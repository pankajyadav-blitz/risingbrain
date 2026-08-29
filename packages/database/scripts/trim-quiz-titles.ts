/**
 * Drop the heading at the top of a Screening topic's notes when it only repeats
 * the topic's own name.
 *
 * Seven of the sixteen topics with theory open with `## Ages` on the page titled
 * "Ages". On screen that prints the title twice — once as the paper's `<h1>`,
 * once as the first line of the notes — and it takes the first slot in the
 * "On this page" rail, where an entry pointing at the page you are already on
 * is pure noise. The sections underneath (`### Core Rules`, `### Common
 * Patterns`) are the real structure and are untouched.
 *
 * Only an EXACT case-insensitive match of the topic name is removed, and only
 * when it is the first heading in the body — a topic whose first section happens
 * to share a word with its title keeps it.
 *
 *   bun run packages/database/scripts/trim-quiz-titles.ts          # preview
 *   bun run packages/database/scripts/trim-quiz-titles.ts --write  # seed + rows
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const SEED = join(HERE, "..", "seed", "quiz.json");

type QuizTopic = { name: string; theory?: string | null };
type Category = { name: string; topics: QuizTopic[] };

/** The body with a leading title-echo heading removed, or the body unchanged. */
function trimTitleEcho(theory: string, name: string): string {
  const m = /^\s*#{1,3}[ \t]+(.+?)[ \t]*$/m.exec(theory);
  if (!m) return theory;
  // Must be the FIRST non-empty line, not a heading further down the document.
  if (theory.slice(0, m.index).trim() !== "") return theory;
  if (m[1]!.trim().toLowerCase() !== name.trim().toLowerCase()) return theory;
  return theory.slice(m.index + m[0].length).replace(/^\n+/, "");
}

const WRITE = process.argv.includes("--write");
const categories = JSON.parse(readFileSync(SEED, "utf8")) as Category[];

const changed: { name: string; theory: string }[] = [];
for (const cat of categories) {
  for (const topic of cat.topics) {
    if (!topic.theory) continue;
    const next = trimTitleEcho(topic.theory, topic.name);
    if (next === topic.theory) continue;
    topic.theory = next;
    changed.push({ name: topic.name, theory: next });
    console.log(`  ✅ ${cat.name} · ${topic.name}`);
  }
}
console.log(`${changed.length} topic(s) had a title echo.`);

if (!WRITE) {
  console.log("\n(preview only — pass --write to update the seed and the rows)");
} else if (changed.length > 0) {
  writeFileSync(SEED, JSON.stringify(categories, null, 2) + "\n");
  console.log(`📝 wrote seed/quiz.json`);

  const { PrismaClient } = await import("../generated/prisma/client");
  const { PrismaPg } = await import("@prisma/adapter-pg");
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
  });
  let updated = 0;
  for (const c of changed) {
    // Name is not unique in the schema, so update by match rather than by id.
    const res = await prisma.quizTopic.updateMany({
      where: { name: c.name },
      data: { theory: c.theory },
    });
    updated += res.count;
  }
  console.log(`🗄  Database: ${updated} row(s) updated.`);
  await prisma.$disconnect();
}
