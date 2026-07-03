/**
 * Backfill the pre-aggregated activity tables (`ActivityDay` + `Submission`)
 * from historical per-user signals, so the heatmap/streak — which now READ from
 * `ActivityDay` — reflect activity recorded before this table was wired up.
 *
 * Sources (matching the live heatmap semantics):
 *   - DSA:   UserProblemProgress rows with status=SOLVED and a `solvedAt`, one
 *            contribution per problem on its solve day (IST).
 *   - MCQ:   active UserQuizProgress rows, one contribution per answered question
 *            on its `answeredAt` day (IST).
 *
 * Idempotent & non-destructive: `ActivityDay` is written with SET semantics
 * (recomputed totals, never incremented, never deleted), so re-running is safe.
 * `Submission` audit rows are created only for users who have none yet (there is
 * no natural key to dedupe on), so a re-run won't duplicate them.
 *
 * Run with:  bun run packages/database/scripts/backfill-activity.ts
 */
import { PrismaClient, SubmissionType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const IST_OFFSET_MIN = 330; // UTC+05:30

/** UTC-midnight Date of the IST calendar day an instant falls on (matches ActivityDay.day). */
function istDayUTC(d: Date): Date {
  const s = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}

/** Retry an op a few times — Neon's serverless pooler drops connections under load. */
async function withRetry<T>(op: () => Promise<T>, tries = 4): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await op();
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 300 * (i + 1)));
    }
  }
  throw lastErr;
}

type DayAgg = { dsa: number; mcq: number };

async function main() {
  const [solves, answers] = await Promise.all([
    withRetry(() =>
      prisma.userProblemProgress.findMany({
        where: { status: "SOLVED", solvedAt: { not: null } },
        select: { userId: true, problemId: true, solvedAt: true },
      })
    ),
    withRetry(() =>
      prisma.userQuizProgress.findMany({
        where: { isActive: true },
        select: { userId: true, questionId: true, answeredAt: true },
      })
    ),
  ]);

  // userId -> (dayTime -> { dsa, mcq })
  const byUser = new Map<string, Map<number, DayAgg>>();
  // userId -> Submission rows to insert
  const submissions = new Map<string, { type: SubmissionType; referenceId: string; createdAt: Date }[]>();

  const add = (
    userId: string,
    at: Date,
    kind: "dsa" | "mcq",
    type: SubmissionType,
    referenceId: string
  ) => {
    const dayTime = istDayUTC(at).getTime();
    const days = byUser.get(userId) ?? new Map<number, DayAgg>();
    const agg = days.get(dayTime) ?? { dsa: 0, mcq: 0 };
    agg[kind] += 1;
    days.set(dayTime, agg);
    byUser.set(userId, days);

    const subs = submissions.get(userId) ?? [];
    subs.push({ type, referenceId, createdAt: at });
    submissions.set(userId, subs);
  };

  for (const s of solves) {
    if (s.solvedAt) add(s.userId, s.solvedAt, "dsa", SubmissionType.DSA_PROBLEM, s.problemId);
  }
  for (const a of answers) {
    add(a.userId, a.answeredAt, "mcq", SubmissionType.MCQ, a.questionId);
  }

  let dayRows = 0;
  let subRows = 0;
  const CHUNK = 15;

  for (const [userId, days] of byUser) {
    // ActivityDay — SET semantics (idempotent).
    const entries = [...days.entries()];
    for (let i = 0; i < entries.length; i += CHUNK) {
      const slice = entries.slice(i, i + CHUNK);
      await Promise.all(
        slice.map(([dayTime, agg]) => {
          const day = new Date(dayTime);
          const count = agg.dsa + agg.mcq;
          return withRetry(() =>
            prisma.activityDay.upsert({
              where: { userId_day: { userId, day } },
              create: { userId, day, count, dsaCount: agg.dsa, mcqCount: agg.mcq },
              update: { count, dsaCount: agg.dsa, mcqCount: agg.mcq, sqlCount: 0, courseCount: 0 },
            })
          );
        })
      );
      dayRows += slice.length;
    }

    // Submission audit log — only if the user has none yet (avoids duplicates).
    const existing = await withRetry(() => prisma.submission.count({ where: { userId } }));
    if (existing === 0) {
      const subs = submissions.get(userId) ?? [];
      for (let i = 0; i < subs.length; i += 100) {
        const slice = subs.slice(i, i + 100);
        await withRetry(() =>
          prisma.submission.createMany({ data: slice.map((s) => ({ userId, ...s })) })
        );
        subRows += slice.length;
      }
    }
  }

  console.log(`users with activity: ${byUser.size}`);
  console.log(`ActivityDay rows written: ${dayRows}`);
  console.log(`Submission rows created: ${subRows}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
