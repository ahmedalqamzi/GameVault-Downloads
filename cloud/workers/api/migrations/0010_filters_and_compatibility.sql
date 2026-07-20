-- Additive-only migration: no existing games, collection entries, or progress are changed.
ALTER TABLE games ADD COLUMN age_ratings_json TEXT;
ALTER TABLE games ADD COLUMN themes_json TEXT;
ALTER TABLE games ADD COLUMN game_modes_json TEXT;
ALTER TABLE games ADD COLUMN steam_genres_json TEXT;
ALTER TABLE games ADD COLUMN steam_features_json TEXT;
ALTER TABLE games ADD COLUMN controller_support TEXT;
ALTER TABLE games ADD COLUMN linux_support TEXT;
ALTER TABLE games ADD COLUMN proton_confidence TEXT;
ALTER TABLE games ADD COLUMN steam_metadata_synced_at TEXT;
