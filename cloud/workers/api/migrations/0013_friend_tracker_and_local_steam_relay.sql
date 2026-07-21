-- Additive-only migration. Existing library rows, folders, ratings, reviews,
-- play history, manual progress, Steam activity, and preferences are retained.
ALTER TABLE library_entries ADD COLUMN ownership_sources_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN friend_profiles_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE games ADD COLUMN time_to_beat_json TEXT;
ALTER TABLE library_entries ADD COLUMN up_next_position INTEGER CHECK (
  up_next_position IS NULL OR up_next_position BETWEEN 1 AND 3
);
UPDATE library_entries SET up_next_position = 1 WHERE is_up_next = 1;

CREATE TABLE IF NOT EXISTS steam_auth_codes (
  code_hash TEXT PRIMARY KEY,
  steam_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT
);

CREATE INDEX IF NOT EXISTS steam_auth_codes_expiry_idx
  ON steam_auth_codes(expires_at);

CREATE TABLE IF NOT EXISTS steam_relay_accounts (
  steam_id TEXT PRIMARY KEY,
  persona_name TEXT NOT NULL DEFAULT '',
  source TEXT NOT NULL CHECK(source IN ('desktop-local')),
  library_synced_at TEXT,
  friends_synced_at TEXT,
  relay_seen_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS steam_relay_games (
  steam_id TEXT NOT NULL REFERENCES steam_relay_accounts(steam_id) ON DELETE CASCADE,
  app_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  playtime_minutes INTEGER NOT NULL DEFAULT 0,
  playtime_two_weeks_minutes INTEGER,
  last_played_at TEXT,
  installed INTEGER NOT NULL DEFAULT 0,
  icon_hash TEXT,
  synced_at TEXT NOT NULL,
  PRIMARY KEY (steam_id, app_id)
);

CREATE INDEX IF NOT EXISTS steam_relay_games_activity_idx
  ON steam_relay_games(steam_id, last_played_at);

CREATE TABLE IF NOT EXISTS steam_friends (
  owner_steam_id TEXT NOT NULL REFERENCES steam_relay_accounts(steam_id) ON DELETE CASCADE,
  steam_id TEXT NOT NULL,
  persona_name TEXT NOT NULL,
  profile_url TEXT,
  avatar_url TEXT,
  avatar_hash TEXT,
  presence TEXT NOT NULL DEFAULT 'unavailable',
  state_message TEXT,
  game_app_id INTEGER,
  game_name TEXT,
  last_seen_at TEXT,
  last_seen_online_at TEXT,
  last_seen_in_game_at TEXT,
  relay_seen_at TEXT NOT NULL,
  tracked_at TEXT NOT NULL,
  source TEXT NOT NULL CHECK(source IN ('local-relay', 'public-profile')),
  PRIMARY KEY (owner_steam_id, steam_id)
);

CREATE INDEX IF NOT EXISTS steam_friends_presence_idx
  ON steam_friends(owner_steam_id, presence, tracked_at);

CREATE TABLE IF NOT EXISTS steam_friend_events (
  id TEXT PRIMARY KEY,
  owner_steam_id TEXT NOT NULL REFERENCES steam_relay_accounts(steam_id) ON DELETE CASCADE,
  steam_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN (
    'added', 'online', 'offline', 'game_started', 'game_changed',
    'game_stopped', 'name_changed'
  )),
  previous_presence TEXT,
  presence TEXT NOT NULL,
  previous_game_app_id INTEGER,
  game_app_id INTEGER,
  previous_game_name TEXT,
  game_name TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS steam_friend_events_owner_time_idx
  ON steam_friend_events(owner_steam_id, occurred_at DESC);
