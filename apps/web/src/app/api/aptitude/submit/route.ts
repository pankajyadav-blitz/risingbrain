import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";

/**
 * POST /api/aptitude/submit
 *
 * Grades and stores a whole topic's test. The client sends every answered
 * question with its chosen key and whether a hint was opened BEFORE answering.
 * The server is authoritative: it recomputes correctness, applies the scoring
 * rule (a mark is earned only when correct AND no hint was used), and persists:
 *
 *  - one `UserQuizProgress` row per answered question (replaces any prior attempt
 *    for this topic — we wipe the topic's rows first, so re-attempts overwrite),
 *  - a single `UserQuizTopicScore` (the stored "mark", upserted/replaced).
 *
 * It returns the full review payload (answer keys, explanations, hints, per-
 * question outcomes) so the paper can flip into review mode.
 */
type IncomingAnswer = { questionId: string; selectedKey: string; hintUsed: boolean };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to submit." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const { topicId, answers } = (body ?? {}) as { topicId?: unknown; answers?: unknown };
  if (typeof topicId !== "string" || !topicId.trim()) {
    return NextResponse.json({ error: "topicId is required." }, { status: 400 });
  }
  if (!Array.isArray(answers)) {
    return NextResponse.json({ error: "answers must be an array." }, { status: 400 });
  }

  // Normalize + validate incoming answers.
  const incoming = new Map<string, IncomingAnswer>();
  for (const a of answers) {
    const { questionId, selectedKey, hintUsed } = (a ?? {}) as Partial<IncomingAnswer>;
    if (typeof questionId === "string" && typeof selectedKey === "string" && selectedKey) {
      incoming.set(questionId, { questionId, selectedKey, hintUsed: Boolean(hintUsed) });
    }
  }

  // Load the topic's questions (server-side keys). This also scopes grading to
  // questions that actually belong to the topic.
  const questions = await prisma.quizQuestion.findMany({
    where: { topicId },
    orderBy: { order: "asc" },
    select: { id: true, answerKey: true, explanation: true, hint: true },
  });
  if (questions.length === 0) {
    return NextResponse.json({ error: "Topic not found." }, { status: 404 });
  }

  const review = questions.map((q) => {
    const ans = incoming.get(q.id);
    const selectedKey = ans?.selectedKey ?? null;
    const hintUsed = ans?.hintUsed ?? false;
    const isCorrect = selectedKey !== null && selectedKey === q.answerKey;
    const awarded = isCorrect && !hintUsed;
    return {
      questionId: q.id,
      answerKey: q.answerKey,
      explanation: q.explanation ?? undefined,
      hint: q.hint ?? undefined,
      selectedKey,
      isCorrect,
      awarded,
      hintUsed,
    };
  });

  const total = questions.length;
  const score = review.reduce((s, r) => s + (r.awarded ? 1 : 0), 0);

  // Rows only for answered questions (skips don't pollute the heatmap/streak).
  const answeredRows = review
    .filter((r) => r.selectedKey !== null)
    .map((r) => ({
      userId: user.id,
      questionId: r.questionId,
      selectedKey: r.selectedKey as string,
      isCorrect: r.isCorrect,
      hintUsed: r.hintUsed,
      awarded: r.awarded,
    }));

  const topicQuestionIds = questions.map((q) => q.id);

  // Replace this topic's prior attempt atomically.
  await prisma.$transaction([
    prisma.userQuizProgress.deleteMany({
      where: { userId: user.id, questionId: { in: topicQuestionIds } },
    }),
    ...(answeredRows.length
      ? [prisma.userQuizProgress.createMany({ data: answeredRows })]
      : []),
    prisma.userQuizTopicScore.upsert({
      where: { userId_topicId: { userId: user.id, topicId } },
      create: { userId: user.id, topicId, score, total },
      update: { score, total, submittedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ score, total, review });
}
