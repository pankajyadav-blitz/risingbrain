import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { checkWriteLimit } from "@/lib/auth/rate-limit";

/**
 * POST /api/screening/check
 *
 * Live per-answer validation for the test UI. The page ships questions WITHOUT
 * their answer key, so this is the only way the client learns whether a chosen
 * option is right — but it returns ONLY a boolean, never the correct key or the
 * explanation (those stay hidden until the whole test is submitted). It also
 * persists NOTHING: the score is computed and stored authoritatively by
 * `/api/screening/submit` when the learner submits the paper.
 */
export async function POST(request: Request) {
  // Public + DB-hitting: throttle by IP so it can't be used to hammer Postgres
  // or rapidly brute-force an answer key one option at a time.
  const limited = await checkWriteLimit(request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { questionId, selectedKey } = (body ?? {}) as {
    questionId?: unknown;
    selectedKey?: unknown;
  };

  if (typeof questionId !== "string" || !questionId.trim()) {
    return NextResponse.json({ error: "questionId is required." }, { status: 400 });
  }
  if (typeof selectedKey !== "string" || !selectedKey.trim()) {
    return NextResponse.json({ error: "selectedKey is required." }, { status: 400 });
  }

  const question = await prisma.quizQuestion.findUnique({
    where: { id: questionId },
    select: { answerKey: true },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found." }, { status: 404 });
  }

  return NextResponse.json({ correct: selectedKey === question.answerKey });
}
