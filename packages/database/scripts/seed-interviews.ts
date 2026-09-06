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
 * with its likes and comments, via cascade) before every post in
 * seed/interview.json is re-inserted. User-authored posts are NOT spared.
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
  PublishStatus,
  Role,
} from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

import interviewData from "../seed/interview.json";
import { interviewSlug } from "@risingbrain/core/utils";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

/** Minutes between consecutive posts' createdAt, newest first. */
const SPACING_MINUTES = 47;

/** createMany in chunks, so one oversized statement can't blow the parameter limit. */
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
 * Draw the entries in random order, each company's odds proportional to how
 * many posts it still has unplaced. Sampling without replacement, so the return
 * value is a full permutation of `entries` — callers walk it until one is
 * usable rather than re-drawing.
 */
function weightedShuffle(
  entries: Array<[string, InterviewPostJson[]]>,
): Array<[string, InterviewPostJson[]]> {
  const pool = [...entries];
  const order: Array<[string, InterviewPostJson[]]> = [];

  while (pool.length > 0) {
    const total = pool.reduce((sum, [, bucket]) => sum + bucket.length, 0);
    let ticket = Math.random() * total;
    let i = 0;
    // Guarded on length as well, so float rounding can't walk off the end.
    while (i < pool.length - 1 && ticket >= pool[i]![1].length) {
      ticket -= pool[i]![1].length;
      i++;
    }
    order.push(pool.splice(i, 1)[0]!);
  }

  return order;
}

/**
 * Spread posts so no two neighbours share a company.
 *
 * At each step, pick the next company at random *weighted by how many posts it
 * still has unplaced* (excluding whichever company we just placed), then keep
 * that pick only if what remains can still be arranged. Weighting by remaining
 * count drains a dominant company steadily across the whole feed. Always taking
 * the largest bucket — the obvious greedy — instead produced a rigid
 * "Microsoft → Amazon → Microsoft → Amazon …" head with every small company
 * stranded in the tail, which reads as sorted rather than shuffled.
 *
 * The feasibility guard is what lets the choice stay random. After placing `c`,
 * `m` posts remain and none of them may lead with `c`, so `c` can only occupy
 * the m/2 non-leading slots (positions 1, 3, 5, …) — floor(m/2) of them —
 * while any other company can hold up to ceil(m/2). A candidate that would
 * break either cap paints us into a corner, so we skip to the next draw.
 *
 * Only possible at all when no company holds more than ceil(n/2) posts; if the
 * data ever crosses that line we throw rather than silently emitting a run.
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

    // Posts still unplaced once we've taken this one.
    const remaining = posts.length - out.length - 1;
    const capForPicked = Math.floor(remaining / 2);
    const capForOthers = Math.ceil(remaining / 2);

    const pick = weightedShuffle(candidates).find(([company]) =>
      [...buckets.entries()].every(([other, bucket]) =>
        other === company
          ? bucket.length - 1 <= capForPicked
          : bucket.length <= capForOthers,
      ),
    );
    if (!pick) {
      // Unreachable: the ceil(n/2) check above holds, and the caps below are
      // exactly what keeps it holding for every state we step into.
      throw new Error("Ran out of companies to interleave.");
    }

    const [company, bucket] = pick;
    out.push(bucket.pop()!);
    previous = company;
  }

  return out;
}

async function main() {
  const posts = interviewData as InterviewPostJson[];
  const ordered = shuffleAvoidingAdjacentCompanies(posts);

  // NO deleteMany here, deliberately. This table also holds real user
  // submissions, plus likes and comments that cascade from it — wiping it to
  // reload editorial posts would take all of that with it. Posts are matched by
  // their title-derived slug and updated in place instead (see the upsert below).

  const emailFor = (name: string) => `${slugify(name)}@example.com`;

  // Bulk-create the unique authors first (skipDuplicates keeps existing users),
  // then resolve their ids in one query. Every post is "Anonymous" today, so
  // this collapses one upsert per author into a single round trip. The
  // experiences themselves are upserted individually below, keyed by slug.
  const authorRows = new Map<
    string,
    { email: string; name: string; role: Role }
  >();
  for (const post of ordered) {
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

  const now = Date.now();

  // Two editorial posts could share a title; salt the tie the same way the
  // create path does so every slug stays reproducible across runs.
  const taken = new Set<string>();
  const slugFor = (title: string) => {
    let slug = interviewSlug(title);
    for (let n = 2; taken.has(slug); n++) slug = interviewSlug(title, String(n));
    taken.add(slug);
    return slug;
  };

  // One upsert per post rather than a bulk createMany: the slug is the stable
  // identity, so a rerun edits the row that is already there. Costs 40 round
  // trips, which is the price of not destroying the table on every seed.
  let created = 0;
  for (const [index, post] of ordered.entries()) {
    const content = {
      company: post.company,
      role: post.role,
      verdict: post.verdict as InterviewVerdict,
      difficulty: toDifficulty(post.difficulty),
      roundsCount: post.roundsCount,
      title: post.title,
      excerpt: post.excerpt,
      body: post.body,
      tags: post.tags,
      // Seeded posts bypass the approval queue: they are editorial content, not
      // user submissions, and the column defaults to PENDING_REVIEW so leaving it
      // out would seed an empty feed and a review queue nobody asked for.
      status: PublishStatus.PUBLISHED,
    };

    const slug = slugFor(post.title);
    const before = await prisma.interviewExperience.findUnique({
      where: { slug },
      select: { id: true },
    });

    await prisma.interviewExperience.upsert({
      where: { slug },
      // `likeCount` and `createdAt` are NOT refreshed: likes accumulate from real
      // readers (InterviewLike is the truth), and rewriting createdAt on every
      // seed would reshuffle a feed that is sorted by it.
      update: content,
      create: {
        ...content,
        slug,
        authorId: authorId.get(emailFor(post.authorName))!,
        likeCount: post.likeCount,
        // Index 0 is newest, so the feed's createdAt DESC sort mirrors `ordered`.
        createdAt: new Date(now - index * SPACING_MINUTES * 60_000),
      },
    });
    if (!before) created++;
  }

  console.log(
    `✅ ${ordered.length} interview experiences seeded (${created} created, ${ordered.length - created} updated in place).`,
  );
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
