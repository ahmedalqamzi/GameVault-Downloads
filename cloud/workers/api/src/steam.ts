import type {
  Game,
  LinuxSupport,
  SteamAchievement,
  SteamAchievementProgress,
  SteamAchievementsResponse,
  SteamAppMetadata,
  SteamActivityDetails,
  SteamLibraryGame,
  SteamSyncResponse,
} from "@gamevault/shared";
import { gamesBySteamAppIds } from "./igdb";
import { createSteamAuthCode } from "./steam-auth";
import type { Env, SteamAppMetadataRow } from "./types";

interface SteamOwnedGame {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
  playtime_windows_forever?: number;
  playtime_mac_forever?: number;
  playtime_linux_forever?: number;
  playtime_deck_forever?: number;
  playtime_disconnected?: number;
  has_community_visible_stats?: boolean;
}

interface SteamOwnedGamesEnvelope {
  response?: {
    game_count?: number;
    games?: SteamOwnedGame[];
  };
}

interface SteamVanityEnvelope {
  response?: {
    steamid?: string;
    success?: number;
    message?: string;
  };
}

interface SteamStoreEnvelope {
  success?: boolean;
  data?: {
    controller_support?: string;
    categories?: Array<{ id?: number; description?: string }>;
    genres?: Array<{ id?: string; description?: string }>;
    platforms?: { windows?: boolean; mac?: boolean; linux?: boolean };
  };
}

interface ProtonSummary {
  tier?: string;
  bestReportedTier?: string;
  confidence?: string;
}

interface SteamPlayerAchievementsEnvelope {
  playerstats?: {
    steamID?: string;
    gameName?: string;
    success?: boolean;
    error?: string;
    achievements?: Array<{
      apiname?: string;
      name?: string;
      description?: string;
      achieved?: number | boolean;
      unlocktime?: number;
    }>;
  };
}

interface SteamGlobalAchievementsEnvelope {
  achievementpercentages?: {
    achievements?: Array<{ name?: string; percent?: number }>;
  };
}

interface SourceResult<T> {
  reachedSource: boolean;
  value?: T;
}

const STEAM_OPENID_ENDPOINT = "https://steamcommunity.com/openid/login";
const PROTON_TIERS = new Set<LinuxSupport>([
  "platinum",
  "gold",
  "silver",
  "bronze",
  "borked",
  "pending",
]);
const FILTER_CATEGORY_IDS = new Set([1, 2, 9, 20, 27, 36, 37, 38, 39, 49]);
const STEAM_METADATA_DATABASE_TTL_MS = 30 * 86_400_000;

function authorizedSteamFetch(env: Env, url: string): Promise<Response> {
  return fetch(url, {
    headers: {
      accept: "application/json",
      "x-webapi-key": env.STEAM_API_KEY!,
    },
  });
}

function uniqueNames(values: Array<string | undefined>): string[] {
  return [...new Set(values.flatMap((value) => {
    const clean = value?.trim();
    return clean ? [clean] : [];
  }))].sort((left, right) => left.localeCompare(right));
}

async function cachedFetch(
  url: string,
  accept = "application/json",
  headers: Record<string, string> = {},
): Promise<Response> {
  const request = new Request(url, { headers: { accept, ...headers } });
  const workerCache = typeof caches === "undefined"
    ? undefined
    : (caches as CacheStorage & { default: Cache }).default;
  const cached = await workerCache?.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok && workerCache) {
    const headers = new Headers(response.headers);
    headers.delete("set-cookie");
    headers.set("cache-control", "public, max-age=604800");
    const cacheable = new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    await workerCache.put(request, cacheable).catch(() => undefined);
  }
  return response;
}

function parseStringArray(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? uniqueNames(parsed.map((item) => typeof item === "string" ? item : undefined))
      : [];
  } catch {
    return [];
  }
}

