import { NextResponse } from "next/server";
import { prisma, PublishStatus } from "@/lib/db";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { requireAdmin, parse, writeErrorResponse } from "../_guard";
import { interviewReview, idPayload } from "@/lib/admin/schemas";

/**
 * Moderation actions on a submitted interview experience.
 *
 *   PATCH  { id, action, note? }  -> rule on one submission
 *   DELETE { id }                 -> erase it permanently
 *
 * `/interview` is open to anyone with an account, so every write-up arrives
 * PENDING_REVIEW (see `POST /api/interview`) and only this route can put one on
 * the public feed. It is the enforcement point for that gate: the queue UI at
 * `/admin/interview` is just a caller, and `requireAdmin` re-checks the role on
 * every request rather than trusting that the page was reachable.
 *
 * Rulings are ATTRIBUTED — `reviewedById` / `reviewedAt` record who decided and
 * when, so a contested approval can be traced to a person.
 */

/** Fields the queue needs back after a ruling, to patch its row in place. */
const REVIEWED_SELECT = {
  id: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
} as const;

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, interviewReview);
  if (parsed.error) return parsed.error;
  const { id, action, note } = parsed.data;

  const experience = await prisma.interviewExperience.findUnique({
    where: { id },
    select: { id: true, authorId: true, author: { select: { role: true, disabledAt: true } } },
  });
  if (!experience) {
    return NextResponse.json({ error: "Experience not found." }, { status: 404 });
  }

  // Every ruling stamps the same trail, so the four branches below only differ
  // in the status they land on and whether they carry a note.
  const review = { reviewedById: guard.user.id, reviewedAt: new Date() };

  try {
    if (action === "block_author") {
      if (experience.authorId === guard.user.id) {
        return NextResponse.json({ error: "You can't block your own account." }, { status: 400 });
      }
      // Admin accounts are out of scope here on purpose: taking an admin offline
      // is a role decision, not a moderation one, and belongs on /admin/users
      // where the self-lockout rules already live.
      if (experience.author.role === "ADMIN") {
        return NextResponse.json(
          { error: "Admin accounts can only be disabled from Users." },
          { status: 400 },
        );
      }

      const reason = note?.trim() || "Account blocked by a moderator.";

      const [, rejected] = await prisma.$transaction([
        prisma.user.update({
          where: { id: experience.authorId },
          data: { disabledAt: new Date() },
        }),
        // Clear what they have waiting in the queue. Their already-PUBLISHED
        // posts are deliberately left alone — blocking an account is about the
        // person, and archiving work that was reviewed and approved is a
        // separate call an admin makes per post.
        prisma.interviewExperience.updateMany({
          where: { authorId: experience.authorId, status: PublishStatus.PENDING_REVIEW },
          data: { status: PublishStatus.REJECTED, reviewNote: reason, ...review },
        }),
      ]);

      // The disable only bites once their live sessions are gone — the access
      // token otherwise stays valid for the rest of its 15-min lifetime.
      await revokeAllUserSessions(experience.authorId);

      return NextResponse.json({ ok: true, blocked: true, rejectedCount: rejected.count });
    }

    const data =
      action === "publish"
        ? { status: PublishStatus.PUBLISHED, reviewNote: null, ...review }
        : action === "reject"
          ? { status: PublishStatus.REJECTED, reviewNote: note ?? null, ...review }
          : action === "archive"
            ? { status: PublishStatus.ARCHIVED, ...review }
            : // "unpublish" — back into the queue for a second look. The note is
              // cleared with it: it described the previous ruling.
              { status: PublishStatus.PENDING_REVIEW, reviewNote: null, ...review };

    const updated = await prisma.interviewExperience.update({
      where: { id },
      data,
      select: REVIEWED_SELECT,
    });

    return NextResponse.json({ ok: true, experience: updated });
  } catch (e) {
    return writeErrorResponse(e, "interview-review");
  }
}

/**
 * DELETE /api/admin/interview  { id }
 *
 * Erases the row for good, and with it (via `onDelete: Cascade`) every like and
 * comment underneath it. This is the outlet for content that must not merely
 * leave the feed — spam, abuse, personal data — where the ARCHIVED tombstone an
 * author's own delete leaves behind would be the wrong answer. For anything
 * recoverable, `action: "archive"` is the softer option.
 */
export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.interviewExperience.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true, deleted: parsed.data.id });
  } catch (e) {
    return writeErrorResponse(e, "interview-delete");
  }
}
