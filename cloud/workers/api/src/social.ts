import type {
  FriendWishlist,
  Game,
  GameVaultSocialProfile,
  SocialFriendsResponse,
  SocialProfileResponse,
} from "@gamevault/shared";
import { steamCommunityFriends } from "./steam-relay";
import type { Env } from "./types";

const MAX_SHARED_WISHLIST_GAMES = 500;
const PROFILE_QUERY_CHUNK = 75;

interface SocialProfileRow {
  steam_id: string;
  persona_name: string;
  avatar_url: string | null;
  share_wishlist: number;
  created_at: string;
  updated_at: string;
  wishlist_count?: number;
}

interface SocialWishlistRow {
  steam_id: string;
  game_id: number;
  game_json: string;
  position: number;
  updated_at: string;
}

interface SteamPlayerSummaryEnvelope {
  response?: {
    players?: Array<{
      steamid?: string;
      personaname?: string;
      avatarfull?: string;
    }>;
  };
}

interface SteamFriendListEnvelope {
  friendslist?: {
    friends?: Array<{ steamid?: string }>;
  };
}

function validSteamID(value: string | undefined): value is string {
  return Boolean(value && /^\d{17}$/.test(value));
}

async function verifiedSteamFriendIDs(env: Env, steamId: string): Promise<string[]> {
  if (env.STEAM_API_KEY) {
    const query = new URLSearchParams({ steamid: steamId, relationship: "friend" });
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetFriendList/v1/?${query.toString()}`,
      {
        headers: {
          accept: "application/json",
          "x-webapi-key": env.STEAM_API_KEY,
        },
      },
    ).catch(() => undefined);
    if (response?.ok) {
      const payload = await response.json().catch(() => undefined) as SteamFriendListEnvelope | undefined;
      if (payload?.friendslist && Array.isArray(payload.friendslist.friends)) {
        return [...new Set(payload.friendslist.friends.flatMap((friend) => (
          validSteamID(friend.steamid) && friend.steamid !== steamId ? [friend.steamid] : []
        )))];
      }
    }
  }

  // The public community page keeps standalone friend matching available if
  // Steam's Web API is temporarily unavailable. Both routes respect the
  // account's Friends List privacy setting.
  return (await steamCommunityFriends(steamId)).map((friend) => friend.steamId);
}

function socialProfile(row: SocialProfileRow): GameVaultSocialProfile {
  return {
    steamId: row.steam_id,
    personaName: row.persona_name,
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    profileUrl: `https://steamcommunity.com/profiles/${row.steam_id}`,
    shareWishlist: row.share_wishlist === 1,
    wishlistCount: Number(row.wishlist_count) || 0,
    updatedAt: row.updated_at,
  };
}

function parseSharedGame(value: string): Game | undefined {
  try {
    const game = JSON.parse(value) as Partial<Game>;
    if (
      !Number.isSafeInteger(game.id)
      || Number(game.id) === 0
      || typeof game.name !== "string"
      || !game.name.trim()
      || !Array.isArray(game.platforms)
      || !Array.isArray(game.genres)
      || !Array.isArray(game.releaseDates)
    ) return undefined;
    return game as Game;
  } catch {
    return undefined;
  }
}

async function steamPersona(
  env: Env,
  steamId: string,
  current?: SocialProfileRow,
): Promise<{ personaName: string; avatarUrl?: string }> {
  if (env.STEAM_API_KEY) {
    const query = new URLSearchParams({ steamids: steamId, format: "json" });
    const response = await fetch(
      `https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/?${query.toString()}`,
      {
        headers: {
          accept: "application/json",
          "x-webapi-key": env.STEAM_API_KEY,
        },
      },
    ).catch(() => undefined);
    if (response?.ok) {
      try {
        const payload = await response.json() as SteamPlayerSummaryEnvelope;
        const player = payload.response?.players?.find((item) => item.steamid === steamId);
        const personaName = player?.personaname?.trim();
        if (personaName) {
          return {
            personaName: personaName.slice(0, 100),
            ...(player?.avatarfull?.startsWith("https://")
              ? { avatarUrl: player.avatarfull.slice(0, 1_000) }
              : {}),
          };
        }
      } catch {
        // Preserve the last verified name when Steam's optional summary is unreadable.
      }
    }
  }
  return {
    personaName: current?.persona_name || `Steam ${steamId.slice(-6)}`,
    ...(current?.avatar_url ? { avatarUrl: current.avatar_url } : {}),
  };
}

async function profileRow(env: Env, steamId: string): Promise<SocialProfileRow | undefined> {
  return (await env.DB.prepare(
    `SELECT p.*,
       (SELECT COUNT(*) FROM gamevault_social_wishlist w WHERE w.steam_id = p.steam_id) AS wishlist_count
     FROM gamevault_social_profiles p WHERE p.steam_id = ?`,
  ).bind(steamId).first<SocialProfileRow>()) ?? undefined;
}

