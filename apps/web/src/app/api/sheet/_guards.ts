/**
 * Shared guards for the sheet write routes (bookmark / progress / notes). Keeps
 * the per-route handlers free of duplicated rate-limit and error-mapping
 * boilerplate. `checkWriteLimit` now lives in `@/lib/auth/rate-limit` so the
 * interview and aptitude routes share the exact same throttle; re-exported here
 * for the existing sheet-route imports.
 */
export { checkWriteLimit } from "@/lib/auth/rate-limit";

/** True for a Prisma error with the given code. */
function hasCode(e: unknown, code: string): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === code
  );
}

/**
 * True for a Prisma foreign-key violation (P2003) — e.g. an upsert against a
 * `problemId` that doesn't exist. Lets routes return a 400 instead of letting
 * the error surface as an unhandled 500.
 */
export function isUnknownReference(e: unknown): boolean {
  return hasCode(e, "P2003");
}

/**
 * True for a Prisma unique-constraint violation (P2002). Prisma's `upsert` is
 * find-then-create under the hood, so two concurrent first-writes to the same
 * `(userId, problemId)` row can both miss and race to insert — the loser throws
 * P2002. Routes catch this and retry as a plain update (the row now exists).
 */
export function isConflict(e: unknown): boolean {
  return hasCode(e, "P2002");
}
