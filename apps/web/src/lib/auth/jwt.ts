/**
 * Access-token signing & verification with `jose`. Pure-crypto and edge-safe —
 * the middleware verifies tokens here with ZERO database or Redis calls, which
 * is what lets authenticated requests scale (see docs/ARCHITECTURE.md §1.2).
 *
 * Reads AUTH_SECRET straight from process.env (not ./env) to avoid pulling
 * Node-only / DB config into the edge bundle.
 */
import { SignJWT, jwtVerify } from "jose";
import { ACCESS_TTL_SECONDS, type AccessClaims } from "./constants";

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("Missing AUTH_SECRET");
  return new TextEncoder().encode(value);
}

const ALG = "HS256";

export async function signAccessToken(claims: AccessClaims): Promise<string> {
  return new SignJWT({ role: claims.role, sid: claims.sid })
    .setProtectedHeader({ alg: ALG })
    .setSubject(claims.sub)
    .setIssuedAt()
    .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
    .sign(secret());
}

/** Returns the claims if the token is valid & unexpired, else null. */
export async function verifyAccessToken(token: string): Promise<AccessClaims | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    if (!payload.sub || !payload.role || !payload.sid) return null;
    return {
      sub: payload.sub,
      role: payload.role as AccessClaims["role"],
      sid: payload.sid as string,
    };
  } catch {
    return null;
  }
}
