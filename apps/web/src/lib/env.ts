/**
 * Centralized, validated environment access. Import from here instead of
 * touching process.env directly so a missing var fails loudly and early.
 */

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

export const env = {
  DATABASE_URL: required("DATABASE_URL"),
  REDIS_URL: optional("REDIS_URL", "redis://localhost:6379"),
  AUTH_SECRET: required("AUTH_SECRET"),
  ACCESS_TOKEN_TTL: optional("ACCESS_TOKEN_TTL", "15m"),
  REFRESH_TOKEN_TTL_DAYS: Number(optional("REFRESH_TOKEN_TTL_DAYS", "30")),
  APP_URL: optional("APP_URL", "http://localhost:3000"),

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

  isProd: process.env.NODE_ENV === "production",
};

export { COOKIES } from "./auth/constants";
