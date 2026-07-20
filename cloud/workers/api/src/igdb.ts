import type {
  AgeRating,
  FranchiseRef,
  Game,
  GameRelation,
  GameVideo,
  Genre,
  Platform,
  ReleaseDate,
  StoreLink,
} from "@gamevault/shared";
import type { Env } from "./types";

interface IGDBPlatform {
  id: number;
  name?: string;
  abbreviation?: string;
}

interface IGDBGenre {
  id: number;
  name?: string;
}

interface IGDBReleaseDate {
  id: number;
  date?: number;
  human?: string;
  region?: number;
  category?: number;
  platform?: IGDBPlatform;
}

interface IGDBNamedRef {
  id: number;
  name?: string;
}

interface IGDBExternalGame {
  id: number;
  url?: string;
  platform?: IGDBPlatform;
  external_game_source?: IGDBNamedRef;
}

interface IGDBWebsite {
  id: number;
  url?: string;
  type?: { id: number; type?: string };
}

interface IGDBVideo {
  id: number;
  name?: string;
  video_id?: string;
}

interface IGDBInvolvedCompany {
  id: number;
  publisher?: boolean;
  company?: IGDBNamedRef;
}

interface IGDBGameType {
  id: number;
  type?: string;
}

interface IGDBGameStatus {
  id: number;
  status?: string;
}

interface IGDBAgeRating {
  id: number;
  organization?: IGDBNamedRef;
  rating_category?: { id: number; rating?: string };
}

export interface IGDBGame {
  id: number;
  name?: string;
  slug?: string;
  summary?: string;
  first_release_date?: number;
  status?: number;
  category?: number;
  game_type?: IGDBGameType;
  game_status?: IGDBGameStatus;
  updated_at?: number;
  created_at?: number;
  aggregated_rating?: number;
  aggregated_rating_count?: number;
  hypes?: number;
  cover?: { image_id?: string };
  platforms?: IGDBPlatform[];
  genres?: IGDBGenre[];
  themes?: IGDBGenre[];
  game_modes?: IGDBGenre[];
  age_ratings?: IGDBAgeRating[];
  release_dates?: IGDBReleaseDate[];
  franchises?: IGDBNamedRef[];
  collections?: IGDBNamedRef[];
  external_games?: IGDBExternalGame[];
  websites?: IGDBWebsite[];
  videos?: IGDBVideo[];
  involved_companies?: IGDBInvolvedCompany[];
  remasters?: IGDBNamedRef[];
}

interface TokenResponse {
  access_token: string;
  expires_in: number;
}

interface IGDBExternalGameMapping {
  uid?: string;
  game?: number;
}

const GAME_FIELDS = [
  "id",
  "name",
  "slug",
  "summary",
  "first_release_date",
  "status",
  "category",
  "game_type.id",
  "game_type.type",
  "game_status.id",
  "game_status.status",
  "updated_at",
  "created_at",
  "aggregated_rating",
  "aggregated_rating_count",
  "hypes",
  "cover.image_id",
  "platforms.id",
  "platforms.name",
  "platforms.abbreviation",
  "genres.id",
  "genres.name",
  "themes.id",
  "themes.name",
  "game_modes.id",
  "game_modes.name",
  "age_ratings.id",
  "age_ratings.organization.id",
  "age_ratings.organization.name",
  "age_ratings.rating_category.id",
  "age_ratings.rating_category.rating",
  "release_dates.id",
  "release_dates.date",
  "release_dates.human",
  "release_dates.region",
  "release_dates.category",
  "release_dates.platform.id",
  "release_dates.platform.name",
  "release_dates.platform.abbreviation",
  "franchises.id",
  "franchises.name",
  "collections.id",
  "collections.name",
  "external_games.id",
  "external_games.url",
  "external_games.platform.id",
  "external_games.platform.name",
  "external_games.platform.abbreviation",
  "external_games.external_game_source.id",
  "external_games.external_game_source.name",
  "websites.id",
  "websites.url",
  "websites.type.id",
  "websites.type.type",
  "videos.id",
  "videos.name",
  "videos.video_id",
  "involved_companies.id",
  "involved_companies.publisher",
  "involved_companies.company.id",
  "involved_companies.company.name",
  "remasters.id",
  "remasters.name",
].join(",");

let tokenCache: { token: string; expiresAt: number } | undefined;
const IGDB_BATCH_PAUSE_MS = 275;

function pauseBetweenIGDBBatches(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, IGDB_BATCH_PAUSE_MS));
}

function requireCredentials(env: Env): { clientId: string; clientSecret: string } {
  if (!env.IGDB_CLIENT_ID || !env.IGDB_CLIENT_SECRET) {
    throw new Error("IGDB credentials are not configured");
  }
  return { clientId: env.IGDB_CLIENT_ID, clientSecret: env.IGDB_CLIENT_SECRET };
}

