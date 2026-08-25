/**
 * Standalone seeder for the DBMS subject of the Domain section.
 *
 * Reseeds ONLY the `DBMS` rows of `domain_topics` (and, by cascade, their
 * practice questions) — clears and reloads them from seed/domain-dbms.json +
 * seed/domain-dbms-quiz.json, leaving the other subjects and every other table
 * untouched:
 *
 *   bun run db:seed-domain-dbms     (from packages/database, or via turbo)
 *
 * The content is the 10-module DBMS course extracted from the source PDFs: 35
 * topics carrying their module as `groupLabel`/`groupOrder`, so the left nav
 * reads Module 1 → Module 10 in order. The diagrams the notes reference are
 * static assets under apps/web/public/study-notes/dbms/<slug>/fig-N.png, so the
 * DB only ever holds their relative paths.
 *
 * DESTRUCTIVE within its scope: because questions cascade with their topic, any
 * learner answers recorded against the OLD DBMS questions go with them.
 *
 * Shares seedDomainSubject() with the full `db:seed`, so the two never drift.
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDomainSubject } from "./domain-loader";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Domain topics for DBMS…");
  const { topics, questions } = await seedDomainSubject(prisma, "DBMS");
  console.log(`✅ DBMS domain seed complete: ${topics} topics, ${questions} practice questions.`);
}

main()
  .catch((e) => {
    console.error("❌ DBMS domain seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
