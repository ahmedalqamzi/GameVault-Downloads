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

export interface GameTimeToBeat {
  /** Average time to reach the credits without spending notable time on extras. */
  mainStorySeconds?: number;
  /** Average time to reach the credits while completing some optional content. */
  mainExtraSeconds?: number;
  /** Average time to reach 100% completion. */
  completionistSeconds?: number;
  submissionCount: number;
  sourceUpdatedAt?: number;
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
  friendProfiles: FriendProfile[];
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

export type FriendPresenceState =
  | "in_game"
  | "online"
  | "busy"
  | "away"
  | "snooze"
  | "looking_to_trade"
  | "looking_to_play"
  | "offline"
  | "private"
  | "unavailable";

export interface FriendProfile {
  id: string;
  name: string;
  steamId?: string;
  profileUrl?: string;
  notes?: string;
  favorite?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SteamFriendPresence {
  steamId: string;
  personaName: string;
  profileUrl?: string;
  avatarUrl?: string;
  presence: FriendPresenceState;
  stateMessage?: string;
  gameAppId?: number;
  gameName?: string;
  lastSeenAt?: string;
  lastSeenOnlineAt?: string;
  lastSeenInGameAt?: string;
  trackedAt: string;
  source: "local-relay" | "public-profile";
}

export type FriendPresenceEventKind =
  | "added"
  | "online"
  | "offline"
  | "game_started"
  | "game_changed"
  | "game_stopped"
  | "name_changed";

export interface FriendPresenceEvent {
  id: string;
  steamId: string;
  kind: FriendPresenceEventKind;
  previousPresence?: FriendPresenceState;
  presence: FriendPresenceState;
  previousGameAppId?: number;
  gameAppId?: number;
  previousGameName?: string;
  gameName?: string;
  occurredAt: string;
}

export interface FriendTrackerResponse {
  steamId: string;
  friends: SteamFriendPresence[];
  events: FriendPresenceEvent[];
  syncedAt?: string;
  relayAvailable: boolean;
}

export interface SteamAuthExchangeResponse {
  steamId: string;
  token: string;
  expiresAt: string;
}

export interface SteamLocalAccount {
  steamId: string;
  personaName: string;
  mostRecent: boolean;
  cachedAppCount: number;
}

export interface SteamRelayFriend {
  steamId: string;
  personaName: string;
  avatarHash?: string;
}

export interface SteamRelayGame {
  appId: number;
  name: string;
  playtimeMinutes: number;
  playtimeTwoWeeksMinutes?: number;
  lastPlayedAt?: string;
  installed?: boolean;
  iconHash?: string;
}

export interface SteamRelaySnapshot {
  steamId: string;
  personaName: string;
  games: SteamRelayGame[];
  friends: SteamRelayFriend[];
  syncedAt: string;
  source: "desktop-local";
}

export interface SteamRelayStatus {
  steamId: string;
  personaName: string;
  gameCount: number;
  friendCount: number;
  librarySyncedAt?: string;
  friendsSyncedAt?: string;
  relaySeenAt: string;
}

export type OwnershipProvider =
  | "steam"
  | "epic"
  | "gog"
  | "xbox"
  | "playstation"
  | "nintendo"
  | "physical"
  | "other";

export interface GameOwnershipSource {
  id: string;
  provider: OwnershipProvider;
  label: string;
  externalId?: string;
  platform?: string;
  playtimeMinutes?: number;
  lastPlayedAt?: string;
  syncMode?: "automatic" | "import" | "manual";
  syncedAt?: string;
  addedAt: string;
  updatedAt: string;
}

// `wants_to_play` remains readable for pre-0.7 backups. New writes use the
// canonical Wishlist status so GameVault never creates two equivalent states.
export type FriendGameStatus = "owns" | "playing" | "completed" | "wishlist" | "wants_to_play";

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
  timeToBeat?: GameTimeToBeat;
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
  ownershipSources?: GameOwnershipSource[];
  customFolderIds?: string[];
  steamAppId?: number;
  steamPlaytimeMinutes?: number;
  steamPlaytimeTwoWeeksMinutes?: number;
  steamLastPlayedAt?: string;
  steamSyncedAt?: string;
  steamActivity?: SteamActivityDetails;
  isUpNext?: boolean;
  upNextPosition?: 1 | 2 | 3;
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

export interface GameFeedResponse {
  games: Game[];
  nextCursor?: string;
  hasMore: boolean;
}

export interface AnticipatedMonthResponse {
  month: string;
  games: Game[];
}

export interface GameVaultSocialProfile {
  steamId: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl: string;
  shareWishlist: boolean;
  wishlistCount: number;
  updatedAt: string;
}

export interface FriendWishlist {
  profile: GameVaultSocialProfile;
  games: Game[];
}

export interface SocialProfileResponse {
  profile: GameVaultSocialProfile;
  games: Game[];
}

export interface SocialFriendsResponse {
  me?: GameVaultSocialProfile;
  friends: FriendWishlist[];
  syncedAt: string;
}

export interface SocialWishlistUpdate {
  shareWishlist: boolean;
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
export * from "./themes";
