import { prisma, ProblemStatus } from "@/lib/db";

/**
 * Server-side data for the profile dashboard:
 *  - a month-divided activity heatmap for a SELECTED calendar year (Jan–Dec),
 *    built from real practice signals (DSA `solvedAt` + aptitude `answeredAt`)
 *    bucketed by IST calendar day. A year switcher lets the user view past years.
 *  - per-section solved/total counts (DSA, SQL, Aptitude) split by difficulty.
 *  - current/longest streaks derived from recent activity (the denormalised User
 *    columns are not maintained yet).
 */

const IST_OFFSET_MIN = 330; // UTC+05:30
const DAY_MS = 86_400_000;
// The year the platform went live. The year switcher always offers every year
// from here up to the current year (it auto-extends as the app keeps running).
const APP_LAUNCH_YEAR = 2025;
const pad = (n: number) => String(n).padStart(2, "0");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
/** UTC instant of 00:00 IST on the given IST calendar date. */
const istMidnightUTC = (y: number, m: number, day: number) =>
  new Date(Date.UTC(y, m, day) - IST_OFFSET_MIN * 60_000);

export type HeatCell = {
  key: string;
  count: number;
  dsa: number;
  apt: number;
  level: 0 | 1 | 2 | 3 | 4;
};

// One month's days laid out as week columns (rows = Sun..Sat), padded to 6
// columns so every month block is the same width; null = padding/blank day.
export type MonthBlock = {
  key: string;
  label: string;
  weeks: (HeatCell | null)[][];
};

export type SectionStat = {
  key: "dsa" | "sql" | "aptitude";
  label: string;
  solved: number;
  total: number;
  byDifficulty:
    | { label: "Easy" | "Medium" | "Hard"; solved: number; total: number }[]
    | null;
};

