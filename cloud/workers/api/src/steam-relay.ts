import type {
  FriendPresenceEvent,
  FriendPresenceEventKind,
  FriendPresenceState,
  FriendTrackerResponse,
  Game,
  SteamFriendPresence,
  SteamRelaySnapshot,
  SteamRelayStatus,
  SteamSyncResponse,
} from "@gamevault/shared";
import { gamesBySteamAppIds } from "./igdb";
import { steamSyntheticGame, steamSyntheticGameID } from "./steam";
import type {
  Env,
  SteamFriendEventRow,
  SteamFriendRow,
  SteamRelayAccountRow,
  SteamRelayGameRow,
} from "./types";

const PRESENCE_STATES = new Set<FriendPresenceState>([
  "in_game", "online", "busy", "away", "snooze", "looking_to_trade",
  "looking_to_play", "offline", "private", "unavailable",
]);
const EVENT_KINDS = new Set<FriendPresenceEventKind>([
  "added", "online", "offline", "game_started", "game_changed",
  "game_stopped", "name_changed",
]);
const MAX_RELAY_GAMES = 20_000;
const MAX_RELAY_FRIENDS = 5_000;

function validSteamID(value: unknown): value is string {
  return typeof value === "string" && /^\d{17}$/.test(value) && BigInt(value) > 0;
}

function validTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    && parsed <= Date.now() + 5 * 60_000
    && parsed >= Date.now() - 30 * 86_400_000;
}

function validHistoricalTimestamp(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed)
    && parsed >= 0
    && parsed <= Date.now() + 5 * 60_000;
}

export function normalizeRelaySnapshot(value: unknown): SteamRelaySnapshot | undefined {
  if (!value || typeof value !== "object") return undefined;
  const source = value as Partial<SteamRelaySnapshot>;
  if (
    !validSteamID(source.steamId)
    || typeof source.personaName !== "string"
    || !source.personaName.trim()
    || source.personaName.trim().length > 100
    || source.source !== "desktop-local"
    || !validTimestamp(source.syncedAt)
    || !Array.isArray(source.games)
    || source.games.length > MAX_RELAY_GAMES
    || !Array.isArray(source.friends)
    || source.friends.length > MAX_RELAY_FRIENDS
  ) return undefined;

  const gameIDs = new Set<number>();
  const games = source.games.flatMap((game) => {
    if (
      !game || typeof game !== "object"
      || !Number.isInteger(game.appId) || game.appId <= 0 || game.appId > 4_294_967_295
      || gameIDs.has(game.appId)
      || typeof game.name !== "string" || !game.name.trim() || game.name.trim().length > 300
      || !Number.isInteger(game.playtimeMinutes) || game.playtimeMinutes < 0
      || (game.playtimeTwoWeeksMinutes !== undefined
        && (!Number.isInteger(game.playtimeTwoWeeksMinutes) || game.playtimeTwoWeeksMinutes < 0))
      || (game.lastPlayedAt !== undefined && !validHistoricalTimestamp(game.lastPlayedAt))
      || (game.installed !== undefined && typeof game.installed !== "boolean")
      || (game.iconHash !== undefined && !/^[A-Fa-f0-9]{8,64}$/.test(game.iconHash))
    ) return [];
    gameIDs.add(game.appId);
    return [{
      appId: game.appId,
      name: game.name.trim(),
      playtimeMinutes: game.playtimeMinutes,
      ...(game.playtimeTwoWeeksMinutes !== undefined
        ? { playtimeTwoWeeksMinutes: game.playtimeTwoWeeksMinutes }
        : {}),
      ...(game.lastPlayedAt ? { lastPlayedAt: game.lastPlayedAt } : {}),
      ...(game.installed ? { installed: true } : {}),
      ...(game.iconHash ? { iconHash: game.iconHash.toLowerCase() } : {}),
    }];
  });
  if (games.length !== source.games.length) return undefined;

  const friendIDs = new Set<string>();
  const friends = source.friends.flatMap((friend) => {
    if (
      !friend || typeof friend !== "object"
      || !validSteamID(friend.steamId)
      || friend.steamId === source.steamId
      || friendIDs.has(friend.steamId)
      || typeof friend.personaName !== "string"
      || !friend.personaName.trim()
      || friend.personaName.trim().length > 100
      || (friend.avatarHash !== undefined && !/^[A-Fa-f0-9]{8,64}$/.test(friend.avatarHash))
    ) return [];
    friendIDs.add(friend.steamId);
    return [{
      steamId: friend.steamId,
      personaName: friend.personaName.trim(),
      ...(friend.avatarHash ? { avatarHash: friend.avatarHash.toLowerCase() } : {}),
    }];
  });
  if (friends.length !== source.friends.length) return undefined;
  return {
    steamId: source.steamId,
    personaName: source.personaName.trim(),
    games,
    friends,
    syncedAt: source.syncedAt,
    source: "desktop-local",
  };
}

