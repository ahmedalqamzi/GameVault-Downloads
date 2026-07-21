-- Cross-app friend discovery is additive and account-scoped. Existing library,
-- preferences, folders, progress, play history, and sync events are untouched.
CREATE TABLE IF NOT EXISTS gamevault_social_profiles (
  steam_id TEXT PRIMARY KEY CHECK(length(steam_id) = 17),
  persona_name TEXT NOT NULL,
  avatar_url TEXT,
  share_wishlist INTEGER NOT NULL DEFAULT 0 CHECK(share_wishlist IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS gamevault_social_profiles_updated_idx
  ON gamevault_social_profiles(updated_at DESC);

CREATE TABLE IF NOT EXISTS gamevault_social_wishlist (
  steam_id TEXT NOT NULL REFERENCES gamevault_social_profiles(steam_id) ON DELETE CASCADE,
  game_id INTEGER NOT NULL,
  game_json TEXT NOT NULL,
  position INTEGER NOT NULL CHECK(position >= 0),
  updated_at TEXT NOT NULL,
  PRIMARY KEY (steam_id, game_id)
);

CREATE INDEX IF NOT EXISTS gamevault_social_wishlist_owner_position_idx
  ON gamevault_social_wishlist(steam_id, position);
