/**
 * Distributed rate limiting backed by Redis (rate-limiter-flexible). Protects
 * auth + write endpoints so a flood can't hammer Postgres. Fails OPEN on a Redis
 * error so a cache blip never locks users out.
 */
import { NextResponse } from "next/server";
import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis, redisTry } from "./redis";
import { env } from "../env";

// 5 attempts / 15 min per identifier — for login, register, password reset.
const authLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth",
  points: 5,
  duration: 15 * 60,
  blockDuration: 15 * 60,
});

/**
 * 20 attempts / 15 min per ACCOUNT, independent of where they come from.
 *
 * The IP bucket above can only ever be advisory: `X-Forwarded-For` is written by
 * the client unless a trusted proxy overwrites it (see `clientIp`), so an
 * attacker who varies the header gets a fresh IP bucket per request and the
 * 5-attempt limit never fires. This bucket is keyed by the email being attacked
 * instead, which the attacker cannot vary while still guessing the same account's
 * password or 6-digit OTP.
 *
 * The tradeoff is deliberate: a griefer can burn a victim's 20 attempts and lock
 * that ONE account's login for 15 minutes. Unbounded credential and OTP guessing
 * is the worse of the two, and 20/15min still leaves a 6-digit code (10^6 values,
 * expiring in minutes, with its own per-code attempt cap) far out of reach.
 */
const accountLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rl:auth:acct",
  points: 20,
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
  // `redisTry` bounds this with a timeout: without it a Redis outage doesn't just
  // fail, it HANGS the request until ioredis gives up — turning "rate limiting is
  // degraded" into "login times out with a 500".
  const result = await redisTry(async () => {
    try {
      await limiter.consume(id);
      return { ok: true } as RateResult;
    } catch (res: unknown) {
      // RateLimiterRes when blocked; anything else is a Redis fault → rethrow so
      // redisTry catches it and we fail open.
      if (res && typeof res === "object" && "msBeforeNext" in res) {
        const ms = (res as { msBeforeNext: number }).msBeforeNext;
        return { ok: false, retryAfterSeconds: Math.ceil(ms / 1000) } as RateResult;
      }
      throw res;
    }
  });
  // null = Redis unreachable/timed out → fail open.
  return result ?? { ok: true };
}

export const limitAuth = (id: string) => consume(authLimiter, id);
export const limitWrite = (id: string) => consume(writeLimiter, id);

/**
 * Best-available client IP from `X-Forwarded-For`.
 *
 * Read from the RIGHT of the chain, not the left. Each proxy APPENDS the address
 * it saw, so the rightmost entries are the ones written by infrastructure and
 * everything to their left is whatever the client sent. Reading `split(",")[0]`
 * (what this did) took the one value entirely under the caller's control: vary it
 * per request and every attempt lands in its own bucket, so the 5-per-15-minutes
 * auth limit never triggers at all.
 *
 * With `TRUSTED_PROXY_HOPS = 0` there is no trusted hop, so this is still only a
 * best guess — that is why auth routes also consume `accountLimiter`, which does
 * not depend on the header being honest.
 */
export function clientIp(req: Request): string {
  const chain = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (!chain.length) return "unknown";
  const idx = chain.length - 1 - Math.max(0, env.TRUSTED_PROXY_HOPS);
  return chain[Math.max(0, idx)] ?? "unknown";
}

/** Client identifier — prefer the user id, fall back to the forwarded IP. */
export function clientId(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  return `ip:${clientIp(req)}`;
}

const tooMany = (retryAfterSeconds?: number) =>
  NextResponse.json(
    { error: "Too many attempts. Try again later." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds ?? 900) } }
  );

/**
 * Per-IP auth throttle. Call BEFORE parsing the body (it is the cheap guard), and
 * pair it with `checkAccountLimit` once the email is known — neither is
 * sufficient alone. Returns a ready-to-send 429, or `null` to proceed.
 */
export async function checkAuthLimit(req: Request): Promise<NextResponse | null> {
  const rl = await limitAuth(clientId(req));
  return rl.ok ? null : tooMany(rl.retryAfterSeconds);
}

/**
 * Per-account auth throttle — the one that actually bounds password/OTP guessing,
 * because it cannot be sidestepped by rotating a request header.
 */
export async function checkAccountLimit(email: string): Promise<NextResponse | null> {
  const key = email.trim().toLowerCase();
  if (!key) return null;
  const rl = await consume(accountLimiter, `email:${key}`);
  return rl.ok ? null : tooMany(rl.retryAfterSeconds);
}

/**
 * Per-caller write throttle for any state-changing (or DB-hitting public) route.
 * Returns a ready-to-send 429 when over budget, or `null` to proceed. Keyed by
 * user id when signed in, else the forwarded IP. Fails open if Redis is down.
 * Shared by the sheet, interview and aptitude routes so one flood can't hammer
 * Postgres (see docs/ARCHITECTURE.md §1).
 */
export async function checkWriteLimit(req: Request, userId?: string): Promise<NextResponse | null> {
  const rl = await limitWrite(clientId(req, userId));
  if (rl.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Slow down." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
  );
}