function rowPresence(row: SteamFriendRow): SteamFriendPresence {
  const presence = PRESENCE_STATES.has(row.presence as FriendPresenceState)
    ? row.presence as FriendPresenceState
    : "unavailable";
  return {
    steamId: row.steam_id,
    personaName: row.persona_name,
    ...(row.profile_url ? { profileUrl: row.profile_url } : {}),
    ...(row.avatar_url ? { avatarUrl: row.avatar_url } : {}),
    presence,
    ...(row.state_message ? { stateMessage: row.state_message } : {}),
    ...(row.game_app_id !== null ? { gameAppId: row.game_app_id } : {}),
    ...(row.game_name ? { gameName: row.game_name } : {}),
    ...(row.last_seen_at ? { lastSeenAt: row.last_seen_at } : {}),
    ...(row.last_seen_online_at ? { lastSeenOnlineAt: row.last_seen_online_at } : {}),
    ...(row.last_seen_in_game_at ? { lastSeenInGameAt: row.last_seen_in_game_at } : {}),
    trackedAt: row.tracked_at,
    source: row.source,
  };
}

function rowEvent(row: SteamFriendEventRow): FriendPresenceEvent {
  const presence = PRESENCE_STATES.has(row.presence as FriendPresenceState)
    ? row.presence as FriendPresenceState
    : "unavailable";
  return {
    id: row.id,
    steamId: row.steam_id,
    kind: EVENT_KINDS.has(row.kind as FriendPresenceEventKind)
      ? row.kind as FriendPresenceEventKind
      : "name_changed",
    ...(row.previous_presence && PRESENCE_STATES.has(row.previous_presence as FriendPresenceState)
      ? { previousPresence: row.previous_presence as FriendPresenceState }
      : {}),
    presence,
    ...(row.previous_game_app_id !== null ? { previousGameAppId: row.previous_game_app_id } : {}),
    ...(row.game_app_id !== null ? { gameAppId: row.game_app_id } : {}),
    ...(row.previous_game_name ? { previousGameName: row.previous_game_name } : {}),
    ...(row.game_name ? { gameName: row.game_name } : {}),
    occurredAt: row.occurred_at,
  };
}

