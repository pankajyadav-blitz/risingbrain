import { NextResponse } from "next/server";
import { prisma, PublishStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { markdownToHtml } from "@/lib/html-to-markdown";
import { parseExperiencePayload } from "../_payload";

/**
 * Owner-only operations on one interview experience.
 *
 *   GET    -> the editable representation (body converted back to HTML)
 *   PATCH  -> update it (and send it back through review)
 *   DELETE -> archive it
 *
 * Authorship is re-checked against the database on every call. The UI only shows
 * these controls to the author, but that is a convenience, not a control: the
 * endpoint is the boundary, and it must assume the caller crafted the request by
 * hand. A missing row and a row belonging to someone else deliberately return the
 * SAME 404 — a distinct 403 would confirm that a given id exists.
 */

/** Loads the row only if the caller wrote it. */
async function loadOwned(id: string, userId: string) {
  const exp = await prisma.interviewExperience.findUnique({
    where: { id },
    select: {
      id: true,
      authorId: true,
      status: true,
      company: true,
      role: true,
      verdict: true,
      difficulty: true,
      roundsCount: true,
      title: true,
      excerpt: true,
      body: true,
      tags: true,
    },
  });
  // ARCHIVED is the one state the author can no longer touch — it is the
  // tombstone left by a delete. PENDING_REVIEW and REJECTED are editable on
  // purpose: that is how an author answers a moderator's note and resubmits.
  if (!exp || exp.authorId !== userId || exp.status === PublishStatus.ARCHIVED) return null;
  return exp;
}

const notFound = () =>
  NextResponse.json({ error: "Experience not found." }, { status: 404 });

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const exp = await loadOwned(id, user.id);
  if (!exp) return notFound();

  // Stored as markdown, edited as HTML — see `markdownToHtml` for why this uses
  // the reader's own pipeline rather than a second markdown implementation.
  const bodyHtml = await markdownToHtml(exp.body);

  return NextResponse.json({
    id: exp.id,
    company: exp.company,
    role: exp.role,
    verdict: exp.verdict,
    difficulty: exp.difficulty,
    roundsCount: exp.roundsCount,
    title: exp.title,
    excerpt: exp.excerpt ?? "",
    tags: exp.tags,
    bodyHtml,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  const { id } = await params;
  const exp = await loadOwned(id, user.id);
  if (!exp) return notFound();

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

  // `authorId` is not writable — an edit must not be able to reassign a post.
  // `status` IS written, but only ever back to PENDING_REVIEW: an approval
  // applies to the words a moderator actually read, so re-writing the body puts
  // the post back in the queue. Without this, "submit something innocuous, wait
  // for the approval, then swap in the real payload" would walk straight past
  // the review layer. The old review note is cleared with it so the author is
  // not left reading feedback about a version that no longer exists.
  await prisma.interviewExperience.update({
    where: { id: exp.id },
    data: {
      ...parsed.data,
      status: PublishStatus.PENDING_REVIEW,
      reviewedAt: null,
      reviewedById: null,
      reviewNote: null,
    },
  });

  return NextResponse.json({ id: exp.id, status: PublishStatus.PENDING_REVIEW });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  const { id } = await params;
  const exp = await loadOwned(id, user.id);
  if (!exp) return notFound();

  // Archive rather than delete. Every read path already filters on
  // `status: "PUBLISHED"`, so this removes the post from the feed, the detail
  // page and search immediately — while keeping the row, and with it the replies
  // other people wrote underneath it, which a cascading delete would destroy.
  // It also means an accidental removal is recoverable.
  await prisma.interviewExperience.update({
    where: { id: exp.id },
    data: { status: PublishStatus.ARCHIVED },
  });

  return NextResponse.json({ ok: true });
}
