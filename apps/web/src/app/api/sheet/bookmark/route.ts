import { NextResponse } from "next/server";
import { prisma, ProblemStatus } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit, isConflict, isUnknownReference } from "../_guards";

/**
 * POST /api/sheet/bookmark  { problemId, bookmarked }
 *
 * Saves/unsaves a problem for the current user. Reuses the same
 * UserProblemProgress row (unique on userId+problemId) — a fresh row is created
 * with status NOT_STARTED, an existing row just flips isBookmarked.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  let body: { problemId?: unknown; bookmarked?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const problemId = typeof body.problemId === "string" ? body.problemId : "";
  if (!problemId || typeof body.bookmarked !== "boolean") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const bookmarked = body.bookmarked;

  try {
    try {
      await prisma.userProblemProgress.upsert({
        where: { userId_problemId: { userId: user.id, problemId } },
        create: {
          userId: user.id,
          problemId,
          status: ProblemStatus.NOT_STARTED,
          isBookmarked: bookmarked,
        },
        update: { isBookmarked: bookmarked },
      });
    } catch (e) {
      // Concurrent first-insert lost the race — the row exists now, so update
      // only our field (never clobber a solve status set by the other writer).
      if (!isConflict(e)) throw e;
      await prisma.userProblemProgress.update({
        where: { userId_problemId: { userId: user.id, problemId } },
        data: { isBookmarked: bookmarked },
      });
    }
  } catch (e) {
    // Unknown problemId → FK violation. Treat as a bad request, not a 500.
    if (isUnknownReference(e)) {
      return NextResponse.json({ error: "Unknown problem" }, { status: 400 });
    }
    console.error("sheet/bookmark upsert failed", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, bookmarked });
}
