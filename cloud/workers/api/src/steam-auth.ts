import type { SteamAuthExchangeResponse } from "@gamevault/shared";
import type { Env } from "./types";

interface SteamSessionPayload {
  v: 1;
  sub: string;
  iat: number;
  exp: number;
}

const AUTH_CODE_TTL_MS = 5 * 60_000;
const SESSION_TTL_MS = 30 * 86_400_000;

function base64URL(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function decodeBase64URL(value: string): Uint8Array | undefined {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) return undefined;
  try {
    const padded = value.replaceAll("-", "+").replaceAll("_", "/")
      .padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    // Base64 has unused trailing bits for some lengths. Requiring the canonical
    // spelling prevents different token strings from decoding to one signature.
    return base64URL(bytes) === value ? bytes : undefined;
  } catch {
    return undefined;
  }
}

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return base64URL(new Uint8Array(digest));
}

async function hmacKey(env: Env): Promise<CryptoKey> {
  const secret = env.STEAM_SESSION_SECRET?.trim() || env.SYNC_TOKEN?.trim();
  if (!secret) throw new Error("Steam sessions are not configured on the GameVault service.");
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
}

async function issueSteamSession(env: Env, steamId: string): Promise<SteamAuthExchangeResponse> {
  const now = Date.now();
  const payload: SteamSessionPayload = { v: 1, sub: steamId, iat: now, exp: now + SESSION_TTL_MS };
  const encodedPayload = base64URL(new TextEncoder().encode(JSON.stringify(payload)));
  const signature = await crypto.subtle.sign(
    "HMAC",
    await hmacKey(env),
    new TextEncoder().encode(encodedPayload),
  );
  return {
    steamId,
    token: `${encodedPayload}.${base64URL(new Uint8Array(signature))}`,
    expiresAt: new Date(payload.exp).toISOString(),
  };
}

export async function createSteamAuthCode(db: D1Database, steamId: string): Promise<string> {
  if (!/^\d{17}$/.test(steamId)) throw new Error("Steam did not return a valid account ID.");
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const code = base64URL(bytes);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + AUTH_CODE_TTL_MS);
  await db.prepare(
    `INSERT INTO steam_auth_codes (code_hash, steam_id, created_at, expires_at, consumed_at)
     VALUES (?, ?, ?, ?, NULL)`,
  ).bind(await sha256(code), steamId, now.toISOString(), expiresAt.toISOString()).run();
  // Opportunistic bounded cleanup. It cannot affect the code just created.
  await db.prepare(
    "DELETE FROM steam_auth_codes WHERE expires_at < ? OR consumed_at < ?",
  ).bind(now.toISOString(), new Date(now.getTime() - 86_400_000).toISOString()).run().catch(() => undefined);
  return code;
}

export async function exchangeSteamAuthCode(
  env: Env,
  code: string,
): Promise<SteamAuthExchangeResponse | undefined> {
  const clean = code.trim();
  if (clean.length < 32 || clean.length > 200 || !/^[A-Za-z0-9_-]+$/.test(clean)) return undefined;
  const now = new Date().toISOString();
  const consumed = await env.DB.prepare(
    `UPDATE steam_auth_codes SET consumed_at = ?
     WHERE code_hash = ? AND consumed_at IS NULL AND expires_at > ?
     RETURNING steam_id`,
  ).bind(now, await sha256(clean), now).first<{ steam_id: string }>();
  if (!consumed || !/^\d{17}$/.test(consumed.steam_id)) return undefined;
  return issueSteamSession(env, consumed.steam_id);
}

export async function steamSessionIdentity(request: Request, env: Env): Promise<string | undefined> {
  const authorization = request.headers.get("authorization")?.match(/^Steam\s+(.+)$/i)?.[1];
  const token = authorization ?? request.headers.get("x-gamevault-steam-session")?.trim();
  if (!token) return undefined;
  const parts = token.split(".");
  if (parts.length !== 2) return undefined;
  const payloadBytes = decodeBase64URL(parts[0]!);
  const signature = decodeBase64URL(parts[1]!);
  if (!payloadBytes || !signature) return undefined;
  try {
    const valid = await crypto.subtle.verify(
      "HMAC",
      await hmacKey(env),
      new Uint8Array(signature).buffer,
      new TextEncoder().encode(parts[0]!),
    );
    if (!valid) return undefined;
    const payload = JSON.parse(new TextDecoder().decode(payloadBytes)) as Partial<SteamSessionPayload>;
    if (
      payload.v !== 1
      || typeof payload.sub !== "string"
      || !/^\d{17}$/.test(payload.sub)
      || !Number.isFinite(payload.iat)
      || !Number.isFinite(payload.exp)
      || payload.iat! > Date.now() + 60_000
      || payload.exp! <= Date.now()
      || payload.exp! - payload.iat! > SESSION_TTL_MS + 60_000
    ) return undefined;
    return payload.sub;
  } catch {
    return undefined;
  }
}