export async function saveSocialWishlist(
  env: Env,
  steamId: string,
  shareWishlist: boolean,
  inputGames: Game[],
): Promise<SocialProfileResponse> {
  const seen = new Set<number>();
  const games = inputGames.flatMap((game) => {
    if (seen.has(game.id)) return [];
    seen.add(game.id);
    return [game];
  }).slice(0, MAX_SHARED_WISHLIST_GAMES);
  const current = await profileRow(env, steamId);
  const persona = await steamPersona(env, steamId, current);
  const now = new Date().toISOString();

  await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO gamevault_social_profiles (
         steam_id, persona_name, avatar_url, share_wishlist, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(steam_id) DO UPDATE SET
         persona_name = excluded.persona_name,
         avatar_url = excluded.avatar_url,
         share_wishlist = excluded.share_wishlist,
         updated_at = excluded.updated_at`,
    ).bind(
      steamId,
      persona.personaName,
      persona.avatarUrl ?? null,
      shareWishlist ? 1 : 0,
      current?.created_at ?? now,
      now,
    ),
    env.DB.prepare("DELETE FROM gamevault_social_wishlist WHERE steam_id = ?").bind(steamId),
  ]);

  for (let start = 0; start < games.length; start += 80) {
    await env.DB.batch(games.slice(start, start + 80).map((game, offset) => env.DB.prepare(
      `INSERT INTO gamevault_social_wishlist (
         steam_id, game_id, game_json, position, updated_at
       ) VALUES (?, ?, ?, ?, ?)`,
    ).bind(steamId, game.id, JSON.stringify(game), start + offset, now)));
  }

  return {
    profile: {
      steamId,
      personaName: persona.personaName,
      ...(persona.avatarUrl ? { avatarUrl: persona.avatarUrl } : {}),
      profileUrl: `https://steamcommunity.com/profiles/${steamId}`,
      shareWishlist,
      wishlistCount: games.length,
      updatedAt: now,
    },
    games,
  };
}

export async function getSocialProfile(
  env: Env,
  steamId: string,
): Promise<SocialProfileResponse | undefined> {
  const row = await profileRow(env, steamId);
  if (!row) return undefined;
  const result = await env.DB.prepare(
    `SELECT steam_id, game_id, game_json, position, updated_at
     FROM gamevault_social_wishlist WHERE steam_id = ? ORDER BY position ASC`,
  ).bind(steamId).all<SocialWishlistRow>();
  return {
    profile: socialProfile(row),
    games: (result.results ?? []).flatMap((item) => {
      const game = parseSharedGame(item.game_json);
      return game ? [game] : [];
    }),
  };
}

async function sharedProfiles(
  env: Env,
  friendIDs: string[],
): Promise<SocialProfileRow[]> {
  const rows: SocialProfileRow[] = [];
  for (let start = 0; start < friendIDs.length; start += PROFILE_QUERY_CHUNK) {
    const chunk = friendIDs.slice(start, start + PROFILE_QUERY_CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const result = await env.DB.prepare(
      `SELECT p.*,
         (SELECT COUNT(*) FROM gamevault_social_wishlist w WHERE w.steam_id = p.steam_id) AS wishlist_count
       FROM gamevault_social_profiles p
       WHERE p.share_wishlist = 1 AND p.steam_id IN (${placeholders})`,
    ).bind(...chunk).all<SocialProfileRow>();
    rows.push(...(result.results ?? []));
  }
  return rows;
}

async function sharedWishlistRows(
  env: Env,
  profileIDs: string[],
): Promise<SocialWishlistRow[]> {
  const rows: SocialWishlistRow[] = [];
  for (let start = 0; start < profileIDs.length; start += PROFILE_QUERY_CHUNK) {
    const chunk = profileIDs.slice(start, start + PROFILE_QUERY_CHUNK);
    const placeholders = chunk.map(() => "?").join(",");
    const result = await env.DB.prepare(
      `SELECT steam_id, game_id, game_json, position, updated_at
       FROM gamevault_social_wishlist
       WHERE steam_id IN (${placeholders})
       ORDER BY steam_id ASC, position ASC`,
    ).bind(...chunk).all<SocialWishlistRow>();
    rows.push(...(result.results ?? []));
  }
  return rows;
}

export async function getSocialFriends(
  env: Env,
  steamId: string,
): Promise<SocialFriendsResponse> {
  const [me, steamFriendIDs] = await Promise.all([
    profileRow(env, steamId),
    verifiedSteamFriendIDs(env, steamId),
  ]);
  const profiles = await sharedProfiles(env, steamFriendIDs);
  const wishlistRows = await sharedWishlistRows(env, profiles.map((profile) => profile.steam_id));
  const gamesBySteamID = new Map<string, Game[]>();
  for (const row of wishlistRows) {
    const game = parseSharedGame(row.game_json);
    if (!game) continue;
    const games = gamesBySteamID.get(row.steam_id) ?? [];
    games.push(game);
    gamesBySteamID.set(row.steam_id, games);
  }
  const friends: FriendWishlist[] = profiles
    .map((profile) => ({
      profile: socialProfile(profile),
      games: gamesBySteamID.get(profile.steam_id) ?? [],
    }))
    .sort((left, right) => left.profile.personaName.localeCompare(right.profile.personaName));
  return {
    ...(me ? { me: socialProfile(me) } : {}),
    friends,
    syncedAt: new Date().toISOString(),
  };
}

export async function deleteSocialProfile(env: Env, steamId: string): Promise<void> {
  await env.DB.batch([
    env.DB.prepare("DELETE FROM gamevault_social_wishlist WHERE steam_id = ?").bind(steamId),
    env.DB.prepare("DELETE FROM gamevault_social_profiles WHERE steam_id = ?").bind(steamId),
  ]);
}
