-- Additive-only migration: existing games, collection entries, folders, progress,
-- reviews, play history, and sync events remain unchanged.
ALTER TABLE games ADD COLUMN keywords_json TEXT;
ALTER TABLE games ADD COLUMN steam_tags_json TEXT;

CREATE TABLE IF NOT EXISTS steam_app_metadata (
  app_id INTEGER PRIMARY KEY,
  steam_genres_json TEXT NOT NULL DEFAULT '[]',
  steam_features_json TEXT NOT NULL DEFAULT '[]',
  steam_tags_json TEXT NOT NULL DEFAULT '[]',
  controller_support TEXT,
  linux_support TEXT,
  proton_confidence TEXT,
  synced_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_steam_app_metadata_synced_at
  ON steam_app_metadata(synced_at);
