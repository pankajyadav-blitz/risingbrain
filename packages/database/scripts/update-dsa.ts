/**
 * DSA-only updater — applies packages/database/seed/dsa.json to the database
 * WITHOUT running the full seed (which wipes quizzes, domain, courses,
 * interviews and companies via clearContent()).
 *
 * Use this when you already have data in the DB and only want to refresh /
 * extend the DSA sheets (e.g. after adding the SBC sheet).
 *
 *   bun run scripts/update-dsa.ts            # upsert + prune rows absent from JSON
 *   bun run scripts/update-dsa.ts --no-prune # upsert only, never delete
 *
 * Why upsert (not delete + recreate): UserProblemProgress and UserProblemNote
 * FK to DsaProblem.id (cuid) with onDelete: Cascade. We upsert every row by its
 * stable slug so ids never change — so existing user progress, bookmarks and
 * notes are preserved. Only Dsa* and Company tables are touched.
 *
 * Slug rules mirror prisma/seed.ts exactly (same iteration order + uniqueSlug),
 * so slugs line up with whatever a full seed produced.
 */
import { PrismaClient, Difficulty } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import dsaData from "../seed/dsa.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const PRUNE = !process.argv.includes("--no-prune");

// ---- helpers (kept in sync with prisma/seed.ts) ----
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

// Brand domains → Clearbit logos (must match prisma/seed.ts COMPANY_DOMAINS).
const COMPANY_DOMAINS: Record<string, string> = {
  Adobe: "adobe.com",
  Amazon: "amazon.com",
  Apple: "apple.com",
  Atlassian: "atlassian.com",
  Bloomberg: "bloomberg.com",
  ByteDance: "bytedance.com",
  "DE Shaw": "deshaw.com",
  Facebook: "facebook.com",
  Flipkart: "flipkart.com",
  Freshworks: "freshworks.com",
  "Goldman Sachs": "goldmansachs.com",
  Google: "google.com",
  Intuit: "intuit.com",
  Accenture: "accenture.com",
  Capgemini: "capgemini.com",
  Cognizant: "cognizant.com",
  HCL: "hcltech.com",
  Infosys: "infosys.com",
  TCS: "tcs.com",
  Wipro: "wipro.com",
  LinkedIn: "linkedin.com",
  Meta: "meta.com",
  Microsoft: "microsoft.com",
  "Morgan Stanley": "morganstanley.com",
  Myntra: "myntra.com",
  Ola: "olacabs.com",
  Oracle: "oracle.com",
  PayPal: "paypal.com",
  Paytm: "paytm.com",
  PhonePe: "phonepe.com",
  Samsung: "samsung.com",
  "Sumo Logic": "sumologic.com",
  Swiggy: "swiggy.com",
  Uber: "uber.com",
  Walmart: "walmart.com",
  Zoho: "zoho.com",
  Zomato: "zomato.com",
};

function logoFor(name: string, sourceLogo?: string): string | null {
  const domain = COMPANY_DOMAINS[name];
  if (domain) return `https://logo.clearbit.com/${domain}`;
  return sourceLogo ?? null;
}

// ---- JSON types (subset of seed.ts) ----
type DsaProblemJson = {
  id: string;
  title: string;
  reference?: string;
  difficulty?: string;
  leetcodeUrl?: string;
  gfgUrl?: string;
  youtubeUrl?: string;
  companies?: { name: string; logo?: string }[];
};
type DsaSubtopicJson = {
  name: string;
  order?: number;
  strategy?: string;
  identification?: string;
  problems: DsaProblemJson[];
};
type DsaTopicJson = { name: string; description?: string; subtopics: DsaSubtopicJson[] };
type DsaSheetJson = {
  name: string;
  description?: string;
  order?: number;
  topics: DsaTopicJson[];
};

const sheets = (dsaData as { sheets: DsaSheetJson[] }).sheets;

async function upsertCompanies(): Promise<Map<string, string>> {
  const names = new Map<string, string | undefined>();
  for (const sheet of sheets)
    for (const topic of sheet.topics)
      for (const sub of topic.subtopics)
        for (const p of sub.problems)
          for (const c of p.companies ?? []) if (!names.has(c.name)) names.set(c.name, c.logo);

  for (const [name, logo] of names) {
    const slug = slugify(name);
    const logoUrl = logoFor(name, logo);
    await prisma.company.upsert({
      where: { slug },
      update: { name, logoUrl },
      create: { name, slug, logoUrl },
    });
  }
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  return new Map(companies.map((c) => [c.name, c.id]));
}

