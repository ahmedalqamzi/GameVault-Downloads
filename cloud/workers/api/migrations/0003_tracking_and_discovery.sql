ALTER TABLE games ADD COLUMN critic_score REAL;
ALTER TABLE games ADD COLUMN critic_score_count INTEGER;
ALTER TABLE games ADD COLUMN franchises_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE games ADD COLUMN store_links_json TEXT NOT NULL DEFAULT '[]';

ALTER TABLE library_entries ADD COLUMN tags_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN playthroughs_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN play_sessions_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN friends_json TEXT NOT NULL DEFAULT '[]';
ALTER TABLE library_entries ADD COLUMN is_up_next INTEGER NOT NULL DEFAULT 0;
ALTER TABLE library_entries ADD COLUMN manual_order REAL;

CREATE INDEX IF NOT EXISTS library_up_next_idx
  ON library_entries(is_up_next)
  WHERE deleted_at IS NULL AND is_up_next = 1;
