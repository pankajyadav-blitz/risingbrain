import { NextResponse } from "next/server";
import { prisma, PublishStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { parseExperiencePayload } from "./_payload";
import { interviewSlug } from "@risingbrain/core/utils";

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
 * ONE OPEN SUBMISSION PER AUTHOR. Someone with a write-up already waiting cannot
 * queue another until that one has been ruled on. The review queue is worked by
 * hand, so an author who posts five drafts in a row isn't five times as likely
 * to be published — they just push everyone else's submission down the list. The
 * existing draft stays fully editable (`PATCH /api/interview/[id]`), which is
 * the answer to "I thought of something else": improve the one in the queue.
 *
 * Editing and removing an existing one live in `[id]/route.ts`; validation is
 * shared via `_payload.ts` so the two paths enforce identical rules.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  // Checked before the body is parsed — it is the cheaper guard, and there is no
  // point validating a write-up that cannot be filed. 409, not 429: this is a
  // conflict with a row that already exists, and it clears when that row is
  // reviewed rather than after a wait.
  const openSubmission = await prisma.interviewExperience.findFirst({
    where: { authorId: user.id, status: PublishStatus.PENDING_REVIEW },
    select: { id: true },
  });
  if (openSubmission) {
    return NextResponse.json(
      {
        error:
          "You already have an experience waiting for review. You can keep editing that one — once a moderator has looked at it, you can post another.",
        pendingId: openSubmission.id,
      },
      { status: 409 },
    );
  }

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

  // The slug is derived from the title, so two posts sharing a title collide on
  // the unique index. That is the only way this can fail, and salting the token
  // resolves it — so retry a bounded number of times rather than rejecting a
  // perfectly valid write-up for having an unoriginal heading.
  let created: { id: string; slug: string; status: PublishStatus } | null = null;
  for (let attempt = 0; attempt < 5 && !created; attempt++) {
    const slug = interviewSlug(parsed.data.title, attempt === 0 ? "" : String(attempt));
    try {
      created = await prisma.interviewExperience.create({
        // `status` is set explicitly rather than left to the schema default so
        // the review gate is visible at the one place content enters the system.
        data: {
          authorId: user.id,
          ...parsed.data,
          slug,
          status: PublishStatus.PENDING_REVIEW,
        },
        select: { id: true, slug: true, status: true },
      });
    } catch (e) {
      // P2002 = unique violation. Anything else is a real failure, not a clash.
      if ((e as { code?: string }).code !== "P2002") throw e;
    }
  }
  if (!created) {
    return NextResponse.json(
      { error: "Could not generate a unique link for that title. Try a small edit to it." },
      { status: 409 },
    );
  }

  return NextResponse.json({ id: created.id, slug: created.slug, status: created.status });
}