function eventStatement(
  db: D1Database,
  ownerSteamID: string,
  steamID: string,
  kind: FriendPresenceEventKind,
  previous: SteamFriendRow | undefined,
  next: SteamFriendPresence,
): D1PreparedStatement {
  return db.prepare(
    `INSERT INTO steam_friend_events (
       id, owner_steam_id, steam_id, kind, previous_presence, presence,
       previous_game_app_id, game_app_id, previous_game_name, game_name, occurred_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(
    crypto.randomUUID(), ownerSteamID, steamID, kind,
    previous?.presence ?? null, next.presence,
    previous?.game_app_id ?? null, next.gameAppId ?? null,
    previous?.game_name ?? null, next.gameName ?? null, next.trackedAt,
  );
}

export async function saveRelaySnapshot(db: D1Database, snapshot: SteamRelaySnapshot): Promise<void> {
  const existingFriends = await db.prepare(
    "SELECT * FROM steam_friends WHERE owner_steam_id = ?",
  ).bind(snapshot.steamId).all<SteamFriendRow>();
  const existingByID = new Map((existingFriends.results ?? []).map((row) => [row.steam_id, row]));
  const now = new Date().toISOString();

  await db.prepare(
    `INSERT INTO steam_relay_accounts (
       steam_id, persona_name, source, library_synced_at, friends_synced_at, relay_seen_at, updated_at
     ) VALUES (?, ?, 'desktop-local', NULL, NULL, ?, ?)
     ON CONFLICT(steam_id) DO UPDATE SET
       persona_name = excluded.persona_name,
       relay_seen_at = excluded.relay_seen_at,
       updated_at = excluded.updated_at`,
  ).bind(snapshot.steamId, snapshot.personaName, now, now).run();

  for (let start = 0; start < snapshot.games.length; start += 100) {
    await db.batch(snapshot.games.slice(start, start + 100).map((game) => db.prepare(
      `INSERT INTO steam_relay_games (
         steam_id, app_id, name, playtime_minutes, playtime_two_weeks_minutes,
         last_played_at, installed, icon_hash, synced_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(steam_id, app_id) DO UPDATE SET
         name = excluded.name,
         playtime_minutes = excluded.playtime_minutes,
         playtime_two_weeks_minutes = excluded.playtime_two_weeks_minutes,
         last_played_at = excluded.last_played_at,
         installed = excluded.installed,
         icon_hash = excluded.icon_hash,
         synced_at = excluded.synced_at`,
    ).bind(
      snapshot.steamId, game.appId, game.name, game.playtimeMinutes,
      game.playtimeTwoWeeksMinutes ?? null, game.lastPlayedAt ?? null,
      game.installed ? 1 : 0, game.iconHash ?? null, snapshot.syncedAt,
    )));
  }
  await db.prepare(
    "DELETE FROM steam_relay_games WHERE steam_id = ? AND synced_at <> ?",
  ).bind(snapshot.steamId, snapshot.syncedAt).run();

  const friendStatements: D1PreparedStatement[] = [];
  const addedEventStatements: D1PreparedStatement[] = [];
  for (const friend of snapshot.friends) {
    const existing = existingByID.get(friend.steamId);
    const next: SteamFriendPresence = {
      steamId: friend.steamId,
      personaName: friend.personaName,
      profileUrl: `https://steamcommunity.com/profiles/${friend.steamId}`,
      ...(friend.avatarHash
        ? { avatarUrl: `https://avatars.fastly.steamstatic.com/${friend.avatarHash}_full.jpg` }
        : {}),
      presence: existing && PRESENCE_STATES.has(existing.presence as FriendPresenceState)
        ? existing.presence as FriendPresenceState
        : "unavailable",
      trackedAt: snapshot.syncedAt,
      source: existing?.source ?? "local-relay",
    };
    friendStatements.push(db.prepare(
      `INSERT INTO steam_friends (
         owner_steam_id, steam_id, persona_name, profile_url, avatar_url, avatar_hash,
         presence, state_message, game_app_id, game_name, last_seen_at,
         last_seen_online_at, last_seen_in_game_at, relay_seen_at, tracked_at, source
       ) VALUES (?, ?, ?, ?, ?, ?, 'unavailable', NULL, NULL, NULL, NULL, NULL, NULL, ?, ?, 'local-relay')
       ON CONFLICT(owner_steam_id, steam_id) DO UPDATE SET
         persona_name = excluded.persona_name,
         profile_url = COALESCE(steam_friends.profile_url, excluded.profile_url),
         avatar_url = COALESCE(excluded.avatar_url, steam_friends.avatar_url),
         avatar_hash = COALESCE(excluded.avatar_hash, steam_friends.avatar_hash),
         relay_seen_at = excluded.relay_seen_at`,
    ).bind(
      snapshot.steamId, friend.steamId, friend.personaName,
      next.profileUrl ?? null, next.avatarUrl ?? null, friend.avatarHash ?? null,
      snapshot.syncedAt, snapshot.syncedAt,
    ));
    if (!existing) addedEventStatements.push(eventStatement(
      db, snapshot.steamId, friend.steamId, "added", undefined, next,
    ));
  }
  for (let start = 0; start < friendStatements.length; start += 100) {
    await db.batch(friendStatements.slice(start, start + 100));
  }
  for (let start = 0; start < addedEventStatements.length; start += 100) {
    await db.batch(addedEventStatements.slice(start, start + 100));
  }
  await db.prepare(
    "DELETE FROM steam_friends WHERE owner_steam_id = ? AND relay_seen_at <> ?",
  ).bind(snapshot.steamId, snapshot.syncedAt).run();
  await db.prepare(
    `UPDATE steam_relay_accounts
     SET library_synced_at = ?, friends_synced_at = ?, relay_seen_at = ?, updated_at = ?
     WHERE steam_id = ?`,
  ).bind(snapshot.syncedAt, snapshot.syncedAt, now, now, snapshot.steamId).run();
  await db.prepare(
    `DELETE FROM steam_friend_events WHERE owner_steam_id = ? AND occurred_at < ?`,
  ).bind(snapshot.steamId, new Date(Date.now() - 180 * 86_400_000).toISOString()).run().catch(() => undefined);
}