function rowToSteamMetadata(row: SteamAppMetadataRow): SteamAppMetadata {
  const controllerSupport = row.controller_support === "full" || row.controller_support === "partial"
    ? row.controller_support
    : undefined;
  const rawLinux = row.linux_support as LinuxSupport | null;
  const linuxSupport = rawLinux && (rawLinux === "native" || PROTON_TIERS.has(rawLinux))
    ? rawLinux
    : undefined;
  return {
    appId: row.app_id,
    steamGenres: parseStringArray(row.steam_genres_json),
    steamFeatures: parseStringArray(row.steam_features_json),
    steamTags: parseStringArray(row.steam_tags_json),
    ...(controllerSupport ? { controllerSupport } : {}),
    ...(linuxSupport ? { linuxSupport } : {}),
    ...(row.proton_confidence ? { protonConfidence: row.proton_confidence } : {}),
    syncedAt: row.synced_at,
  };
}

async function readSteamMetadata(
  db: D1Database | undefined,
  appIDs: number[],
): Promise<Map<number, SteamAppMetadata>> {
  if (!db || appIDs.length === 0) return new Map();
  try {
    const placeholders = appIDs.map(() => "?").join(",");
    const rows = await db.prepare(
      `SELECT * FROM steam_app_metadata WHERE app_id IN (${placeholders})`,
    ).bind(...appIDs).all<SteamAppMetadataRow>();
    const cutoff = Date.now() - STEAM_METADATA_DATABASE_TTL_MS;
    return new Map((rows.results ?? []).flatMap((row) => {
      const syncedAt = Date.parse(row.synced_at);
      return Number.isFinite(syncedAt) && syncedAt >= cutoff
        ? [[row.app_id, rowToSteamMetadata(row)] as const]
        : [];
    }));
  } catch {
    // Keep metadata functional during a rolling deploy before the additive table exists.
    return new Map();
  }
}

async function writeSteamMetadata(
  db: D1Database | undefined,
  apps: SteamAppMetadata[],
): Promise<void> {
  if (!db || apps.length === 0) return;
  try {
    await db.batch(apps.map((app) => db.prepare(
      `INSERT INTO steam_app_metadata (
        app_id, steam_genres_json, steam_features_json, steam_tags_json,
        controller_support, linux_support, proton_confidence, synced_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(app_id) DO UPDATE SET
        steam_genres_json = excluded.steam_genres_json,
        steam_features_json = excluded.steam_features_json,
        steam_tags_json = excluded.steam_tags_json,
        controller_support = excluded.controller_support,
        linux_support = excluded.linux_support,
        proton_confidence = excluded.proton_confidence,
        synced_at = excluded.synced_at`,
    ).bind(
      app.appId,
      JSON.stringify(app.steamGenres),
      JSON.stringify(app.steamFeatures),
      JSON.stringify(app.steamTags),
      app.controllerSupport ?? null,
      app.linuxSupport ?? null,
      app.protonConfidence ?? null,
      app.syncedAt,
    )));
  } catch {
    // Live metadata is still returned if a transient D1 write fails.
  }
}

export function parseSteamStoreTags(html: string): string[] {
  const marker = "InitAppTagModal(";
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) return [];
  const arrayStart = html.indexOf("[", markerIndex + marker.length);
  if (arrayStart < 0) return [];

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = arrayStart; index < html.length; index += 1) {
    const character = html[index]!;
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "[") depth += 1;
    else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        try {
          const tags = JSON.parse(html.slice(arrayStart, index + 1)) as unknown;
          if (!Array.isArray(tags)) return [];
          return uniqueNames(tags.slice(0, 100).map((item) => (
            item && typeof item === "object" && typeof (item as { name?: unknown }).name === "string"
              ? (item as { name: string }).name
              : undefined
          )));
        } catch {
          return [];
        }
      }
    }
  }
  return [];
}

