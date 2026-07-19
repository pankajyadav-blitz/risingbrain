/**
 * Interview-experience-only reseed.
 *
 * `prisma/seed.ts` wipes every content table before reloading, which is fine on
 * a fresh database but destructive once real user data exists. This script
 * touches *only* the interview tables, so it can be run against a populated
 * database without losing DSA/SQL/quiz/course content or user progress.
 *
 *   bun run db:seed-interviews
 *
 * DESTRUCTIVE within its scope: every InterviewExperience is deleted (along
 * with its likes and comments, via cascade) before the 27 posts in
 * seed/interview.json are re-inserted. User-authored posts are NOT spared.
 *
 * Posts are inserted in a random order that never places two posts from the
 * same company back to back, and `createdAt` is spaced out so the feed's
 * `ORDER BY createdAt DESC` reproduces that order. The shuffle is re-rolled on
 * every run, so the feed order changes each time you reseed.
 */
import {
  PrismaClient,
  Difficulty,
  InterviewVerdict,
  Role,
} from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import interviewData from "../seed/interview.json";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Minutes between consecutive posts' createdAt, newest first. */
const SPACING_MINUTES = 47;

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

type InterviewPostJson = {
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
};

/**
 * Spread posts so no two neighbours share a company.
 *
 * Greedy "reorganize string": at each step take the company with the most
 * posts still unplaced, excluding whichever one we just placed. Always
 * draining the largest bucket is what keeps a dominant company (here Microsoft,
 * 9 of 27) from piling up at the tail with nothing left to separate it. Ties
 * are broken randomly, and each company's own posts are shuffled, so the order
 * differs on every run.
 *
 * Only possible when no company holds more than ceil(n/2) posts; if the data
 * ever crosses that line we throw rather than silently emitting a run.
 */
function shuffleAvoidingAdjacentCompanies(
  posts: InterviewPostJson[],
): InterviewPostJson[] {
  const buckets = new Map<string, InterviewPostJson[]>();
  for (const post of posts) {
    const bucket = buckets.get(post.company);
    if (bucket) bucket.push(post);
    else buckets.set(post.company, [post]);
  }
  for (const bucket of buckets.values()) {
    // Fisher-Yates, so which post of a company lands where also varies.
    for (let i = bucket.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [bucket[i], bucket[j]] = [bucket[j]!, bucket[i]!];
    }
  }

  const largest = Math.max(...[...buckets.values()].map((b) => b.length));
  if (largest > Math.ceil(posts.length / 2)) {
    throw new Error(
      `Cannot separate companies: one has ${largest} of ${posts.length} posts ` +
        `(max ${Math.ceil(posts.length / 2)}).`,
    );
  }

  const out: InterviewPostJson[] = [];
  let previous: string | null = null;

  while (out.length < posts.length) {
    const candidates = [...buckets.entries()].filter(
      ([company, bucket]) => bucket.length > 0 && company !== previous,
    );
    if (candidates.length === 0) {
      // Unreachable given the ceil(n/2) check above.
      throw new Error("Ran out of companies to interleave.");
    }

    const most = Math.max(...candidates.map(([, b]) => b.length));
    const tied = candidates.filter(([, b]) => b.length === most);
    const [company, bucket] = tied[Math.floor(Math.random() * tied.length)]!;

    out.push(bucket.pop()!);
    previous = company;
  }

  return out;
}

async function main() {
  const posts = interviewData as InterviewPostJson[];
  const ordered = shuffleAvoidingAdjacentCompanies(posts);

  const deleted = await prisma.interviewExperience.deleteMany();
  console.log(`🗑️  Deleted ${deleted.count} existing interview experiences.`);

  const now = Date.now();

  for (const [index, post] of ordered.entries()) {
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
        // Index 0 is newest, so the feed's createdAt DESC sort mirrors `ordered`.
        createdAt: new Date(now - index * SPACING_MINUTES * 60_000),
      },
    });
  }

  console.log(`✅ Inserted ${ordered.length} interview experiences.`);
  console.log(`   order: ${ordered.map((p) => p.company).join(" → ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
