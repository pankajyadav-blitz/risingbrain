import { cacheLife, cacheTag } from "next/cache";
import { prisma, ProblemStatus } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";

/**
 * The full published DSA sheet tree — sheets → topics → patterns → problems →
 * companies. This is SHARED, seeded content: identical for every user and only
 * changes on a re-seed, so it is cached cross-request and tagged for on-demand
 * revalidation (see /api/admin/revalidate). It reads NO cookies and NO per-user
 * data — progress, bookmarks and notes are layered on per request in the page.
 */
export async function getDsaCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.dsaCatalog);

  return prisma.dsaSheet.findMany({
    where: { isPublished: true },
    orderBy: { order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          patterns: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              name: true,
              strategy: true,
              identification: true,
              problems: {
                orderBy: { order: "asc" },
                select: {
                  id: true,
                  slug: true,
                  title: true,
                  reference: true,
                  difficulty: true,
                  leetcodeUrl: true,
                  gfgUrl: true,
                  youtubeUrl: true,
                  companies: {
                    select: { company: { select: { name: true, logoUrl: true } } },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

export type DsaCatalog = Awaited<ReturnType<typeof getDsaCatalog>>;

/**
 * Server-side activity data for the DSA Sheet route's calendar widget.
 *
 * Unlike the profile heatmap (which combines DSA + aptitude), this is scoped to
 * SHEET activity ONLY — i.e. DSA problems marked solved (`UserProblemProgress`
 * with `solvedAt`), bucketed by IST calendar day. It powers the month-by-month
 * "solve streak" calendar in the sheet hero's right rail.
 */

const IST_OFFSET_MIN = 330; // UTC+05:30
const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

// How many trailing months the calendar can page back through (incl. current).
const NUM_MONTHS = 6;

const MONTHS_LONG = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** YYYY-MM-DD for the IST calendar day a UTC instant falls on. */
function istDayKey(d: Date): string {
  const s = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}
/** IST "today" as a UTC-midnight Date we can iterate in getUTC* space. */
function istToday(now: Date): Date {
  const s = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}
const keyOf = (d: Date) =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const addDays = (d: Date, n: number) => new Date(d.getTime() + n * DAY_MS);

export type SheetDayCell = {
  key: string; // YYYY-MM-DD (IST)
  day: number; // day of month (1..N)
  count: number; // DSA solves logged that day
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
  future: boolean;
};

export type SheetMonth = {
  key: string; // YYYY-MM
  label: string; // "June 2026"
  leading: number; // blank cells before day 1 (0=Sun .. 6=Sat)
  cells: SheetDayCell[];
};

export type SheetActivity = {
  months: SheetMonth[]; // chronological, oldest -> current (length NUM_MONTHS)
  currentStreak: number;
  longestStreak: number;
  totalSolved: number; // all-time DSA solves
  todayKey: string;
  joinedKey: string; // IST day the user's account was created (YYYY-MM-DD)
};

export function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

export async function getSheetActivity(userId: string): Promise<SheetActivity> {
  const now = new Date();
  const today = istToday(now);
  const todayKey = keyOf(today);
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();

  // Window = first day of the earliest displayed month (IST) -> now.
  const firstMonthFirstDay = new Date(Date.UTC(currentYear, currentMonth - (NUM_MONTHS - 1), 1));
  const windowStartUTC = new Date(firstMonthFirstDay.getTime() - IST_OFFSET_MIN * 60_000);
  // Streaks need a longer look-back than the visible window.
  const streakSince = new Date(now.getTime() - 400 * DAY_MS);

  const [windowRows, streakRows, totalSolved, user] = await Promise.all([
    prisma.userProblemProgress.findMany({
      where: { userId, status: ProblemStatus.SOLVED, solvedAt: { gte: windowStartUTC } },
      select: { solvedAt: true },
    }),
    prisma.userProblemProgress.findMany({
      where: { userId, status: ProblemStatus.SOLVED, solvedAt: { gte: streakSince } },
      select: { solvedAt: true },
    }),
    prisma.userProblemProgress.count({ where: { userId, status: ProblemStatus.SOLVED } }),
    prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
  ]);

  const joinedKey = user ? istDayKey(user.createdAt) : todayKey;

  // ---- Daily solve counts in the visible window, keyed by IST day ----------
  const counts = new Map<string, number>();
  for (const r of windowRows) {
    if (!r.solvedAt) continue;
    const k = istDayKey(r.solvedAt);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  // ---- One block per visible month -----------------------------------------
  const months: SheetMonth[] = [];
  for (let i = NUM_MONTHS - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
    const y = d.getUTCFullYear();
    const m = d.getUTCMonth();
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const leading = new Date(Date.UTC(y, m, 1)).getUTCDay(); // 0=Sun
    const cells: SheetDayCell[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(y, m, day));
      const k = keyOf(date);
      const future = date.getTime() > today.getTime();
      const count = counts.get(k) ?? 0;
      cells.push({
        key: k,
        day,
        count,
        level: future ? 0 : levelFor(count),
        isToday: k === todayKey,
        future,
      });
    }
    months.push({ key: `${y}-${pad(m + 1)}`, label: `${MONTHS_LONG[m]} ${y}`, leading, cells });
  }

  // ---- Streaks from the recent window --------------------------------------
  const streakDays = new Set<string>();
  for (const r of streakRows) if (r.solvedAt) streakDays.add(istDayKey(r.solvedAt));

  let currentStreak = 0;
  let probe = streakDays.has(keyOf(today)) ? today : addDays(today, -1);
  while (streakDays.has(keyOf(probe))) {
    currentStreak += 1;
    probe = addDays(probe, -1);
  }

  let longestStreak = 0;
  let run = 0;
  let prevKey: string | null = null;
  for (const k of [...streakDays].sort()) {
    if (prevKey && (Date.parse(k) - Date.parse(prevKey)) / DAY_MS === 1) run += 1;
    else run = 1;
    longestStreak = Math.max(longestStreak, run);
    prevKey = k;
  }

  return { months, currentStreak, longestStreak, totalSolved, todayKey, joinedKey };
}
