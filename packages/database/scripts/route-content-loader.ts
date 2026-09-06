/**
 * Loaders for the three slug-routed content sections: Domain, the quiz bank that
 * backs Screening + Puzzles, and Interview experiences.
 *
 * Extracted so the full `db:seed` and the scoped `db:reseed-routes` run the SAME
 * code — the same reason `domain-loader.ts` exists. A copy in each would drift,
 * and these functions decide what every public URL under /domain, /screening,
 * /puzzles and /interview looks like.
 *
 * Each one is DELETE-AND-RELOAD within its own tables and touches nothing else:
 * DSA sheets, companies, courses, instructors and user accounts are never in
 * scope here.
 */
import type { PrismaClient } from "../generated/prisma/client";
import { Difficulty, QuizKind, InterviewVerdict, PublishStatus, Role } from "../generated/prisma/client";
import { randomUUID } from "node:crypto";
import { interviewSlug } from "@risingbrain/core/utils";

import quizData from "../seed/quiz.json";
import interviewData from "../seed/interview.json";

const newId = () => randomUUID();

/** Bulk-insert in chunks to stay well under Postgres' bind-parameter ceiling. */
async function insertMany<T>(
  create: (rows: T[]) => Promise<unknown>,
  rows: T[],
  chunk = 5000
): Promise<number> {
  for (let i = 0; i < rows.length; i += chunk) await create(rows.slice(i, i + chunk));
  return rows.length;
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function toDifficulty(v: string | undefined): Difficulty {
  const up = (v ?? "MEDIUM").toUpperCase();
  if (up === "EASY") return Difficulty.EASY;
  if (up === "HARD") return Difficulty.HARD;
  return Difficulty.MEDIUM;
}

// ---------------------------------------------------------------------------
// QUIZ  (/screening + /puzzles — one table, two routes)
// ---------------------------------------------------------------------------

/**
 * Reload every quiz category, topic and question.
 *
 * Deleting the categories cascades to topics and questions, and with them any
 * learner answers recorded against those questions — the rows they referenced no
 * longer exist after a content reload.
 */
export async function seedQuizContent(prisma: PrismaClient): Promise<number> {
  const categories = quizData as Array<{
    kind: string;
    slug: string;
    name: string;
    order: number;
    topics: Array<{
      name: string;
      slug: string;
      order: number;
      theory?: string;
      formula?: string;
      questions: Array<{
        prompt: string;
        options: { key: string; label: string }[];
        answerKey: string;
        explanation?: string;
        hint?: string;
        difficulty?: string | null;
        order: number;
      }>;
    }>;
  }>;

  const catRows: { id: string; kind: QuizKind; slug: string; name: string; order: number }[] = [];
  const topicRows: {
    id: string;
    categoryId: string;
    name: string;
    slug: string;
    theory: string | null;
    formula: string | null;
    order: number;
  }[] = [];
  const questionRows: {
    id: string;
    topicId: string;
    prompt: string;
    options: { key: string; label: string }[];
    answerKey: string;
    explanation: string | null;
    hint: string | null;
    difficulty: Difficulty | null;
    order: number;
  }[] = [];

  for (const cat of categories) {
    const categoryId = newId();
    catRows.push({
      id: categoryId,
      kind: cat.kind as QuizKind,
      slug: cat.slug,
      name: cat.name,
      order: cat.order,
    });
    for (const topic of cat.topics) {
      const topicId = newId();
      topicRows.push({
        id: topicId,
        categoryId,
        name: topic.name,
        slug: topic.slug,
        theory: topic.theory ?? null,
        formula: topic.formula ?? null,
        order: topic.order,
      });
      for (const q of topic.questions) {
        questionRows.push({
          id: newId(),
          topicId,
          prompt: q.prompt,
          options: q.options,
          answerKey: q.answerKey,
          explanation: q.explanation ?? null,
          hint: q.hint ?? null,
          difficulty: q.difficulty ? toDifficulty(q.difficulty) : null,
          order: q.order,
        });
      }
    }
  }

  // quiz_topics.slug is globally unique — it is the whole URL segment for
  // /screening/<slug> and /puzzles/<slug>, which share this table. Name the
  // offender here instead of letting it surface as a unique-violation.
  const dupes = topicRows.map((t) => t.slug).filter((s, i, all) => all.indexOf(s) !== i);
  if (dupes.length) {
    throw new Error(
      `Duplicate quiz topic slug(s) in seed/quiz.json: ${[...new Set(dupes)].join(", ")}. ` +
        `Slugs are URLs and must be unique across every category — rename one.`
    );
  }

  // Categories cascade to topics → questions, so this one delete clears the bank.
  await prisma.quizCategory.deleteMany();
  await insertMany((r) => prisma.quizCategory.createMany({ data: r }), catRows);
  await insertMany((r) => prisma.quizTopic.createMany({ data: r }), topicRows);
  await insertMany((r) => prisma.quizQuestion.createMany({ data: r }), questionRows);
  return questionRows.length;
}

// ---------------------------------------------------------------------------
// INTERVIEW  (/interview)
// ---------------------------------------------------------------------------

/**
 * Reload the editorial interview experiences.
 *
 * DESTRUCTIVE: clears `interview_experiences` first, so likes and comments on
 * the old rows cascade away with them — including any REAL user submissions,
 * which live in this same table. `db:seed-interviews` is the non-destructive
 * alternative: it upserts by slug and leaves everything else alone.
 */
export async function seedInterviewContent(prisma: PrismaClient): Promise<number> {
  const posts = interviewData as Array<{
    company: string;
    role: string;
    authorName: string;
    verdict: string;
    difficulty: string;
    roundsCount: number;
    title: string;
    excerpt: string;
    body: string;
    tags: string[];
    likeCount: number;
  }>;

  const emailFor = (name: string) => `${slugify(name)}@example.com`;

  const authorRows = new Map<string, { email: string; name: string; role: Role }>();
  for (const post of posts) {
    const email = emailFor(post.authorName);
    if (!authorRows.has(email))
      authorRows.set(email, { email, name: post.authorName, role: Role.NORMAL });
  }
  // skipDuplicates: authors are looked up by email and kept, never recreated —
  // this reload replaces posts, not the people who wrote them.
  await insertMany(
    (r) => prisma.user.createMany({ data: r, skipDuplicates: true }),
    [...authorRows.values()]
  );

  const authors = await prisma.user.findMany({
    where: { email: { in: [...authorRows.keys()] } },
    select: { id: true, email: true },
  });
  const authorId = new Map(authors.map((a) => [a.email, a.id]));

  // Slugs are derived from the title, so two posts sharing one need the tie
  // broken — the same salt rule the create route uses.
  const taken = new Set<string>();
  const slugFor = (title: string) => {
    let slug = interviewSlug(title);
    for (let n = 2; taken.has(slug); n++) slug = interviewSlug(title, String(n));
    taken.add(slug);
    return slug;
  };

  const rows = posts.map((post) => ({
    id: newId(),
    slug: slugFor(post.title),
    authorId: authorId.get(emailFor(post.authorName))!,
    company: post.company,
    role: post.role,
    verdict: post.verdict as InterviewVerdict,
    difficulty: toDifficulty(post.difficulty),
    roundsCount: post.roundsCount,
    title: post.title,
    excerpt: post.excerpt,
    body: post.body,
    tags: post.tags,
    likeCount: post.likeCount,
    // Editorial seed content, so it is published outright — the column defaults
    // to PENDING_REVIEW because *user* submissions must be approved first.
    status: PublishStatus.PUBLISHED,
  }));

  await prisma.interviewExperience.deleteMany();
  await insertMany((r) => prisma.interviewExperience.createMany({ data: r }), rows);
  return rows.length;
}
