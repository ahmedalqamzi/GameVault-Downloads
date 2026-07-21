import type {
  AgeRating,
  ClientChange,
  CollectionFolder,
  FriendProfile,
  FranchiseRef,
  Game,
  GameOwnershipSource,
  GameTimeToBeat,
  GameRelation,
  GameVideo,
  Genre,
  LibraryEntry,
  LibraryItem,
  LibraryStatus,
  PullResponse,
  PushResult,
  SyncEvent,
  SyncPayload,
  StoreLink,
  SteamActivityDetails,
  UserPreferences,
} from "@gamevault/shared";
import type { EventRow, GameRow, LibraryRow, PreferencesRow } from "./types";

const LIBRARY_STATUSES = new Set<LibraryStatus>([
  "wishlist",
  "backlog",
  "playing",
  "completed",
  "dropped",
]);
const FRIEND_STATUSES = new Set(["owns", "playing", "completed", "wishlist", "wants_to_play"]);
const OWNERSHIP_PROVIDERS = new Set([
  "steam", "epic", "gog", "xbox", "playstation", "nintendo", "physical", "other",
]);

function parseArray<T>(value: string | null | undefined): T[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function parseObject<T extends object>(value: string | null | undefined): T | undefined {
  if (!value) return undefined;
  try {
    const parsed: unknown = JSON.parse(value);
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as T
      : undefined;
  } catch {
    return undefined;
  }
}

export function rowToGame(row: GameRow): Game {
  const franchises = parseArray<FranchiseRef>(row.franchises_json);
  const remasters = parseArray<GameRelation>(row.remasters_json);
  const storeLinks = parseArray<StoreLink>(row.store_links_json);
  const videos = parseArray<GameVideo>(row.videos_json);
  const ageRatings = row.age_ratings_json == null
    ? undefined
    : parseArray<AgeRating>(row.age_ratings_json);
  const themes = row.themes_json == null ? undefined : parseArray<Genre>(row.themes_json);
  const gameModes = row.game_modes_json == null ? undefined : parseArray<Genre>(row.game_modes_json);
  const keywords = row.keywords_json == null ? undefined : parseArray<Genre>(row.keywords_json);
  const steamGenres = row.steam_genres_json == null
    ? undefined
    : parseArray<string>(row.steam_genres_json);
  const steamFeatures = row.steam_features_json == null
    ? undefined
    : parseArray<string>(row.steam_features_json);
  const steamTags = row.steam_tags_json == null
    ? undefined
    : parseArray<string>(row.steam_tags_json);
  const timeToBeat = parseObject<GameTimeToBeat>(row.time_to_beat_json);
  return {
    id: row.id,
    name: row.name,
    ...(row.slug ? { slug: row.slug } : {}),
    ...(row.summary ? { summary: row.summary } : {}),
    ...(row.cover_url ? { coverUrl: row.cover_url } : {}),
    ...(row.first_release_date ? { firstReleaseDate: row.first_release_date } : {}),
    ...(row.status !== null ? { status: row.status } : {}),
    ...(row.category !== null ? { category: row.category } : {}),
    ...(row.source_updated_at ? { sourceUpdatedAt: row.source_updated_at } : {}),
    ...(row.source_created_at ? { sourceCreatedAt: row.source_created_at } : {}),
    ...(row.is_custom ? { isCustom: true } : {}),
    ...(row.average_artwork_color ? { averageArtworkColor: row.average_artwork_color } : {}),
    ...(row.critic_score !== null ? { criticScore: row.critic_score } : {}),
    ...(row.critic_score_count !== null ? { criticScoreCount: row.critic_score_count } : {}),
    ...(row.hype !== null ? { hype: row.hype } : {}),
    ...(parseArray<string>(row.publishers_json).length ? { publishers: parseArray<string>(row.publishers_json) } : {}),
    ...(remasters.length ? { remasters } : {}),
    ...(franchises.length ? { franchises } : {}),
    ...(storeLinks.length ? { storeLinks } : {}),
    ...(videos.length ? { videos } : {}),
    ...(ageRatings !== undefined ? { ageRatings } : {}),
    ...(themes !== undefined ? { themes } : {}),
    ...(gameModes !== undefined ? { gameModes } : {}),
    ...(keywords !== undefined ? { keywords } : {}),
    ...(steamGenres !== undefined ? { steamGenres } : {}),
    ...(steamFeatures !== undefined ? { steamFeatures } : {}),
    ...(steamTags !== undefined ? { steamTags } : {}),
    ...(row.controller_support === "full" || row.controller_support === "partial"
      ? { controllerSupport: row.controller_support }
      : {}),
    ...(new Set(["native", "platinum", "gold", "silver", "bronze", "borked", "pending"])
      .has(row.linux_support ?? "")
      ? { linuxSupport: row.linux_support as NonNullable<Game["linuxSupport"]> }
      : {}),
    ...(row.proton_confidence ? { protonConfidence: row.proton_confidence } : {}),
    ...(row.steam_metadata_synced_at ? { steamMetadataSyncedAt: row.steam_metadata_synced_at } : {}),
    ...(timeToBeat ? { timeToBeat } : {}),
    platforms: parseArray(row.platforms_json),
    genres: parseArray(row.genres_json),
    releaseDates: parseArray(row.release_dates_json),
  };
}

function rowToEntry(row: LibraryRow): LibraryEntry {
  const status = LIBRARY_STATUSES.has(row.entry_status as LibraryStatus)
    ? (row.entry_status as LibraryStatus)
    : "wishlist";
  const steamActivity = parseObject<SteamActivityDetails>(row.steam_activity_json);
  const friends = parseArray<NonNullable<LibraryEntry["friends"]>[number]>(row.friends_json)
    .map((friend) => friend.status === "wants_to_play" ? { ...friend, status: "wishlist" as const } : friend);
  const ownershipSources = parseArray<GameOwnershipSource>(row.ownership_sources_json);
  return {
    gameId: row.id,
    status,
    notes: row.notes,
    ...(row.personal_rating !== null ? { personalRating: row.personal_rating } : {}),
    ...(row.story_progress !== null ? { storyProgress: row.story_progress } : {}),
    ...(row.overall_progress !== null ? { overallProgress: row.overall_progress } : {}),
    ...(row.review ? { review: row.review } : {}),
    ...(row.completed_at ? { completedAt: row.completed_at } : {}),
    ...(parseArray<string>(row.library_platforms_json).length
      ? { libraryPlatforms: parseArray<string>(row.library_platforms_json) }
      : {}),
    ...(row.import_sources ? { importSources: row.import_sources } : {}),
    ...(parseArray<string>(row.tags_json).length ? { tags: parseArray<string>(row.tags_json) } : {}),
    ...(parseArray<NonNullable<LibraryEntry["playthroughs"]>[number]>(row.playthroughs_json).length
      ? { playthroughs: parseArray<NonNullable<LibraryEntry["playthroughs"]>[number]>(row.playthroughs_json) }
      : {}),
    ...(parseArray<NonNullable<LibraryEntry["playSessions"]>[number]>(row.play_sessions_json).length
      ? { playSessions: parseArray<NonNullable<LibraryEntry["playSessions"]>[number]>(row.play_sessions_json) }
      : {}),
    ...(friends.length ? { friends } : {}),
    ...(ownershipSources.length ? { ownershipSources } : {}),
    ...(parseArray<string>(row.custom_folder_ids_json).length
      ? { customFolderIds: parseArray<string>(row.custom_folder_ids_json) }
      : {}),
    ...(row.steam_app_id !== null ? { steamAppId: row.steam_app_id } : {}),
    ...(row.steam_playtime_minutes !== null ? { steamPlaytimeMinutes: row.steam_playtime_minutes } : {}),
    ...(row.steam_playtime_two_weeks_minutes !== null
      ? { steamPlaytimeTwoWeeksMinutes: row.steam_playtime_two_weeks_minutes }
      : {}),
    ...(row.steam_last_played_at ? { steamLastPlayedAt: row.steam_last_played_at } : {}),
    ...(row.steam_synced_at ? { steamSyncedAt: row.steam_synced_at } : {}),
    ...(steamActivity ? { steamActivity } : {}),
    ...(row.is_up_next ? { isUpNext: true } : {}),
    ...(row.up_next_position === 1 || row.up_next_position === 2 || row.up_next_position === 3
      ? { upNextPosition: row.up_next_position }
      : {}),
    ...(row.manual_order !== null ? { manualOrder: row.manual_order } : {}),
    createdAt: row.entry_created_at,
    updatedAt: row.entry_updated_at,
    ...(row.deleted_at ? { deletedAt: row.deleted_at } : {}),
  };
}

function eventFromRow(row: EventRow): SyncEvent {
  return {
    revision: row.revision,
    eventId: row.event_id,
    entity: row.entity,
    entityId: row.entity_id,
    operation: row.operation,
    payload: JSON.parse(row.payload_json) as SyncPayload,
    createdAt: row.created_at,
  };
}

export function isValidGame(game: Game): boolean {
  const validID = Number.isSafeInteger(game.id) && (game.id > 0 || (game.id < 0 && game.isCustom));
  const estimate = game.timeToBeat;
  const validEstimate = estimate === undefined || (
    Number.isInteger(estimate.submissionCount)
    && estimate.submissionCount >= 0
    && [estimate.mainStorySeconds, estimate.mainExtraSeconds, estimate.completionistSeconds]
      .every((value) => value === undefined || (Number.isInteger(value) && value > 0 && value <= 315_576_000))
    && (estimate.sourceUpdatedAt === undefined
      || (Number.isInteger(estimate.sourceUpdatedAt) && estimate.sourceUpdatedAt > 0))
  );
  return Boolean(
    validID
    && typeof game.name === "string"
    && game.name.trim().length > 0
    && game.name.trim().length <= 500
    && validEstimate,
  );
}

function isValidSteamActivity(value: SteamActivityDetails | undefined): boolean {
  if (value === undefined) return true;
  const nonNegativeIntegers = [
    value.playtimeWindowsMinutes,
    value.playtimeMacMinutes,
    value.playtimeLinuxMinutes,
    value.playtimeDeckMinutes,
    value.playtimeDisconnectedMinutes,
    value.achievementsUnlocked,
    value.achievementsTotal,
  ];
  return nonNegativeIntegers.every((item) => item === undefined || (Number.isInteger(item) && item >= 0))
    && (value.hasCommunityStats === undefined || typeof value.hasCommunityStats === "boolean")
    && (value.achievementsAvailable === undefined || typeof value.achievementsAvailable === "boolean")
    && (value.achievementPercent === undefined || (
      Number.isFinite(value.achievementPercent)
      && value.achievementPercent >= 0
      && value.achievementPercent <= 100
    ))
    && (value.lastAchievementAt === undefined || !Number.isNaN(Date.parse(value.lastAchievementAt)))
    && (value.achievementsSyncedAt === undefined || !Number.isNaN(Date.parse(value.achievementsSyncedAt)));
}

export function isValidEntry(entry: LibraryEntry | undefined, gameId: number): boolean {
  return Boolean(
    entry
      && entry.gameId === gameId
      && LIBRARY_STATUSES.has(entry.status)
      && entry.notes.length <= 20_000
      && (entry.review === undefined || entry.review.length <= 50_000)
      && (entry.personalRating === undefined
        || (Number.isInteger(entry.personalRating)
          && entry.personalRating >= 0
          && entry.personalRating <= 100))
      && (entry.storyProgress === undefined
        || (Number.isInteger(entry.storyProgress) && entry.storyProgress >= 0 && entry.storyProgress <= 100))
      && (entry.overallProgress === undefined
        || (Number.isInteger(entry.overallProgress) && entry.overallProgress >= 0 && entry.overallProgress <= 100))
      && (entry.libraryPlatforms === undefined
        || (Array.isArray(entry.libraryPlatforms)
          && entry.libraryPlatforms.length <= 100
          && entry.libraryPlatforms.every((platform) => typeof platform === "string" && platform.trim().length <= 100)))
      && (entry.tags === undefined || (
        Array.isArray(entry.tags)
        && entry.tags.length <= 50
        && entry.tags.every((tag) => typeof tag === "string" && tag.trim().length <= 60)
      ))
      && (entry.playthroughs === undefined || (
        Array.isArray(entry.playthroughs)
        && entry.playthroughs.length <= 250
        && entry.playthroughs.every((playthrough) => (
          typeof playthrough.id === "string"
          && playthrough.id.length <= 100
          && !Number.isNaN(Date.parse(playthrough.startedAt))
          && (playthrough.endedAt === undefined || !Number.isNaN(Date.parse(playthrough.endedAt)))
          && (playthrough.platform === undefined || playthrough.platform.length <= 100)
          && (playthrough.notes === undefined || playthrough.notes.length <= 2_000)
        ))
      ))
      && (entry.playSessions === undefined || (
        Array.isArray(entry.playSessions)
        && entry.playSessions.length <= 10_000
        && entry.playSessions.every((session) => (
          typeof session.id === "string"
          && session.id.length <= 100
          && !Number.isNaN(Date.parse(session.playedAt))
          && Number.isInteger(session.minutes)
          && session.minutes > 0
          && session.minutes <= 1_440
          && (session.platform === undefined || session.platform.length <= 100)
          && (session.notes === undefined || session.notes.length <= 2_000)
        ))
      ))
      && (entry.friends === undefined || (
        Array.isArray(entry.friends)
        && entry.friends.length <= 250
        && entry.friends.every((friend) => (
          typeof friend.id === "string"
          && friend.id.length <= 100
          && typeof friend.name === "string"
          && friend.name.trim().length <= 100
          && FRIEND_STATUSES.has(friend.status)
          && (friend.platform === undefined || friend.platform.length <= 100)
        ))
      ))
      && (entry.ownershipSources === undefined || (
        Array.isArray(entry.ownershipSources)
        && entry.ownershipSources.length <= 50
        && entry.ownershipSources.every((source) => (
          typeof source.id === "string"
          && source.id.trim().length >= 3
          && source.id.trim().length <= 100
          && OWNERSHIP_PROVIDERS.has(source.provider)
          && typeof source.label === "string"
          && source.label.trim().length > 0
          && source.label.trim().length <= 100
          && (source.externalId === undefined || source.externalId.trim().length <= 200)
          && (source.platform === undefined || source.platform.trim().length <= 100)
          && (source.playtimeMinutes === undefined
            || (Number.isInteger(source.playtimeMinutes) && source.playtimeMinutes >= 0))
          && (source.lastPlayedAt === undefined || !Number.isNaN(Date.parse(source.lastPlayedAt)))
          && (source.syncMode === undefined
            || source.syncMode === "automatic" || source.syncMode === "import" || source.syncMode === "manual")
          && (source.syncedAt === undefined || !Number.isNaN(Date.parse(source.syncedAt)))
          && !Number.isNaN(Date.parse(source.addedAt))
          && !Number.isNaN(Date.parse(source.updatedAt))
        ))
      ))
      && (entry.customFolderIds === undefined || (
        Array.isArray(entry.customFolderIds)
        && entry.customFolderIds.length <= 100
        && entry.customFolderIds.every((id) => typeof id === "string" && id.length >= 8 && id.length <= 100)
      ))
      && (entry.steamAppId === undefined
        || (Number.isInteger(entry.steamAppId) && entry.steamAppId > 0 && entry.steamAppId <= 4_294_967_295))
      && (entry.steamPlaytimeMinutes === undefined
        || (Number.isInteger(entry.steamPlaytimeMinutes) && entry.steamPlaytimeMinutes >= 0))
      && (entry.steamPlaytimeTwoWeeksMinutes === undefined
        || (Number.isInteger(entry.steamPlaytimeTwoWeeksMinutes) && entry.steamPlaytimeTwoWeeksMinutes >= 0))
      && (entry.steamLastPlayedAt === undefined || !Number.isNaN(Date.parse(entry.steamLastPlayedAt)))
      && (entry.steamSyncedAt === undefined || !Number.isNaN(Date.parse(entry.steamSyncedAt)))
      && isValidSteamActivity(entry.steamActivity)
      && (entry.isUpNext === undefined || typeof entry.isUpNext === "boolean")
      && (entry.upNextPosition === undefined
        || entry.upNextPosition === 1 || entry.upNextPosition === 2 || entry.upNextPosition === 3)
      && (entry.manualOrder === undefined || Number.isFinite(entry.manualOrder))
      && !Number.isNaN(Date.parse(entry.createdAt))
      && !Number.isNaN(Date.parse(entry.updatedAt)),
  );
}

function gameStatement(db: D1Database, game: Game): D1PreparedStatement {
  return db.prepare(
    `INSERT INTO games (
      id, name, slug, summary, cover_url, first_release_date, status, category,
      source_updated_at, source_created_at, is_custom, average_artwork_color,
      critic_score, critic_score_count, hype, publishers_json, remasters_json, franchises_json, store_links_json, videos_json,
      age_ratings_json, themes_json, game_modes_json, keywords_json, steam_genres_json, steam_features_json, steam_tags_json,
      controller_support, linux_support, proton_confidence, steam_metadata_synced_at, time_to_beat_json,
      platforms_json, genres_json, release_dates_json, cached_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      slug = excluded.slug,
      summary = excluded.summary,
      cover_url = excluded.cover_url,
      first_release_date = excluded.first_release_date,
      status = excluded.status,
      category = excluded.category,
      source_updated_at = excluded.source_updated_at,
      source_created_at = excluded.source_created_at,
      is_custom = excluded.is_custom,
      average_artwork_color = COALESCE(excluded.average_artwork_color, games.average_artwork_color),
      critic_score = excluded.critic_score,
      critic_score_count = excluded.critic_score_count,
      hype = excluded.hype,
      publishers_json = excluded.publishers_json,
      remasters_json = excluded.remasters_json,
      franchises_json = excluded.franchises_json,
      store_links_json = excluded.store_links_json,
      videos_json = excluded.videos_json,
      age_ratings_json = COALESCE(excluded.age_ratings_json, games.age_ratings_json),
      themes_json = COALESCE(excluded.themes_json, games.themes_json),
      game_modes_json = COALESCE(excluded.game_modes_json, games.game_modes_json),
      keywords_json = COALESCE(excluded.keywords_json, games.keywords_json),
      steam_genres_json = COALESCE(excluded.steam_genres_json, games.steam_genres_json),
      steam_features_json = COALESCE(excluded.steam_features_json, games.steam_features_json),
      steam_tags_json = COALESCE(excluded.steam_tags_json, games.steam_tags_json),
      controller_support = COALESCE(excluded.controller_support, games.controller_support),
      linux_support = COALESCE(excluded.linux_support, games.linux_support),
      proton_confidence = COALESCE(excluded.proton_confidence, games.proton_confidence),
      steam_metadata_synced_at = COALESCE(excluded.steam_metadata_synced_at, games.steam_metadata_synced_at),
      time_to_beat_json = COALESCE(excluded.time_to_beat_json, games.time_to_beat_json),
      platforms_json = excluded.platforms_json,
      genres_json = excluded.genres_json,
      release_dates_json = excluded.release_dates_json,
      cached_at = excluded.cached_at`,
  ).bind(
    game.id,
    game.name,
    game.slug ?? null,
    game.summary ?? null,
    game.coverUrl ?? null,
    game.firstReleaseDate ?? null,
    game.status ?? null,
    game.category ?? null,
    game.sourceUpdatedAt ?? null,
    game.sourceCreatedAt ?? null,
    game.isCustom ? 1 : 0,
    game.averageArtworkColor ?? null,
    game.criticScore ?? null,
    game.criticScoreCount ?? null,
    game.hype ?? null,
    JSON.stringify(game.publishers ?? []),
    JSON.stringify(game.remasters ?? []),
    JSON.stringify(game.franchises ?? []),
    JSON.stringify(game.storeLinks ?? []),
    JSON.stringify(game.videos ?? []),
    game.ageRatings === undefined ? null : JSON.stringify(game.ageRatings),
    game.themes === undefined ? null : JSON.stringify(game.themes),
    game.gameModes === undefined ? null : JSON.stringify(game.gameModes),
    game.keywords === undefined ? null : JSON.stringify(game.keywords),
    game.steamGenres === undefined ? null : JSON.stringify(game.steamGenres),
    game.steamFeatures === undefined ? null : JSON.stringify(game.steamFeatures),
    game.steamTags === undefined ? null : JSON.stringify(game.steamTags),
    game.controllerSupport ?? null,
    game.linuxSupport ?? null,
    game.protonConfidence ?? null,
    game.steamMetadataSyncedAt ?? null,
    game.timeToBeat === undefined ? null : JSON.stringify(game.timeToBeat),
    JSON.stringify(game.platforms),
    JSON.stringify(game.genres),
    JSON.stringify(game.releaseDates),
    new Date().toISOString(),
  );
}

export async function cacheGames(db: D1Database, games: Game[]): Promise<void> {
  if (games.length === 0) return;
  for (let start = 0; start < games.length; start += 100) {
    await db.batch(games.slice(start, start + 100).map((game) => gameStatement(db, game)));
  }
}

export async function getLibrary(db: D1Database): Promise<LibraryItem[]> {
  const result = await db.prepare(
    `SELECT
      g.*,
      e.status AS entry_status,
      e.notes,
      e.personal_rating,
      e.story_progress,
      e.overall_progress,
      e.review,
      e.completed_at,
      e.library_platforms_json,
      e.import_sources,
      e.tags_json,
      e.playthroughs_json,
      e.play_sessions_json,
      e.friends_json,
      e.ownership_sources_json,
      e.custom_folder_ids_json,
      e.steam_app_id,
      e.steam_playtime_minutes,
      e.steam_playtime_two_weeks_minutes,
      e.steam_last_played_at,
      e.steam_synced_at,
      e.steam_activity_json,
      e.is_up_next,
      e.up_next_position,
      e.manual_order,
      e.created_at AS entry_created_at,
      e.updated_at AS entry_updated_at,
      e.deleted_at
    FROM library_entries e
    JOIN games g ON g.id = e.game_id
    WHERE e.deleted_at IS NULL
    ORDER BY e.updated_at DESC`,
  ).all<LibraryRow>();
  return result.results.map((row) => ({ game: rowToGame(row), entry: rowToEntry(row) }));
}

const EMPTY_PREFERENCES: UserPreferences = {
  preferredPlatforms: [],
  preferredStores: [],
  followedFranchises: [],
  customFolders: [],
  friendProfiles: [],
  updatedAt: "1970-01-01T00:00:00.000Z",
};

function normalizePreferenceValues(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))].slice(0, 100);
}

