import { NextResponse } from "next/server";
import { prisma, FeedbackStatus } from "@/lib/db";
import { requireAdmin, parse, writeErrorResponse } from "../_guard";
import { feedbackReview, idPayload } from "@/lib/admin/schemas";

/**
 * Admin actions on one piece of user feedback.
 *
 *   PATCH  { id, action: "view" | "unview" }  -> mark it read / put it back
 *   DELETE { id }                             -> erase it
 *
 * Marking read is not cosmetic: a user may only hold FEEDBACK_PENDING_LIMIT
 * UNREAD notes (see `lib/feedback.ts`), so this route is also what releases
 * their quota. Deleting releases it too — the count only ever looks at rows that
 * still exist and are still NEW.
 *
 * Reads are ATTRIBUTED (`reviewedById` / `reviewedAt`) for the same reason
 * interview rulings are: "who saw this and when" is the question asked later.
 */

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, feedbackReview);
  if (parsed.error) return parsed.error;
  const { id, action } = parsed.data;

  const data =
    action === "view"
      ? {
          status: FeedbackStatus.VIEWED,
          reviewedById: guard.user.id,
          reviewedAt: new Date(),
        }
      : // "unview" — back into the inbox. The trail is cleared with it: it
        // described a read that is being taken back.
        { status: FeedbackStatus.NEW, reviewedById: null, reviewedAt: null };

  try {
    const updated = await prisma.feedback.update({
      where: { id },
      data,
      select: { id: true, status: true, reviewedAt: true },
    });
    return NextResponse.json({ ok: true, feedback: updated });
  } catch (e) {
    return writeErrorResponse(e, "feedback-review");
  }
}

/**
 * DELETE /api/admin/feedback  { id }
 *
 * Feedback has no archive state on purpose — it is a short note, not a
 * publication, and the useful lifecycle is "read it, act on it, clear it out".
 * This is how the table stays small.
 */
export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.feedback.delete({ where: { id: parsed.data.id } });
    return NextResponse.json({ ok: true, deleted: parsed.data.id });
  } catch (e) {
    return writeErrorResponse(e, "feedback-delete");
  }
}