async function updateDsa(companyIds: Map<string, string>) {
  const seenSheets = new Set<string>();
  const seenTopics = new Set<string>();
  const seenPatterns = new Set<string>();
  const seenProblems = new Set<string>();

  // Mirror seed.ts's cross-pattern slug de-dup so slugs match an existing seed.
  const usedSlugs = new Set<string>();
  const uniqueSlug = (id: string): string => {
    let slug = id;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${id}-${n++}`;
    usedSlugs.add(slug);
    return slug;
  };

  let sheetsN = 0,
    topicsN = 0,
    patternsN = 0,
    problemsN = 0;

  for (const [sheetIdx, sheet] of sheets.entries()) {
    const sheetSlug = slugify(sheet.name);
    const createdSheet = await prisma.dsaSheet.upsert({
      where: { slug: sheetSlug },
      update: { name: sheet.name, description: sheet.description ?? null, order: sheet.order ?? sheetIdx },
      // isPublished only set on create so admin toggles aren't clobbered.
      create: { slug: sheetSlug, name: sheet.name, description: sheet.description ?? null, order: sheet.order ?? sheetIdx },
    });
    seenSheets.add(createdSheet.id);
    sheetsN++;

    for (const [topicIdx, topic] of sheet.topics.entries()) {
      const topicSlug = `${slugify(topic.name)}-${topicIdx}`;
      const createdTopic = await prisma.dsaTopic.upsert({
        where: { sheetId_slug: { sheetId: createdSheet.id, slug: topicSlug } },
        update: { name: topic.name, description: topic.description ?? null, order: topicIdx },
        create: { sheetId: createdSheet.id, name: topic.name, slug: topicSlug, description: topic.description ?? null, order: topicIdx },
      });
      seenTopics.add(createdTopic.id);
      topicsN++;

      for (const [patternIdx, sub] of topic.subtopics.entries()) {
        const patternSlug = `${slugify(sub.name)}-${patternIdx}`;
        const createdPattern = await prisma.dsaPattern.upsert({
          where: { topicId_slug: { topicId: createdTopic.id, slug: patternSlug } },
          update: { name: sub.name, strategy: sub.strategy ?? null, identification: sub.identification ?? null, order: sub.order ?? patternIdx },
          create: { topicId: createdTopic.id, name: sub.name, slug: patternSlug, strategy: sub.strategy ?? null, identification: sub.identification ?? null, order: sub.order ?? patternIdx },
        });
        seenPatterns.add(createdPattern.id);
        patternsN++;

        for (const [problemIdx, p] of sub.problems.entries()) {
          const slug = uniqueSlug(p.id);
          const fields = {
            title: p.title,
            reference: p.reference ?? null,
            difficulty: toDifficulty(p.difficulty),
            leetcodeUrl: p.leetcodeUrl ?? null,
            gfgUrl: p.gfgUrl ?? null,
            youtubeUrl: p.youtubeUrl ?? null,
            order: problemIdx,
          };
          const createdProblem = await prisma.dsaProblem.upsert({
            where: { slug },
            // patternId in update handles a problem that moved to another pattern.
            update: { patternId: createdPattern.id, ...fields },
            create: { patternId: createdPattern.id, slug, ...fields },
          });
          seenProblems.add(createdProblem.id);
          problemsN++;

          // Reconcile company tags (join table carries no user data).
          const wanted = (p.companies ?? [])
            .map((c) => companyIds.get(c.name))
            .filter((id): id is string => Boolean(id));
          await prisma.problemCompany.deleteMany({ where: { problemId: createdProblem.id } });
          if (wanted.length)
            await prisma.problemCompany.createMany({
              data: wanted.map((companyId) => ({ problemId: createdProblem.id, companyId })),
              skipDuplicates: true,
            });
        }
      }
    }
  }

  console.log(`   upserted: ${sheetsN} sheets, ${topicsN} topics, ${patternsN} patterns, ${problemsN} problems`);

  if (!PRUNE) {
    console.log("   prune: skipped (--no-prune)");
    return;
  }

  // Remove Dsa* rows no longer present in dsa.json. Deleting a sheet/topic/
  // pattern cascades to its children; a not-seen parent only has not-seen
  // children, so deleting parents first is safe. Deleting a problem cascades
  // its progress/notes — but only for problems that truly no longer exist.
  const delSheets = await prisma.dsaSheet.deleteMany({ where: { id: { notIn: [...seenSheets] } } });
  const delTopics = await prisma.dsaTopic.deleteMany({ where: { id: { notIn: [...seenTopics] } } });
  const delPatterns = await prisma.dsaPattern.deleteMany({ where: { id: { notIn: [...seenPatterns] } } });
  const delProblems = await prisma.dsaProblem.deleteMany({ where: { id: { notIn: [...seenProblems] } } });
  console.log(
    `   pruned: ${delSheets.count} sheets, ${delTopics.count} topics, ${delPatterns.count} patterns, ${delProblems.count} problems (their progress/notes cascaded)`,
  );
}

async function main() {
  console.log(`🔄 Updating DSA content from seed/dsa.json (prune=${PRUNE})…`);
  const companyIds = await upsertCompanies();
  console.log(`   companies: ${companyIds.size}`);
  await updateDsa(companyIds);
  console.log("✅ DSA update complete. (quizzes, domain, courses, interviews, users untouched)");
}

main()
  .catch((e) => {
    console.error("❌ DSA update failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