async function accessToken(env: Env): Promise<string> {
  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) return tokenCache.token;
  const { clientId, clientSecret } = requireCredentials(env);
  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });
  const response = await fetch(`https://id.twitch.tv/oauth2/token?${params.toString()}`, {
    method: "POST",
  });
  if (!response.ok) throw new Error(`IGDB authentication failed (${response.status})`);
  const payload = (await response.json()) as TokenResponse;
  tokenCache = {
    token: payload.access_token,
    expiresAt: now + payload.expires_in * 1000,
  };
  return payload.access_token;
}

async function queryIGDBEndpoint<T>(env: Env, endpoint: string, body: string): Promise<T[]> {
  const { clientId } = requireCredentials(env);
  const token = await accessToken(env);
  const response = await fetch(`https://api.igdb.com/v4/${endpoint}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${token}`,
      "client-id": clientId,
      "content-type": "text/plain",
    },
    body,
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`IGDB query failed (${response.status}): ${detail.slice(0, 160)}`);
  }
  return (await response.json()) as T[];
}

async function queryIGDB(env: Env, body: string): Promise<IGDBGame[]> {
  return queryIGDBEndpoint<IGDBGame>(env, "games", body);
}

export function escapeIGDBSearch(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"').trim();
}

function storeLabel(value: string): string | undefined {
  const normalized = value.toLowerCase();
  if (normalized === "steam") return "Steam";
  if (normalized === "gog") return "GOG";
  if (normalized.includes("epic")) return "Epic Games Store";
  if (normalized === "itch" || normalized === "itch.io") return "itch.io";
  if (normalized.includes("playstation")) return "PlayStation Store";
  if (normalized.includes("xbox") || normalized === "microsoft") return "Xbox Store";
  if (normalized.includes("nintendo")) return "Nintendo eShop";
  if (normalized.includes("app store") || normalized === "apple") return "App Store";
  if (normalized.includes("google play") || normalized === "android") return "Google Play";
  if (normalized.includes("oculus") || normalized.includes("meta quest")) return "Meta Quest Store";
  return undefined;
}

