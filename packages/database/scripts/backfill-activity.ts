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
 * ── Why this is written in bulk ───────────────────────────────────────────────
 * The first version issued ONE `activityDay.upsert` per (user, day) plus one
 * `submission.count` per user — ~54k round trips. Against a remote Neon database
 * that ran for 3+ hours and *decelerated* (the per-user count scans a table that
 * grows as the run proceeds), and the constant connection churn eventually tripped
 * a Bun socket bug (`internalConnectMultipleTimeout`) once pointed at the direct
 * (non-pooled) endpoint, which accepts far fewer connections than the pooler.
 *
 * Everything below is set-based: `INSERT … SELECT FROM unnest(...) ON CONFLICT`,
 * ~1000 rows per round trip, over a small fixed connection pool. Same results,
 * ~150 round trips instead of ~54,000.
 *
 * ── Idempotent & non-destructive ──────────────────────────────────────────────
 *   - `ActivityDay` is written with SET semantics (recomputed totals, never
 *     incremented) via ON CONFLICT DO UPDATE, so re-running is always safe.
 *   - `Submission` has no natural unique key, so it can't use ON CONFLICT. Instead
 *     the expected count per user is compared against the actual count in ONE
 *     grouped query:
 *        exact match  -> skip (already done)
 *        zero         -> insert all
 *        partial      -> delete this user's backfilled rows, then reinsert
 *     That last case is what makes a killed/crashed run recoverable: the old
 *     `count === 0` check would skip a half-written user forever, leaving them
 *     permanently short.
 *
 * Run with:  bun run packages/database/scripts/backfill-activity.ts
 */
import { PrismaClient, SubmissionType } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// A small, long-lived pool. Large pools + per-row queries are what tripped the
// Bun connect-timeout crash against the direct Neon endpoint; generous timeouts
// also ride out Neon's cold start instead of failing the run.
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: 4,
  connectionTimeoutMillis: 30_000,
  idleTimeoutMillis: 30_000,
  keepAlive: true,
});
const prisma = new PrismaClient({ adapter });

const IST_OFFSET_MIN = 330; // UTC+05:30
const CHUNK = 1000;

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
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastErr;
}

function chunked<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function progress(label: string, total: number) {
  const t0 = Date.now();
  let done = 0;
  return (n: number) => {
    done += n;
    const secs = (Date.now() - t0) / 1000;
    const rate = done / Math.max(secs, 0.001);
    const eta = rate > 0 ? Math.round((total - done) / rate) : 0;
    console.log(
      `   ${label}: ${done}/${total} (${Math.round((done / total) * 100)}%)  ` +
        `${Math.round(rate)}/s  eta ${eta > 90 ? `${Math.round(eta / 60)}m` : `${eta}s`}`
    );
  };
}

/**
 * Prints an elapsed-time line every 10s while a long await is in flight.
 * Without this the initial reads (180k+ rows over the network) are completely
 * silent for a minute or more and the script looks hung.
 */
function heartbeat(label: string) {
  const t0 = Date.now();
  const timer = setInterval(() => {
    console.log(`   …${label} still running (${Math.round((Date.now() - t0) / 1000)}s)`);
  }, 10_000);
  return () => {
    clearInterval(timer);
    return Math.round((Date.now() - t0) / 1000);
  };
}

type DayAgg = { dsa: number; mcq: number };

