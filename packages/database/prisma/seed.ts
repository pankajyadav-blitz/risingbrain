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
  CourseLevel,
  CourseTag,
  InterviewVerdict,
  Role,
} from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import dsaData from "../seed/dsa.json";
import sqlData from "../seed/sql.json";
import quizData from "../seed/quiz.json";
import coursesData from "../seed/courses.json";
import interviewData from "../seed/interview.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

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

function canonicalKey(reference: string | null | undefined): string | null {
  if (!reference) return null;
  return slugify(reference); // "LC 167" -> "lc-167"
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
  await prisma.sqlProblem.deleteMany();
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
  let problemCount = 0;
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

  for (const [sheetIdx, sheet] of sheets.entries()) {
    const createdSheet = await prisma.dsaSheet.create({
      data: {
        slug: slugify(sheet.name),
        name: sheet.name,
        description: sheet.description ?? null,
        order: sheet.order ?? sheetIdx,
      },
    });

    for (const [topicIdx, topic] of sheet.topics.entries()) {
      const createdTopic = await prisma.dsaTopic.create({
        data: {
          sheetId: createdSheet.id,
          name: topic.name,
          slug: `${slugify(topic.name)}-${topicIdx}`,
          description: topic.description ?? null,
          order: topicIdx,
        },
      });

      for (const [patternIdx, sub] of topic.subtopics.entries()) {
        const createdPattern = await prisma.dsaPattern.create({
          data: {
            topicId: createdTopic.id,
            name: sub.name,
            slug: `${slugify(sub.name)}-${patternIdx}`,
            strategy: sub.strategy ?? null,
            identification: sub.identification ?? null,
            order: sub.order ?? patternIdx,
          },
        });

        for (const [problemIdx, p] of sub.problems.entries()) {
          const companyConnect = (p.companies ?? [])
            .map((c) => companyIds.get(c.name))
            .filter((id): id is string => Boolean(id))
            .map((companyId) => ({ companyId }));

          await prisma.dsaProblem.create({
            data: {
              patternId: createdPattern.id,
              slug: uniqueSlug(p.id), // stable dataset id; suffixed if reused across patterns
              title: p.title,
              reference: p.reference ?? null,
              canonicalKey: canonicalKey(p.reference),
              difficulty: toDifficulty(p.difficulty),
              leetcodeUrl: p.leetcodeUrl ?? null,
              gfgUrl: p.gfgUrl ?? null,
              youtubeUrl: p.youtubeUrl ?? null,
              order: problemIdx,
              companies: { create: companyConnect },
            },
          });
          problemCount++;
        }
      }
    }
  }
  return problemCount;
}

async function seedSql() {
  const problems = sqlData as Array<{
    slug: string;
    title: string;
    difficulty: string;
    tags: string[];
    topic?: string;
    description: string;
    bestApproach: string;
    solutionQuery: string;
    order?: number;
  }>;
  await prisma.sqlProblem.createMany({
    data: problems.map((p, i) => ({
      slug: p.slug,
      title: p.title,
      difficulty: toDifficulty(p.difficulty),
      tags: p.tags,
      topic: p.topic ?? null,
      description: p.description,
      bestApproach: p.bestApproach,
      solutionQuery: p.solutionQuery,
      order: p.order ?? i,
    })),
  });
  return problems.length;
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

  let questionCount = 0;
  for (const cat of categories) {
    const createdCat = await prisma.quizCategory.create({
      data: {
        kind: cat.kind as QuizKind,
        slug: cat.slug,
        name: cat.name,
        order: cat.order,
      },
    });
    for (const topic of cat.topics) {
      const createdTopic = await prisma.quizTopic.create({
        data: {
          categoryId: createdCat.id,
          name: topic.name,
          slug: topic.slug,
          theory: topic.theory ?? null,
          formula: topic.formula ?? null,
          order: topic.order,
        },
      });
      if (topic.questions.length) {
        await prisma.quizQuestion.createMany({
          data: topic.questions.map((q) => ({
            topicId: createdTopic.id,
            prompt: q.prompt,
            options: q.options,
            answerKey: q.answerKey,
            explanation: q.explanation ?? null,
            hint: q.hint ?? null,
            order: q.order,
          })),
        });
        questionCount += topic.questions.length;
      }
    }
  }
  return questionCount;
}

async function seedCourses() {
  const { instructors, courses } = coursesData as {
    instructors: Array<{
      slug: string;
      name: string;
      bio?: string;
      image?: string | null;
      links?: Record<string, string>;
    }>;
    courses: Array<{
      slug: string;
      title: string;
      blurb?: string;
      icon?: string;
      level: string;
      tag: string;
      priceInPaise: number;
      isFree: boolean;
      rating?: number;
      learnersLabel?: string;
      lessonCount: number;
      durationHours: number;
      isPublished: boolean;
      order: number;
      instructorSlug: string;
    }>;
  };

  const instructorIds = new Map<string, string>();
  for (const ins of instructors) {
    const created = await prisma.instructor.create({
      data: {
        slug: ins.slug,
        name: ins.name,
        bio: ins.bio ?? null,
        image: ins.image ?? null,
        links: ins.links ?? {},
      },
    });
    instructorIds.set(ins.slug, created.id);
  }

  for (const c of courses) {
    await prisma.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        blurb: c.blurb ?? null,
        icon: c.icon ?? null,
        level: c.level as CourseLevel,
        tag: c.tag as CourseTag,
        priceInPaise: c.priceInPaise,
        isFree: c.isFree,
        rating: c.rating ?? null,
        learnersLabel: c.learnersLabel ?? null,
        lessonCount: c.lessonCount,
        durationHours: c.durationHours,
        isPublished: c.isPublished,
        order: c.order,
        instructorId: instructorIds.get(c.instructorSlug) ?? null,
      },
    });
  }
  return courses.length;
}

async function seedUsers() {
  // Demo accounts for local testing. passwordHash stays null until the auth
  // phase wires argon2; these are usable via OAuth or future credential setup.
  const admin = await prisma.user.upsert({
    where: { email: "admin@risingbrain.dev" },
    update: { role: Role.ADMIN },
    create: { email: "admin@risingbrain.dev", name: "RisingBrain Admin", role: Role.ADMIN },
  });
  await prisma.user.upsert({
    where: { email: "learner@risingbrain.dev" },
    update: {},
    create: { email: "learner@risingbrain.dev", name: "Demo Learner", role: Role.NORMAL },
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

  for (const post of posts) {
    const email = `${slugify(post.authorName)}@example.com`;
    const author = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: post.authorName, role: Role.NORMAL },
    });
    await prisma.interviewExperience.create({
      data: {
        authorId: author.id,
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
      },
    });
  }
  return posts.length;
}

async function main() {
  console.log("🌱 Seeding RisingBrain…");
  await clearContent();

  const companyIds = await seedCompanies();
  console.log(`   companies: ${companyIds.size}`);

  const problems = await seedDsa(companyIds);
  console.log(`   dsa problems: ${problems}`);

  const sql = await seedSql();
  console.log(`   sql problems: ${sql}`);

  const questions = await seedQuiz();
  console.log(`   quiz questions: ${questions}`);

  const courses = await seedCourses();
  console.log(`   courses: ${courses}`);

  await seedUsers();
  const interviews = await seedInterviews();
  console.log(`   interview experiences: ${interviews}`);

  console.log("✅ Seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
