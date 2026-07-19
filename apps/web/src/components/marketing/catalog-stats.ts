/**
 * The marketing numbers, in one place.
 *
 * These used to be typed separately into `stats.tsx` and the hero's
 * `pattern-recognition.tsx`, which meant the landing page could quote two
 * different figures for the same thing a few hundred pixels apart. Every
 * marketing surface reads from here instead.
 *
 * `problems` and `patterns` describe the seeded DSA catalog. The seed currently
 * holds 496 problems across 85 patterns and 32 topics — so `problems` is the
 * one figure here that is rounded up rather than counted. When the pooler is
 * healthy these should come from `getDsaCatalog()` (cross-request cached via
 * `"use cache"` + `cacheTag`) so they can never drift from the real catalog.
 */
export const CATALOG_STATS = {
  /** Distinct reusable patterns across both sheets. */
  patterns: 85,
  /** Curated problems. Rounded; the seed holds 496. */
  problems: 500,
  /** Topics across both sheets. */
  topics: 32,
} as const;