async function steamStoreTags(appID: number): Promise<SourceResult<string[]>> {
  try {
    const response = await cachedFetch(
      `https://store.steampowered.com/app/${appID}/?l=english&cc=us`,
      "text/html",
      { cookie: "birthtime=315532801; lastagecheckage=1-January-1980" },
    );
    return response.ok
      ? { reachedSource: true, value: parseSteamStoreTags(await response.text()) }
      : { reachedSource: false };
  } catch {
    return { reachedSource: false };
  }
}

async function protonSummary(appID: number): Promise<SourceResult<ProtonSummary>> {
  try {
    const response = await cachedFetch(`https://www.protondb.com/api/v1/reports/summaries/${appID}.json`);
    if (response.ok) return { reachedSource: true, value: await response.json() as ProtonSummary };
    return { reachedSource: response.status === 404 };
  } catch {
    return { reachedSource: false };
  }
}

async function steamAppMetadata(appID: number): Promise<{ metadata: SteamAppMetadata; cacheable: boolean }> {
  const syncedAt = new Date().toISOString();
  const storePromise = (async (): Promise<SourceResult<SteamStoreEnvelope>> => {
    const params = new URLSearchParams({
      appids: String(appID),
      filters: "basic,categories,platforms,genres",
      l: "english",
    });
    const response = await cachedFetch(`https://store.steampowered.com/api/appdetails?${params}`);
    if (response.ok) {
      const envelope = await response.json() as Record<string, SteamStoreEnvelope>;
      return { reachedSource: true, value: envelope[String(appID)] };
    }
    return { reachedSource: false };
  })().catch((): SourceResult<SteamStoreEnvelope> => ({ reachedSource: false }));
  const [storeResult, tagResult, protonResult] = await Promise.all([
    storePromise,
    steamStoreTags(appID),
    protonSummary(appID),
  ]);
  const store = storeResult.value;
  const steamTags = tagResult.value ?? [];
  const proton = protonResult.value;

  const categories = store?.success ? store.data?.categories ?? [] : [];
  const controllerValue = store?.data?.controller_support?.toLowerCase();
  const controllerSupport = controllerValue === "full" || categories.some((item) => item.id === 28)
    ? "full" as const
    : controllerValue === "partial" || categories.some((item) => item.id === 18)
      ? "partial" as const
      : undefined;
  const nativeLinux = store?.success && store.data?.platforms?.linux === true;
  const rawTier = (proton?.tier ?? proton?.bestReportedTier)?.toLowerCase() as LinuxSupport | undefined;
  const linuxSupport: LinuxSupport | undefined = nativeLinux
    ? "native"
    : rawTier && PROTON_TIERS.has(rawTier) ? rawTier : undefined;

  const cacheable = storeResult.reachedSource
    && tagResult.reachedSource
    && (nativeLinux || protonResult.reachedSource);
  return { metadata: {
    appId: appID,
    steamGenres: uniqueNames((store?.data?.genres ?? []).map((item) => item.description)),
    steamFeatures: uniqueNames(categories
      .filter((item) => item.id !== undefined && FILTER_CATEGORY_IDS.has(item.id))
      .map((item) => item.description)),
    steamTags,
    ...(controllerSupport ? { controllerSupport } : {}),
    ...(linuxSupport ? { linuxSupport } : {}),
    ...(proton?.confidence?.trim() ? { protonConfidence: proton.confidence.trim().toLowerCase() } : {}),
    syncedAt: cacheable ? syncedAt : "1970-01-01T00:00:00.000Z",
  }, cacheable };
}

export function normalizeSteamAppIDs(values: unknown, maximum = 20): number[] | undefined {
  if (!Array.isArray(values) || values.length < 1 || values.length > maximum) return undefined;
  const result: number[] = [];
  for (const value of values) {
    if (!Number.isInteger(value) || Number(value) <= 0 || Number(value) > 4_294_967_295) return undefined;
    if (!result.includes(Number(value))) result.push(Number(value));
  }
  return result.length ? result : undefined;
}

function normalizedMinutes(value: number | undefined): number | undefined {
  return Number.isFinite(value) ? Math.max(0, Math.trunc(value!)) : undefined;
}

