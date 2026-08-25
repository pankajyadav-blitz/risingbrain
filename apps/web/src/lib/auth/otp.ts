/**
 * One-time-password (OTP) flows backed by Redis (Node runtime only). Codes are
 * never stored in plaintext — only their SHA-256 hash — and carry a short TTL
 * plus an attempt cap to resist brute force.
 *
 * Two flows use this:
 *  - Email verification on signup. The pending account (name + already-hashed
 *    password) rides along in the same record, so the User row is created ONLY
 *    after the email is proven, never before.
 *  - Password reset. On success a separate one-time reset token is minted so the
 *    new-password step doesn't have to re-send the code.
 *
 * Redis is the ONLY store for these records — a short-lived pending signup has no
 * business in Postgres — so unlike sessions there is nothing to fall back to. What
 * that must NOT mean is an unhandled rejection: every call here used to hit
 * `redis.*` bare, so with Redis unreachable `verifyOtp` threw straight out of the
 * route handler and signup, email verification and password reset all answered 500.
 * Instead each operation reports `unavailable` distinctly from `expired`, so the
 * routes can say "try again in a moment" (503) rather than either crashing or
 * telling a user their correct code is wrong.
 */
import { redis, redisAttempt } from "./redis";
import { sha256, randomId } from "./crypto";
import { sendOtpEmail } from "../mail/mailer";

const CODE_TTL_SECONDS = 10 * 60; // 10 minutes
const MAX_ATTEMPTS = 5;
const RESET_TOKEN_TTL_SECONDS = 10 * 60;

export const OTP_TTL_MINUTES = CODE_TTL_SECONDS / 60;

type Purpose = "signup" | "reset";

interface SignupPayload {
  name: string;
  passwordHash: string;
}

interface OtpRecord {
  codeHash: string;
  attempts: number;
  /** Present only for the signup flow. */
  signup?: SignupPayload;
}

const otpKey = (purpose: Purpose, email: string) => `otp:${purpose}:${email}`;
const resetTokenKey = (token: string) => `pwreset:${token}`;

/**
 * The OTP store couldn't be reached. Distinct from "no such code" — the caller
 * should answer 503 and invite a retry, not fail the user's input.
 */
export class OtpStoreUnavailableError extends Error {
  constructor(cause?: unknown) {
    super("Verification store temporarily unavailable");
    this.name = "OtpStoreUnavailableError";
    this.cause = cause;
  }
}

/** Cryptographically-random 6-digit code, zero-padded. */
function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return n.toString().padStart(6, "0");
}

/**
 * Create (or replace) an OTP for an email+purpose and send it. Re-requesting
 * overwrites any existing code and resets the attempt counter, so a user who
 * asks for a new code can always use the latest one.
 *
 * Throws `OtpStoreUnavailableError` if the code can't be stored. Deliberately
 * BEFORE the email goes out: mailing someone a code we can't verify would be
 * worse than not mailing at all.
 */
export async function issueOtp(params: {
  purpose: Purpose;
  email: string;
  signup?: SignupPayload;
}): Promise<void> {
  const { purpose, email, signup } = params;
  const code = generateCode();
  const record: OtpRecord = {
    codeHash: await sha256(code),
    attempts: 0,
    ...(signup ? { signup } : {}),
  };
  const stored = await redisAttempt(() =>
    redis.set(otpKey(purpose, email), JSON.stringify(record), "EX", CODE_TTL_SECONDS)
  );
  if (!stored.ok) throw new OtpStoreUnavailableError(stored.error);

  await sendOtpEmail({
    to: email,
    code,
    purpose: purpose === "signup" ? "verify" : "reset",
    ttlMinutes: OTP_TTL_MINUTES,
  });
}

export type VerifyResult =
  | { ok: true; signup?: SignupPayload }
  | { ok: false; reason: "expired" | "invalid" | "too_many" | "unavailable" };

/**
 * Check a submitted code. On success the record is consumed (deleted) and any
 * pending signup payload is returned. On a wrong code the attempt counter
 * increments and the record is dropped once the cap is hit.
 */
export async function verifyOtp(params: {
  purpose: Purpose;
  email: string;
  code: string;
}): Promise<VerifyResult> {
  const { purpose, email, code } = params;
  const key = otpKey(purpose, email);

  const read = await redisAttempt(() => redis.get(key));
  if (!read.ok) return { ok: false, reason: "unavailable" };
  if (!read.value) return { ok: false, reason: "expired" };

  const record = JSON.parse(read.value) as OtpRecord;
  if (record.attempts >= MAX_ATTEMPTS) {
    await redisAttempt(() => redis.del(key));
    return { ok: false, reason: "too_many" };
  }

  const presented = await sha256(code);
  if (presented !== record.codeHash) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      await redisAttempt(() => redis.del(key));
      return { ok: false, reason: "too_many" };
    }
    // Preserve the remaining TTL on the record while bumping the attempt count.
    // Best-effort: losing the increment costs an extra guess, which is a far
    // smaller problem than rejecting the flow outright.
    const ttl = await redisAttempt(() => redis.ttl(key));
    const remaining = ttl.ok && ttl.value > 0 ? ttl.value : CODE_TTL_SECONDS;
    await redisAttempt(() => redis.set(key, JSON.stringify(record), "EX", remaining));
    return { ok: false, reason: "invalid" };
  }

  // The code is right. Consuming it is what makes it one-time, so a failed delete
  // must not be reported as success — the record would stay live and replayable.
  const consumed = await redisAttempt(() => redis.del(key));
  if (!consumed.ok) return { ok: false, reason: "unavailable" };

  return { ok: true, signup: record.signup };
}

/**
 * Mint a single-use token (after a verified reset OTP) gating the new-password
 * step. Throws `OtpStoreUnavailableError` rather than handing back a token the
 * reset step would then reject.
 */
export async function issueResetToken(email: string): Promise<string> {
  const token = randomId(32);
  const stored = await redisAttempt(() =>
    redis.set(resetTokenKey(token), email, "EX", RESET_TOKEN_TTL_SECONDS)
  );
  if (!stored.ok) throw new OtpStoreUnavailableError(stored.error);
  return token;
}

/**
 * Consume a reset token, returning the email it was issued for. `null` means the
 * token is unknown or spent; throws `OtpStoreUnavailableError` when the store
 * couldn't be reached, so a blip isn't reported to the user as an invalid link.
 */
export async function consumeResetToken(token: string): Promise<string | null> {
  const key = resetTokenKey(token);

  const read = await redisAttempt(() => redis.get(key));
  if (!read.ok) throw new OtpStoreUnavailableError(read.error);
  if (!read.value) return null;

  // Same one-time guarantee as verifyOtp: don't authorise the password change
  // unless the token is definitely gone.
  const consumed = await redisAttempt(() => redis.del(key));
  if (!consumed.ok) throw new OtpStoreUnavailableError(consumed.error);

  return read.value;
}
