import type {
  ClientChange,
  CollectionFolder,
  LibraryResponse,
  PreferencesResponse,
  PushResponse,
  SearchResponse,
  SteamAppsResponse,
  UserPreferences,
} from "@gamevault/shared";
import {
  applyChanges,
  cacheGames,
  getLibrary,
  getPreferences,
  getServerRevision,
  isValidEntry,
  isValidGame,
  pullEvents,
  recordGameRefreshes,
  savePreferences,
  trackedGameRows,
} from "./db";
import { apiError, corsHeaders, isAuthorized, json, parseJson } from "./http";
import {
  calendarGames,
  discoverGames,
  gamesByIds,
  gamesInFranchise,
  searchGames,
} from "./igdb";
import {
  isValidSteamIdentity,
  normalizeSteamAppIDs,
  normalizeSteamID,
  steamAppsMetadata,
  steamLibrary,
  steamOpenIDCallback,
  steamOpenIDStart,
} from "./steam";
import type { Env } from "./types";

interface PushRequest {
  changes?: ClientChange[];
}

interface PreferencesRequest {
  preferredPlatforms?: unknown;
  preferredStores?: unknown;
  followedFranchises?: unknown;
  customFolders?: unknown;
  steamId?: unknown;
}

interface SteamRequest {
  steamId?: unknown;
}

interface SteamAppsRequest {
  appIds?: unknown;
}

function isValidPreferenceList(value: unknown): value is string[] {
  return Array.isArray(value)
    && value.length <= 100
    && value.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 100);
}

export function isValidFranchisePreferenceList(value: unknown): value is UserPreferences["followedFranchises"] {
  return Array.isArray(value)
    && value.length <= 500
    && value.every((item) => (
      item !== null
      && typeof item === "object"
      && Number.isSafeInteger((item as { id?: unknown }).id)
      && Number((item as { id?: unknown }).id) > 0
      && typeof (item as { name?: unknown }).name === "string"
      && (item as { name: string }).name.trim().length > 0
      && (item as { name: string }).name.trim().length <= 200
      && ((item as { kind?: unknown }).kind === "franchise" || (item as { kind?: unknown }).kind === "collection")
      && ((item as { coverUrl?: unknown }).coverUrl === undefined
        || (typeof (item as { coverUrl?: unknown }).coverUrl === "string" && (item as { coverUrl: string }).coverUrl.length <= 1_000))
      && ((item as { averageArtworkColor?: unknown }).averageArtworkColor === undefined
        || (typeof (item as { averageArtworkColor?: unknown }).averageArtworkColor === "string" && (item as { averageArtworkColor: string }).averageArtworkColor.length <= 100))
      && ((item as { publisher?: unknown }).publisher === undefined
        || (typeof (item as { publisher?: unknown }).publisher === "string" && (item as { publisher: string }).publisher.trim().length <= 200))
    ));
}

export function isValidCustomFolderList(value: unknown): value is CollectionFolder[] {
  return Array.isArray(value)
    && value.length <= 100
    && value.every((item) => (
      item !== null
      && typeof item === "object"
      && typeof (item as { id?: unknown }).id === "string"
      && (item as { id: string }).id.trim().length >= 8
      && (item as { id: string }).id.trim().length <= 100
      && typeof (item as { name?: unknown }).name === "string"
      && (item as { name: string }).name.trim().length > 0
      && (item as { name: string }).name.trim().length <= 80
      && typeof (item as { createdAt?: unknown }).createdAt === "string"
      && !Number.isNaN(Date.parse((item as { createdAt: string }).createdAt))
    ));
}

function monthRange(value: string): { start: number; end: number } | undefined {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return undefined;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 1970 || year > 2100 || month < 1 || month > 12) return undefined;
  return {
    start: Math.floor(Date.UTC(year, month - 1, 1) / 1000),
    end: Math.floor(Date.UTC(year, month, 1) / 1000),
  };
}

export function parseGameIds(value: string | null): number[] | undefined {
  if (!value) return undefined;
  const parts = value.split(",");
  if (parts.length === 0 || parts.length > 100) return undefined;
  const ids: number[] = [];
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return undefined;
    const id = Number(part);
    if (!Number.isSafeInteger(id) || id <= 0) return undefined;
    if (!ids.includes(id)) ids.push(id);
  }
  return ids.length > 0 ? ids : undefined;
}

