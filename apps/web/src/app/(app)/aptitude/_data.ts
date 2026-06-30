import { cache } from "react";
import { prisma } from "@/lib/db";
import type { AptOption } from "./_components/question-card";

/**
 * Loaders for the parallel-route aptitude workspace.
 *
 * The route is split in two so we NEVER ship every question up front:
 *  - `getAptitudeIndex` — light: category/topic names + question counts only.
 *    Feeds the `@nav` slot and the mobile picker. Wrapped in React `cache()` so
 *    the layout and the slot share a single query per request.
 *  - `getAptitudeTopic` — heavy: ONE topic's questions, fetched per-route when a
 *    topic is navigated to (lazy). Still WITHOUT `answerKey`/`explanation` — the
 *    correct answer only ever lives in `/api/aptitude/check`.
 */

export type AptKind = "APTITUDE" | "LOGICAL_REASONING" | "PUZZLE";

export type AptIndexTopic = { id: string; name: string; total: number };
export type AptIndexCategory = {
  id: string;
  slug: string;
  name: string;
  kind: AptKind;
  topics: AptIndexTopic[];
};

/** Light index — names & counts, no question bodies. Shared per request. */
export const getAptitudeIndex = cache(async () => {
  const categoriesRaw = await prisma.quizCategory.findMany({
    orderBy: { order: "asc" },
    include: {
      topics: {
        orderBy: { order: "asc" },
        select: { id: true, name: true, _count: { select: { questions: true } } },
      },
    },
  });

  const categories: AptIndexCategory[] = categoriesRaw.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    kind: c.kind as AptKind,
    topics: c.topics.map((t) => ({ id: t.id, name: t.name, total: t._count.questions })),
  }));

  const totalTopics = categories.reduce((s, c) => s + c.topics.length, 0);
  const totalQuestions = categories.reduce(
    (s, c) => s + c.topics.reduce((a, t) => a + t.total, 0),
    0
  );

  return { categories, totalTopics, totalQuestions };
});

/** First topic id in display order — `/aptitude` redirects here so the paper is never empty. */
export async function getFirstTopicId(): Promise<string | null> {
  const { categories } = await getAptitudeIndex();
  for (const c of categories) {
    if (c.topics[0]) return c.topics[0].id;
  }
  return null;
}

/** A submitted question's full outcome — only exists once the test is graded. */
export type AptReviewEntry = {
  selectedKey: string;
  isCorrect: boolean;
  awarded: boolean;
  hintUsed: boolean;
  answerKey: string;
  explanation: string | null;
};

export type AptProgressSeed = {
  /** Per-question review, keyed by questionId. Present only for submitted tests. */
  reviewByQuestion: Record<string, AptReviewEntry>;
  /** The stored mark per submitted topic — drives the module progress display. */
  submittedTopics: Record<string, { score: number; total: number }>;
};

/**
 * The signed-in learner's graded state in two queries, seeded once into the
 * client provider by the layout. Rows exist ONLY after a test is submitted, so
 * shipping answer keys/explanations here is fine (the learner has earned them) —
 * and it keeps `[topicId]` cookie-free → fully prefetchable on hover.
 */
export async function getProgressSeed(userId: string): Promise<AptProgressSeed> {
  const [rows, scores] = await Promise.all([
    prisma.userQuizProgress.findMany({
      where: { userId },
      select: {
        questionId: true,
        selectedKey: true,
        isCorrect: true,
        awarded: true,
        hintUsed: true,
        question: { select: { answerKey: true, explanation: true } },
      },
    }),
    prisma.userQuizTopicScore.findMany({
      where: { userId },
      select: { topicId: true, score: true, total: true },
    }),
  ]);

  const reviewByQuestion: Record<string, AptReviewEntry> = {};
  for (const r of rows) {
    reviewByQuestion[r.questionId] = {
      selectedKey: r.selectedKey,
      isCorrect: r.isCorrect,
      awarded: r.awarded,
      hintUsed: r.hintUsed,
      answerKey: r.question.answerKey,
      explanation: r.question.explanation,
    };
  }
  const submittedTopics: Record<string, { score: number; total: number }> = {};
  for (const s of scores) submittedTopics[s.topicId] = { score: s.score, total: s.total };

  return { reviewByQuestion, submittedTopics };
}

export type AptPaperQuestion = {
  id: string;
  prompt: string;
  options: AptOption[];
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  /** Method nudge — safe to ship (never the answer); revealed on demand. */
  hint: string | null;
};

export type AptPaper = {
  topicId: string;
  topicName: string;
  categoryName: string;
  theory: string | null;
  formula: string | null;
  questions: AptPaperQuestion[];
};

/**
 * Per-topic loader — only this topic's questions ship, and NO answer key. It
 * reads no cookies (the user's status dots come from the client provider), so
 * the `[topicId]` segment is statically prefetchable: hovering a nav item fully
 * generates and caches the paper, making the click feel instant.
 */
export const getAptitudeTopic = cache(async (topicId: string): Promise<AptPaper | null> => {
  const topic = await prisma.quizTopic.findUnique({
    where: { id: topicId },
    select: {
      id: true,
      name: true,
      theory: true,
      formula: true,
      category: { select: { name: true } },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, options: true, difficulty: true, hint: true },
      },
    },
  });
  if (!topic) return null;

  return {
    topicId: topic.id,
    topicName: topic.name,
    categoryName: topic.category.name,
    theory: topic.theory,
    formula: topic.formula,
    questions: topic.questions.map((q) => ({
      id: q.id,
      prompt: q.prompt,
      options: (q.options as unknown as AptOption[]) ?? [],
      difficulty: q.difficulty,
      hint: q.hint,
    })),
  };
});