function level(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

export async function getProfileData(userId: string, year?: number) {
  const now = new Date();
  const today = istToday(now);
  const currentYear = today.getUTCFullYear();
  const currentMonth = today.getUTCMonth();
  const explicitYear = !!(year && year >= 2000 && year <= currentYear);
  const selectedYear = explicitYear ? year! : currentYear;

  // Default view: a trailing 12-month window ending with the current month, so
  // today sits at the end and no future days show. Selecting a year switches to
  // that full calendar year (Jan–Dec).
  const monthList: { y: number; m: number }[] = [];
  let windowStartUTC: Date;
  let windowEndUTC: Date;
  if (explicitYear) {
    for (let m = 0; m < 12; m++) monthList.push({ y: selectedYear, m });
    windowStartUTC = istMidnightUTC(selectedYear, 0, 1);
    windowEndUTC = istMidnightUTC(selectedYear + 1, 0, 1);
  } else {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(Date.UTC(currentYear, currentMonth - i, 1));
      monthList.push({ y: d.getUTCFullYear(), m: d.getUTCMonth() });
    }
    const first = monthList[0]!;
    windowStartUTC = istMidnightUTC(first.y, first.m, 1);
    windowEndUTC = istMidnightUTC(currentYear, currentMonth + 1, 1);
  }
  const streakSince = new Date(now.getTime() - 400 * DAY_MS);

  const [
    yearDsa,
    yearApt,
    streakDsa,
    streakApt,
    dsaTotalsRows,
    sqlTotalsRows,
    dsaSolvedRows,
    quizTotal,
    quizSolved,
    firstDsa,
    firstApt,
  ] = await Promise.all([
    prisma.userProblemProgress.findMany({
      where: { userId, status: ProblemStatus.SOLVED, solvedAt: { gte: windowStartUTC, lt: windowEndUTC } },
      select: { solvedAt: true },
    }),
    prisma.userQuizProgress.findMany({
      where: { userId, answeredAt: { gte: windowStartUTC, lt: windowEndUTC } },
      select: { answeredAt: true },
    }),
    prisma.userProblemProgress.findMany({
      where: { userId, status: ProblemStatus.SOLVED, solvedAt: { gte: streakSince } },
      select: { solvedAt: true },
    }),
    prisma.userQuizProgress.findMany({
      where: { userId, answeredAt: { gte: streakSince } },
      select: { answeredAt: true },
    }),
    prisma.dsaProblem.groupBy({ by: ["difficulty"], _count: { _all: true } }),
    prisma.sqlProblem.groupBy({ by: ["difficulty"], _count: { _all: true } }),
    prisma.userProblemProgress.findMany({
      where: { userId, status: ProblemStatus.SOLVED },
      select: { problem: { select: { difficulty: true } } },
    }),
    prisma.quizQuestion.count(),
    // Aptitude "solved" = marks earned (correct without a hint), counted only for
    // submitted tests. Mirrors the per-question `awarded` flag.
    prisma.userQuizProgress.count({ where: { userId, awarded: true } }),
    prisma.userProblemProgress.findFirst({
      where: { userId, status: ProblemStatus.SOLVED, solvedAt: { not: null } },
      orderBy: { solvedAt: "asc" },
      select: { solvedAt: true },
    }),
    prisma.userQuizProgress.findFirst({
      where: { userId },
      orderBy: { answeredAt: "asc" },
      select: { answeredAt: true },
    }),
  ]);

  // ---- Heatmap counts for the selected year, keyed by IST day --------------
  const counts = new Map<string, { count: number; dsa: number; apt: number }>();
  const bump = (d: Date | null, kind: "dsa" | "apt") => {
    if (!d) return;
    const k = istDayKey(d);
    const cur = counts.get(k) ?? { count: 0, dsa: 0, apt: 0 };
    cur.count += 1;
    cur[kind] += 1;
    counts.set(k, cur);
  };
  for (const r of yearDsa) bump(r.solvedAt, "dsa");
  for (const r of yearApt) bump(r.answeredAt, "apt");

  // ---- Month blocks for the window, each padded to 6 columns ---------------
  const months: MonthBlock[] = [];
  for (const { y, m } of monthList) {
    const daysInMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
    const monthWeeks: (HeatCell | null)[][] = [];
    let col: (HeatCell | null)[] = new Array(7).fill(null);
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(Date.UTC(y, m, day));
      const wd = date.getUTCDay();
      if (wd === 0 && day !== 1) {
        monthWeeks.push(col);
        col = new Array(7).fill(null);
      }
      if (date.getTime() > today.getTime()) {
        col[wd] = null; // future day — blank
      } else {
        const k = keyOf(date);
        const c = counts.get(k);
        col[wd] = {
          key: k,
          count: c?.count ?? 0,
          dsa: c?.dsa ?? 0,
          apt: c?.apt ?? 0,
          level: level(c?.count ?? 0),
        };
      }
    }
    monthWeeks.push(col);
    while (monthWeeks.length < 6) monthWeeks.push(new Array(7).fill(null));
    months.push({ key: `${y}-${pad(m + 1)}`, label: MONTHS[m]!, weeks: monthWeeks });
  }

  const totalContributions = [...counts.values()].reduce((s, v) => s + v.count, 0);
  const activeDays = counts.size;

  // ---- Streaks from the recent window --------------------------------------
  const streakDays = new Set<string>();
  for (const r of streakDsa) if (r.solvedAt) streakDays.add(istDayKey(r.solvedAt));
  for (const r of streakApt) streakDays.add(istDayKey(r.answeredAt));

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

  // ---- Available years for the switcher ------------------------------------
  // From the app launch year (or the user's even-earlier first activity, just in
  // case) up to the current year, newest first. Auto-grows each calendar year.
  let earliest = Math.min(APP_LAUNCH_YEAR, currentYear);
  for (const d of [firstDsa?.solvedAt, firstApt?.answeredAt]) {
    if (!d) continue;
    const yy = new Date(d.getTime() + IST_OFFSET_MIN * 60_000).getUTCFullYear();
    if (yy < earliest) earliest = yy;
  }
  const availableYears: number[] = [];
  for (let y = currentYear; y >= earliest; y--) availableYears.push(y);

  // ---- Section dashboard ----------------------------------------------------
  const dsaTotal = { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<string, number>;
  for (const r of dsaTotalsRows) dsaTotal[r.difficulty] = r._count._all;
  const dsaSolved = { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<string, number>;
  for (const r of dsaSolvedRows) {
    dsaSolved[r.problem.difficulty] = (dsaSolved[r.problem.difficulty] ?? 0) + 1;
  }
  const sqlTotal = { EASY: 0, MEDIUM: 0, HARD: 0 } as Record<string, number>;
  for (const r of sqlTotalsRows) sqlTotal[r.difficulty] = r._count._all;

  const sections: SectionStat[] = [
    {
      key: "dsa",
      label: "DSA Sheets",
      solved: dsaSolved.EASY! + dsaSolved.MEDIUM! + dsaSolved.HARD!,
      total: dsaTotal.EASY! + dsaTotal.MEDIUM! + dsaTotal.HARD!,
      byDifficulty: [
        { label: "Easy", solved: dsaSolved.EASY!, total: dsaTotal.EASY! },
        { label: "Medium", solved: dsaSolved.MEDIUM!, total: dsaTotal.MEDIUM! },
        { label: "Hard", solved: dsaSolved.HARD!, total: dsaTotal.HARD! },
      ],
    },
    {
      key: "sql",
      label: "SQL",
      solved: 0, // no per-user SQL solve tracking yet
      total: sqlTotal.EASY! + sqlTotal.MEDIUM! + sqlTotal.HARD!,
      byDifficulty: [
        { label: "Easy", solved: 0, total: sqlTotal.EASY! },
        { label: "Medium", solved: 0, total: sqlTotal.MEDIUM! },
        { label: "Hard", solved: 0, total: sqlTotal.HARD! },
      ],
    },
    {
      key: "aptitude",
      label: "Aptitude",
      solved: quizSolved,
      total: quizTotal,
      byDifficulty: null,
    },
  ];

  const totalSolved = sections.reduce((s, x) => s + x.solved, 0);
  const totalProblems = sections.reduce((s, x) => s + x.total, 0);

  return {
    heatmap: {
      months,
      year: selectedYear,
      rolling: !explicitYear,
      availableYears,
      totalContributions,
      activeDays,
      currentStreak,
      longestStreak,
    },
    sections,
    totalSolved,
    totalProblems,
  };
}
