import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getCurrentUser } from "@/lib/auth/current-user";
import { REVALIDATABLE_TAGS } from "@/lib/cache";

/**
 * POST /api/admin/revalidate  { tag }
 *
 * Busts a content-catalog cache tag on demand — call this after re-seeding so
 * the new catalog shows immediately instead of waiting for the cacheLife window
 * to expire. ADMIN only. Allowed tags are restricted to the known catalogs.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { tag?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tag = typeof body.tag === "string" ? body.tag : "";
  if (!REVALIDATABLE_TAGS.has(tag)) {
    return NextResponse.json({ error: "Unknown tag" }, { status: 400 });
  }

  // `{ expire: 0 }` expires the tag immediately so the next request refetches
  // the freshly re-seeded catalog (vs "max" stale-while-revalidate). This route
  // is the explicit post-seed trigger, so immediate freshness is what we want.
  revalidateTag(tag, { expire: 0 });
  return NextResponse.json({ ok: true, revalidated: tag });
}
