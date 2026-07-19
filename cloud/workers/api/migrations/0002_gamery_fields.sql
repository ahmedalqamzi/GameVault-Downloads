ALTER TABLE games ADD COLUMN is_custom INTEGER NOT NULL DEFAULT 0;
ALTER TABLE games ADD COLUMN average_artwork_color TEXT;

ALTER TABLE library_entries ADD COLUMN story_progress INTEGER CHECK(story_progress IS NULL OR story_progress BETWEEN 0 AND 100);
ALTER TABLE library_entries ADD COLUMN overall_progress INTEGER CHECK(overall_progress IS NULL OR overall_progress BETWEEN 0 AND 100);
ALTER TABLE library_entries ADD COLUMN review TEXT;
ALTER TABLE library_entries ADD COLUMN completed_at TEXT;
ALTER TABLE library_entries ADD COLUMN library_platforms_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN import_sources TEXT;
