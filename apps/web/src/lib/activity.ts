/**
 * Activity logging — the write side of the streak/heatmap system.
 *
 * Every meaningful "task done" (a first DSA solve, a newly-answered aptitude
 * question, later course completions) is recorded here so the heatmap and
 * streak can be read from the pre-aggregated `ActivityDay` table (one row per
 * user per IST day) instead of re-scanning the raw progress tables on every
 * navbar render. It appends an audit `Submission` per event and bumps the day's
 * counters atomically.
 *
 * Best-effort by design: a logging failure must NEVER fail the user's actual
 * write (solving a problem must succeed even if the heatmap bump hiccups), so
 * everything here is wrapped in a swallow-and-log guard.
 */
import { prisma, SubmissionType } from "@/lib/db";
import { istToday } from "@/lib/ist";

export type ActivityKind = "dsa" | "mcq" | "course";

const SUBMISSION_TYPE: Record<ActivityKind, SubmissionType> = {
  dsa: SubmissionType.DSA_PROBLEM,
  mcq: SubmissionType.MCQ,
  course: SubmissionType.COURSE_LESSON,
};

const COUNT_COLUMN: Record<ActivityKind, "dsaCount" | "mcqCount" | "courseCount"> = {
  dsa: "dsaCount",
  mcq: "mcqCount",
  course: "courseCount",
};

function isConflict(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code?: unknown }).code === "P2002"
  );
}

/**
 * Record one or more same-kind events for a user on a given IST day.
 * `referenceIds` are the ids of the things acted on (problem/question/lesson);
 * one `Submission` row is written per id and the day's counters go up by the
 * number of ids.
 */
export async function recordActivity(params: {
  userId: string;
  kind: ActivityKind;
  referenceIds: string[];
  /** When the activity happened (defaults to now). Used to pick the IST day. */
  at?: Date;
}): Promise<void> {
  const { userId, kind, referenceIds } = params;
  const n = referenceIds.length;
  if (n === 0) return;

  try {
    const day = istToday(params.at ?? new Date());
    const column = COUNT_COLUMN[kind];

    // Append the audit log rows.
    await prisma.submission.createMany({
      data: referenceIds.map((referenceId) => ({
        userId,
        type: SUBMISSION_TYPE[kind],
        referenceId,
      })),
    });

    // Atomically bump the day's counters. Update-first avoids a create race; if
    // the row doesn't exist yet we create it, and a lost create race (P2002)
    // falls back to the same atomic increment.
    const increment = { count: { increment: n }, [column]: { increment: n } };
    const updated = await prisma.activityDay.updateMany({ where: { userId, day }, data: increment });
    if (updated.count === 0) {
      try {
        await prisma.activityDay.create({
          data: {
            userId,
            day,
            count: n,
            dsaCount: kind === "dsa" ? n : 0,
            mcqCount: kind === "mcq" ? n : 0,
            courseCount: kind === "course" ? n : 0,
          },
        });
      } catch (e) {
        if (!isConflict(e)) throw e;
        await prisma.activityDay.updateMany({ where: { userId, day }, data: increment });
      }
    }
  } catch (err) {
    // Never let a heatmap-logging failure break the user's real write.
    console.error("[activity] failed to record", { userId, kind, n }, err);
  }
}
