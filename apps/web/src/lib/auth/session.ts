/**
 * Session lifecycle (Node runtime). Redis is the live source of truth; the
 * Session row is the durable audit record. Enforces ONE active session per user
 * and rotates the refresh token on every use with reuse detection.
 * See docs/ARCHITECTURE.md §1.
 */
import { prisma } from "@/lib/db";
import { redis } from "./redis";
import { signAccessToken } from "./jwt";
import { generateRefreshToken, sha256 } from "./crypto";
import { REFRESH_TTL_SECONDS, type AppRole } from "./constants";

const sessionKey = (sid: string) => `session:${sid}`;
const userSidKey = (userId: string) => `user:${userId}:sid`;
const rtKey = (hash: string) => `rt:${hash}`;

interface RedisSession {
  userId: string;
  role: AppRole;
  refreshHash: string;
  /** Whether the client's auth cookies should persist across browser restarts. */
  persistent: boolean;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  sid: string;
  /** Mirrors the session's persistence choice so cookie helpers can honor it. */
  persistent: boolean;
}

async function writeRedisSession(sid: string, data: RedisSession) {
  const ttl = REFRESH_TTL_SECONDS;
  await redis
    .multi()
    .set(sessionKey(sid), JSON.stringify(data), "EX", ttl)
    .set(userSidKey(data.userId), sid, "EX", ttl)
    .set(rtKey(data.refreshHash), sid, "EX", ttl)
    .exec();
}

/** Revoke a single session everywhere (Redis live state + durable DB record). */
export async function revokeSession(sid: string): Promise<void> {
  const raw = await redis.get(sessionKey(sid));
  const pipeline = redis.multi().del(sessionKey(sid));
  if (raw) {
    const data = JSON.parse(raw) as RedisSession;
    pipeline.del(rtKey(data.refreshHash));
    const current = await redis.get(userSidKey(data.userId));
    if (current === sid) pipeline.del(userSidKey(data.userId));
  }
  await pipeline.exec();
  await prisma.session
    .update({ where: { id: sid }, data: { revokedAt: new Date() } })
    .catch(() => undefined); // best-effort; row may already be gone
}

/**
 * Revoke every session for a user — clears the live Redis session/refresh index
 * AND marks all open DB rows revoked. Used after a password reset so existing
 * logins can't outlive the credential change.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  const sid = await redis.get(userSidKey(userId));
  if (sid) await revokeSession(sid);
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

/** Create a brand-new session, revoking any prior one (single active login). */
export async function createSession(params: {
  userId: string;
  role: AppRole;
  userAgent?: string | null;
  ip?: string | null;
  /** "Remember me": persist cookies across browser restarts. Defaults to true. */
  persistent?: boolean;
}): Promise<IssuedTokens> {
  const { userId, role, userAgent, ip, persistent = true } = params;

  // One-login-per-user: kill the previous live session and mark old DB rows.
  const prevSid = await redis.get(userSidKey(userId));
  if (prevSid) await revokeSession(prevSid);
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const refreshToken = generateRefreshToken();
  const refreshHash = await sha256(refreshToken);
  const expiresAt = new Date(Date.now() + REFRESH_TTL_SECONDS * 1000);

  const row = await prisma.session.create({
    data: {
      userId,
      refreshHash,
      userAgent: userAgent ?? null,
      ip: ip ?? null,
      expiresAt,
    },
  });
  const sid = row.id;

  await writeRedisSession(sid, { userId, role, refreshHash, persistent });
  const accessToken = await signAccessToken({ sub: userId, role, sid });

  return { accessToken, refreshToken, sid, persistent };
}

/**
 * Validate + rotate a refresh token. Returns fresh tokens, or null if the token
 * is invalid / expired / reused (caller should clear cookies and force re-login).
 */
export async function rotateSession(
  rawRefreshToken: string,
  meta?: { userAgent?: string | null; ip?: string | null }
): Promise<IssuedTokens | null> {
  const presentedHash = await sha256(rawRefreshToken);

  const sid = await redis.get(rtKey(presentedHash));
  if (!sid) return null; // unknown/rotated-away token → treat as reuse

  const raw = await redis.get(sessionKey(sid));
  if (!raw) return null;
  const data = JSON.parse(raw) as RedisSession;
  // Sessions created before "remember me" existed have no flag → treat as persistent.
  const persistent = data.persistent ?? true;

  // Defense in depth: the stored hash must match the presented one.
  if (data.refreshHash !== presentedHash) {
    await revokeSession(sid);
    return null;
  }

  // Rotate: mint a new refresh token, swap the rt index, update the DB row.
  const newRefreshToken = generateRefreshToken();
  const newHash = await sha256(newRefreshToken);

  await redis.del(rtKey(presentedHash));
  await writeRedisSession(sid, { ...data, refreshHash: newHash, persistent });
  await prisma.session
    .update({
      where: { id: sid },
      data: {
        refreshHash: newHash,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
        userAgent: meta?.userAgent ?? undefined,
        ip: meta?.ip ?? undefined,
      },
    })
    .catch(() => undefined);

  const accessToken = await signAccessToken({ sub: data.userId, role: data.role, sid });
  return { accessToken, refreshToken: newRefreshToken, sid, persistent };
}
