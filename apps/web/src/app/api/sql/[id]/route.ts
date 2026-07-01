import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Public, lazy-load endpoint for a single SQL problem's heavy content.
 * The /sql page SSR-renders only the light list (title/difficulty/topic/tags);
 * each card fetches this on hover to reveal the description, approach & query.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const problem = await prisma.sqlProblem.findFirst({
    where: { id, isPublished: true },
    select: { description: true, bestApproach: true, solutionQuery: true },
  });

  if (!problem) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(problem);
}