export function normalizeIGDBGame(source: IGDBGame): Game {
  const platforms: Platform[] = (source.platforms ?? [])
    .filter((platform) => platform.name)
    .map((platform) => ({
      id: platform.id,
      name: platform.name!,
      ...(platform.abbreviation ? { abbreviation: platform.abbreviation } : {}),
    }));
  const genres: Genre[] = (source.genres ?? [])
    .filter((genre) => genre.name)
    .map((genre) => ({ id: genre.id, name: genre.name! }));
  const themes: Genre[] = (source.themes ?? [])
    .filter((theme) => theme.name)
    .map((theme) => ({ id: theme.id, name: theme.name! }));
  const gameModes: Genre[] = (source.game_modes ?? [])
    .filter((mode) => mode.name)
    .map((mode) => ({ id: mode.id, name: mode.name! }));
  const ageRatings: AgeRating[] = (source.age_ratings ?? [])
    .flatMap((rating) => {
      const organization = rating.organization?.name?.trim();
      const value = rating.rating_category?.rating?.trim();
      return organization && value ? [{ organization, rating: value }] : [];
    })
    .filter((rating, index, ratings) => ratings.findIndex((other) => (
      other.organization === rating.organization && other.rating === rating.rating
    )) === index);
  const releaseDates: ReleaseDate[] = (source.release_dates ?? []).map((release) => ({
    id: release.id,
    ...(release.date ? { date: release.date } : {}),
    ...(release.human ? { human: release.human } : {}),
    ...(release.region !== undefined ? { region: release.region } : {}),
    ...(release.category !== undefined ? { category: release.category } : {}),
    ...(release.platform?.name
      ? {
          platform: {
            id: release.platform.id,
            name: release.platform.name,
            ...(release.platform.abbreviation
              ? { abbreviation: release.platform.abbreviation }
              : {}),
          },
        }
      : {}),
  }));
  const franchises: FranchiseRef[] = [
    ...(source.franchises ?? []).map((item) => ({ ...item, kind: "franchise" as const })),
    ...(source.collections ?? []).map((item) => ({ ...item, kind: "collection" as const })),
  ]
    .filter((item): item is FranchiseRef => Boolean(item.name))
    .filter((item, index, items) => items.findIndex((other) => (
      other.id === item.id && other.kind === item.kind
    )) === index)
    .filter((item, index, items) => items.findIndex((other) => (
      other.name.localeCompare(item.name, undefined, { sensitivity: "base" }) === 0
    )) === index);
  const externalLinks: StoreLink[] = (source.external_games ?? [])
    .filter((item) => item.url && item.external_game_source?.name && storeLabel(item.external_game_source.name))
    .map((item) => ({
      id: item.id,
      name: storeLabel(item.external_game_source!.name!)!,
      url: item.url!,
      ...(item.platform?.name
        ? {
            platform: {
              id: item.platform.id,
              name: item.platform.name,
              ...(item.platform.abbreviation ? { abbreviation: item.platform.abbreviation } : {}),
            },
          }
        : {}),
    }));
  const websiteLinks: StoreLink[] = (source.websites ?? [])
    .filter((item) => item.url && item.type?.type && storeLabel(item.type.type))
    .map((item) => ({ id: item.id, name: storeLabel(item.type!.type!)!, url: item.url! }));
  const storeLinks = [...externalLinks, ...websiteLinks]
    .filter((item, index, items) => items.findIndex((other) => other.url === item.url) === index);
  const videos: GameVideo[] = (source.videos ?? [])
    .filter((item) => item.video_id && /^[A-Za-z0-9_-]{6,20}$/.test(item.video_id))
    .map((item) => ({
      id: item.id,
      name: item.name?.trim() || "Trailer",
      videoId: item.video_id!,
    }))
    .filter((item, index, items) => items.findIndex((other) => other.videoId === item.videoId) === index);
  const publishers = [...new Set((source.involved_companies ?? [])
    .filter((item) => item.publisher && item.company?.name)
    .map((item) => item.company!.name!.trim())
    .filter(Boolean))]
    .sort((left, right) => left.localeCompare(right));
  const remasters: GameRelation[] = (source.remasters ?? [])
    .filter((item): item is Required<IGDBNamedRef> => Boolean(item.name))
    .map((item) => ({ id: item.id, name: item.name.trim() }))
    .filter((item, index, items) => items.findIndex((other) => other.id === item.id) === index);

  return {
    id: source.id,
    name: source.name?.trim() || `Game ${source.id}`,
    ...(source.slug ? { slug: source.slug } : {}),
    ...(source.summary ? { summary: source.summary } : {}),
    ...(source.cover?.image_id
      ? { coverUrl: `https://images.igdb.com/igdb/image/upload/t_cover_big/${source.cover.image_id}.jpg` }
      : {}),
    ...(source.first_release_date ? { firstReleaseDate: source.first_release_date } : {}),
    ...(source.game_status?.id !== undefined
      ? { status: source.game_status.id }
      : source.status !== undefined ? { status: source.status } : {}),
    ...(source.game_type?.id !== undefined
      ? { category: source.game_type.id }
      : source.category !== undefined ? { category: source.category } : {}),
    ...(source.updated_at ? { sourceUpdatedAt: source.updated_at } : {}),
    ...(source.created_at ? { sourceCreatedAt: source.created_at } : {}),
    ...(source.aggregated_rating !== undefined ? { criticScore: source.aggregated_rating } : {}),
    ...(source.aggregated_rating_count !== undefined
      ? { criticScoreCount: source.aggregated_rating_count }
      : {}),
    ...(source.hypes !== undefined ? { hype: source.hypes } : {}),
    ...(publishers.length ? { publishers } : {}),
    ...(remasters.length ? { remasters } : {}),
    ...(franchises.length ? { franchises } : {}),
    ...(storeLinks.length ? { storeLinks } : {}),
    ...(videos.length ? { videos } : {}),
    ageRatings,
    themes,
    gameModes,
    platforms,
    genres,
    releaseDates,
  };
}

export async function searchGames(env: Env, rawQuery: string): Promise<Game[]> {
  const query = escapeIGDBSearch(rawQuery);
  if (query.length < 2) return [];
  const rows = await queryIGDB(
    env,
    `search "${query}"; fields ${GAME_FIELDS}; where version_parent = null; limit 40;`,
  );
  return rows.map(normalizeIGDBGame);
}

export async function discoverGames(
  env: Env,
  kind: "new" | "upcoming",
): Promise<Game[]> {
  const now = Math.floor(Date.now() / 1000);
  const clause = kind === "upcoming"
    ? `where version_parent = null & first_release_date >= ${now}; sort first_release_date asc;`
    : "where version_parent = null; sort created_at desc;";
  const rows = await queryIGDB(env, `fields ${GAME_FIELDS}; ${clause} limit 50;`);
  return rows.map(normalizeIGDBGame);
}

export async function calendarGames(
  env: Env,
  start: number,
  end: number,
): Promise<Game[]> {
  if (!Number.isSafeInteger(start) || !Number.isSafeInteger(end) || start <= 0 || end <= start) {
    return [];
  }
  const rows = await queryIGDB(
    env,
    `fields ${GAME_FIELDS}; where version_parent = null & first_release_date >= ${start} & first_release_date < ${end}; sort hypes desc; limit 500;`,
  );
  return rows.map(normalizeIGDBGame);
}

