import { NextResponse } from "next/server";
import { prisma, FeedbackStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { sanitizeRichText } from "@/lib/sanitize";
import { htmlToMarkdown, containsHtmlMarkup } from "@/lib/html-to-markdown";
import {
  FEEDBACK_LIMIT_MESSAGE,
  FEEDBACK_MAX_CHARS,
  FEEDBACK_MAX_RATING,
  FEEDBACK_MIN_RATING,
  FEEDBACK_PENDING_LIMIT,
  type FeedbackQuota,
} from "@/lib/feedback";

/**
 * The floating feedback widget's endpoint.
 *
 *   GET   -> the caller's quota, so the widget can warn BEFORE they write
 *   POST  { body } -> file one piece of feedback
 *
 * Auth is required on both: feedback is attributed, and an anonymous firehose is
 * exactly what the quota below exists to prevent.
 *
 * The quota is "at most FEEDBACK_PENDING_LIMIT UNREAD notes per account". It is
 * released by an admin reading (or deleting) them on `/admin/feedback`, not by
 * the clock — see `lib/feedback.ts` for why. `checkWriteLimit` still applies on
 * top as the ordinary per-minute flood guard.
 */

/**
 * The two counts the widget runs on: how many unread notes this user has open
 * (what the quota bounds) and whether they have ever sent one at all (what
 * decides if the one-time nudge may appear). Both in a single round trip.
 */
async function readCounts(userId: string): Promise<{ pending: number; total: number }> {
  const [pending, total] = await Promise.all([
    prisma.feedback.count({ where: { userId, status: FeedbackStatus.NEW } }),
    prisma.feedback.count({ where: { userId } }),
  ]);
  return { pending, total };
}

const quota = (pending: number, hasEverSent: boolean): FeedbackQuota => ({
  pending,
  remaining: Math.max(0, FEEDBACK_PENDING_LIMIT - pending),
  limit: FEEDBACK_PENDING_LIMIT,
  hasEverSent,
});

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { pending, total } = await readCounts(user.id);
  return NextResponse.json(quota(pending, total > 0));
}

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

  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  // Optional by design: a bug report has nothing to score, and the nudge can be
  // answered with a star before a word is typed. Anything outside 1–5 is a
  // malformed client, not a rating, so it is rejected rather than clamped.
  const rating = raw.rating === undefined || raw.rating === null ? null : Number(raw.rating);
  if (
    rating !== null &&
    (!Number.isInteger(rating) || rating < FEEDBACK_MIN_RATING || rating > FEEDBACK_MAX_RATING)
  ) {
    return NextResponse.json({ error: "Invalid rating." }, { status: 400 });
  }
  if (body.length > FEEDBACK_MAX_CHARS) {
    return NextResponse.json({ error: "That feedback is too long." }, { status: 413 });
  }

  // The widget submits the editor's HTML — strip the tags to confirm it actually
  // carries words, so an empty "<p></p>" can't be filed as feedback.
  const text = body.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();
  // A lone star IS feedback ("this page is a 2/5" is a signal), so the body is
  // only required when no rating came with it. What is refused is an empty
  // submission of both.
  if (!text && rating === null) {
    return NextResponse.json({ error: "Leave a rating or write something first." }, { status: 400 });
  }

  // Re-checked here, not just in the UI: the widget's warning is ergonomics and
  // this is the enforcement point. 429 (not 403) because it IS a rate limit —
  // the same request succeeds later, once the queue has been read.
  const { pending, total } = await readCounts(user.id);
  if (pending >= FEEDBACK_PENDING_LIMIT) {
    return NextResponse.json(
      { error: FEEDBACK_LIMIT_MESSAGE, ...quota(pending, total > 0) },
      { status: 429 },
    );
  }

  // Sanitize while it is still HTML — that is where scripts, event handlers and
  // `javascript:` URLs live — then convert, so the column holds markdown like
  // every other user-authored body in the app (see `api/interview/_payload.ts`).
  const markdown = text
    ? containsHtmlMarkup(body)
      ? htmlToMarkdown(sanitizeRichText(body))
      : body
    : "";

  const created = await prisma.feedback.create({
    data: { userId: user.id, body: markdown, rating },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id, ...quota(pending + 1, true) });
}