async function steamAchievementProgress(
  env: Env,
  steamId: string,
  appId: number,
  syncedAt: string,
): Promise<SteamAchievementProgress> {
  const query = new URLSearchParams({ steamid: steamId, appid: String(appId), l: "english" });
  const [playerResponse, globalResponse] = await Promise.all([
    authorizedSteamFetch(
      env,
      `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/?${query.toString()}`,
    ).catch(() => undefined),
    cachedFetch(
      `https://api.steampowered.com/ISteamUserStats/GetGlobalAchievementPercentagesForApp/v2/?gameid=${appId}`,
    ).catch(() => undefined),
  ]);
  if (!playerResponse) throw new Error("Steam achievement tracking is temporarily unavailable.");
  if (playerResponse.status === 401 || playerResponse.status === 403) {
    throw new Error("Steam rejected the GameVault server credential.");
  }
  if (!playerResponse.ok) throw new Error(`Steam could not load achievements (${playerResponse.status}).`);

  let payload: SteamPlayerAchievementsEnvelope;
  try {
    payload = await playerResponse.json() as SteamPlayerAchievementsEnvelope;
  } catch {
    throw new Error("Steam returned an unreadable achievement response.");
  }
  const player = payload.playerstats;
  if (player?.success !== true || !Array.isArray(player.achievements)) {
    return {
      appId,
      available: false,
      ...(player?.gameName?.trim() ? { gameName: player.gameName.trim() } : {}),
      unlocked: 0,
      total: 0,
      percent: 0,
      achievements: [],
      syncedAt,
    };
  }

  const globalPercentages = new Map<string, number>();
  if (globalResponse?.ok) {
    try {
      const global = await globalResponse.json() as SteamGlobalAchievementsEnvelope;
      for (const item of global.achievementpercentages?.achievements ?? []) {
        const name = item.name?.trim();
        if (name && Number.isFinite(item.percent)) {
          globalPercentages.set(name, Math.max(0, Math.min(100, item.percent!)));
        }
      }
    } catch {
      // Rarity is optional; personal unlock state remains usable without it.
    }
  }

  const achievements: SteamAchievement[] = player.achievements.flatMap((item) => {
    const apiName = item.apiname?.trim();
    if (!apiName) return [];
    const achieved = item.achieved === 1 || item.achieved === true;
    const unlockTime = achieved && Number.isFinite(item.unlocktime) && item.unlocktime! > 0
      ? new Date(Math.trunc(item.unlocktime!) * 1_000).toISOString()
      : undefined;
    const globalPercent = globalPercentages.get(apiName);
    return [{
      apiName,
      name: item.name?.trim() || apiName,
      ...(item.description?.trim() ? { description: item.description.trim() } : {}),
      achieved,
      ...(unlockTime ? { unlockTime } : {}),
      ...(globalPercent !== undefined ? { globalPercent } : {}),
    }];
  }).sort((left, right) => {
    if (left.achieved !== right.achieved) return left.achieved ? -1 : 1;
    if (left.unlockTime !== right.unlockTime) return (right.unlockTime ?? "").localeCompare(left.unlockTime ?? "");
    return left.name.localeCompare(right.name);
  });
  const unlocked = achievements.filter((item) => item.achieved).length;
  const total = achievements.length;
  return {
    appId,
    available: true,
    ...(player.gameName?.trim() ? { gameName: player.gameName.trim() } : {}),
    unlocked,
    total,
    percent: total ? Math.round((unlocked / total) * 1_000) / 10 : 0,
    achievements,
    syncedAt,
  };
}

function decodeSteamXML(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .trim();
}

function steamXMLValue(xml: string, ...tags: string[]): string | undefined {
  for (const tag of tags) {
    const match = new RegExp(
      `<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`,
      "i",
    ).exec(xml);
    const value = decodeSteamXML(match?.[1] ?? match?.[2] ?? "");
    if (value) return value;
  }
  return undefined;
}