function decodeXML(value: string): string {
  return value
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", "\"")
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&")
    .trim();
}

function xmlValue(xml: string, tag: string): string | undefined {
  const match = new RegExp(
    `<${tag}(?:\\s[^>]*)?>(?:<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>|([\\s\\S]*?))</${tag}>`,
    "i",
  ).exec(xml);
  const value = decodeXML(match?.[1] ?? match?.[2] ?? "");
  return value || undefined;
}

function normalizedPresence(onlineState: string | undefined, stateMessage: string | undefined, gameName: string | undefined): FriendPresenceState {
  if (gameName) return "in_game";
  const combined = `${onlineState ?? ""} ${stateMessage ?? ""}`.toLowerCase();
  if (combined.includes("looking to play")) return "looking_to_play";
  if (combined.includes("looking to trade")) return "looking_to_trade";
  if (combined.includes("snooze")) return "snooze";
  if (combined.includes("away")) return "away";
  if (combined.includes("busy")) return "busy";
  if (combined.includes("online")) return "online";
  if (combined.includes("offline")) return "offline";
  return "unavailable";
}

export function parseSteamProfileXML(xml: string, trackedAt = new Date().toISOString()): SteamFriendPresence | undefined {
  const steamId = xmlValue(xml, "steamID64");
  if (!validSteamID(steamId)) return undefined;
  const personaName = xmlValue(xml, "steamID") ?? `Steam user ${steamId.slice(-4)}`;
  const gameName = xmlValue(xml, "gameName");
  const gameLink = xmlValue(xml, "gameLink");
  const appMatch = gameLink ? /\/app\/(\d+)/.exec(gameLink) : undefined;
  const gameAppId = appMatch?.[1] ? Number(appMatch[1]) : undefined;
  const stateMessage = xmlValue(xml, "stateMessage");
  const privacyState = xmlValue(xml, "privacyState")?.toLowerCase();
  const presence = privacyState === "private"
    ? "private" as const
    : normalizedPresence(xmlValue(xml, "onlineState"), stateMessage, gameName);
  return {
    steamId,
    personaName,
    profileUrl: xmlValue(xml, "profileURL") ?? `https://steamcommunity.com/profiles/${steamId}`,
    ...(xmlValue(xml, "avatarFull") ? { avatarUrl: xmlValue(xml, "avatarFull") } : {}),
    presence,
    ...(stateMessage ? { stateMessage } : {}),
    ...(Number.isInteger(gameAppId) && gameAppId! > 0 ? { gameAppId } : {}),
    ...(gameName ? { gameName } : {}),
    ...(presence !== "offline" && presence !== "private" && presence !== "unavailable"
      ? { lastSeenAt: trackedAt, lastSeenOnlineAt: trackedAt }
      : {}),
    ...(presence === "in_game" ? { lastSeenInGameAt: trackedAt } : {}),
    trackedAt,
    source: "public-profile",
  };
}

