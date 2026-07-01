/**
 * Cache tags for the shared, seeded content catalogs. These are the only data
 * sets safe to cache across users (identical for everyone, change only on a
 * re-seed). Per-user data — progress, bookmarks, notes, streaks, profiles — is
 * NEVER cached and is read dynamically per request.
 *
 * A `use cache` fetcher tags its result with one of these; the admin revalidate
 * route (`/api/admin/revalidate`) busts a tag on demand after re-seeding, and a
 * `cacheLife` window refreshes it automatically as a safety net.
 */
export const CACHE_TAGS = {
  dsaCatalog: "dsa-catalog",
  quizCatalog: "quiz-catalog",
  sqlCatalog: "sql-catalog",
} as const;

export type CacheTag = (typeof CACHE_TAGS)[keyof typeof CACHE_TAGS];

/** The set of tags the admin revalidate route is allowed to bust. */
export const REVALIDATABLE_TAGS: ReadonlySet<string> = new Set(Object.values(CACHE_TAGS));