function metadataClientKey(request: Request): string {
  const installation = request.headers.get("x-gamevault-client")?.trim() ?? "";
  const validInstallation = /^[a-zA-Z0-9._:-]{8,100}$/.test(installation)
    ? installation
    : "unknown-installation";
  const address = request.headers.get("cf-connecting-ip")?.trim() || "unknown-address";
  return `${address}:${validInstallation}`;
}

function steamClientKey(request: Request): string {
  return request.headers.get("cf-connecting-ip")?.trim() || "unknown-address";
}

async function routePublicMetadata(
  request: Request,
  env: Env,
  path: string,
  url: URL,
): Promise<Response | undefined> {
  const supported = request.method === "GET" && new Set([
    "/v1/games/search",
    "/v1/games/discover",
    "/v1/games/calendar",
    "/v1/games/franchise",
    "/v1/games/metadata",
  ]).has(path);
  if (!supported) return undefined;

  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    return apiError(request, env, 503, "metadata_not_configured", "Game metadata is not configured yet.");
  }
  if (env.METADATA_RATE_LIMITER) {
    const outcome = await env.METADATA_RATE_LIMITER.limit({ key: metadataClientKey(request) });
    if (!outcome.success) {
      return apiError(request, env, 429, "rate_limited", "Too many metadata requests. Try again in a minute.");
    }
  }

  if (path === "/v1/games/search") {
    const query = url.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2 || query.length > 120) {
      return apiError(request, env, 400, "invalid_query", "Search must be 2–120 characters.");
    }
    const games = await searchGames(env, query);
    await cacheGames(env.DB, games);
    return json(request, env, { games } satisfies SearchResponse, {
      headers: { "cache-control": "public, max-age=60" },
    });
  }

  if (path === "/v1/games/discover") {
    const kind = url.searchParams.get("kind") === "upcoming" ? "upcoming" : "new";
    const games = await discoverGames(env, kind);
    await cacheGames(env.DB, games);
    return json(request, env, { games } satisfies SearchResponse, {
      headers: { "cache-control": "public, max-age=900" },
    });
  }

  if (path === "/v1/games/calendar") {
    const month = url.searchParams.get("month") ?? "";
    const range = monthRange(month);
    if (!range) {
      return apiError(request, env, 400, "invalid_month", "Month must use YYYY-MM format.");
    }
    const games = await calendarGames(env, range.start, range.end);
    await cacheGames(env.DB, games);
    return json(request, env, { games } satisfies SearchResponse, {
      headers: { "cache-control": "public, max-age=900" },
    });
  }

  if (path === "/v1/games/franchise") {
    const id = Number.parseInt(url.searchParams.get("id") ?? "", 10);
    const kind = url.searchParams.get("kind") === "collection" ? "collection" : "franchise";
    if (!Number.isSafeInteger(id) || id <= 0) {
      return apiError(request, env, 400, "invalid_franchise", "A valid franchise ID is required.");
    }
    const games = await gamesInFranchise(env, id, kind);
    await cacheGames(env.DB, games);
    return json(request, env, { games } satisfies SearchResponse, {
      headers: { "cache-control": "public, max-age=900" },
    });
  }

  const ids = parseGameIds(url.searchParams.get("ids"));
  if (!ids) {
    return apiError(request, env, 400, "invalid_game_ids", "Provide 1–100 comma-separated game IDs.");
  }
  const games = await gamesByIds(env, ids);
  await cacheGames(env.DB, games);
  return json(request, env, { games } satisfies SearchResponse, {
    headers: { "cache-control": "public, max-age=3600" },
  });
}

