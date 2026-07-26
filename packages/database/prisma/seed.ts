/**
 * RisingBrain seed — loads all content (DSA sheets, SQL, aptitude/reasoning/
 * puzzle MCQs, courses, interview experiences) plus a couple of demo users.
 *
 * Idempotent: content tables are cleared and reloaded on every run, so
 * `bun run db:seed` is always safe. Run after `db push`:
 *
 *   docker compose up -d && bun run db:setup
 *
 * Data sources live in packages/database/seed/*.json.
 */
import {
  PrismaClient,
  Difficulty,
  QuizKind,
  InterviewVerdict,
  Role,
} from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { randomUUID } from "node:crypto";

import dsaData from "../seed/dsa.json";
import quizData from "../seed/quiz.json";
import interviewData from "../seed/interview.json";
import { seedDomain } from "../scripts/domain-loader";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// The whole tree is inserted with batched createMany() instead of per-row
// create(): we pre-generate the primary keys here so children can reference
// their parents without a round-trip per row. A random id is fine — external
// references use the stable `slug`, never the pk. This turns the ~2k sequential
// inserts the seed used to do into a handful of bulk statements.
const newId = () => randomUUID();

// Bulk-insert in chunks to stay well under Postgres' bind-parameter ceiling.
async function insertMany<T>(
  create: (rows: T[]) => Promise<unknown>,
  rows: T[],
  chunk = 5000,
): Promise<number> {
  for (let i = 0; i < rows.length; i += chunk) {
    await create(rows.slice(i, i + chunk));
  }
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

// ---- types for the loosely-typed JSON ----
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
type DsaTopicJson = {
  name: string;
  description?: string;
  subtopics: DsaSubtopicJson[];
};
type DsaSheetJson = {
  name: string;
  description?: string;
  order?: number;
  topics: DsaTopicJson[];
};

async function clearContent() {
  // Order matters only where cascades don't cover it; top-level deletes cascade
  // down to children (topics/patterns/problems, modules/lessons, likes/comments).
  await prisma.interviewComment.deleteMany();
  await prisma.interviewLike.deleteMany();
  await prisma.interviewExperience.deleteMany();
  await prisma.dsaSheet.deleteMany();
  await prisma.company.deleteMany();
  await prisma.quizCategory.deleteMany();
  await prisma.domainTopic.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();
}

// Brand domains → Clearbit logo API (square, reliable, hotlink-friendly PNGs).
// The DSA source data's own logo URLs point at hosts that block hotlinking
// (Google image proxy, figma, freepik…), so prefer Clearbit for known firms.
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
  // Service-based / IT-consulting firms (SBC sheet).
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

async function seedCompanies() {
  const sheets = (dsaData as { sheets: DsaSheetJson[] }).sheets;
  const names = new Map<string, string | undefined>();
  for (const sheet of sheets)
    for (const topic of sheet.topics)
      for (const sub of topic.subtopics)
        for (const p of sub.problems)
          for (const c of p.companies ?? [])
            if (!names.has(c.name)) names.set(c.name, c.logo);

  await prisma.company.createMany({
    data: [...names.entries()].map(([name, logo]) => ({
      name,
      slug: slugify(name),
      logoUrl: logoFor(name, logo),
    })),
    skipDuplicates: true,
  });
  const companies = await prisma.company.findMany({ select: { id: true, name: true } });
  return new Map(companies.map((c) => [c.name, c.id]));
}

async function seedDsa(companyIds: Map<string, string>) {
  const sheets = (dsaData as { sheets: DsaSheetJson[] }).sheets;

  // A handful of problems are placed in two patterns (same dataset id). Each
  // placement is its own row, so disambiguate the unique slug on collision.
  const usedSlugs = new Set<string>();
  const uniqueSlug = (id: string): string => {
    let slug = id;
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${id}-${n++}`;
    usedSlugs.add(slug);
    return slug;
  };

  // Build the entire tree in memory with pre-generated ids, then bulk-insert one
  // level at a time (parents before children so the FKs resolve).
  const sheetRows: {
    id: string;
    slug: string;
    name: string;
    description: string | null;
    order: number;
  }[] = [];
  const topicRows: {
    id: string;
    sheetId: string;
    name: string;
    slug: string;
    description: string | null;
    order: number;
  }[] = [];
  const patternRows: {
    id: string;
    topicId: string;
    name: string;
    slug: string;
    strategy: string | null;
    identification: string | null;
    order: number;
  }[] = [];
  const problemRows: {
    id: string;
    patternId: string;
    slug: string;
    title: string;
    reference: string | null;
    difficulty: Difficulty;
    leetcodeUrl: string | null;
    gfgUrl: string | null;
    youtubeUrl: string | null;
    order: number;
  }[] = [];
  const joinRows: { problemId: string; companyId: string }[] = [];

  for (const [sheetIdx, sheet] of sheets.entries()) {
    const sheetId = newId();
    sheetRows.push({
      id: sheetId,
      slug: slugify(sheet.name),
      name: sheet.name,
      description: sheet.description ?? null,
      order: sheet.order ?? sheetIdx,
    });

    for (const [topicIdx, topic] of sheet.topics.entries()) {
      const topicId = newId();
      topicRows.push({
        id: topicId,
        sheetId,
        name: topic.name,
        slug: `${slugify(topic.name)}-${topicIdx}`,
        description: topic.description ?? null,
        order: topicIdx,
      });

      for (const [patternIdx, sub] of topic.subtopics.entries()) {
        const patternId = newId();
        patternRows.push({
          id: patternId,
          topicId,
          name: sub.name,
          slug: `${slugify(sub.name)}-${patternIdx}`,
          strategy: sub.strategy ?? null,
          identification: sub.identification ?? null,
          order: sub.order ?? patternIdx,
        });

        for (const [problemIdx, p] of sub.problems.entries()) {
          const problemId = newId();
          problemRows.push({
            id: problemId,
            patternId,
            slug: uniqueSlug(p.id), // stable dataset id; suffixed if reused across patterns
            title: p.title,
            reference: p.reference ?? null,
            difficulty: toDifficulty(p.difficulty),
            leetcodeUrl: p.leetcodeUrl ?? null,
            gfgUrl: p.gfgUrl ?? null,
            youtubeUrl: p.youtubeUrl ?? null,
            order: problemIdx,
          });

          for (const c of p.companies ?? []) {
            const companyId = companyIds.get(c.name);
            if (companyId) joinRows.push({ problemId, companyId });
          }
        }
      }
    }
  }

  await insertMany((r) => prisma.dsaSheet.createMany({ data: r }), sheetRows);
  await insertMany((r) => prisma.dsaTopic.createMany({ data: r }), topicRows);
  await insertMany((r) => prisma.dsaPattern.createMany({ data: r }), patternRows);
  await insertMany((r) => prisma.dsaProblem.createMany({ data: r }), problemRows);
  // skipDuplicates: a problem may list the same company twice across placements.
  await insertMany(
    (r) => prisma.problemCompany.createMany({ data: r, skipDuplicates: true }),
    joinRows,
  );
  return problemRows.length;
}

async function seedQuiz() {
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
          order: q.order,
        });
      }
    }
  }

  await insertMany((r) => prisma.quizCategory.createMany({ data: r }), catRows);
  await insertMany((r) => prisma.quizTopic.createMany({ data: r }), topicRows);
  await insertMany((r) => prisma.quizQuestion.createMany({ data: r }), questionRows);
  return questionRows.length;
}

async function seedUsers() {
  // Demo accounts for local testing. passwordHash stays null until the auth
  // phase wires argon2; these are usable via OAuth or future credential setup.
  const admin = await prisma.user.upsert({
    where: { email: "pankajy9636@gmail.com" },
    update: { role: Role.ADMIN },
    create: { email: "pankajy9636@gmail.com", name: "Pankaj Yadav", role: Role.ADMIN },
  });
  return admin;
}

async function seedInterviews() {
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

  // Bulk-create the unique authors first (skipDuplicates keeps existing users),
  // then resolve their ids in one query and bulk-insert the experiences.
  const authorRows = new Map<string, { email: string; name: string; role: Role }>();
  for (const post of posts) {
    const email = emailFor(post.authorName);
    if (!authorRows.has(email))
      authorRows.set(email, { email, name: post.authorName, role: Role.NORMAL });
  }
  await insertMany(
    (r) => prisma.user.createMany({ data: r, skipDuplicates: true }),
    [...authorRows.values()],
  );

  const authors = await prisma.user.findMany({
    where: { email: { in: [...authorRows.keys()] } },
    select: { id: true, email: true },
  });
  const authorId = new Map(authors.map((a) => [a.email, a.id]));

  const experienceRows = posts.map((post) => ({
    id: newId(),
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
  }));
  await insertMany((r) => prisma.interviewExperience.createMany({ data: r }), experienceRows);
  return posts.length;
}

async function main() {
  console.log("🌱 Seeding RisingBrain…");
  const t0 = Date.now();
  await clearContent();

  // DSA needs the company ids; everything else is independent, so run the
  // content groups concurrently instead of one-after-another.
  const companyIds = await seedCompanies();
  console.log(`   companies: ${companyIds.size}`);

  const [problems, domain, questions, , interviews] = await Promise.all([
    seedDsa(companyIds),
    seedDomain(prisma),
    seedQuiz(),
    seedUsers(),
    seedInterviews(),
  ]);

  console.log(`   dsa problems: ${problems}`);
  console.log(`   domain topics: ${domain.topics} (${domain.withExample} with example)`);
  console.log(`   quiz questions: ${questions}`);
  console.log(`   interview experiences: ${interviews}`);

  console.log(`✅ Seed complete in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
