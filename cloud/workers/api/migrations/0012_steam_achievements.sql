-- Additive-only migration: existing collection rows, folders, manual progress,
-- reviews, play history, and Steam activity fields remain unchanged.
ALTER TABLE library_entries ADD COLUMN steam_activity_json TEXT;