async function routePublicSteam(
  request: Request,
  env: Env,
  path: string,
  url: URL,
): Promise<Response | undefined> {
  if (path === "/v1/steam/auth/start" && request.method === "GET") {
    const returnTarget = url.searchParams.get("return_to") ?? "";
    try {
      return steamOpenIDStart(request, env, returnTarget);
    } catch (error) {
      return apiError(request, env, 422, "invalid_return_target", error instanceof Error ? error.message : "The return address is invalid.");
    }
  }

  if (path === "/v1/steam/auth/callback" && request.method === "GET") {
    try {
      return await steamOpenIDCallback(request, env);
    } catch (error) {
      return apiError(request, env, 401, "steam_auth_failed", error instanceof Error ? error.message : "Steam sign-in failed.");
    }
  }

  if (path === "/v1/steam/apps" && request.method === "POST") {
    const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
    if (Number.isFinite(contentLength) && contentLength > 2_048) {
      return apiError(request, env, 413, "request_too_large", "The Steam metadata request is too large.");
    }
    const body = await parseJson<SteamAppsRequest>(request);
    const appIDs = normalizeSteamAppIDs(body?.appIds);
    if (!appIDs) {
      return apiError(request, env, 422, "invalid_app_ids", "Provide 1–20 valid Steam app IDs.");
    }
    if (env.STEAM_METADATA_RATE_LIMITER) {
      const outcome = await env.STEAM_METADATA_RATE_LIMITER.limit({ key: steamClientKey(request) });
      if (!outcome.success) {
        return apiError(request, env, 429, "rate_limited", "Too many Steam metadata requests. Try again in a minute.");
      }
    }
    const apps = await steamAppsMetadata(appIDs, env.DB);
    return json(request, env, { apps } satisfies SteamAppsResponse, {
      headers: { "cache-control": "no-store" },
    });
  }

  if (path !== "/v1/steam/sync" || request.method !== "POST") return undefined;

  const contentLength = Number.parseInt(request.headers.get("content-length") ?? "0", 10);
  if (Number.isFinite(contentLength) && contentLength > 2_048) {
    return apiError(request, env, 413, "request_too_large", "The Steam profile request is too large.");
  }
  const body = await parseJson<SteamRequest>(request);
  if (!body || typeof body.steamId !== "string" || !isValidSteamIdentity(body.steamId)) {
    return apiError(request, env, 422, "invalid_steam_id", "Enter a valid 17-digit Steam ID or public profile URL.");
  }
  if (!env.STEAM_API_KEY) {
    return apiError(request, env, 503, "steam_not_configured", "Steam integration is not configured on the GameVault service.");
  }
  if (env.STEAM_RATE_LIMITER) {
    const outcome = await env.STEAM_RATE_LIMITER.limit({ key: steamClientKey(request) });
    if (!outcome.success) {
      return apiError(request, env, 429, "rate_limited", "Too many Steam imports. Try again in a minute.");
    }
  }

  try {
    const result = await steamLibrary(env, body.steamId);
    await cacheGames(env.DB, result.games.map((item) => item.game));
    return json(request, env, result, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return apiError(
      request,
      env,
      502,
      "steam_sync_failed",
      error instanceof Error ? error.message : "Steam library sync failed.",
    );
  }
}

function isValidChange(change: ClientChange): boolean {
  if (
    !change
    || typeof change.id !== "string"
    || change.id.length < 8
    || change.id.length > 100
    || (change.operation !== "upsert" && change.operation !== "delete")
    || !isValidGame(change.game)
    || Number.isNaN(Date.parse(change.changedAt))
  ) return false;
  return change.operation === "delete" || isValidEntry(change.entry, change.game.id);
}

async function route(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/$/, "") || "/";

  if (path === "/health" && request.method === "GET") {
    return json(request, env, {
      ok: true,
      service: "gamevault-api",
      igdbConfigured: Boolean(env.IGDB_CLIENT_ID && env.IGDB_CLIENT_SECRET),
      steamConfigured: Boolean(env.STEAM_API_KEY),
      time: new Date().toISOString(),
    });
  }

  const metadataResponse = await routePublicMetadata(request, env, path, url);
  if (metadataResponse) return metadataResponse;

  // Steam imports use only public profile data and return it directly to the
  // requesting device. This keeps phone-only mode independent of cloud sync.
  const steamResponse = await routePublicSteam(request, env, path, url);
  if (steamResponse) return steamResponse;

  if (!env.SYNC_TOKEN) {
    return apiError(request, env, 503, "not_configured", "The sync token is not configured.");
  }
  if (!(await isAuthorized(request, env))) {
    return apiError(request, env, 401, "unauthorized", "A valid sync token is required.");
  }

  if (path === "/v1/library" && request.method === "GET") {
    const body: LibraryResponse = {
      items: await getLibrary(env.DB),
      serverRevision: await getServerRevision(env.DB),
    };
    return json(request, env, body, { headers: { "cache-control": "no-store" } });
  }

  if (path === "/v1/preferences" && request.method === "GET") {
    const body: PreferencesResponse = { preferences: await getPreferences(env.DB) };
    return json(request, env, body, { headers: { "cache-control": "no-store" } });
  }

  if (path === "/v1/preferences" && request.method === "PUT") {
    const body = await parseJson<PreferencesRequest>(request);
    if (
      !body
      || !isValidPreferenceList(body.preferredPlatforms)
      || !isValidPreferenceList(body.preferredStores)
      || (body.followedFranchises !== undefined && !isValidFranchisePreferenceList(body.followedFranchises))
      || (body.customFolders !== undefined && !isValidCustomFolderList(body.customFolders))
      || (body.steamId !== undefined
        && (typeof body.steamId !== "string" || (body.steamId.trim() && !normalizeSteamID(body.steamId))))
    ) {
      return apiError(request, env, 422, "invalid_preferences", "Platform and store preferences must be ordered names, and followed franchises must be valid references.");
    }
    const preferences: UserPreferences = await savePreferences(env.DB, {
      preferredPlatforms: body.preferredPlatforms,
      preferredStores: body.preferredStores,
      ...(body.followedFranchises !== undefined ? { followedFranchises: body.followedFranchises } : {}),
      ...(body.customFolders !== undefined ? { customFolders: body.customFolders } : {}),
      ...(body.steamId !== undefined
        ? { steamId: body.steamId.trim() ? normalizeSteamID(body.steamId)! : "" }
        : {}),
    });
    return json(request, env, { preferences } satisfies PreferencesResponse, {
      headers: { "cache-control": "no-store" },
    });
  }

  if (path === "/v1/sync" && request.method === "GET") {
    const after = Math.max(0, Number.parseInt(url.searchParams.get("after") ?? "0", 10) || 0);
    const limit = Number.parseInt(url.searchParams.get("limit") ?? "200", 10) || 200;
    return json(request, env, await pullEvents(env.DB, after, limit), {
      headers: { "cache-control": "no-store" },
    });
  }

  if (path === "/v1/sync" && request.method === "POST") {
    const body = await parseJson<PushRequest>(request);
    if (!body || !Array.isArray(body.changes) || body.changes.length > 100) {
      return apiError(request, env, 400, "invalid_body", "Provide at most 100 changes.");
    }
    if (!body.changes.every(isValidChange)) {
      return apiError(request, env, 422, "invalid_change", "One or more changes are invalid.");
    }
    const response: PushResponse = {
      results: await applyChanges(env.DB, body.changes),
      serverRevision: await getServerRevision(env.DB),
    };
    return json(request, env, response);
  }

  if (path === "/v1/refresh" && request.method === "POST") {
    return json(request, env, await refreshTrackedGames(env, true), {
      headers: { "cache-control": "no-store" },
    });
  }

  if (path === "/v1/export" && request.method === "GET") {
    return json(request, env, {
      format: "gamevault-export-v1",
      exportedAt: new Date().toISOString(),
      items: await getLibrary(env.DB),
      serverRevision: await getServerRevision(env.DB),
    });
  }

  return apiError(request, env, 404, "not_found", "That endpoint does not exist.");
}

