import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db";
import { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";
import type { FeedExperience } from "./_lib/types";
import { timeAgo } from "./_lib/format";

/** How many cards per page. Tuned to the 3-column grid (3 full rows). */
export const PAGE_SIZE = 9;

export type FeedSort = "new" | "top";

/** Normalized, validated query params that drive the DB query + the URL. */
export interface FeedParams {
  q: string;
  verdict: InterviewVerdict | null;
  difficulty: Difficulty | null;
  sort: FeedSort;
  page: number;
}

const VERDICTS = new Set<string>(Object.values(InterviewVerdict));
const DIFFICULTIES = new Set<string>(Object.values(Difficulty));

type RawParams = Record<string, string | string[] | undefined>;

/** Parse + sanitize raw searchParams into a safe `FeedParams` (never trusts input). */
export function parseFeedParams(sp: RawParams): FeedParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const verdict = one(sp.verdict).toUpperCase();
  const difficulty = one(sp.difficulty).toUpperCase();
  const page = Number.parseInt(one(sp.page), 10);

  return {
    q: one(sp.q).trim().slice(0, 100),
    verdict: VERDICTS.has(verdict) ? (verdict as InterviewVerdict) : null,
    difficulty: DIFFICULTIES.has(difficulty) ? (difficulty as Difficulty) : null,
    sort: one(sp.sort) === "top" ? "top" : "new",
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

export interface FeedResult {
  experiences: FeedExperience[];
  /** Total rows matching the active filter (for the result count + pagination). */
  filteredTotal: number;
  /** Total published rows, ignoring filters (drives header stats + "X of Y"). */
  globalTotal: number;
  page: number;
  totalPages: number;
  stats: { companies: number; selected: number };
}

/**
 * The single source of truth for the interview feed. Filtering, sorting and
 * pagination all happen in the database, so the page only ever loads PAGE_SIZE
 * rows regardless of how large the table grows.
 */
export async function getInterviewFeed(
  params: FeedParams,
  userId: string | null
): Promise<FeedResult> {
  const where: Prisma.InterviewExperienceWhereInput = { status: "PUBLISHED" };
  if (params.verdict) where.verdict = params.verdict;
  if (params.difficulty) where.difficulty = params.difficulty;
  if (params.q) {
    where.OR = [
      { company: { contains: params.q, mode: "insensitive" } },
      { role: { contains: params.q, mode: "insensitive" } },
      { title: { contains: params.q, mode: "insensitive" } },
      { tags: { has: params.q } },
    ];
  }

  const orderBy: Prisma.InterviewExperienceOrderByWithRelationInput[] =
    params.sort === "top"
      ? [{ likeCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  // Counts + global stats in parallel; they don't depend on the page slice.
  const publishedWhere: Prisma.InterviewExperienceWhereInput = { status: "PUBLISHED" };
  const [filteredTotal, globalTotal, selected, companyGroups] = await Promise.all([
    prisma.interviewExperience.count({ where }),
    prisma.interviewExperience.count({ where: publishedWhere }),
    prisma.interviewExperience.count({
      where: { ...publishedWhere, verdict: InterviewVerdict.SELECTED },
    }),
    prisma.interviewExperience.groupBy({ by: ["company"], where: publishedWhere }),
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredTotal / PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), totalPages); // clamp out-of-range pages

  const rows = await prisma.interviewExperience.findMany({
    where,
    orderBy,
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      author: { select: { name: true, image: true } },
      _count: { select: { comments: true } },
    },
  });

  // Seed which of THIS page's experiences the signed-in user has liked.
  let likedIds = new Set<string>();
  if (userId && rows.length) {
    const likes = await prisma.interviewLike.findMany({
      where: { userId, experienceId: { in: rows.map((r) => r.id) }, isActive: true },
      select: { experienceId: true },
    });
    likedIds = new Set(likes.map((l) => l.experienceId));
  }

  const experiences: FeedExperience[] = rows.map((r) => ({
    id: r.id,
    company: r.company,
    role: r.role,
    verdict: r.verdict,
    difficulty: r.difficulty,
    roundsCount: r.roundsCount,
    title: r.title,
    excerpt: r.excerpt,
    tags: r.tags,
    likeCount: r.likeCount,
    commentCount: r._count.comments,
    createdAt: r.createdAt.toISOString(),
    createdAtLabel: timeAgo(r.createdAt),
    author: { name: r.author.name, image: r.author.image },
    liked: likedIds.has(r.id),
  }));

  return {
    experiences,
    filteredTotal,
    globalTotal,
    page,
    totalPages,
    stats: { companies: companyGroups.length, selected },
  };
}
