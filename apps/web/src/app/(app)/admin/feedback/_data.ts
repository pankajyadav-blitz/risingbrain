import { prisma, FeedbackStatus } from "@/lib/db";
import type { Prisma } from "@/lib/db";

/**
 * Reads behind the feedback inbox. Separate from the widget's own endpoint for
 * the same reason the interview queue is separate from the feed: that side only
 * ever needs "how many of MINE are unread", this side needs everybody's, with
 * the author attached.
 */

/** Notes per page. Each card carries a whole write-up, so keep it small. */
export const INBOX_PAGE_SIZE = 15;

/** The statuses the inbox has a tab for, in tab order. */
export const INBOX_TABS = [FeedbackStatus.NEW, FeedbackStatus.VIEWED] as const;

export type InboxStatus = (typeof INBOX_TABS)[number];

export interface InboxParams {
  status: InboxStatus;
  q: string;
  page: number;
}

type RawParams = Record<string, string | string[] | undefined>;

/** Parse raw searchParams into safe inbox params (never trusts input). */
export function parseInboxParams(sp: RawParams): InboxParams {
  const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const status = one(sp.status).toUpperCase();
  const page = Number.parseInt(one(sp.page), 10);

  return {
    status: (INBOX_TABS as readonly string[]).includes(status)
      ? (status as InboxStatus)
      : FeedbackStatus.NEW, // the inbox opens on the work to be done
    q: one(sp.q).trim().slice(0, 100),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

const INBOX_SELECT = {
  id: true,
  body: true,
  rating: true,
  status: true,
  reviewedAt: true,
  createdAt: true,
  reviewedBy: { select: { name: true, email: true } },
  user: { select: { id: true, name: true, email: true, image: true, disabledAt: true } },
} satisfies Prisma.FeedbackSelect;

export type InboxItem = Prisma.FeedbackGetPayload<{ select: typeof INBOX_SELECT }>;

export interface InboxResult {
  items: InboxItem[];
  total: number;
  page: number;
  totalPages: number;
  /** Row count per status — drives the tab badges (and the "all clear" state). */
  counts: Record<InboxStatus, number>;
}

/**
 * One page of the inbox plus the per-status counts.
 *
 * NEW is ordered NEWEST first, unlike the interview queue's FIFO: feedback is
 * usually a reaction to something that just broke, so the freshest note is the
 * most actionable one — and unlike a submission waiting on a verdict, an old
 * unread note isn't blocking its author from doing anything except sending more.
 */
export async function getFeedbackInbox(params: InboxParams): Promise<InboxResult> {
  const where: Prisma.FeedbackWhereInput = { status: params.status };
  if (params.q) {
    where.OR = [
      { body: { contains: params.q, mode: "insensitive" } },
      { user: { email: { contains: params.q, mode: "insensitive" } } },
      { user: { name: { contains: params.q, mode: "insensitive" } } },
    ];
  }

  const [total, ...tabTotals] = await Promise.all([
    prisma.feedback.count({ where }),
    ...INBOX_TABS.map((s) => prisma.feedback.count({ where: { status: s } })),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / INBOX_PAGE_SIZE));
  const page = Math.min(Math.max(1, params.page), totalPages); // clamp out-of-range pages

  const items = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * INBOX_PAGE_SIZE,
    take: INBOX_PAGE_SIZE,
    select: INBOX_SELECT,
  });

  const counts = Object.fromEntries(
    INBOX_TABS.map((s, i) => [s, tabTotals[i] ?? 0]),
  ) as Record<InboxStatus, number>;

  return { items, total, page, totalPages, counts };
}

/**
 * The overview card's figures: what still needs reading, what has been read, and
 * the average score across every note that carried one.
 *
 * `_avg` ignores NULLs, which is exactly right here — a bug report with no stars
 * is not a zero, and counting it as one would drag the average down every time
 * someone used the widget for its other purpose.
 */
export async function getFeedbackSummary(): Promise<{
  unread: number;
  read: number;
  averageRating: number | null;
  rated: number;
}> {
  const [unread, read, agg] = await Promise.all([
    prisma.feedback.count({ where: { status: FeedbackStatus.NEW } }),
    prisma.feedback.count({ where: { status: FeedbackStatus.VIEWED } }),
    prisma.feedback.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
      where: { rating: { not: null } },
    }),
  ]);

  return {
    unread,
    read,
    averageRating: agg._avg.rating,
    rated: agg._count.rating,
  };
}
