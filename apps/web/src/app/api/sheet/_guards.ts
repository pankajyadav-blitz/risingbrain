import { NextResponse } from "next/server";
import { clientId, limitWrite } from "@/lib/auth/rate-limit";

/**
 * Shared guards for the sheet write routes (bookmark / progress / notes). Keeps
 * the per-route handlers free of duplicated rate-limit and error-mapping
 * boilerplate.
 */

/**
 * Per-user write throttle for sheet mutations (30/min, see rate-limit.ts).
 * Returns a ready-to-send 429 response when the caller is over budget, or
 * `null` to proceed. Fails open if Redis is unavailable.
 */
export async function checkWriteLimit(req: Request, userId: string): Promise<NextResponse | null> {
  const rl = await limitWrite(clientId(req, userId));
  if (rl.ok) return null;
  return NextResponse.json(
    { error: "Too many requests. Slow down." },
    { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 60) } }
  );
}

/**
 * True for a Prisma foreign-key violation (P2003) — e.g. an upsert against a
 * `problemId` that doesn't exist. Lets routes return a 400 instead of letting
 * the error surface as an unhandled 500.
 */
export function isUnknownReference(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2003"
  );
}
