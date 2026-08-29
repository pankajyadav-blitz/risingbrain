import { prisma, PublishStatus } from "@/lib/db";
import type { Prisma } from "@/lib/db";

/**
 * Reads behind the interview approval queue. Deliberately separate from
 * `(app)/interview/_data.ts`: that loader exists to hide everything but
 * PUBLISHED rows, while this one exists to show the rows it hides — including
 * the full body an admin has to read before ruling on it.
 */

/** Submissions per page. Each card carries a whole write-up, so keep it small. */
export const QUEUE_PAGE_SIZE = 10;

/** The statuses the queue has a tab for, in tab order. */
export const QUEUE_TABS = [
  PublishStatus.PENDING_REVIEW,
  PublishStatus.PUBLISHED,
  PublishStatus.REJECTED,
  PublishStatus.ARCHIVED,
] as const;

export type QueueStatus = (typeof QUEUE_TABS)[number];

export interface QueueParams {
  status: QueueStatus;
  q: string;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

/** Parse raw searchParams into safe queue params (never trusts input). */
export function parseQueueParams(sp: RawParams): QueueParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const status = one(sp.status).toUpperCase();
  const page = Number.parseInt(one(sp.page), 10);

  return {
    status: (QUEUE_TABS as readonly string[]).includes(status)
      ? (status as QueueStatus)
      : PublishStatus.PENDING_REVIEW, // the queue opens on the work to be done
    q: one(sp.q).trim().slice(0, 100),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

const QUEUE_SELECT = {
  id: true,
  company: true,
  role: true,
  verdict: true,
  difficulty: true,
  roundsCount: true,
  title: true,
  excerpt: true,
  body: true,
  tags: true,
  status: true,
  reviewNote: true,
  reviewedAt: true,
  likeCount: true,
  createdAt: true,
  updatedAt: true,
  reviewedBy: { select: { name: true, email: true } },
  author: {
    select: { id: true, name: true, email: true, image: true, disabledAt: true, role: true },
  },
  // How much of a track record this author has, so a moderator can tell a
  // first-time poster from someone with ten approved write-ups without leaving
  // the card.
  _count: { select: { comments: true } },
} satisfies Prisma.InterviewExperienceSelect;

export type QueueItem = Prisma.InterviewExperienceGetPayload<{ select: typeof QUEUE_SELECT }>;

export interface QueueResult {
  items: QueueItem[];
  total: number;
  page: number;
  totalPages: number;
  /** Row count per status — drives the tab badges (and the "0 waiting" state). */
  counts: Record<QueueStatus, number>;
}

/**
 * One page of the queue plus the per-status counts. PENDING_REVIEW is ordered
 * OLDEST FIRST — a review queue is a FIFO, and burying the submission that has
 * waited longest under today's arrivals is how posts get forgotten. Every other
 * tab is a browse view, so those read newest first.
 */
export async function getReviewQueue(params: QueueParams): Promise<QueueResult> {
  const where: Prisma.InterviewExperienceWhereInput = { status: params.status };
  if (params.q) {
    where.OR = [
      { company: { contains: params.q, mode: "insensitive" } },
      { role: { contains: params.q, mode: "insensitive" } },
      { title: { contains: params.q, mode: "insensitive" } },
      { author: { email: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  const [total, ...tabTotals] = await Promise.all([
    prisma.interviewExperience.count({ where }),
    ...QUEUE_TABS.map((s) => prisma.interviewExperience.count({ where: { status: s } })),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / QUEUE_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), totalPages); // clamp out-of-range pages

  const items = await prisma.interviewExperience.findMany({
    where,
    orderBy:
      params.status === PublishStatus.PENDING_REVIEW
        ? { createdAt: "asc" }
        : { createdAt: "desc" },
    skip: (page - 1) * QUEUE_PAGE_SIZE,
    take: QUEUE_PAGE_SIZE,
    select: QUEUE_SELECT,
  });

  const counts = Object.fromEntries(
    QUEUE_TABS.map((s, i) => [s, tabTotals[i] ?? 0]),
  ) as Record<QueueStatus, number>;

  return { items, total, page, totalPages, counts };
}

/** Just the pending count — for the admin overview card's badge. */
export function countPendingInterviews(): Promise<number> {
  return prisma.interviewExperience.count({
    where: { status: PublishStatus.PENDING_REVIEW },
  });
}
