import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";

/**
 * POST /api/interview/[id]/like
 *
 * Toggles the current user's like on an experience. Non-destructive: unliking
 * flips the like row's `isActive` to false (reused on a re-like) rather than
 * deleting it. Instead of incrementing/decrementing a counter — which drifts
 * under concurrent toggles or the classic check-then-act race — the denormalized
 * `likeCount` is RECOMPUTED authoritatively from the count of active likes inside
 * the transaction, so it can never disagree with the like rows. Returns
 * `{ liked, likeCount }`.
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  const { id: experienceId } = await params;

  const experience = await prisma.interviewExperience.findFirst({
    where: { id: experienceId, status: "PUBLISHED" },
    select: { id: true },
  });
  if (!experience) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const existing = await prisma.interviewLike.findUnique({
    where: { userId_experienceId: { userId: user.id, experienceId } },
    select: { isActive: true },
  });
  const liked = !(existing?.isActive ?? false); // toggling to this state

  const likeCount = await prisma.$transaction(async (tx) => {
    await tx.interviewLike.upsert({
      where: { userId_experienceId: { userId: user.id, experienceId } },
      create: { userId: user.id, experienceId, isActive: liked },
      update: { isActive: liked },
    });
    // Authoritative recount — no drift possible.
    const count = await tx.interviewLike.count({ where: { experienceId, isActive: true } });
    await tx.interviewExperience.update({ where: { id: experienceId }, data: { likeCount: count } });
    return count;
  });

  return NextResponse.json({ liked, likeCount });
}
