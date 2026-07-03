import { prisma } from "@/lib/db";
import { DAY_MS, istToday, keyOf } from "@/lib/ist";

/**
 * Current practice streak (consecutive IST days with activity, ending today or
 * yesterday). Reads the pre-aggregated `ActivityDay` table — one row per active
 * day — instead of scanning the raw progress tables, so the navbar flame (which
 * renders on EVERY page) costs a single small indexed range scan.
 */

/**
 * Returns the streak count, or `null` when the activity can't be loaded (a
 * transient DB error). The navbar renders the flame on every page, so a hiccup
 * must NOT throw and take the page down — and `null` lets the caller HIDE the
 * badge entirely rather than show a misleading "broken streak". A real `0` (user
 * signed in, no activity yet) is still a valid value that shows the dull flame.
 */
export async function getCurrentStreak(userId: string): Promise<number | null> {
  const since = new Date(Date.now() - 400 * DAY_MS);

  let rows: { day: Date }[];
  try {
    rows = await prisma.activityDay.findMany({
      where: { userId, day: { gte: since }, count: { gt: 0 } },
      select: { day: true },
    });
  } catch (err) {
    console.error("[streak] failed to load activity, hiding the badge:", err);
    return null;
  }

  const days = new Set<string>(rows.map((r) => keyOf(r.day)));
  if (days.size === 0) return 0;

  const today = istToday(new Date());
  // Start today if active, else yesterday (so a not-yet-practiced today doesn't
  // zero out an otherwise-live streak).
  let probe = days.has(keyOf(today)) ? today : new Date(today.getTime() - DAY_MS);
  let streak = 0;
  while (days.has(keyOf(probe))) {
    streak += 1;
    probe = new Date(probe.getTime() - DAY_MS);
  }
  return streak;
}
