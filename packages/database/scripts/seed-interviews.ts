/**
 * Interview-experience-only seed.
 *
 * `prisma/seed.ts` wipes every content table before reloading, which is fine on
 * a fresh database but destructive once real user data exists. This script
 * touches *only* interview experiences (plus the demo author users they need),
 * so it is safe to run against a populated database.
 *
 *   bun run db:seed-interviews
 *
 * Idempotent: posts are matched by `title` (unique across seed/interview.json)
 * and updated in place, so re-running never creates duplicates and never
 * detaches existing likes/comments. `likeCount` is only written on create —
 * on an existing post the denormalized counter is left alone because
 * InterviewLike rows are the source of truth there.
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

async function main() {
  const posts = interviewData as InterviewPostJson[];
  console.log(`🌱 Syncing ${posts.length} interview experiences…`);

  let created = 0;
  let updated = 0;

  for (const post of posts) {
    const email = `${slugify(post.authorName)}@example.com`;
    const author = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name: post.authorName, role: Role.NORMAL },
    });

    const shared = {
      authorId: author.id,
      company: post.company,
      role: post.role,
      verdict: post.verdict as InterviewVerdict,
      difficulty: toDifficulty(post.difficulty),
      roundsCount: post.roundsCount,
      excerpt: post.excerpt,
      body: post.body,
      tags: post.tags,
    };

    const existing = await prisma.interviewExperience.findFirst({
      where: { title: post.title },
      select: { id: true },
    });

    if (existing) {
      await prisma.interviewExperience.update({
        where: { id: existing.id },
        data: shared,
      });
      updated += 1;
    } else {
      await prisma.interviewExperience.create({
        data: { ...shared, title: post.title, likeCount: post.likeCount },
      });
      created += 1;
    }
  }

  console.log(`✅ Done — ${created} created, ${updated} updated.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
