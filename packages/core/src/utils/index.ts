/** Format a date as e.g. "Jun 25, 2026". */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

/** Convert arbitrary text into a URL-safe slug. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Narrow an unknown thrown value to a message string. */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Short, stable token derived from a string — FNV-1a (32-bit), base36.
 *
 * Pure and dependency-free so the same value is produced in a seed script, a
 * route handler and the browser. Not a security hash; it exists only to make a
 * human-readable slug unique.
 */
function fnv1aToken(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).padStart(6, "0").slice(-6);
}

/**
 * URL slug for an interview experience: a readable, truncated title plus a short
 * token, e.g. "google-l4-strong-start-fell-short-on-the-dp-round-1f2a9c".
 *
 * DERIVED FROM THE TITLE, deliberately — not from the row id. That is what lets
 * `db:seed-interviews` upsert editorial posts BY SLUG and update the same rows on
 * every run instead of deleting and recreating them (which would cascade away
 * likes, comments and any real user submissions sharing the table).
 *
 * A row's slug is minted once, at creation, and never rewritten — editing a title
 * leaves the URL alone rather than stranding every link that already points at it.
 *
 * `salt` exists for the one case determinism cannot cover: two different posts
 * with the identical title. The caller retries with a salt on a unique violation.
 */
export function interviewSlug(title: string, salt = ""): string {
  const base = slugify(title).slice(0, 60).replace(/-+$/, "") || "interview";
  return `${base}-${fnv1aToken(title + salt)}`;
}
