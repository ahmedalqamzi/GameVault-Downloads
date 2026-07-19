ALTER TABLE games ADD COLUMN videos_json TEXT NOT NULL DEFAULT '[]';

CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY CHECK(id = 1),
  preferred_platforms_json TEXT NOT NULL DEFAULT '[]',
  preferred_stores_json TEXT NOT NULL DEFAULT '[]',
  updated_at TEXT NOT NULL
);

INSERT OR IGNORE INTO user_preferences (
  id,
  preferred_platforms_json,
  preferred_stores_json,
  updated_at
) VALUES (1, '[]', '[]', '1970-01-01T00:00:00.000Z');
