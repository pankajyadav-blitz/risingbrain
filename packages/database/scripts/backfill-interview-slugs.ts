/**
 * Set `interview_experiences.slug` from each row's title.
 *
 * The slug migration seeded the column from the row id, which is unique but not
 * reproducible from the seed JSON — so `db:seed-interviews` could not find an
 * existing post to update. `interviewSlug()` derives the token from the TITLE
 * instead, making the slug something both the seed and this script can compute,
 * which is what lets the seed upsert in place rather than delete and recreate.
 *
 * Idempotent: a row already carrying its computed slug is skipped, so re-running
 * is a no-op. UPDATE only — no row is ever deleted here.
 */
import { prisma } from "../src/index";
import { interviewSlug } from "@risingbrain/core/utils";

async function main() {
  const rows = await prisma.interviewExperience.findMany({
    select: { id: true, title: true, slug: true },
    orderBy: { createdAt: "asc" },
  });

  // Two posts may legitimately share a title; the salt breaks that tie the same
  // way the create path does, so the computed slug stays reproducible.
  const taken = new Set<string>();
  let changed = 0;

  for (const row of rows) {
    let slug = interviewSlug(row.title);
    for (let n = 2; taken.has(slug); n++) slug = interviewSlug(row.title, String(n));
    taken.add(slug);

    if (row.slug === slug) continue;
    await prisma.interviewExperience.update({ where: { id: row.id }, data: { slug } });
    changed++;
  }

  console.log(`✅ ${rows.length} experiences checked, ${changed} slug(s) rewritten.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
