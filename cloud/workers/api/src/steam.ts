import type {
  Game,
  LinuxSupport,
  SteamAppMetadata,
  SteamLibraryGame,
  SteamSyncResponse,
} from "@gamevault/shared";
import { gamesBySteamAppIds } from "./igdb";
import type { Env } from "./types";

interface SteamOwnedGame {
  appid?: number;
  name?: string;
  playtime_forever?: number;
  playtime_2weeks?: number;
  rtime_last_played?: number;
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

function uniqueNames(values: Array<string | undefined>): string[] {
  return [...new Set(values.flatMap((value) => {
    const clean = value?.trim();
    return clean ? [clean] : [];
  }))].sort((left, right) => left.localeCompare(right));
}

async function cachedFetch(url: string): Promise<Response> {
  const request = new Request(url, { headers: { accept: "application/json" } });
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

async function protonSummary(appID: number): Promise<ProtonSummary | undefined> {
  try {
    const response = await cachedFetch(`https://www.protondb.com/api/v1/reports/summaries/${appID}.json`);
    return response.ok ? await response.json() as ProtonSummary : undefined;
  } catch {
    return undefined;
  }
}

async function steamAppMetadata(appID: number): Promise<SteamAppMetadata> {
  const syncedAt = new Date().toISOString();
  let store: SteamStoreEnvelope | undefined;
  try {
    const params = new URLSearchParams({
      appids: String(appID),
      filters: "basic,categories,platforms,genres",
      l: "english",
    });
    const response = await cachedFetch(`https://store.steampowered.com/api/appdetails?${params}`);
    if (response.ok) {
      const envelope = await response.json() as Record<string, SteamStoreEnvelope>;
      store = envelope[String(appID)];
    }
  } catch {
    // ProtonDB can still provide a compatibility tier when Steam Store is unavailable.
  }

  const categories = store?.success ? store.data?.categories ?? [] : [];
  const controllerValue = store?.data?.controller_support?.toLowerCase();
  const controllerSupport = controllerValue === "full" || categories.some((item) => item.id === 28)
    ? "full" as const
    : controllerValue === "partial" || categories.some((item) => item.id === 18)
      ? "partial" as const
      : undefined;
  const nativeLinux = store?.success && store.data?.platforms?.linux === true;
  const proton = nativeLinux ? undefined : await protonSummary(appID);
  const rawTier = (proton?.tier ?? proton?.bestReportedTier)?.toLowerCase() as LinuxSupport | undefined;
  const linuxSupport: LinuxSupport | undefined = nativeLinux
    ? "native"
    : rawTier && PROTON_TIERS.has(rawTier) ? rawTier : undefined;

  return {
    appId: appID,
    steamGenres: uniqueNames((store?.data?.genres ?? []).map((item) => item.description)),
    steamFeatures: uniqueNames(categories
      .filter((item) => item.id !== undefined && FILTER_CATEGORY_IDS.has(item.id))
      .map((item) => item.description)),
    ...(controllerSupport ? { controllerSupport } : {}),
    ...(linuxSupport ? { linuxSupport } : {}),
    ...(proton?.confidence?.trim() ? { protonConfidence: proton.confidence.trim().toLowerCase() } : {}),
    syncedAt,
  };
}

export function normalizeSteamAppIDs(values: unknown): number[] | undefined {
  if (!Array.isArray(values) || values.length < 1 || values.length > 20) return undefined;
  const result: number[] = [];
  for (const value of values) {
    if (!Number.isInteger(value) || Number(value) <= 0 || Number(value) > 4_294_967_295) return undefined;
    if (!result.includes(Number(value))) result.push(Number(value));
  }
  return result.length ? result : undefined;
}

export async function steamAppsMetadata(appIDs: number[]): Promise<SteamAppMetadata[]> {
  const results: SteamAppMetadata[] = [];
  for (let start = 0; start < appIDs.length; start += 5) {
    results.push(...await Promise.all(appIDs.slice(start, start + 5).map(steamAppMetadata)));
  }
  return results;
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
  target.searchParams.set("steam_id", steamID);
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
    key: env.STEAM_API_KEY!,
    vanityurl: vanity,
    url_type: "1",
    format: "json",
  });
  const response = await fetch(
    `https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/?${query.toString()}`,
    { headers: { accept: "application/json" } },
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

function syntheticSteamGame(source: Required<Pick<SteamOwnedGame, "appid" | "name">>): Game {
  return {
    id: steamSyntheticGameID(source.appid),
    name: source.name.trim() || `Steam app ${source.appid}`,
    isCustom: true,
    storeLinks: [{
      id: -source.appid,
      name: "Steam",
      url: `https://store.steampowered.com/app/${source.appid}`,
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
    key: env.STEAM_API_KEY,
    steamid: steamId,
    include_appinfo: "true",
    include_played_free_games: "true",
    format: "json",
  });
  const response = await fetch(
    `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/?${query.toString()}`,
    { headers: { accept: "application/json" } },
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
    .map((source) => ({
      game: matchedGames.get(source.appid) ?? syntheticSteamGame(source),
      appId: source.appid,
      playtimeMinutes: source.playtime_forever,
      ...(source.playtime_2weeks !== undefined
        ? { playtimeTwoWeeksMinutes: source.playtime_2weeks }
        : {}),
      ...(source.rtime_last_played
        ? { lastPlayedAt: new Date(source.rtime_last_played * 1_000).toISOString() }
        : {}),
    }))
    .sort((left, right) => left.game.name.localeCompare(right.game.name));
  const matched = games.filter((item) => !item.game.isCustom).length;
  return { steamId, games, matched, unmatched: games.length - matched, syncedAt };
}
