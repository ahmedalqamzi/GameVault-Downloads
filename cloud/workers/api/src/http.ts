import type { ErrorResponse } from "@gamevault/shared";
import type { Env } from "./types";

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };

export function corsHeaders(request: Request, env: Env): HeadersInit {
  const origin = request.headers.get("origin");
  const allowed = (env.CORS_ORIGINS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  const allowOrigin = origin && (allowed.includes(origin) || allowed.includes("*"))
    ? origin
    : allowed.includes("*")
      ? "*"
      : "";

  return {
    ...(allowOrigin ? { "access-control-allow-origin": allowOrigin } : {}),
    "access-control-allow-headers": "authorization, content-type, x-gamevault-client",
    "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
    "access-control-max-age": "86400",
    vary: "Origin",
  };
}

export function json(
  request: Request,
  env: Env,
  value: unknown,
  init: ResponseInit = {},
): Response {
  const headers = new Headers(init.headers);
  for (const [key, headerValue] of Object.entries(JSON_HEADERS)) {
    headers.set(key, headerValue);
  }
  for (const [key, headerValue] of Object.entries(corsHeaders(request, env))) {
    headers.set(key, String(headerValue));
  }
  return new Response(JSON.stringify(value), { ...init, headers });
}

export function apiError(
  request: Request,
  env: Env,
  status: number,
  code: string,
  message: string,
): Response {
  const body: ErrorResponse = { error: { code, message } };
  return json(request, env, body, { status });
}

export async function isAuthorized(request: Request, env: Env): Promise<boolean> {
  if (!env.SYNC_TOKEN) return false;
  const supplied = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  const encoder = new TextEncoder();
  const [expectedDigest, suppliedDigest] = await Promise.all([
    crypto.subtle.digest("SHA-256", encoder.encode(env.SYNC_TOKEN)),
    crypto.subtle.digest("SHA-256", encoder.encode(supplied)),
  ]);
  const expected = new Uint8Array(expectedDigest);
  const actual = new Uint8Array(suppliedDigest);
  let difference = expected.length ^ actual.length;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= expected[index]! ^ actual[index]!;
  }
  return difference === 0;
}

export async function parseJson<T>(request: Request): Promise<T | undefined> {
  if (!request.headers.get("content-type")?.includes("application/json")) return undefined;
  try {
    return (await request.json()) as T;
  } catch {
    return undefined;
  }
}
