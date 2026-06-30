/**
 * Pure auth constants — safe to import from the edge middleware (no env access,
 * no Node-only modules). See docs/ARCHITECTURE.md §1.
 */

export const COOKIES = {
  /** Short-lived access JWT, sent on every request. */
  ACCESS: "rb_at",
  /** Long-lived rotating refresh token. */
  REFRESH: "rb_rt",
} as const;

/** Access-token lifetime in seconds (15 minutes). */
export const ACCESS_TTL_SECONDS = 15 * 60;

/** Refresh-token lifetime in seconds (30 days). */
export const REFRESH_TTL_SECONDS = 30 * 24 * 60 * 60;

/**
 * Path the refresh cookie is scoped to. Site-wide ("/") so the edge proxy can
 * detect a recoverable session on an expired access token and silently refresh
 * instead of logging the user out. It stays HttpOnly + SameSite=Strict + Secure,
 * so it is never exposed to JS nor sent on cross-site requests (CSRF-safe).
 */
export const REFRESH_COOKIE_PATH = "/";

export type AppRole = "NORMAL" | "STUDENT" | "SUBSCRIBER" | "ADMIN";

/** Claims carried by the access token. */
export interface AccessClaims {
  sub: string; // user id
  role: AppRole;
  sid: string; // session id
}
