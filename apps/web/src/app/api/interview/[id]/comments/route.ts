import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { timeAgo } from "@/app/(app)/interview/_lib/format";
import type { CommentItem } from "@/app/(app)/interview/_lib/types";

/**
 * GET /api/interview/[id]/comments  (public)
 *
 * Lists the comments on an experience, oldest first, with author identity.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: experienceId } = await params;

  const rows = await prisma.interviewComment.findMany({
    where: { experienceId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  const comments: CommentItem[] = rows.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    createdAtLabel: timeAgo(c.createdAt),
    author: { name: c.author.name, image: c.author.image },
  }));

  return NextResponse.json({ comments });
}

/**
 * POST /api/interview/[id]/comments  { body }
 *
 * Adds a comment. Auth required (401 otherwise). Returns the created comment
 * with its author so the client can append it without a refetch.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  const { id: experienceId } = await params;

  let raw: { body?: unknown };
  try {
    raw = (await req.json()) as { body?: unknown };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const body = typeof raw.body === "string" ? raw.body.trim() : "";
  if (!body) return NextResponse.json({ error: "Comment cannot be empty." }, { status: 400 });

  const experience = await prisma.interviewExperience.findFirst({
    where: { id: experienceId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!experience) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const created = await prisma.interviewComment.create({
    data: { experienceId, authorId: user.id, body: body.slice(0, 4000) },
    select: {
      id: true,
      body: true,
      createdAt: true,
      author: { select: { name: true, image: true } },
    },
  });

  const comment: CommentItem = {
    id: created.id,
    body: created.body,
    createdAt: created.createdAt.toISOString(),
    createdAtLabel: timeAgo(created.createdAt),
    author: { name: created.author.name, image: created.author.image },
  };

  return NextResponse.json({ comment });
}