export function parseSteamAchievementXML(
  xml: string,
  appId: number,
  syncedAt = new Date().toISOString(),
): SteamAchievementProgress {
  const blocks = [...xml.matchAll(/<achievement\b([^>]*)>([\s\S]*?)<\/achievement>/gi)];
  const achievements: SteamAchievement[] = blocks.map((match, index) => {
    const attributes = match[1] ?? "";
    const body = match[2] ?? "";
    const name = steamXMLValue(body, "name") ?? `Achievement ${index + 1}`;
    const apiName = steamXMLValue(body, "apiname", "apiName")
      ?? `community-${index}-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
    const achieved = /\bclosed\s*=\s*["']1["']/i.test(attributes);
    const rawUnlock = steamXMLValue(body, "unlockTimestamp", "unlocktime");
    const unlockSeconds = rawUnlock ? Number.parseInt(rawUnlock, 10) : 0;
    return {
      apiName,
      name,
      ...(steamXMLValue(body, "description") ? { description: steamXMLValue(body, "description") } : {}),
      achieved,
      ...(achieved && Number.isSafeInteger(unlockSeconds) && unlockSeconds > 0
        ? { unlockTime: new Date(unlockSeconds * 1_000).toISOString() }
        : {}),
    };
  }).sort((left, right) => {
    if (left.achieved !== right.achieved) return left.achieved ? -1 : 1;
    if (left.unlockTime !== right.unlockTime) return (right.unlockTime ?? "").localeCompare(left.unlockTime ?? "");
    return left.name.localeCompare(right.name);
  });
  const unlocked = achievements.filter((item) => item.achieved).length;
  return {
    appId,
    available: achievements.length > 0,
    ...(steamXMLValue(xml, "gameName", "gameFriendlyName")
      ? { gameName: steamXMLValue(xml, "gameName", "gameFriendlyName") }
      : {}),
    unlocked,
    total: achievements.length,
    percent: achievements.length ? Math.round((unlocked / achievements.length) * 1_000) / 10 : 0,
    achievements,
    syncedAt,
  };
}

async function publicSteamAchievementProgress(
  steamId: string,
  appId: number,
  syncedAt: string,
): Promise<SteamAchievementProgress> {
  const response = await fetch(
    `https://steamcommunity.com/profiles/${steamId}/stats/${appId}/?xml=1&l=english`,
    { headers: { accept: "application/xml,text/xml;q=0.9" } },
  ).catch(() => undefined);
  if (!response) throw new Error("Steam achievement tracking is temporarily unavailable.");
  if (!response.ok) throw new Error(`Steam could not load achievements (${response.status}).`);
  const xml = await response.text();
  if (/\/login\/?(?:[?"'])/i.test(xml) || /<title>\s*Sign In\s*<\/title>/i.test(xml)) {
    throw new Error("Steam requires the profile and Game details to be public for achievement tracking.");
  }
  return parseSteamAchievementXML(xml, appId, syncedAt);
}

export async function steamAchievements(
  env: Env,
  rawSteamID: string,
  appIDs: number[],
): Promise<SteamAchievementsResponse> {
  const numericSteamID = normalizeSteamID(rawSteamID);
  const steamId = numericSteamID ?? (env.STEAM_API_KEY ? await resolveSteamID(env, rawSteamID) : undefined);
  if (!steamId) throw new Error("Use the connected numeric Steam account for achievement tracking.");
  const syncedAt = new Date().toISOString();
  const games: SteamAchievementProgress[] = [];
  for (let start = 0; start < appIDs.length; start += 5) {
    games.push(...await Promise.all(appIDs.slice(start, start + 5)
      .map((appID) => env.STEAM_API_KEY
        ? steamAchievementProgress(env, steamId, appID, syncedAt)
        : publicSteamAchievementProgress(steamId, appID, syncedAt))));
  }
  return { steamId, games, syncedAt };
}

export async function steamAppsMetadata(
  appIDs: number[],
  db?: D1Database,
): Promise<SteamAppMetadata[]> {
  const cached = await readSteamMetadata(db, appIDs);
  const missing = appIDs.filter((appID) => !cached.has(appID));
  const fetched: Array<{ metadata: SteamAppMetadata; cacheable: boolean }> = [];
  for (let start = 0; start < missing.length; start += 5) {
    fetched.push(...await Promise.all(missing.slice(start, start + 5).map(steamAppMetadata)));
  }
  await writeSteamMetadata(db, fetched.filter((result) => result.cacheable).map((result) => result.metadata));
  for (const { metadata } of fetched) cached.set(metadata.appId, metadata);
  return appIDs.flatMap((appID) => {
    const app = cached.get(appID);
    return app ? [app] : [];
  });
}

function configuredOrigins(env: Env): Set<string> {
  return new Set((env.CORS_ORIGINS ?? "").split(",").map((item) => item.trim()).filter(Boolean));
}

export function isAllowedSteamReturnTarget(env: Env, value: string): boolean {
  try {
    const target = new URL(value);
    if (target.protocol === "gamevault:") {
      return target.hostname === "steam" && target.pathname === "/callback";
    }
    return (target.protocol === "https:" || target.protocol === "http:")
      && configuredOrigins(env).has(target.origin);
  } catch {
    return false;
  }
}

export function steamOpenIDStart(request: Request, env: Env, returnTarget: string): Response {
  if (!isAllowedSteamReturnTarget(env, returnTarget)) {
    throw new Error("That Steam return address is not allowed.");
  }
  const requestURL = new URL(request.url);
  const callback = new URL("/v1/steam/auth/callback", requestURL.origin);
  callback.searchParams.set("app_return", returnTarget);
  const query = new URLSearchParams({
    "openid.ns": "http://specs.openid.net/auth/2.0",
    "openid.mode": "checkid_setup",
    "openid.return_to": callback.toString(),
    "openid.realm": requestURL.origin,
    "openid.identity": "http://specs.openid.net/auth/2.0/identifier_select",
    "openid.claimed_id": "http://specs.openid.net/auth/2.0/identifier_select",
  });
  return Response.redirect(`${STEAM_OPENID_ENDPOINT}?${query}`, 302);
}

export async function steamOpenIDCallback(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const appReturn = url.searchParams.get("app_return") ?? "";
  if (!isAllowedSteamReturnTarget(env, appReturn)) {
    throw new Error("That Steam return address is not allowed.");
  }
  const signedReturn = url.searchParams.get("openid.return_to");
  if (!signedReturn) throw new Error("Steam did not return a signed callback address.");
  const signedURL = new URL(signedReturn);
  if (
    signedURL.origin !== url.origin
    || signedURL.pathname !== "/v1/steam/auth/callback"
    || signedURL.searchParams.get("app_return") !== appReturn
  ) {
    throw new Error("Steam returned an invalid callback address.");
  }

  const verification = new URLSearchParams();
  url.searchParams.forEach((value, key) => {
    if (key.startsWith("openid.")) verification.append(key, value);
  });
  verification.set("openid.mode", "check_authentication");
  const response = await fetch(STEAM_OPENID_ENDPOINT, {
    method: "POST",
    headers: {
      accept: "text/plain",
      "content-type": "application/x-www-form-urlencoded",
    },
    body: verification.toString(),
  });
  const verificationText = response.ok ? await response.text() : "";
  if (!/(^|\n)is_valid:true(?:\n|$)/.test(verificationText)) {
    throw new Error("Steam could not verify this sign-in.");
  }
  const claimedID = url.searchParams.get("openid.claimed_id") ?? "";
  const match = /^https?:\/\/steamcommunity\.com\/openid\/id\/(\d{17})\/?$/.exec(claimedID);
  const steamID = match?.[1] ? normalizeSteamID(match[1]) : undefined;
  if (!steamID) throw new Error("Steam did not return a valid account ID.");

  const target = new URL(appReturn);
  const code = await createSteamAuthCode(env.DB, steamID);
  target.searchParams.set("steam_id", steamID);
  target.searchParams.set("steam_code", code);
  target.searchParams.set("steam_auth", "success");
  return Response.redirect(target.toString(), 302);
}

function steamCommunityProfile(value: string): { steamId?: string; vanity?: string } | undefined {
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" && url.protocol !== "http:") return undefined;
    if (url.hostname !== "steamcommunity.com" && url.hostname !== "www.steamcommunity.com") return undefined;
    const parts = url.pathname.split("/").filter(Boolean);
    if (parts.length !== 2) return undefined;
    if (parts[0] === "profiles" && /^\d{17}$/.test(parts[1] ?? "")) return { steamId: parts[1] };
    if (parts[0] === "id" && /^[A-Za-z0-9_-]{2,64}$/.test(parts[1] ?? "")) return { vanity: parts[1] };
    return undefined;
  } catch {
    return undefined;
  }
}

export function normalizeSteamID(value: string): string | undefined {
  const trimmed = value.trim();
  const candidate = /^\d{17}$/.test(trimmed)
    ? trimmed
    : steamCommunityProfile(trimmed)?.steamId;
  if (!candidate) return undefined;
  try {
    return BigInt(candidate) > 0 ? candidate : undefined;
  } catch {
    return undefined;
  }
}

export function isValidSteamIdentity(value: string): boolean {
  return Boolean(normalizeSteamID(value) || steamCommunityProfile(value)?.vanity);
}

async function resolveSteamID(env: Env, value: string): Promise<string> {
  const numeric = normalizeSteamID(value);
  if (numeric) return numeric;
  const vanity = steamCommunityProfile(value)?.vanity;
  if (!vanity) throw new Error("Enter a valid 17-digit Steam ID or Steam Community profile URL.");

  const query = new URLSearchParams({
    vanityurl: vanity,
    url_type: "1",
    format: "json",
  });
  const response = await authorizedSteamFetch(
    env,
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?${query.toString()}`,
  );
  if (!response.ok) throw new Error(`Steam could not resolve this profile (${response.status}).`);
  const payload = (await response.json()) as SteamVanityEnvelope;
  const steamId = payload.response?.steamid ? normalizeSteamID(payload.response.steamid) : undefined;
  if (payload.response?.success !== 1 || !steamId) {
    throw new Error("Steam could not find that profile URL.");
  }
  return steamId;
}

export function steamSyntheticGameID(appID: number): number {
  return -(1_000_000_000_000 + appID);
}

export function steamSyntheticGame(appID: number, name: string): Game {
  return {
    id: steamSyntheticGameID(appID),
    name: name.trim() || `Steam app ${appID}`,
    isCustom: true,
    storeLinks: [{
      id: -appID,
      name: "Steam",
      url: `https://store.steampowered.com/app/${appID}`,
      platform: { id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" },
    }],
    platforms: [{ id: 6, name: "PC (Microsoft Windows)", abbreviation: "PC" }],
    genres: [],
    releaseDates: [],
  };
}

export async function steamLibrary(env: Env, rawSteamID: string): Promise<SteamSyncResponse> {
  if (!env.STEAM_API_KEY) throw new Error("Steam integration is not configured on the GameVault server.");
  const steamId = await resolveSteamID(env, rawSteamID);

  const query = new URLSearchParams({
    steamid: steamId,
    include_appinfo: "true",
    include_played_free_games: "true",
    format: "json",
  });
  const response = await authorizedSteamFetch(
    env,
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${query.toString()}`,
  );
  if (!response.ok) throw new Error(`Steam could not load this library (${response.status}).`);
  const payload = (await response.json()) as SteamOwnedGamesEnvelope;
  if (!payload.response || payload.response.game_count === undefined) {
    throw new Error("Steam did not return a library. Make the profile and Game details public, then try again.");
  }

  const owned = (payload.response.games ?? []).flatMap((game) => (
    Number.isInteger(game.appid)
    && game.appid! > 0
    && typeof game.name === "string"
    && game.name.trim()
      ? [{
          appid: game.appid!,
          name: game.name.trim(),
          playtime_forever: Math.max(0, Math.trunc(game.playtime_forever ?? 0)),
          ...(Number.isFinite(game.playtime_2weeks)
            ? { playtime_2weeks: Math.max(0, Math.trunc(game.playtime_2weeks!)) }
            : {}),
          ...(Number.isFinite(game.rtime_last_played) && game.rtime_last_played! > 0
            ? { rtime_last_played: Math.trunc(game.rtime_last_played!) }
            : {}),
          ...(normalizedMinutes(game.playtime_windows_forever) !== undefined
            ? { playtime_windows_forever: normalizedMinutes(game.playtime_windows_forever) }
            : {}),
          ...(normalizedMinutes(game.playtime_mac_forever) !== undefined
            ? { playtime_mac_forever: normalizedMinutes(game.playtime_mac_forever) }
            : {}),
          ...(normalizedMinutes(game.playtime_linux_forever) !== undefined
            ? { playtime_linux_forever: normalizedMinutes(game.playtime_linux_forever) }
            : {}),
          ...(normalizedMinutes(game.playtime_deck_forever) !== undefined
            ? { playtime_deck_forever: normalizedMinutes(game.playtime_deck_forever) }
            : {}),
          ...(normalizedMinutes(game.playtime_disconnected) !== undefined
            ? { playtime_disconnected: normalizedMinutes(game.playtime_disconnected) }
            : {}),
          ...(typeof game.has_community_visible_stats === "boolean"
            ? { has_community_visible_stats: game.has_community_visible_stats }
            : {}),
        }]
      : []
  ));
  let matchedGames = new Map<number, Game>();
  if (env.IGDB_CLIENT_ID && env.IGDB_CLIENT_SECRET) {
    try {
      matchedGames = await gamesBySteamAppIds(env, owned.map((game) => game.appid));
    } catch (error) {
      console.error("steam_igdb_match_failed", error instanceof Error ? error.message : String(error));
      throw new Error("Steam loaded the library, but game matching is temporarily unavailable. Nothing was imported; try again.");
    }
  }
  const syncedAt = new Date().toISOString();
  const games: SteamLibraryGame[] = owned
    .map((source) => {
      const activity: SteamActivityDetails = {
        ...(source.playtime_windows_forever !== undefined
          ? { playtimeWindowsMinutes: source.playtime_windows_forever }
          : {}),
        ...(source.playtime_mac_forever !== undefined ? { playtimeMacMinutes: source.playtime_mac_forever } : {}),
        ...(source.playtime_linux_forever !== undefined
          ? { playtimeLinuxMinutes: source.playtime_linux_forever }
          : {}),
        ...(source.playtime_deck_forever !== undefined
          ? { playtimeDeckMinutes: source.playtime_deck_forever }
          : {}),
        ...(source.playtime_disconnected !== undefined
          ? { playtimeDisconnectedMinutes: source.playtime_disconnected }
          : {}),
        ...(source.has_community_visible_stats !== undefined
          ? { hasCommunityStats: source.has_community_visible_stats }
          : {}),
      };
      return {
        game: matchedGames.get(source.appid) ?? steamSyntheticGame(source.appid, source.name),
        appId: source.appid,
        playtimeMinutes: source.playtime_forever,
        ...(source.playtime_2weeks !== undefined
          ? { playtimeTwoWeeksMinutes: source.playtime_2weeks }
          : {}),
        ...(source.rtime_last_played
          ? { lastPlayedAt: new Date(source.rtime_last_played * 1_000).toISOString() }
          : {}),
        ...(Object.keys(activity).length ? { activity } : {}),
      };
    })
    .sort((left, right) => left.game.name.localeCompare(right.game.name));
  const matched = games.filter((item) => !item.game.isCustom).length;
  return { steamId, games, matched, unmatched: games.length - matched, syncedAt };
}