function changedEvents(previous: SteamFriendRow, next: SteamFriendPresence): FriendPresenceEventKind[] {
  const events: FriendPresenceEventKind[] = [];
  if (previous.persona_name !== next.personaName) events.push("name_changed");
  if (previous.game_app_id === null && next.gameAppId !== undefined) events.push("game_started");
  else if (previous.game_app_id !== null && next.gameAppId === undefined) events.push("game_stopped");
  else if (previous.game_app_id !== null && next.gameAppId !== undefined && previous.game_app_id !== next.gameAppId) {
    events.push("game_changed");
  }
  const wasOnline = !new Set(["offline", "private", "unavailable"]).has(previous.presence);
  const isOnline = !new Set(["offline", "private", "unavailable"]).has(next.presence);
  if (!wasOnline && isOnline) events.push("online");
  else if (wasOnline && !isOnline) events.push("offline");
  return events;
}

export async function refreshSteamFriends(db: D1Database, ownerSteamID: string): Promise<number> {
  const rows = await db.prepare(
    // Rotate through the oldest profiles in bounded groups so one large friend
    // list cannot exceed a Worker invocation's outbound-request budget.
    "SELECT * FROM steam_friends WHERE owner_steam_id = ? ORDER BY tracked_at ASC LIMIT 15",
  ).bind(ownerSteamID).all<SteamFriendRow>();
  let refreshed = 0;
  for (let start = 0; start < (rows.results ?? []).length; start += 10) {
    const batch = rows.results.slice(start, start + 10);
    const results = await Promise.all(batch.map(async (row) => {
      try {
        const response = await fetch(`https://steamcommunity.com/profiles/${row.steam_id}?xml=1`, {
          headers: { accept: "application/xml,text/xml;q=0.9" },
        });
        if (!response.ok) return undefined;
        const next = parseSteamProfileXML(await response.text());
        return next?.steamId === row.steam_id ? { row, next } : undefined;
      } catch {
        return undefined;
      }
    }));
    for (const result of results) {
      if (!result) continue;
      const { row, next } = result;
      const statements = changedEvents(row, next).map((kind) => (
        eventStatement(db, ownerSteamID, row.steam_id, kind, row, next)
      ));
      if (statements.length) await db.batch(statements);
      await db.prepare(
        `UPDATE steam_friends SET
           persona_name = ?, profile_url = ?, avatar_url = ?, presence = ?, state_message = ?,
           game_app_id = ?, game_name = ?,
           last_seen_at = COALESCE(?, last_seen_at),
           last_seen_online_at = COALESCE(?, last_seen_online_at),
           last_seen_in_game_at = COALESCE(?, last_seen_in_game_at),
           tracked_at = ?, source = 'public-profile'
         WHERE owner_steam_id = ? AND steam_id = ?`,
      ).bind(
        next.personaName, next.profileUrl ?? null, next.avatarUrl ?? null, next.presence,
        next.stateMessage ?? null, next.gameAppId ?? null, next.gameName ?? null,
        next.lastSeenAt ?? null, next.lastSeenOnlineAt ?? null, next.lastSeenInGameAt ?? null,
        next.trackedAt, ownerSteamID, row.steam_id,
      ).run();
      refreshed += 1;
    }
  }
  return refreshed;
}

export async function refreshAllSteamFriends(db: D1Database): Promise<number> {
  const accounts = await db.prepare(
    `SELECT a.steam_id
       FROM steam_relay_accounts a
       LEFT JOIN steam_friends f ON f.owner_steam_id = a.steam_id
      GROUP BY a.steam_id
      ORDER BY MIN(COALESCE(f.tracked_at, a.friends_synced_at, a.relay_seen_at)) ASC
      LIMIT 1`,
  ).all<{ steam_id: string }>();
  let refreshed = 0;
  for (const account of accounts.results ?? []) refreshed += await refreshSteamFriends(db, account.steam_id);
  return refreshed;
}

