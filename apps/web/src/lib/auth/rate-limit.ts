/**
 * Distributed rate limiting backed by Redis (rate-limiter-flexible). Protects
 * auth + write endpoints so a flood can't hammer Postgres. Fails OPEN on a Redis
 * error so a cache blip never locks users out.
 */
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./redis";

// 5 attempts / 15 min per identifier — for login, register, password reset.
const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth",
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

// 30 writes / minute per identifier — general state-changing API calls.
const writeLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:write",
  points: 30,
  duration: 60,
});

export interface RateResult {
  ok: boolean;
  retryAfterSeconds?: number;
}

async function consume(limiter: RateLimiterRedis, id: string): Promise<RateResult> {
  try {
    await limiter.consume(id);
    return { ok: true };
  } catch (res: unknown) {
    // RateLimiterRes when blocked; a thrown Error means Redis is down → fail open.
    if (res && typeof res === "object" && "msBeforeNext" in res) {
      const ms = (res as { msBeforeNext: number }).msBeforeNext;
      return { ok: false, retryAfterSeconds: Math.ceil(ms / 1000) };
    }
    return { ok: true };
  }
}

export const limitAuth = (id: string) => consume(authLimiter, id);
export const limitWrite = (id: string) => consume(writeLimiter, id);

/** Client identifier — prefer the user id, fall back to the forwarded IP. */
export function clientId(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const fwd = req.headers.get("x-forwarded-for");
  const ip = fwd ? fwd.split(",")[0]!.trim() : "127.0.0.1";
  return `ip:${ip}`;
}
