/**
 * Puzzle-only updater — applies the PUZZLE category of
 * packages/database/seed/quiz.json to the database WITHOUT running the full
 * seed (which wipes DSA, domain, courses, interviews and companies via
 * clearContent()).
 *
 *   bun run scripts/update-puzzles.ts
 *
 * Scope: the one QuizCategory whose kind is PUZZLE, and everything under it.
 * The APTITUDE and LOGICAL_REASONING categories are never read or written, so
 * quant/reasoning topics keep their rows AND their per-user progress.
 *
 * Why delete + recreate rather than upsert-by-slug like update-dsa.ts: the
 * puzzle bank was restructured from one "puzzles" topic into eight pattern
 * topics, so almost no question survives under its old identity — there is
 * nothing to preserve, and matching on a slug that changed for every row would
 * be pure ceremony. UserQuizProgress and UserQuizTopicScore FK to the questions
 * and topics with onDelete: Cascade, so puzzle progress is dropped with them;
 * that is unavoidable once the questions themselves are replaced.
 *
 * Ids are pre-generated so children can reference their parents without a
 * round trip per row, and rows go out in bulk createMany calls — the same shape
 * prisma/seed.ts uses.
 */
import { PrismaClient, Difficulty, QuizKind } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";

import quizData from "../seed/quiz.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const newId = () => randomUUID();

function toDifficulty(v: string | undefined | null): Difficulty | null {
  if (!v) return null;
  const up = v.toUpperCase();
  if (up === "EASY") return Difficulty.EASY;
  if (up === "HARD") return Difficulty.HARD;
  if (up === "MEDIUM") return Difficulty.MEDIUM;
  return null;
}

type QuizQuestionJson = {
  prompt: string;
  options: { key: string; label: string }[];
  answerKey: string;
  explanation?: string;
  hint?: string;
  difficulty?: string | null;
  order: number;
};
type QuizTopicJson = {
  name: string;
  slug: string;
  order: number;
  theory?: string;
  formula?: string;
  questions: QuizQuestionJson[];
};
type QuizCategoryJson = {
  kind: string;
  slug: string;
  name: string;
  order: number;
  topics: QuizTopicJson[];
};

async function main() {
  const startedAt = Date.now();
  const cat = (quizData as QuizCategoryJson[]).find((c) => c.kind === "PUZZLE");
  if (!cat) throw new Error("no PUZZLE category in seed/quiz.json");

  const questionCount = cat.topics.reduce((s, t) => s + t.questions.length, 0);
  console.log(
    `🔄 Updating puzzles from seed/quiz.json — ${cat.topics.length} topics, ${questionCount} questions…`,
  );

  // Scoped to kind: PUZZLE — the quant and reasoning categories are untouched.
  const removed = await prisma.quizCategory.deleteMany({ where: { kind: QuizKind.PUZZLE } });
  if (removed.count) console.log(`   cleared ${removed.count} existing puzzle category`);

  const categoryId = newId();
  await prisma.quizCategory.create({
    data: {
      id: categoryId,
      kind: QuizKind.PUZZLE,
      slug: cat.slug,
      name: cat.name,
      order: cat.order,
    },
  });

  const topicRows = cat.topics.map((t) => ({
    id: newId(),
    categoryId,
    name: t.name,
    slug: t.slug,
    theory: t.theory ?? null,
    formula: t.formula ?? null,
    order: t.order,
  }));
  await prisma.quizTopic.createMany({ data: topicRows });

  const questionRows = cat.topics.flatMap((t, i) =>
    t.questions.map((q) => ({
      id: newId(),
      topicId: topicRows[i]!.id,
      prompt: q.prompt,
      options: q.options,
      answerKey: q.answerKey,
      explanation: q.explanation ?? null,
      hint: q.hint ?? null,
      difficulty: toDifficulty(q.difficulty),
      order: q.order,
    })),
  );
  await prisma.quizQuestion.createMany({ data: questionRows });

  console.log(
    `✅ Puzzles updated in ${((Date.now() - startedAt) / 1000).toFixed(1)}s — ` +
      `${topicRows.length} topics, ${questionRows.length} questions. ` +
      `(aptitude, reasoning, DSA, domain, courses, interviews, users untouched)`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Puzzle update failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
