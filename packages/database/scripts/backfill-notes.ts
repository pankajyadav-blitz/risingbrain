/**
 * Non-destructive backfill: set `theory` (markdown topic notes, sourced from the
 * study PDFs) on existing quiz_topics from seed/quiz.json WITHOUT a destructive
 * re-seed — preserves topic/question IDs and all user progress. Safe to run
 * against the remote (Neon) database. The full seed already applies the same
 * `theory`, so this is only for patching an already-populated DB.
 *
 * Match is by (category kind, topic slug), both unique together. Run with:
 *   bun run packages/database/scripts/backfill-notes.ts
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import quizData from "../seed/quiz.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

type Topic = { slug: string; theory?: string };
type Cat = { kind: string; topics: Topic[] };

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
  // (kind, slug) -> theory markdown, from the seed (authoritative content).
  const byKey = new Map<string, string>();
  for (const cat of quizData as Cat[]) {
    for (const t of cat.topics) {
      if (t.theory) byKey.set(`${cat.kind}::${t.slug}`, t.theory);
    }
  }

  const topics = await withRetry(() =>
    prisma.quizTopic.findMany({
      select: { id: true, slug: true, category: { select: { kind: true } } },
    })
  );

  let updated = 0;
  const missing: string[] = [];
  const targets = topics
    .map((row) => ({ row, theory: byKey.get(`${row.category.kind}::${row.slug}`) }))
    .filter((t): t is { row: (typeof topics)[number]; theory: string } => Boolean(t.theory));

  for (const key of byKey.keys()) {
    if (!topics.some((row) => `${row.category.kind}::${row.slug}` === key)) missing.push(key);
  }

  const CHUNK = 10;
  for (let i = 0; i < targets.length; i += CHUNK) {
    const slice = targets.slice(i, i + CHUNK);
    await Promise.all(
      slice.map((t) =>
        withRetry(() =>
          prisma.quizTopic.update({ where: { id: t.row.id }, data: { theory: t.theory } })
        )
      )
    );
    updated += slice.length;
  }

  console.log(`quiz topics in DB: ${topics.length}`);
  console.log(`updated with theory notes: ${updated}`);
  if (missing.length) {
    console.log(`SEED NOTES WITH NO MATCHING TOPIC IN DB: ${missing.length}`);
    for (const k of missing) console.log(`  - ${k}`);
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
