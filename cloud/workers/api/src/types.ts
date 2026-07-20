export interface Env {
  DB: D1Database;
  METADATA_RATE_LIMITER?: RateLimit;
  STEAM_RATE_LIMITER?: RateLimit;
  STEAM_METADATA_RATE_LIMITER?: RateLimit;
  SYNC_TOKEN?: string;
  IGDB_CLIENT_ID?: string;
  IGDB_CLIENT_SECRET?: string;
  STEAM_API_KEY?: string;
  CORS_ORIGINS?: string;
  IGDB_REFRESH_HOURS?: string;
}

export interface GameRow {
  id: number;
  name: string;
  slug: string | null;
  summary: string | null;
  cover_url: string | null;
  first_release_date: number | null;
  status: number | null;
  category: number | null;
  source_updated_at: number | null;
  source_created_at: number | null;
  is_custom: number;
  average_artwork_color: string | null;
  critic_score: number | null;
  critic_score_count: number | null;
  hype: number | null;
  publishers_json: string;
  remasters_json: string;
  franchises_json: string;
  store_links_json: string;
  videos_json: string;
  age_ratings_json: string | null;
  themes_json: string | null;
  game_modes_json: string | null;
  keywords_json: string | null;
  steam_genres_json: string | null;
  steam_features_json: string | null;
  steam_tags_json: string | null;
  controller_support: string | null;
  linux_support: string | null;
  proton_confidence: string | null;
  steam_metadata_synced_at: string | null;
  platforms_json: string;
  genres_json: string;
  release_dates_json: string;
  cached_at: string;
}

export interface SteamAppMetadataRow {
  app_id: number;
  steam_genres_json: string;
  steam_features_json: string;
  steam_tags_json: string;
  controller_support: string | null;
  linux_support: string | null;
  proton_confidence: string | null;
  synced_at: string;
}

export interface PreferencesRow {
  preferred_platforms_json: string;
  preferred_stores_json: string;
  followed_franchises_json: string;
  custom_folders_json: string;
  steam_id: string | null;
  updated_at: string;
}

export interface LibraryRow extends GameRow {
  entry_status: string;
  notes: string;
  personal_rating: number | null;
  story_progress: number | null;
  overall_progress: number | null;
  review: string | null;
  completed_at: string | null;
  library_platforms_json: string;
  import_sources: string | null;
  tags_json: string;
  playthroughs_json: string;
  play_sessions_json: string;
  friends_json: string;
  custom_folder_ids_json: string;
  steam_app_id: number | null;
  steam_playtime_minutes: number | null;
  steam_playtime_two_weeks_minutes: number | null;
  steam_last_played_at: string | null;
  steam_synced_at: string | null;
  is_up_next: number;
  manual_order: number | null;
  entry_created_at: string;
  entry_updated_at: string;
  deleted_at: string | null;
}

export interface EventRow {
  revision: number;
  event_id: string;
  entity: "library" | "game";
  entity_id: string;
  operation: "upsert" | "delete";
  payload_json: string;
  created_at: string;
}