function normalizeCustomFolders(values: CollectionFolder[]): CollectionFolder[] {
  const seenIDs = new Set<string>();
  const seenNames = new Set<string>();
  return values.flatMap((folder) => {
    const id = folder.id.trim();
    const name = folder.name.trim();
    const nameKey = name.toLocaleLowerCase();
    if (!id || !name || seenIDs.has(id) || seenNames.has(nameKey)) return [];
    seenIDs.add(id);
    seenNames.add(nameKey);
    return [{ id, name, createdAt: folder.createdAt }];
  }).slice(0, 100);
}

function normalizeFollowedFranchises(values: FranchiseRef[]): FranchiseRef[] {
  const seen = new Set<string>();
  return values.flatMap((reference) => {
    const key = `${reference.kind}:${reference.id}`;
    if (seen.has(key)) return [];
    seen.add(key);
    return [{
      id: reference.id,
      name: reference.name.trim(),
      kind: reference.kind,
      ...(reference.coverUrl ? { coverUrl: reference.coverUrl.trim() } : {}),
      ...(reference.averageArtworkColor ? { averageArtworkColor: reference.averageArtworkColor.trim() } : {}),
      ...(reference.publisher ? { publisher: reference.publisher.trim() } : {}),
    }];
  }).slice(0, 500);
}

