export const deskCookie = "shelf_desk";

const maxAgeSeconds = 60 * 60 * 24 * 12;

export function sessionMaxAge() {
  return maxAgeSeconds;
}

function password() {
  return process.env.ADMIN_PASSWORD ?? "";
}

export function passwordConfigured() {
  return password().length > 0;
}

function bytes(value: string) {
  return new TextEncoder().encode(value);
}

function same(left: string, right: string) {
  const a = bytes(left);
  const b = bytes(right);
  const length = Math.max(a.length, b.length);
  let diff = a.length === b.length ? 0 : 1;

  for (let index = 0; index < length; index += 1) {
    diff |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }

  return diff === 0;
}

async function sign(secret: string, message: string) {
  const key = await crypto.subtle.importKey("raw", bytes(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", key, bytes(message));
  let binary = "";

  for (const part of new Uint8Array(signature)) {
    binary += String.fromCharCode(part);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

export async function passwordsMatch(input: string) {
  const expected = password();
  if (!expected) {
    return false;
  }

  return same(input, expected);
}

export async function createSessionToken() {
  const secret = password();
  const expires = Date.now() + maxAgeSeconds * 1000;
  const signature = await sign(secret, String(expires));
  return `${expires}.${signature}`;
}

export async function hasDeskSession(token: string | undefined, now: number) {
  const secret = password();
  if (!secret || !token) {
    return false;
  }

  const [expires, signature] = token.split(".");
  if (!expires || !signature || !/^\d+$/.test(expires)) {
    return false;
  }

  if (Number(expires) < now) {
    return false;
  }

  return same(signature, await sign(secret, expires));
}
