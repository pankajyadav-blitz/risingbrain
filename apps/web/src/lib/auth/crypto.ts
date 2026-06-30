/**
 * Token randomness + hashing. Refresh tokens are opaque random strings; we only
 * ever store their SHA-256 hash (in Redis and the Session row), never the raw
 * value. Uses Web Crypto so it works in any runtime.
 */

export function generateRefreshToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

/** Random opaque id for OAuth state / PKCE bookkeeping when needed. */
export function randomId(bytes = 24): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return base64url(buf);
}

export async function sha256(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function base64url(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
