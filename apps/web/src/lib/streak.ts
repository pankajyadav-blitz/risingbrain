import { prisma, ProblemStatus } from "@/lib/db";

/**
 * Current practice streak (consecutive IST days with activity, ending today or
 * yesterday) derived from real signals — DSA `solvedAt` + aptitude `answeredAt`.
 * Used by the navbar streak flame; the profile dashboard computes its own from
 * the same signals.
 */

const IST_OFFSET_MIN = 330; // UTC+05:30
const DAY_MS = 86_400_000;
const pad = (n: number) => String(n).padStart(2, "0");

function istKey(d: Date): string {
  const s = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

/**
 * Returns the streak count, or `null` when the activity can't be loaded (a
 * transient DB error). The navbar renders the flame on every page, so a hiccup
 * must NOT throw and take the page down — and `null` lets the caller HIDE the
 * badge entirely rather than show a misleading "broken streak". A real `0` (user
 * signed in, no activity yet) is still a valid value that shows the dull flame.
 */
export async function getCurrentStreak(userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 400 * DAY_MS);

  let dsa: { solvedAt: Date | null }[];
  let apt: { answeredAt: Date }[];
  try {
    [dsa, apt] = await Promise.all([
      prisma.userProblemProgress.findMany({
        where: { userId, status: ProblemStatus.SOLVED, solvedAt: { gte: since } },
        select: { solvedAt: true },
      }),
      prisma.userQuizProgress.findMany({
        where: { userId, answeredAt: { gte: since } },
        select: { answeredAt: true },
      }),
    ]);
  } catch (err) {
    console.error("[streak] failed to load activity, hiding the badge:", err);
    return null;
  }

  const days = new Set<string>();
  for (const r of dsa) if (r.solvedAt) days.add(istKey(r.solvedAt));
  for (const r of apt) days.add(istKey(r.answeredAt));
  if (days.size === 0) return 0;

  const now = new Date();
  // Start today if active, else yesterday (so a not-yet-practiced today doesn't
  // zero out an otherwise-live streak).
  let probe = days.has(istKey(now)) ? now : new Date(now.getTime() - DAY_MS);
  let streak = 0;
  while (days.has(istKey(probe))) {
    streak += 1;
    probe = new Date(probe.getTime() - DAY_MS);
  }
  return streak;
}
