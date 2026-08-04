/**
 * Session lifecycle (Node runtime). Redis is the live fast path; the Session row
 * is the durable record AND the fallback when Redis is unreachable. Enforces ONE
 * active session per user and rotates the refresh token on every use with reuse
 * detection. See docs/ARCHITECTURE.md §1.
 *
 * Redis-outage policy: Redis is a cache, never the sole authority. Every write is
 * best-effort and every read falls back to Postgres, so login/refresh keep working
 * while Redis is down. Reuse detection is delegated to the DB (`refreshHash` is
 * `@unique` and rotates on every use), so degrading to the DB path does not weaken
 * it — a replayed token matches no live row either way.
 */
import { prisma } from "@/lib/db";
import { redis, redisTry } from "./redis";
import { signAccessToken } from "./jwt";
import { generateRefreshToken, sha256 } from "./crypto";
import { REFRESH_TTL_SECONDS, REFRESH_GRACE_SECONDS, type AppRole } from "./constants";

const sessionKey = (sid: string) => `session:${sid}`;
const userSidKey = (userId: string) => `user:${userId}:sid`;
const rtKey = (hash: string) => `rt:${hash}`;
/**
 * Just-rotated refresh hashes, kept for REFRESH_GRACE_SECONDS so two requests that
 * race with the same token both succeed instead of one being treated as a replay.
 * Redis-only: a race *during a Redis outage* still falls through to the strict DB
 * path and forces a re-login, which is rare enough not to warrant a schema column.
 */
const rtPrevKey = (hash: string) => `rtprev:${hash}`;

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

/**
 * Thrown by `rotateSession` when the backing stores are unreachable, as opposed to
 * the token being invalid. The distinction matters at the HTTP layer: `null` means
 * "sign in again" (clear the cookies), while this means "we couldn't tell — keep
 * your cookies and try again shortly". Conflating the two logs people out of a
 * perfectly good session every time Postgres hiccups.
 */
export class SessionUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Session store temporarily unavailable");
    this.name = "SessionUnavailableError";
    this.cause = cause;
  }
}

async function writeRedisSession(sid: string, data: RedisSession) {
  const ttl = REFRESH_TTL_SECONDS;
  await redisTry(() =>
    redis
      .multi()
      .set(sessionKey(sid), JSON.stringify(data), "EX", ttl)
      .set(userSidKey(data.userId), sid, "EX", ttl)
      .set(rtKey(data.refreshHash), sid, "EX", ttl)
      .exec()
  );
}

/** Revoke a single session everywhere (durable DB record + Redis live state). */
export async function revokeSession(sid: string): Promise<void> {
  // DB first: it's the authority, so a revoke must stick even with Redis down.
  await prisma.session
    .update({ where: { id: sid }, data: { revokedAt: new Date() } })
    .catch(() => undefined); // best-effort; row may already be gone

  const raw = await redisTry(() => redis.get(sessionKey(sid)));
  await redisTry(async () => {
    const pipeline = redis.multi().del(sessionKey(sid));
    if (raw) {
      const data = JSON.parse(raw) as RedisSession;
      pipeline.del(rtKey(data.refreshHash)).del(rtPrevKey(data.refreshHash));
      const current = await redis.get(userSidKey(data.userId));
      if (current === sid) pipeline.del(userSidKey(data.userId));
    }
    return pipeline.exec();
  });
}

/**
 * Revoke every session for a user — marks all open DB rows revoked AND clears the
 * live Redis session/refresh index. Used after a password reset so existing logins
 * can't outlive the credential change.
 */
