/**
 * Staging-only backfill: set `hint` + `explanation` on existing quiz_questions
 * from seed/quiz.json WITHOUT a destructive re-seed (preserves IDs and all user
 * progress). Production uses the full seed instead.
 *
 * Match is by exact `prompt` text (prompts are unique in the bank). Run with:
 *   bun run packages/database/scripts/backfill-hints.ts
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import quizData from "../seed/quiz.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Q = { prompt: string; hint?: string; explanation?: string };
type Cat = { topics: Array<{ questions: Q[] }> };

/** Retry an op a few times — Neon's serverless pooler drops connections under load. */
async function withRetry<T>(op: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await op();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

async function main() {
  // prompt -> { hint, explanation } from the seed (authoritative content).
  const byPrompt = new Map<string, { hint: string | null; explanation: string | null }>();
  for (const cat of quizData as Cat[]) {
    for (const t of cat.topics) {
      for (const q of t.questions) {
        byPrompt.set(q.prompt, { hint: q.hint ?? null, explanation: q.explanation ?? null });
      }
    }
  }

  const rows = await withRetry(() =>
    prisma.quizQuestion.findMany({ select: { id: true, prompt: true } })
  );

  let updated = 0;
  const unmatched: string[] = [];
  const targets = rows
    .map((row) => ({ row, content: byPrompt.get(row.prompt) }))
    .filter((t) => {
      if (!t.content) unmatched.push(t.row.prompt.slice(0, 70));
      return Boolean(t.content);
    });

  // Run updates in small parallel chunks so the whole backfill finishes before
  // Neon's pooler drops a long-idle connection (which broke the sequential loop).
  const CHUNK = 15;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const slice = targets.slice(i, i + CHUNK);
    await Promise.all(
      slice.map((t) =>
        withRetry(() =>
          prisma.quizQuestion.update({
            where: { id: t.row.id },
            data: { hint: t.content!.hint, explanation: t.content!.explanation },
          })
        )
      )
    );
    updated += slice.length;
  }

  console.log(`quiz questions in DB: ${rows.length}`);
  console.log(`updated with hint+explanation: ${updated}`);
  if (unmatched.length) {
    console.log(`UNMATCHED (no seed content for these prompts): ${unmatched.length}`);
    for (const p of unmatched) console.log(`  - ${p}…`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
