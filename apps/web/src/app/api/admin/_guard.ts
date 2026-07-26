/**
 * Shared guards for the ADMIN content-management write routes
 * (`/api/admin/dsa|domain|quiz/*`). Keeps every handler's auth + rate-limit +
 * Prisma-error mapping identical. Mirrors the sheet write-route template
 * (`api/sheet/progress/route.ts`) plus the admin gate from
 * `api/admin/revalidate/route.ts` — API routes are NOT covered by the edge proxy
 * (its matcher excludes `/api`), so each admin route MUST self-gate here.
 */
import { NextResponse } from "next/server";
import type { ZodType } from "zod";
import { getCurrentUser, type CurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";

/** 401/403/429 short-circuit, or the authenticated admin user to proceed with. */
export type AdminGuard = { user: CurrentUser; error?: never } | { user?: never; error: NextResponse };

/**
 * Gate an admin write: signed in (else 401) → role ADMIN (else 403) → within the
 * shared write budget (else 429). Returns `{ user }` to proceed or `{ error }`
 * to return immediately.
 */
export async function requireAdmin(req: Request): Promise<AdminGuard> {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  if (user.role !== "ADMIN") return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return { error: limited };

  return { user };
}

/** True for a Prisma error carrying the given `code` (e.g. "P2002"). */
function hasCode(e: unknown, code: string): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && (e as { code?: unknown }).code === code
  );
}

/**
 * Map a Prisma write failure to a client-facing response instead of a bare 500:
 *   P2002 unique-constraint (duplicate slug) → 400
 *   P2003 foreign-key (unknown parent id)    → 400
 *   P2025 record-not-found (bad id on update/delete) → 404
 * Anything else is a genuine server error → logged + 500.
 */
export function writeErrorResponse(e: unknown, context: string): NextResponse {
  if (hasCode(e, "P2002")) {
    return NextResponse.json({ error: "That slug/name is already taken." }, { status: 400 });
  }
  if (hasCode(e, "P2003")) {
    return NextResponse.json({ error: "Unknown parent reference." }, { status: 400 });
  }
  if (hasCode(e, "P2025")) {
    return NextResponse.json({ error: "Record not found." }, { status: 404 });
  }
  console.error(`admin ${context} write failed`, e);
  return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
}

/**
 * Read + validate a JSON body against a Zod schema. Returns the typed `data` to
 * proceed, or a ready 400 (invalid JSON or the first validation message).
 */
export async function parse<T>(
  req: Request,
  schema: ZodType<T>,
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return { error: NextResponse.json({ error: "Invalid JSON" }, { status: 400 }) };
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues[0]?.message ?? "Invalid payload";
    return { error: NextResponse.json({ error: message }, { status: 400 }) };
  }
  return { data: result.data };
}
