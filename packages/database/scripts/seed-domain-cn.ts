/**
 * Standalone seeder for the CN subject of the Domain section.
 *
 * Reseeds ONLY the `CN` rows of `domain_topics` (and, by cascade, their practice
 * questions) — clears and reloads them from seed/domain-cn.json +
 * seed/domain-cn-quiz.json, leaving the other subjects and every other table
 * untouched:
 *
 *   bun run db:seed-domain-cn      (from packages/database, or via turbo)
 *
 * The content is the 9-module Computer Networks course extracted from the source
 * PDFs: 39 topics carrying their module as `groupLabel`/`groupOrder`, so the left
 * nav reads Module 1 → Module 9 in order. Each topic's diagram is a static asset
 * under apps/web/public/study-notes/cn/<slug>/fig-1.png, so the DB only ever holds
 * the relative path.
 *
 * DESTRUCTIVE within its scope: because questions cascade with their topic, any
 * learner answers recorded against the OLD CN questions go with them.
 *
 * Shares seedDomainSubject() with the full `db:seed`, so the two never drift.
 */
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedDomainSubject } from "./domain-loader";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seeding Domain topics for CN…");
  const { topics, questions } = await seedDomainSubject(prisma, "CN");
  console.log(`✅ CN domain seed complete: ${topics} topics, ${questions} practice questions.`);
}

main()
  .catch((e) => {
    console.error("❌ CN domain seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
