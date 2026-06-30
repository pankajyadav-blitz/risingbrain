import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

export const runtime = "nodejs";

/**
 * POST /api/interview/[id]/like
 *
 * Toggles the current user's like on an experience. The like row and the
 * denormalized `likeCount` move together inside a transaction so the counter
 * never drifts. Returns `{ liked, likeCount }`.
 */
export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: experienceId } = await params;

  const experience = await prisma.interviewExperience.findFirst({
    where: { id: experienceId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!experience) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.interviewLike.findUnique({
    where: { userId_experienceId: { userId: user.id, experienceId } },
    select: { id: true },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.interviewLike.delete({ where: { id: existing.id } }),
      prisma.interviewExperience.update({
        where: { id: experienceId },
        data: { likeCount: { decrement: 1 } },
        select: { likeCount: true },
      }),
    ]);
    return NextResponse.json({ liked: false, likeCount: Math.max(0, updated.likeCount) });
  }

  const [, updated] = await prisma.$transaction([
    prisma.interviewLike.create({ data: { userId: user.id, experienceId } }),
    prisma.interviewExperience.update({
      where: { id: experienceId },
      data: { likeCount: { increment: 1 } },
      select: { likeCount: true },
    }),
  ]);
  return NextResponse.json({ liked: true, likeCount: updated.likeCount });
}
