-- Additive-only migration: existing library rows and preferences are preserved.
ALTER TABLE library_entries ADD COLUMN custom_folder_ids_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN steam_app_id INTEGER;
ALTER TABLE library_entries ADD COLUMN steam_playtime_minutes INTEGER;
ALTER TABLE library_entries ADD COLUMN steam_playtime_two_weeks_minutes INTEGER;
ALTER TABLE library_entries ADD COLUMN steam_last_played_at TEXT;
ALTER TABLE library_entries ADD COLUMN steam_synced_at TEXT;

CREATE INDEX IF NOT EXISTS library_steam_app_idx
  ON library_entries(steam_app_id)
  WHERE deleted_at IS NULL AND steam_app_id IS NOT NULL;

ALTER TABLE user_preferences ADD COLUMN custom_folders_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE user_preferences ADD COLUMN steam_id TEXT;