async function refreshTrackedGames(
  env: Env,
  requireConfiguration = false,
): Promise<{ tracked: number; changed: number }> {
  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    if (requireConfiguration) throw new Error("IGDB credentials are not configured");
    return { tracked: 0, changed: 0 };
  }
  const rows = await trackedGameRows(env.DB);
  if (rows.length === 0) return { tracked: 0, changed: 0 };
  let changed = 0;
  for (let start = 0; start < rows.length; start += 500) {
    const chunk = rows.slice(start, start + 500);
    const fresh = await gamesByIds(env, chunk.map((row) => row.id));
    changed += await recordGameRefreshes(env.DB, chunk, fresh);
  }
  console.log(JSON.stringify({ event: "igdb_refresh", tracked: rows.length, changed }));
  return { tracked: rows.length, changed };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    }
    try {
      return await route(request, env);
    } catch (error) {
      console.error("request_failed", error instanceof Error ? error.message : String(error));
      const message = error instanceof Error && error.message.includes("IGDB credentials")
        ? "Game discovery is not configured yet."
        : "The server could not complete the request.";
      return apiError(request, env, 500, "internal_error", message);
    }
  },

  async scheduled(_controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    ctx.waitUntil(refreshTrackedGames(env));
  },
} satisfies ExportedHandler<Env>;

export { isValidPreferenceList, monthRange, refreshTrackedGames, route, routePublicMetadata };
