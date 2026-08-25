/**
 * Standalone seeder for the SQL subject of the Domain section.
 *
 * Reseeds ONLY the `SQL` rows of `domain_topics` — clears and reloads them from
 * seed/domain-sql.json (85 topics across the 14 roadmap patterns), leaving the other
 * subjects and every other table untouched:
 *
 *   bun run db:seed-domain-sql      (from packages/database, or via turbo)
 *
 * The figures referenced by the notes are static assets under
 * apps/web/public/study-notes/sql/<slug>/fig-N.png — extracted from the source PDF
 * alongside this JSON, so the DB only ever holds their relative paths.
 *
 * Shares seedDomainSubject() with the full `db:seed`, so the two never drift.
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDomainSubject } from "./domain-loader";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Domain topics for SQL…");
  const { topics, withExample, questions } = await seedDomainSubject(prisma, "SQL");
  console.log(
    `✅ SQL domain seed complete: ${topics} topics (${withExample} with a code example), ` +
      `${questions} practice questions.`
  );
}

main()
  .catch((e) => {
    console.error("❌ SQL domain seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