async function main() {
  const started = Date.now();

  console.log("[1/4] reading solved problems…");
  let stop = heartbeat("reading solves");
  const solves = await withRetry(() =>
    prisma.userProblemProgress.findMany({
      where: { status: "SOLVED", solvedAt: { not: null } },
      select: { userId: true, problemId: true, solvedAt: true },
    })
  );
  console.log(`   ${solves.length} solves in ${stop()}s`);

  console.log("[2/4] reading quiz answers…");
  stop = heartbeat("reading quiz answers");
  const answers = await withRetry(() =>
    prisma.userQuizProgress.findMany({
      where: { isActive: true },
      select: { userId: true, questionId: true, answeredAt: true },
    })
  );
  console.log(`   ${answers.length} quiz answers in ${stop()}s`);

  // ── Aggregate in memory (cheap) ────────────────────────────────────────────
  const byUser = new Map<string, Map<number, DayAgg>>();
  const submissions = new Map<
    string,
    { type: SubmissionType; referenceId: string; createdAt: Date }[]
  >();

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
  for (const a of answers) add(a.userId, a.answeredAt, "mcq", SubmissionType.MCQ, a.questionId);

  // ── 1. ActivityDay — bulk upsert, SET semantics ────────────────────────────
  // One row per (user, day) by construction, so a batch can never contain the
  // same conflict target twice ("cannot affect row a second time").
  const dayRows: { userId: string; day: Date; dsa: number; mcq: number }[] = [];
  for (const [userId, days] of byUser) {
    for (const [dayTime, agg] of days) {
      dayRows.push({ userId, day: new Date(dayTime), dsa: agg.dsa, mcq: agg.mcq });
    }
  }
  console.log(`[3/4] ActivityDay: ${dayRows.length} rows across ${byUser.size} users`);
  const tickDays = progress("activity days", dayRows.length);
  for (const part of chunked(dayRows)) {
    await withRetry(
      () => prisma.$executeRaw`
        INSERT INTO activity_days
          (id, "userId", day, count, "dsaCount", "mcqCount", "courseCount", "createdAt", "updatedAt")
        SELECT gen_random_uuid()::text, t.u, t.d, t.dsa + t.mcq, t.dsa, t.mcq, 0, now(), now()
        FROM unnest(
          ${part.map((r) => r.userId)}::text[],
          ${part.map((r) => r.day)}::date[],
          ${part.map((r) => r.dsa)}::int[],
          ${part.map((r) => r.mcq)}::int[]
        ) AS t(u, d, dsa, mcq)
        ON CONFLICT ("userId", day) DO UPDATE SET
          count         = EXCLUDED.count,
          "dsaCount"    = EXCLUDED."dsaCount",
          "mcqCount"    = EXCLUDED."mcqCount",
          "courseCount" = 0,
          "updatedAt"   = now()`
    );
    tickDays(part.length);
  }

  // ── 2. Submission — decide per user in ONE grouped query ───────────────────
  // `Submission` has no unique key to conflict on, so duplicates are avoided by
  // comparing expected vs actual counts rather than blindly inserting.
  console.log("[4/4] Submission: comparing expected vs existing counts…");
  const stopCount = heartbeat("counting existing submissions");
  const existingRows = await withRetry(() =>
    prisma.$queryRaw<{ userId: string; n: bigint }[]>`
      SELECT "userId", count(*) AS n
      FROM submissions
      WHERE type IN ('DSA_PROBLEM'::"SubmissionType", 'MCQ'::"SubmissionType")
      GROUP BY "userId"`
  );
  console.log(`   counted ${existingRows.length} users in ${stopCount()}s`);
  const existing = new Map(existingRows.map((r) => [r.userId, Number(r.n)]));

  const toInsert: string[] = []; // users with nothing yet
  const toRepair: string[] = []; // users written partially by a killed run
  let skipped = 0;
  for (const [userId, subs] of submissions) {
    const have = existing.get(userId) ?? 0;
    if (have === subs.length) skipped++;
    else if (have === 0) toInsert.push(userId);
    else toRepair.push(userId);
  }
  console.log(
    `   ${skipped} users already complete, ${toInsert.length} to insert, ${toRepair.length} partial to repair`
  );

  if (toRepair.length) {
    // Clear only the backfilled kinds for these users, then reinsert cleanly.
    for (const part of chunked(toRepair)) {
      await withRetry(() =>
        prisma.submission.deleteMany({
          where: {
            userId: { in: part },
            type: { in: [SubmissionType.DSA_PROBLEM, SubmissionType.MCQ] },
          },
        })
      );
    }
    console.log(`   cleared partial rows for ${toRepair.length} users`);
  }

  const pendingUsers = [...toInsert, ...toRepair];
  const flat: { userId: string; type: SubmissionType; referenceId: string; createdAt: Date }[] = [];
  for (const userId of pendingUsers) {
    for (const s of submissions.get(userId) ?? []) flat.push({ userId, ...s });
  }
  console.log(`Submission: ${flat.length} rows to write`);
  const tickSubs = progress("submissions", flat.length);
  for (const part of chunked(flat)) {
    await withRetry(
      () => prisma.$executeRaw`
        INSERT INTO submissions (id, "userId", type, "referenceId", "createdAt")
        SELECT gen_random_uuid()::text, t.u, t.ty::"SubmissionType", t.r, t.c
        FROM unnest(
          ${part.map((r) => r.userId)}::text[],
          ${part.map((r) => String(r.type))}::text[],
          ${part.map((r) => r.referenceId)}::text[],
          ${part.map((r) => r.createdAt)}::timestamptz[]
        ) AS t(u, ty, r, c)`
    );
    tickSubs(part.length);
  }

  console.log(`\nusers with activity:      ${byUser.size}`);
  console.log(`ActivityDay rows written: ${dayRows.length}`);
  console.log(`Submission rows written:  ${flat.length}  (${skipped} users already complete)`);
  console.log(`done in ${Math.round((Date.now() - started) / 1000)}s`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
