export interface Env {
  DB: D1Database;
  METADATA_RATE_LIMITER?: RateLimit;
  SYNC_TOKEN?: string;
  IGDB_CLIENT_ID?: string;
  IGDB_CLIENT_SECRET?: string;
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
  platforms_json: string;
  genres_json: string;
  release_dates_json: string;
  cached_at: string;
}

export interface PreferencesRow {
  preferred_platforms_json: string;
  preferred_stores_json: string;
  followed_franchises_json: string;
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
