/**
 * Singleton ioredis client (Node runtime only — never import from middleware).
 * Reused across hot reloads to avoid exhausting connections.
 *
 * Redis is a CACHE for auth, never a hard dependency: an outage must degrade to
 * the Postgres path (see session.ts), not 500 the login. Two things are needed
 * for that, and the fallback logic alone isn't enough:
 *   1. commands must FAIL rather than queue while the server is unreachable
 *      (`enableOfflineQueue: false`) — otherwise they sit in the offline queue
 *      and the request hangs until the client's timeout instead of falling back;
 *   2. every call must be bounded by `redisTry()` below.
 */
import Redis from "ioredis";
import { env } from "../env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

/** Hard ceiling on any single Redis round-trip before we fall back to Postgres. */
const REDIS_TIMEOUT_MS = 1_000;

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    // Don't crash the process on a transient Redis hiccup; auth degrades to DB.
    maxRetriesPerRequest: 1,
    connectTimeout: REDIS_TIMEOUT_MS,
    // Fail commands immediately while disconnected instead of buffering them.
    // Without this a Redis outage turns every auth call into a hang.
    enableOfflineQueue: false,
    // Keep trying to reconnect forever, but with a capped backoff so a long
    // outage doesn't hot-loop and a recovered Redis is picked up promptly.
    retryStrategy: (times) => Math.min(times * 200, 5_000),
    // Connect on first command, NOT at import. Importing this module must not
    // open a socket — otherwise `next build` (and serverless cold-start) would
    // try to reach Redis just from bundling an auth route. Runtime behaviour is
    // unchanged: the first auth operation establishes the connection.
    lazyConnect: true,
  });

// ioredis emits 'error' on EVERY failed reconnect. Without a listener Node treats
// it as an unhandled error event; with one we log and let the retryStrategy keep
// working. Throttled, because `retryStrategy` never gives up: an outage of any
// length would otherwise write a line every few seconds forever, drowning the
// logs you actually need to read while diagnosing that outage.
const ERROR_LOG_INTERVAL_MS = 60_000;
let lastErrorLoggedAt = 0;
let suppressedErrors = 0;

redis.on("error", (err: Error & { code?: string }) => {
  suppressedErrors += 1;
  const now = Date.now();
  if (now - lastErrorLoggedAt < ERROR_LOG_INTERVAL_MS) return;
  const skipped = suppressedErrors - 1;
  lastErrorLoggedAt = now;
  suppressedErrors = 0;
  // Logged in production too: "Redis is down" is exactly the kind of thing that
  // must not be invisible just because the app degrades gracefully around it.
  console.warn(
    `[redis] connection error: ${err.code ?? err.message}` +
      (skipped > 0 ? ` (${skipped} similar suppressed in the last minute)` : "")
  );
});

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}

/**
 * Circuit breaker. A single auth request makes several Redis calls, so without
 * this each one pays the full timeout and a login takes seconds during an outage.
 * After a failure we skip Redis outright for a short cooldown, then let one
 * request through to probe for recovery.
 */
const CIRCUIT_COOLDOWN_MS = 5_000;
let circuitOpenedAt = 0;

/**
 * Outcome of a bounded Redis call. `ok: false` means the STORE failed — it says
 * nothing about whether the key exists. Keeping the two apart matters wherever
 * Redis is the only copy of the data (see `otp.ts`): telling a user their correct
 * verification code is wrong, because the lookup never reached Redis, is a much
 * worse failure than telling them to try again in a moment.
 */
export type RedisResult<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Run a Redis op under the timeout + circuit breaker, reporting whether the store
 * was reachable. Never throws.
 */
export async function redisAttempt<T>(op: () => Promise<T>): Promise<RedisResult<T>> {
  if (circuitOpenedAt && Date.now() - circuitOpenedAt < CIRCUIT_COOLDOWN_MS) {
    return { ok: false, error: new Error("redis circuit open") };
  }

  try {
    // `lazyConnect` + `enableOfflineQueue: false` means a command issued before
    // the socket is up would reject, so establish the connection first — still
    // inside the timeout below, so a dead Redis can't stall the request.
    const run = async () => {
      if (redis.status === "wait" || redis.status === "end") await redis.connect();
      return op();
    };
    const value = await Promise.race([
      run(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("redis timeout")), REDIS_TIMEOUT_MS)
      ),
    ]);
    circuitOpenedAt = 0; // healthy again
    return { ok: true, value };
  } catch (error) {
    circuitOpenedAt = Date.now();
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] redis unavailable, using fallback:", (error as Error).message);
    }
    return { ok: false, error };
  }
}

/**
 * Run a Redis op that must never take auth down with it. Returns `null` on any
 * failure — unreachable, timed out, or a genuine cache miss. Callers must treat
 * `null` as "no cached answer" and fall back to Postgres.
 *
 * Use this where Postgres holds the same data (sessions, rate limits). Where Redis
 * is the ONLY copy, use `redisAttempt` instead so an outage isn't misread as a miss.
 */
export async function redisTry<T>(op: () => Promise<T>): Promise<T | null> {
  const result = await redisAttempt(op);
  return result.ok ? result.value : null;
}