function normalizeFriendProfiles(values: FriendProfile[]): FriendProfile[] {
  const seenIDs = new Set<string>();
  const seenSteamIDs = new Set<string>();
  return values.flatMap((profile) => {
    const id = profile.id.trim();
    const name = profile.name.trim();
    const steamId = profile.steamId?.trim();
    if (!id || !name || seenIDs.has(id) || (steamId && seenSteamIDs.has(steamId))) return [];
    seenIDs.add(id);
    if (steamId) seenSteamIDs.add(steamId);
    return [{
      id,
      name,
      ...(steamId ? { steamId } : {}),
      ...(profile.profileUrl?.trim() ? { profileUrl: profile.profileUrl.trim() } : {}),
      ...(profile.notes?.trim() ? { notes: profile.notes.trim() } : {}),
      ...(profile.favorite ? { favorite: true } : {}),
      createdAt: profile.createdAt,
      updatedAt: profile.updatedAt,
    }];
  }).slice(0, 500);
}

export async function getPreferences(db: D1Database): Promise<UserPreferences> {
  const row = await db.prepare(
    `SELECT preferred_platforms_json, preferred_stores_json, followed_franchises_json,
            custom_folders_json, friend_profiles_json, steam_id, updated_at
     FROM user_preferences WHERE id = 1`,
  ).first<PreferencesRow>();
  if (!row) return EMPTY_PREFERENCES;
  return {
    preferredPlatforms: parseArray<string>(row.preferred_platforms_json),
    preferredStores: parseArray<string>(row.preferred_stores_json),
    followedFranchises: parseArray<FranchiseRef>(row.followed_franchises_json),
    customFolders: parseArray<CollectionFolder>(row.custom_folders_json),
    friendProfiles: normalizeFriendProfiles(parseArray<FriendProfile>(row.friend_profiles_json)),
    ...(row.steam_id ? { steamId: row.steam_id } : {}),
    updatedAt: row.updated_at,
  };
}