export async function revokeAllUserSessions(userId: string): Promise<void> {
  // Find live sids from the DB, not Redis, so a Redis outage can't cause a
  // password reset to silently leave sessions alive.
  const rows = await prisma.session.findMany({
    where: { userId, revokedAt: null },
    select: { id: true },
  });
  await prisma.session.updateMany({
    where: { userId, revokedAt: null },
    data: { revokedAt: new Date() },
  });
  for (const row of rows) await revokeSession(row.id);
  await redisTry(() => redis.del(userSidKey(userId)));
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

  // One-login-per-user. Driven off the DB so it still holds with Redis down;
  // revokeAllUserSessions also clears whatever Redis state is reachable.
  await revokeAllUserSessions(userId);

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

  // --- Resolve the session: Redis fast path, Postgres fallback. ---
  let sid: string | null = null;
  let data: RedisSession | null = null;
  let fromRedis = false;

  const cachedSid = await redisTry(() => redis.get(rtKey(presentedHash)));
  if (cachedSid) {
    const raw = await redisTry(() => redis.get(sessionKey(cachedSid)));
    if (raw) {
      const cached = JSON.parse(raw) as RedisSession;
      // Defense in depth: the stored hash must match the presented one.
      if (cached.refreshHash !== presentedHash) {
        await revokeSession(cachedSid);
        return null;
      }
      sid = cachedSid;
      // Sessions created before "remember me" existed have no flag → persistent.
      data = { ...cached, persistent: cached.persistent ?? true };
      fromRedis = true;
    }
  }

  if (!data) {
    // Redis missed or was unreachable. The DB row is authoritative, so a cache
    // gap can't log anyone out; a genuinely reused/rotated token still finds no
    // live row here and is correctly rejected below.
    const row = await prisma.session.findUnique({
      where: { refreshHash: presentedHash },
      select: {
        id: true,
        userId: true,
        revokedAt: true,
        expiresAt: true,
        user: { select: { role: true } },
      },
    });
    if (row && !row.revokedAt && row.expiresAt > new Date()) {
      sid = row.id;
      data = {
        userId: row.userId,
        role: row.user.role as AppRole,
        refreshHash: presentedHash,
        // Not persisted on the row; assume "remember me" so a Redis outage
        // doesn't silently downgrade a long-lived login to a session cookie.
        persistent: true,
      };
    }
  }

  if (!data) {
    // Last chance: was this token rotated away moments ago by a concurrent
    // request? Two tabs refreshing at once (or a proxy bounce landing next to a
    // SessionKeepAlive ping) legitimately present the same token. Re-rotate for
    // that session rather than logging a live user out. The DB row below is still
    // the authority — a grace hit on a revoked session matches zero rows there.
    const graceSid = await redisTry(() => redis.get(rtPrevKey(presentedHash)));
    if (graceSid) {
      const raw = await redisTry(() => redis.get(sessionKey(graceSid)));
      if (raw) {
        const cached = JSON.parse(raw) as RedisSession;
        console.warn(`[auth] refresh race on session ${graceSid} — re-rotating within grace window`);
        sid = graceSid;
        data = { ...cached, persistent: cached.persistent ?? true };
        fromRedis = true;
      }
    }
  }

  if (!data) return null;

  // --- Rotate: mint a new refresh token, swap the rt index, update the row. ---
  const newRefreshToken = generateRefreshToken();
  const newHash = await sha256(newRefreshToken);

  // `updateMany` with `revokedAt: null` makes the DB the final authority: a
  // session revoked while Redis was down (so its cache entry lingered) matches
  // zero rows here and is rejected even on the Redis hit path.
  //
  // `dbFailed` is tracked separately from `rotatedInDb` because the two mean very
  // different things. A completed query reporting 0 rows is a verdict: the session
  // is gone. An exception is NOT a verdict — Neon suspends its compute when idle,
  // so "Connection terminated unexpectedly" on the first write after a lull is a
  // routine event. Treating that as "session invalid" is what turned a momentary
  // blip into a permanent logout.
  let rotatedInDb = false;
  let dbFailed = false;
  let lastErr: unknown;
  // Two quick retries first: a dropped pooled socket usually succeeds immediately
  // on a fresh connection, which avoids bothering the caller at all.
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const { count } = await prisma.session.updateMany({
        where: { id: sid!, revokedAt: null },
        data: {
          refreshHash: newHash,
          lastUsedAt: new Date(),
          expiresAt: new Date(Date.now() + REFRESH_TTL_SECONDS * 1000),
          userAgent: meta?.userAgent ?? undefined,
          ip: meta?.ip ?? undefined,
        },
      });
      rotatedInDb = count > 0;
      dbFailed = false;
      break;
    } catch (err) {
      lastErr = err;
      dbFailed = true;
      if (attempt < 3) await new Promise((r) => setTimeout(r, 150 * attempt));
    }
  }

  if (dbFailed) {
    console.error("[auth] session rotate: database write failed:", lastErr);
    // Redis already authenticated this token, so the session is real — let the
    // user through on the cached identity rather than logging them out over a
    // write we can retry on the next rotation.
    rotatedInDb = fromRedis;
  }

  if (!rotatedInDb) {
    // Revoke ONLY on a definitive verdict. After a DB failure we know nothing
    // about the session, so surface it as "unavailable" — the caller keeps the
    // user's cookies and retries, instead of destroying a session that was fine.
    if (dbFailed) throw new SessionUnavailableError(lastErr);
    await revokeSession(sid!);
    return null;
  }

  // Retire the superseded hashes into the short grace index instead of deleting
  // them outright, so a request already in flight with one re-rotates instead of
  // being logged out.
  //
  // BOTH hashes matter. They're identical on the normal path, but when we got here
  // through the grace window they differ: `presentedHash` is the token this caller
  // brought, and `data.refreshHash` is the one the request that beat us installed.
  // Retiring only the former would leave `rt:{data.refreshHash}` pointing at a
  // session whose stored hash has moved on — and that inconsistency is exactly what
  // the mismatch branch above treats as token reuse, killing the session.
  const retired = [...new Set([presentedHash, data.refreshHash])];
  await redisTry(() => {
    const pipeline = redis.multi();
    for (const hash of retired) {
      pipeline.del(rtKey(hash)).set(rtPrevKey(hash), sid!, "EX", REFRESH_GRACE_SECONDS);
    }
    return pipeline.exec();
  });
  await writeRedisSession(sid!, { ...data, refreshHash: newHash });

  const accessToken = await signAccessToken({ sub: data.userId, role: data.role, sid: sid! });
  return { accessToken, refreshToken: newRefreshToken, sid: sid!, persistent: data.persistent };
}
