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
 */
import { redis } from "./redis";
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

/** Cryptographically-random 6-digit code, zero-padded. */
function generateCode(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0]! % 1_000_000;
  return n.toString().padStart(6, "0");
}

/**
 * Create (or replace) an OTP for an email+purpose and send it. Re-requesting
 * overwrites any existing code and resets the attempt counter, so a user who
 * asks for a new code can always use the latest one.
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
  await redis.set(otpKey(purpose, email), JSON.stringify(record), "EX", CODE_TTL_SECONDS);
  await sendOtpEmail({
    to: email,
    code,
    purpose: purpose === "signup" ? "verify" : "reset",
    ttlMinutes: OTP_TTL_MINUTES,
  });
}

type VerifyResult =
  | { ok: true; signup?: SignupPayload }
  | { ok: false; reason: "expired" | "invalid" | "too_many" };

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
  const raw = await redis.get(key);
  if (!raw) return { ok: false, reason: "expired" };

  const record = JSON.parse(raw) as OtpRecord;
  if (record.attempts >= MAX_ATTEMPTS) {
    await redis.del(key);
    return { ok: false, reason: "too_many" };
  }

  const presented = await sha256(code);
  if (presented !== record.codeHash) {
    record.attempts += 1;
    if (record.attempts >= MAX_ATTEMPTS) {
      await redis.del(key);
      return { ok: false, reason: "too_many" };
    }
    // Preserve the remaining TTL on the record while bumping the attempt count.
    const ttl = await redis.ttl(key);
    await redis.set(key, JSON.stringify(record), "EX", ttl > 0 ? ttl : CODE_TTL_SECONDS);
    return { ok: false, reason: "invalid" };
  }

  await redis.del(key);
  return { ok: true, signup: record.signup };
}

/** Mint a single-use token (after a verified reset OTP) gating the new-password step. */
export async function issueResetToken(email: string): Promise<string> {
  const token = randomId(32);
  await redis.set(resetTokenKey(token), email, "EX", RESET_TOKEN_TTL_SECONDS);
  return token;
}

/** Consume a reset token, returning the email it was issued for (or null). */
export async function consumeResetToken(token: string): Promise<string | null> {
  const key = resetTokenKey(token);
  const email = await redis.get(key);
  if (!email) return null;
  await redis.del(key);
  return email;
}