export async function savePreferences(
  db: D1Database,
  input: Pick<UserPreferences, "preferredPlatforms" | "preferredStores">
    & Partial<Pick<UserPreferences, "followedFranchises" | "customFolders" | "friendProfiles" | "steamId">>,
): Promise<UserPreferences> {
  const current = await getPreferences(db);
  const steamId = input.steamId === undefined ? current.steamId : input.steamId.trim() || undefined;
  const preferences: UserPreferences = {
    preferredPlatforms: normalizePreferenceValues(input.preferredPlatforms),
    preferredStores: normalizePreferenceValues(input.preferredStores),
    followedFranchises: normalizeFollowedFranchises(input.followedFranchises ?? current?.followedFranchises ?? []),
    customFolders: normalizeCustomFolders(input.customFolders ?? current.customFolders),
    friendProfiles: normalizeFriendProfiles(input.friendProfiles ?? current.friendProfiles),
    ...(steamId ? { steamId } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.prepare(
    `INSERT INTO user_preferences (
       id, preferred_platforms_json, preferred_stores_json, followed_franchises_json,
       custom_folders_json, friend_profiles_json, steam_id, updated_at
     ) VALUES (1, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       preferred_platforms_json = excluded.preferred_platforms_json,
       preferred_stores_json = excluded.preferred_stores_json,
       followed_franchises_json = excluded.followed_franchises_json,
       custom_folders_json = excluded.custom_folders_json,
       friend_profiles_json = excluded.friend_profiles_json,
       steam_id = excluded.steam_id,
       updated_at = excluded.updated_at`,
  ).bind(
    JSON.stringify(preferences.preferredPlatforms),
    JSON.stringify(preferences.preferredStores),
    JSON.stringify(preferences.followedFranchises),
    JSON.stringify(preferences.customFolders),
    JSON.stringify(preferences.friendProfiles),
    preferences.steamId ?? null,
    preferences.updatedAt,
  ).run();
  return preferences;
}

export async function getServerRevision(db: D1Database): Promise<number> {
  const row = await db.prepare(
    "SELECT COALESCE(MAX(revision), 0) AS revision FROM sync_events",
  ).first<{ revision: number }>();
  return row?.revision ?? 0;
}

export async function pullEvents(
  db: D1Database,
  after: number,
  requestedLimit: number,
): Promise<PullResponse> {
  const limit = Math.max(1, Math.min(requestedLimit, 500));
  const result = await db.prepare(
    `SELECT revision, event_id, entity, entity_id, operation, payload_json, created_at
     FROM sync_events
     WHERE revision > ?
     ORDER BY revision ASC
     LIMIT ?`,
  ).bind(after, limit + 1).all<EventRow>();
  const hasMore = result.results.length > limit;
  const rows = result.results.slice(0, limit);
  const events = rows.map(eventFromRow);
  return {
    events,
    nextCursor: events.at(-1)?.revision ?? after,
    hasMore,
  };
}

async function insertEvent(
  db: D1Database,
  eventId: string,
  entity: "library" | "game",
  entityId: string,
  operation: "upsert" | "delete",
  payload: SyncPayload,
  createdAt: string,
): Promise<number> {
  const inserted = await db.prepare(
    `INSERT INTO sync_events (event_id, entity, entity_id, operation, payload_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?)
     RETURNING revision`,
  ).bind(
    eventId,
    entity,
    entityId,
    operation,
    JSON.stringify(payload),
    createdAt,
  ).first<{ revision: number }>();
  return inserted?.revision ?? 0;
}

async function applyChange(db: D1Database, change: ClientChange): Promise<PushResult> {
  const duplicate = await db.prepare(
    "SELECT revision FROM sync_events WHERE event_id = ?",
  ).bind(change.id).first<{ revision: number }>();
  if (duplicate) return { id: change.id, disposition: "duplicate" };

  const existing = await db.prepare(
    `SELECT updated_at, custom_folder_ids_json, ownership_sources_json, up_next_position,
            steam_app_id, steam_playtime_minutes,
            steam_playtime_two_weeks_minutes, steam_last_played_at, steam_synced_at,
            steam_activity_json
     FROM library_entries WHERE game_id = ?`,
  ).bind(change.game.id).first<{
    updated_at: string;
    custom_folder_ids_json: string;
    ownership_sources_json: string;
    up_next_position: number | null;
    steam_app_id: number | null;
    steam_playtime_minutes: number | null;
    steam_playtime_two_weeks_minutes: number | null;
    steam_last_played_at: string | null;
    steam_synced_at: string | null;
    steam_activity_json: string | null;
  }>();
  if (existing && existing.updated_at > change.changedAt) {
    return { id: change.id, disposition: "stale" };
  }

  await gameStatement(db, change.game).run();
  const now = new Date().toISOString();
  if (change.operation === "delete") {
    const deletedAt = change.changedAt;
    await db.prepare(
      `INSERT INTO library_entries (
        game_id, status, notes, personal_rating, created_at, updated_at, deleted_at
      ) VALUES (?, 'wishlist', '', NULL, ?, ?, ?)
      ON CONFLICT(game_id) DO UPDATE SET
        updated_at = excluded.updated_at,
        deleted_at = excluded.deleted_at`,
    ).bind(change.game.id, change.changedAt, change.changedAt, deletedAt).run();
    await insertEvent(
      db,
      change.id,
      "library",
      String(change.game.id),
      "delete",
      { gameId: change.game.id, deletedAt },
      now,
    );
    return { id: change.id, disposition: "accepted" };
  }

  // Older clients do not know about custom folders or Steam fields. Merge those
  // additive fields from the current row so an edit from an older app can never
  // erase newer data.
  const entry: LibraryEntry = { ...change.entry! };
  if (entry.friends) {
    entry.friends = entry.friends.map((friend) => (
      friend.status === "wants_to_play" ? { ...friend, status: "wishlist" } : friend
    ));
  }
  if (existing) {
    if (entry.customFolderIds === undefined) {
      const folderIDs = parseArray<string>(existing.custom_folder_ids_json);
      if (folderIDs.length) entry.customFolderIds = folderIDs;
    }
    if (entry.ownershipSources === undefined) {
      const ownershipSources = parseArray<GameOwnershipSource>(existing.ownership_sources_json);
      if (ownershipSources.length) entry.ownershipSources = ownershipSources;
    }
    if (entry.upNextPosition === undefined && entry.isUpNext === undefined && existing.up_next_position !== null) {
      entry.upNextPosition = existing.up_next_position as 1 | 2 | 3;
      entry.isUpNext = true;
    }
    if (entry.steamAppId === undefined && existing.steam_app_id !== null) entry.steamAppId = existing.steam_app_id;
    if (entry.steamPlaytimeMinutes === undefined && existing.steam_playtime_minutes !== null) {
      entry.steamPlaytimeMinutes = existing.steam_playtime_minutes;
    }
    if (entry.steamPlaytimeTwoWeeksMinutes === undefined && existing.steam_playtime_two_weeks_minutes !== null) {
      entry.steamPlaytimeTwoWeeksMinutes = existing.steam_playtime_two_weeks_minutes;
    }
    if (entry.steamLastPlayedAt === undefined && existing.steam_last_played_at) {
      entry.steamLastPlayedAt = existing.steam_last_played_at;
    }
    if (entry.steamSyncedAt === undefined && existing.steam_synced_at) entry.steamSyncedAt = existing.steam_synced_at;
    if (entry.steamActivity === undefined && existing.steam_activity_json) {
      entry.steamActivity = parseObject<SteamActivityDetails>(existing.steam_activity_json);
    }
  }
  await db.prepare(
    `INSERT INTO library_entries (
      game_id, status, notes, personal_rating, story_progress, overall_progress,
      review, completed_at, library_platforms_json, import_sources,
      tags_json, playthroughs_json, play_sessions_json, friends_json, ownership_sources_json,
      custom_folder_ids_json, steam_app_id, steam_playtime_minutes,
      steam_playtime_two_weeks_minutes, steam_last_played_at, steam_synced_at,
      steam_activity_json, is_up_next, up_next_position, manual_order, created_at, updated_at, deleted_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
    ON CONFLICT(game_id) DO UPDATE SET
      status = excluded.status,
      notes = excluded.notes,
      personal_rating = excluded.personal_rating,
      story_progress = excluded.story_progress,
      overall_progress = excluded.overall_progress,
      review = excluded.review,
      completed_at = excluded.completed_at,
      library_platforms_json = excluded.library_platforms_json,
      import_sources = excluded.import_sources,
      tags_json = excluded.tags_json,
      playthroughs_json = excluded.playthroughs_json,
      play_sessions_json = excluded.play_sessions_json,
      friends_json = excluded.friends_json,
      ownership_sources_json = excluded.ownership_sources_json,
      custom_folder_ids_json = excluded.custom_folder_ids_json,
      steam_app_id = excluded.steam_app_id,
      steam_playtime_minutes = excluded.steam_playtime_minutes,
      steam_playtime_two_weeks_minutes = excluded.steam_playtime_two_weeks_minutes,
      steam_last_played_at = excluded.steam_last_played_at,
      steam_synced_at = excluded.steam_synced_at,
      steam_activity_json = excluded.steam_activity_json,
      is_up_next = excluded.is_up_next,
      up_next_position = excluded.up_next_position,
      manual_order = excluded.manual_order,
      updated_at = excluded.updated_at,
      deleted_at = NULL`,
  ).bind(
    entry.gameId,
    entry.status,
    entry.notes,
    entry.personalRating ?? null,
    entry.storyProgress ?? null,
    entry.overallProgress ?? null,
    entry.review ?? null,
    entry.completedAt ?? null,
    JSON.stringify(entry.libraryPlatforms ?? []),
    entry.importSources ?? null,
    JSON.stringify(entry.tags ?? []),
    JSON.stringify(entry.playthroughs ?? []),
    JSON.stringify(entry.playSessions ?? []),
    JSON.stringify(entry.friends ?? []),
    JSON.stringify(entry.ownershipSources ?? []),
    JSON.stringify(entry.customFolderIds ?? []),
    entry.steamAppId ?? null,
    entry.steamPlaytimeMinutes ?? null,
    entry.steamPlaytimeTwoWeeksMinutes ?? null,
    entry.steamLastPlayedAt ?? null,
    entry.steamSyncedAt ?? null,
    entry.steamActivity === undefined ? null : JSON.stringify(entry.steamActivity),
    entry.isUpNext ? 1 : 0,
    entry.isUpNext ? entry.upNextPosition ?? 1 : null,
    entry.manualOrder ?? null,
    entry.createdAt,
    entry.updatedAt,
  ).run();
  await insertEvent(
    db,
    change.id,
    "library",
    String(change.game.id),
    "upsert",
    { game: change.game, entry },
    now,
  );
  return { id: change.id, disposition: "accepted" };
}

export async function applyChanges(
  db: D1Database,
  changes: ClientChange[],
): Promise<PushResult[]> {
  const results: PushResult[] = [];
  for (const change of changes) {
    results.push(await applyChange(db, change));
  }
  return results;
}

export async function trackedGameRows(db: D1Database): Promise<GameRow[]> {
  const result = await db.prepare(
    `SELECT g.*
     FROM games g
     JOIN library_entries e ON e.game_id = g.id
     WHERE e.deleted_at IS NULL AND g.id > 0 AND g.is_custom = 0`,
  ).all<GameRow>();
  return result.results;
}

export async function recordGameRefreshes(
  db: D1Database,
  oldRows: GameRow[],
  freshGames: Game[],
): Promise<number> {
  const oldById = new Map(oldRows.map((row) => [row.id, row]));
  await cacheGames(db, freshGames);
  const eventStatements: D1PreparedStatement[] = [];
  for (const game of freshGames) {
    const old = oldById.get(game.id);
    const releaseDatesChanged = old?.release_dates_json !== JSON.stringify(game.releaseDates);
    const sourceChanged = old?.source_updated_at !== (game.sourceUpdatedAt ?? null);
    const discoveryChanged = old?.critic_score !== (game.criticScore ?? null)
      || old?.hype !== (game.hype ?? null)
      || old?.publishers_json !== JSON.stringify(game.publishers ?? [])
      || old?.remasters_json !== JSON.stringify(game.remasters ?? [])
      || old?.franchises_json !== JSON.stringify(game.franchises ?? [])
      || old?.store_links_json !== JSON.stringify(game.storeLinks ?? [])
      || old?.videos_json !== JSON.stringify(game.videos ?? [])
      || old?.age_ratings_json !== JSON.stringify(game.ageRatings ?? [])
      || old?.themes_json !== JSON.stringify(game.themes ?? [])
      || old?.game_modes_json !== JSON.stringify(game.gameModes ?? [])
      || old?.keywords_json !== JSON.stringify(game.keywords ?? [])
      || (game.timeToBeat !== undefined
        && old?.time_to_beat_json !== JSON.stringify(game.timeToBeat));
    if (!old || releaseDatesChanged || sourceChanged || discoveryChanged) {
      eventStatements.push(db.prepare(
        `INSERT INTO sync_events (event_id, entity, entity_id, operation, payload_json, created_at)
         VALUES (?, 'game', ?, 'upsert', ?, ?)`,
      ).bind(
        crypto.randomUUID(),
        String(game.id),
        JSON.stringify({ game }),
        new Date().toISOString(),
      ));
    }
  }
  for (let start = 0; start < eventStatements.length; start += 100) {
    await db.batch(eventStatements.slice(start, start + 100));
  }
  return eventStatements.length;
}
