PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT,
  summary TEXT,
  cover_url TEXT,
  first_release_date INTEGER,
  status INTEGER,
  category INTEGER,
  source_updated_at INTEGER,
  source_created_at INTEGER,
  platforms_json TEXT NOT NULL DEFAULT '[]',
  genres_json TEXT NOT NULL DEFAULT '[]',
  release_dates_json TEXT NOT NULL DEFAULT '[]',
  cached_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS games_name_idx ON games(name COLLATE NOCASE);

CREATE TABLE IF NOT EXISTS library_entries (
  game_id INTEGER PRIMARY KEY REFERENCES games(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK(status IN ('wishlist', 'backlog', 'playing', 'completed', 'dropped')),
  notes TEXT NOT NULL DEFAULT '',
  personal_rating INTEGER CHECK(personal_rating IS NULL OR personal_rating BETWEEN 0 AND 100),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX IF NOT EXISTS library_updated_idx ON library_entries(updated_at);
CREATE INDEX IF NOT EXISTS library_status_idx ON library_entries(status) WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS sync_events (
  revision INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  entity TEXT NOT NULL CHECK(entity IN ('library', 'game')),
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK(operation IN ('upsert', 'delete')),
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS sync_events_entity_idx ON sync_events(entity, entity_id);