export async function gamesByIds(env: Env, ids: number[]): Promise<Game[]> {
  const cleanIds = [...new Set(ids)].filter((id) => Number.isSafeInteger(id) && id > 0).slice(0, 500);
  if (cleanIds.length === 0) return [];
  const rows = await queryIGDB(
    env,
    `fields ${GAME_FIELDS}; where id = (${cleanIds.join(",")}); limit ${cleanIds.length};`,
  );
  return rows.map(normalizeIGDBGame);
}

export async function gamesBySteamAppIds(env: Env, appIds: number[]): Promise<Map<number, Game>> {
  const cleanIds = [...new Set(appIds)]
    .filter((id) => Number.isInteger(id) && id > 0 && id <= 4_294_967_295);
  if (cleanIds.length === 0) return new Map();

  const gameIDByAppID = new Map<number, number>();
  for (let start = 0; start < cleanIds.length; start += 400) {
    const chunk = cleanIds.slice(start, start + 400);
    const quoted = chunk.map((id) => `"${id}"`).join(",");
    const rows = await queryIGDBEndpoint<IGDBExternalGameMapping>(
      env,
      "external_games",
      `fields game,uid; where external_game_source = 1 & uid = (${quoted}); limit ${chunk.length};`,
    );
    for (const row of rows) {
      const appID = Number(row.uid);
      if (Number.isInteger(appID) && appID > 0 && Number.isInteger(row.game) && row.game! > 0) {
        gameIDByAppID.set(appID, row.game!);
      }
    }
    await pauseBetweenIGDBBatches();
  }

  const games: Game[] = [];
  const gameIDs = [...new Set(gameIDByAppID.values())];
  for (let start = 0; start < gameIDs.length; start += 500) {
    games.push(...await gamesByIds(env, gameIDs.slice(start, start + 500)));
    if (start + 500 < gameIDs.length) await pauseBetweenIGDBBatches();
  }
  const gamesByID = new Map(games.map((game) => [game.id, game]));
  return new Map([...gameIDByAppID].flatMap(([appID, gameID]) => {
    const game = gamesByID.get(gameID);
    return game ? [[appID, game] as const] : [];
  }));
}

export async function gamesInFranchise(
  env: Env,
  id: number,
  kind: "franchise" | "collection",
): Promise<Game[]> {
  if (!Number.isSafeInteger(id) || id <= 0) return [];
  const field = kind === "franchise" ? "franchises" : "collections";
  const rows = await queryIGDB(
    env,
    `fields ${GAME_FIELDS}; where ${field} = ${id} & version_parent = null; sort first_release_date asc; limit 500;`,
  );
  const games = rows.map(normalizeIGDBGame);
  const includedIDs = new Set(games.map((game) => game.id));
  const missingRemasterIDs = games
    .flatMap((game) => game.remasters?.map((remaster) => remaster.id) ?? [])
    .filter((remasterID) => !includedIDs.has(remasterID));
  const relatedRemasters = await gamesByIds(env, missingRemasterIDs);
  return [...games, ...relatedRemasters]
    .filter((game, index, items) => items.findIndex((other) => other.id === game.id) === index)
    .filter(isFranchiseCatalogGame)
    .sort((left, right) => (
      (left.firstReleaseDate ?? Number.MAX_SAFE_INTEGER) - (right.firstReleaseDate ?? Number.MAX_SAFE_INTEGER)
      || left.name.localeCompare(right.name)
    ));
}

const FRANCHISE_TIMELINE_TYPES = new Set([0, 4, 8, 9, 10]);
const FRANCHISE_TIMELINE_STATUSES = new Set([0, 4]);
const INACCESSIBLE_PLATFORM_PATTERN = /satellaview|barcode battler/i;
const INACCESSIBLE_TITLE_PATTERN = /^(bs\s|bs:)|barcode battler/i;

export function isFranchiseCatalogGame(game: Game): boolean {
  const gameType = game.category ?? 0;
  if (!FRANCHISE_TIMELINE_TYPES.has(gameType)) return false;
  if (game.status !== undefined && !FRANCHISE_TIMELINE_STATUSES.has(game.status)) return false;
  if (!game.firstReleaseDate) return false;
  if (INACCESSIBLE_TITLE_PATTERN.test(game.name.trim())) return false;
  if (game.platforms.length > 0 && game.platforms.every((platform) => (
    INACCESSIBLE_PLATFORM_PATTERN.test(platform.name)
  ))) return false;
  return true;
}
