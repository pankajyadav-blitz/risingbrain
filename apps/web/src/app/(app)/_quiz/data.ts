import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import type { AptOption } from "./components/question-card";

/**
 * Loaders for the parallel-route quiz workspace, SHARED by two routes:
 *   /screening -> kinds APTITUDE + LOGICAL_REASONING
 *   /puzzles   -> kind  PUZZLE
 *
 * Both render the identical paper UI over the identical tables; only the set of
 * QuizCategory kinds differs. `kinds` is therefore an argument rather than a
 * constant — and because these are `"use cache"` functions, it also becomes part
 * of the cache key, so the two routes never serve each other's index.
 *
 * The route is split in two so we NEVER ship every question up front:
 *  - `getAptitudeIndex` — light: category/topic names + question counts only.
 *    Feeds the `@nav` slot and the mobile picker.
 *  - `getAptitudeTopic` — heavy: ONE topic's questions, fetched per-route when a
 *    topic is navigated to (lazy). Still WITHOUT `answerKey`/`explanation` —
 *    grading happens server-side in `/api/screening/submit`, so a key only ever
 *    reaches the client in the review payload of a test already submitted.
 *
 * Both are SHARED, seeded, cookie-free content (identical for everyone, changes
 * only on a re-seed), so — like the DSA/SQL catalogs — they use `"use cache"`
 * with the `quizCatalog` tag for cross-request caching + on-demand revalidation
 * (see /api/admin/revalidate). Per-user graded state comes from `getProgressSeed`
 * below, which is deliberately NOT cached.
 */

export type AptKind = "APTITUDE" | "LOGICAL_REASONING" | "PUZZLE";

export type AptIndexTopic = { id: string; slug: string; name: string; total: number };
export type AptIndexCategory = {
  id: string;
  slug: string;
  name: string;
  kind: AptKind;
  topics: AptIndexTopic[];
};

/** Light index — names & counts, no question bodies. Cached cross-request. */
export async function getQuizIndex(kinds: AptKind[]) {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.quizCatalog);

  const categoriesRaw = await prisma.quizCategory.findMany({
    where: { kind: { in: kinds } },
    orderBy: { order: "asc" },
    include: {
      topics: {
        orderBy: { order: "asc" },
        select: { id: true, slug: true, name: true, _count: { select: { questions: true } } },
      },
    },
  });

  const categories: AptIndexCategory[] = categoriesRaw.map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name,
    kind: c.kind as AptKind,
    // Both id and slug ride along: the slug is the URL segment, the id is what
    // the progress provider keys scores by.
    topics: c.topics.map((t) => ({
      id: t.id,
      slug: t.slug,
      name: t.name,
      total: t._count.questions,
    })),
  }));

  const totalTopics = categories.reduce((s, c) => s + c.topics.length, 0);
  const totalQuestions = categories.reduce(
    (s, c) => s + c.topics.reduce((a, t) => a + t.total, 0),
    0
  );

  return { categories, totalTopics, totalQuestions };
}

/** First topic slug in display order — the route index redirects here so the paper is never empty. */
export async function getFirstTopicSlug(kinds: AptKind[]): Promise<string | null> {
  const { categories } = await getQuizIndex(kinds);
  for (const c of categories) {
    if (c.topics[0]) return c.topics[0].slug;
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
      where: { userId, isActive: true },
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
  /** Primary key — what `/api/screening/submit` grades against, NOT the URL. */
  topicId: string;
  /** URL segment for this topic; used to canonicalise a legacy /<id> link. */
  topicSlug: string;
  topicName: string;
  categoryName: string;
  /** Which route owns this topic — lets a page redirect a foreign topic id. */
  kind: AptKind;
  theory: string | null;
  formula: string | null;
  questions: AptPaperQuestion[];
};

/**
 * Per-topic loader — only this topic's questions ship, and NO answer key. It
 * reads no cookies (the user's status dots come from the client provider), so
 * the `[slug]` segment is statically prefetchable: hovering a nav item fully
 * generates and caches the paper, making the click feel instant.
 *
 * Keyed by `slug`, which is globally unique across every category — so the two
 * routes that share this table (/screening, /puzzles) can each resolve a topic
 * from its URL segment alone, and a slug that belongs to the sibling route still
 * resolves here (the page then redirects it — see routes.ts).
 */
export async function getQuizTopicBySlug(slug: string): Promise<AptPaper | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.quizCatalog);

  const topic = await prisma.quizTopic.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
      theory: true,
      formula: true,
      category: { select: { name: true, kind: true } },
      questions: {
        orderBy: { order: "asc" },
        select: { id: true, prompt: true, options: true, difficulty: true, hint: true },
      },
    },
  });
  if (!topic) return null;

  return {
    topicId: topic.id,
    topicSlug: topic.slug,
    topicName: topic.name,
    categoryName: topic.category.name,
    kind: topic.category.kind as AptKind,
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
}

/**
 * Resolve a legacy `/screening/<cuid>` or `/puzzles/<cuid>` link to its slug.
 *
 * Topic URLs carried the primary key before slugs; bookmarks and shared links
 * from that era still arrive. The paper pages fall back to this when a segment
 * matches no slug, and redirect to the canonical URL rather than 404ing.
 */
export async function getTopicSlugById(id: string): Promise<string | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.quizCatalog);

  const t = await prisma.quizTopic.findUnique({ where: { id }, select: { slug: true } });
  return t?.slug ?? null;
}
