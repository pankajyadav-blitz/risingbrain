import { NextResponse } from "next/server";
import { prisma, PublishStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { parseExperiencePayload } from "./_payload";

/**
 * POST /api/interview
 *
 * SUBMITS a new interview experience for review. Anyone with an account can post
 * here, so nothing written through this endpoint is publicly readable on
 * arrival: the row is created PENDING_REVIEW and only an admin acting on
 * `/admin/interview` can move it to PUBLISHED. Auth is required; anonymous
 * callers get a 401. Returns `{ id, status }` so the composer can tell the
 * author their write-up is queued rather than live.
 *
 * Editing and removing an existing one live in `[id]/route.ts`; validation is
 * shared via `_payload.ts` so the two paths enforce identical rules.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = parseExperiencePayload(raw);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: parsed.status });
  }

  // `status` is set explicitly rather than left to the schema default so the
  // review gate is visible at the one place content enters the system.
  const created = await prisma.interviewExperience.create({
    data: { authorId: user.id, ...parsed.data, status: PublishStatus.PENDING_REVIEW },
    select: { id: true, status: true },
  });

  return NextResponse.json({ id: created.id, status: created.status });
}
