/**
 * Centralized, validated environment access. Import from here instead of
 * touching process.env directly so a missing var fails loudly and early.
 *
 * `server-only`: this module reads secrets (DB URL, AUTH_SECRET, OAuth + SMTP
 * credentials). The guard makes any accidental import from a Client Component a
 * BUILD error, so credentials can never be bundled to the browser. Modules that
 * broker secrets (redis, oauth, mailer, cookies) import env from here, so they
 * inherit the same protection.
 */
import "server-only";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    // In dev we surface a clear error; never silently fall back for secrets.
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

const APP_URL = optional("APP_URL", "http://localhost:3000");
const isProd = process.env.NODE_ENV === "production";

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),
  AUTH_SECRET: required("AUTH_SECRET"),
  ACCESS_TOKEN_TTL: optional("ACCESS_TOKEN_TTL", "15m"),
  REFRESH_TOKEN_TTL_DAYS: Number(optional("REFRESH_TOKEN_TTL_DAYS", "30")),
  APP_URL,

  /**
   * How many reverse proxies sit in front of the app and append to
   * `X-Forwarded-For`. The client IP is read that many hops from the RIGHT of the
   * chain, because every entry to the left of a trusted hop is attacker-supplied.
   * Default 0 = nothing trusted in front (the container publishes :3000 directly),
   * in which case the header carries no trustworthy IP at all and rate limiting
   * leans on its account-keyed bucket instead. Set this to the real hop count when
   * you put nginx/Cloudflare/ALB in front.
   */
  TRUSTED_PROXY_HOPS: Number(optional("TRUSTED_PROXY_HOPS", "0")) || 0,

  GOOGLE_CLIENT_ID: optional("GOOGLE_CLIENT_ID"),
  GOOGLE_CLIENT_SECRET: optional("GOOGLE_CLIENT_SECRET"),
  GITHUB_CLIENT_ID: optional("GITHUB_CLIENT_ID"),
  GITHUB_CLIENT_SECRET: optional("GITHUB_CLIENT_SECRET"),

  // Gmail SMTP for transactional email (OTP / password reset). Use a Gmail
  // App Password (requires 2-Step Verification), NOT the account password.
  GMAIL_USER: optional("GMAIL_USER"),
  GMAIL_APP_PASSWORD: optional("GMAIL_APP_PASSWORD"),
  // Optional friendly From header; falls back to GMAIL_USER.
  MAIL_FROM: optional("MAIL_FROM"),

  isProd,

  /**
   * Whether auth cookies get the `Secure` flag (HTTPS-only). True when running
   * as a production build OR when APP_URL is HTTPS — so cookies are Secure on any
   * real deployment even if NODE_ENV is somehow unset, while local development
   * over http://localhost stays non-secure (so login works there). A leftover
   * http:// APP_URL in production would drop Secure, so keep APP_URL = https://.
   */
  secureCookies: isProd || APP_URL.startsWith("https://"),
};

export { COOKIES } from "./auth/constants";