export async function getRelayStatus(db: D1Database, steamId: string): Promise<SteamRelayStatus | undefined> {
  const account = await db.prepare(
    `SELECT a.*,
       (SELECT COUNT(*) FROM steam_relay_games g WHERE g.steam_id = a.steam_id) AS game_count,
       (SELECT COUNT(*) FROM steam_friends f WHERE f.owner_steam_id = a.steam_id) AS friend_count
     FROM steam_relay_accounts a WHERE a.steam_id = ?`,
  ).bind(steamId).first<SteamRelayAccountRow & { game_count: number; friend_count: number }>();
  if (!account) return undefined;
  return {
    steamId: account.steam_id,
    personaName: account.persona_name,
    gameCount: Number(account.game_count) || 0,
    friendCount: Number(account.friend_count) || 0,
    ...(account.library_synced_at ? { librarySyncedAt: account.library_synced_at } : {}),
    ...(account.friends_synced_at ? { friendsSyncedAt: account.friends_synced_at } : {}),
    relaySeenAt: account.relay_seen_at,
  };
}

export async function getFriendTracker(db: D1Database, steamId: string): Promise<FriendTrackerResponse> {
  const [friends, events, status] = await Promise.all([
    db.prepare(
      `SELECT * FROM steam_friends WHERE owner_steam_id = ?
       ORDER BY CASE presence WHEN 'in_game' THEN 0 WHEN 'online' THEN 1 ELSE 2 END,
                persona_name COLLATE NOCASE`,
    ).bind(steamId).all<SteamFriendRow>(),
    db.prepare(
      `SELECT * FROM steam_friend_events WHERE owner_steam_id = ?
       ORDER BY occurred_at DESC LIMIT 250`,
    ).bind(steamId).all<SteamFriendEventRow>(),
    getRelayStatus(db, steamId),
  ]);
  return {
    steamId,
    friends: (friends.results ?? []).map(rowPresence),
    events: (events.results ?? []).map(rowEvent),
    ...(status?.friendsSyncedAt ? { syncedAt: status.friendsSyncedAt } : {}),
    relayAvailable: Boolean(status),
  };
}

export async function relaySteamLibrary(env: Env, steamId: string): Promise<SteamSyncResponse | undefined> {
  const rows = await env.DB.prepare(
    "SELECT * FROM steam_relay_games WHERE steam_id = ? ORDER BY name COLLATE NOCASE",
  ).bind(steamId).all<SteamRelayGameRow>();
  if (!rows.results?.length) return undefined;
  let matched = new Map<number, Game>();
  if (env.IGDB_CLIENT_ID && env.IGDB_CLIENT_SECRET) {
    try {
      matched = await gamesBySteamAppIds(env, rows.results.map((row) => row.app_id));
    } catch (error) {
      console.warn("relay_igdb_match_failed", error instanceof Error ? error.message : String(error));
    }
  }
  const status = await getRelayStatus(env.DB, steamId);
  const games = rows.results.map((row) => ({
    game: matched.get(row.app_id) ?? steamSyntheticGame(row.app_id, row.name),
    appId: row.app_id,
    playtimeMinutes: Math.max(0, row.playtime_minutes),
    ...(row.playtime_two_weeks_minutes !== null
      ? { playtimeTwoWeeksMinutes: Math.max(0, row.playtime_two_weeks_minutes) }
      : {}),
    ...(row.last_played_at ? { lastPlayedAt: row.last_played_at } : {}),
  }));
  const matchedCount = games.filter((item) => item.game.id !== steamSyntheticGameID(item.appId)).length;
  return {
    steamId,
    games,
    matched: matchedCount,
    unmatched: games.length - matchedCount,
    syncedAt: status?.librarySyncedAt ?? rows.results[0]!.synced_at,
  };
}
