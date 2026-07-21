export type LibraryStatus =
  | "wishlist"
  | "backlog"
  | "playing"
  | "completed"
  | "dropped";

export interface Platform {
  id: number;
  name: string;
  abbreviation?: string;
}

export interface Genre {
  id: number;
  name: string;
}

export interface AgeRating {
  organization: string;
  rating: string;
}

export type SteamControllerSupport = "full" | "partial";

export type LinuxSupport =
  | "native"
  | "platinum"
  | "gold"
  | "silver"
  | "bronze"
  | "borked"
  | "pending";

export interface ReleaseDate {
  id: number;
  date?: number;
  human?: string;
  region?: number;
  category?: number;
  platform?: Platform;
}

export interface FranchiseRef {
  id: number;
  name: string;
  kind: "franchise" | "collection";
  coverUrl?: string;
  averageArtworkColor?: string;
  publisher?: string;
}

export interface StoreLink {
  id: number;
  name: string;
  url: string;
  platform?: Platform;
}

export interface GameVideo {
  id: number;
  name: string;
  videoId: string;
}

export interface GameRelation {
  id: number;
  name: string;
}

export interface UserPreferences {
  preferredPlatforms: string[];
  preferredStores: string[];
  followedFranchises: FranchiseRef[];
  customFolders: CollectionFolder[];
  steamId?: string;
  updatedAt: string;
}

export interface CollectionFolder {
  id: string;
  name: string;
  createdAt: string;
}

export interface PreferencesResponse {
  preferences: UserPreferences;
}

export interface Playthrough {
  id: string;
  startedAt: string;
  endedAt?: string;
  platform?: string;
  notes?: string;
}

export interface PlaySession {
  id: string;
  playedAt: string;
  minutes: number;
  platform?: string;
  notes?: string;
}

export interface SteamActivityDetails {
  playtimeWindowsMinutes?: number;
  playtimeMacMinutes?: number;
  playtimeLinuxMinutes?: number;
  playtimeDeckMinutes?: number;
  playtimeDisconnectedMinutes?: number;
  hasCommunityStats?: boolean;
  achievementsAvailable?: boolean;
  achievementsUnlocked?: number;
  achievementsTotal?: number;
  achievementPercent?: number;
  lastAchievementAt?: string;
  achievementsSyncedAt?: string;
}

export interface SteamAchievement {
  apiName: string;
  name: string;
  description?: string;
  achieved: boolean;
  unlockTime?: string;
  globalPercent?: number;
}

export interface SteamAchievementProgress {
  appId: number;
  available: boolean;
  gameName?: string;
  unlocked: number;
  total: number;
  percent: number;
  achievements: SteamAchievement[];
  syncedAt: string;
}

export interface SteamAchievementsResponse {
  steamId: string;
  games: SteamAchievementProgress[];
  syncedAt: string;
}

export type FriendGameStatus = "owns" | "playing" | "completed" | "wants_to_play";

export interface FriendActivity {
  id: string;
  name: string;
  status: FriendGameStatus;
  platform?: string;
}

export interface Game {
  id: number;
  name: string;
  slug?: string;
  summary?: string;
  coverUrl?: string;
  firstReleaseDate?: number;
  status?: number;
  category?: number;
  sourceUpdatedAt?: number;
  sourceCreatedAt?: number;
  isCustom?: boolean;
  averageArtworkColor?: string;
  criticScore?: number;
  criticScoreCount?: number;
  hype?: number;
  publishers?: string[];
  remasters?: GameRelation[];
  franchises?: FranchiseRef[];
  storeLinks?: StoreLink[];
  videos?: GameVideo[];
  ageRatings?: AgeRating[];
  themes?: Genre[];
  gameModes?: Genre[];
  keywords?: Genre[];
  steamGenres?: string[];
  steamFeatures?: string[];
  steamTags?: string[];
  controllerSupport?: SteamControllerSupport;
  linuxSupport?: LinuxSupport;
  protonConfidence?: string;
  steamMetadataSyncedAt?: string;
  platforms: Platform[];
  genres: Genre[];
  releaseDates: ReleaseDate[];
}

export interface LibraryEntry {
  gameId: number;
  status: LibraryStatus;
  notes: string;
  personalRating?: number;
  storyProgress?: number;
  overallProgress?: number;
  review?: string;
  completedAt?: string;
  libraryPlatforms?: string[];
  importSources?: string;
  tags?: string[];
  playthroughs?: Playthrough[];
  playSessions?: PlaySession[];
  friends?: FriendActivity[];
  customFolderIds?: string[];
  steamAppId?: number;
  steamPlaytimeMinutes?: number;
  steamPlaytimeTwoWeeksMinutes?: number;
  steamLastPlayedAt?: string;
  steamSyncedAt?: string;
  steamActivity?: SteamActivityDetails;
  isUpNext?: boolean;
  manualOrder?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

export interface SteamLibraryGame {
  game: Game;
  appId: number;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes?: number;
  lastPlayedAt?: string;
  activity?: SteamActivityDetails;
}

export interface SteamSyncResponse {
  steamId: string;
  games: SteamLibraryGame[];
  matched: number;
  unmatched: number;
  syncedAt: string;
}

export interface SteamAppMetadata {
  appId: number;
  steamGenres: string[];
  steamFeatures: string[];
  steamTags: string[];
  controllerSupport?: SteamControllerSupport;
  linuxSupport?: LinuxSupport;
  protonConfidence?: string;
  syncedAt: string;
}

export interface SteamAppsResponse {
  apps: SteamAppMetadata[];
}

export interface LibraryItem {
  game: Game;
  entry: LibraryEntry;
}

export interface ClientChange {
  id: string;
  operation: "upsert" | "delete";
  game: Game;
  entry?: LibraryEntry;
  changedAt: string;
}

export interface SyncPayload {
  game?: Game;
  entry?: LibraryEntry;
  gameId?: number;
  deletedAt?: string;
}

export interface SyncEvent {
  revision: number;
  eventId: string;
  entity: "library" | "game";
  entityId: string;
  operation: "upsert" | "delete";
  payload: SyncPayload;
  createdAt: string;
}

export interface PushResult {
  id: string;
  disposition: "accepted" | "duplicate" | "stale";
}

export interface PushResponse {
  results: PushResult[];
  serverRevision: number;
}

export interface PullResponse {
  events: SyncEvent[];
  nextCursor: number;
  hasMore: boolean;
}

export interface LibraryResponse {
  items: LibraryItem[];
  serverRevision: number;
}

export interface SearchResponse {
  games: Game[];
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

export * from "./gamery";
export * from "./release";
