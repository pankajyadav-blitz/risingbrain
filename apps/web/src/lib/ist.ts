/**
 * IST (UTC+05:30) calendar-day helpers — the single source of truth for how the
 * app buckets activity into days. Streaks and the heatmap are computed in IST so
 * a solve at 1am IST lands on the right local day regardless of server TZ.
 *
 * Previously these helpers were copy-pasted into streak.ts, sheet/_data.ts and
 * profile/_data.ts; centralizing them removes the drift risk between those views.
 */

export const IST_OFFSET_MIN = 330; // UTC+05:30
export const DAY_MS = 86_400_000;

const pad = (n: number) => String(n).padStart(2, "0");

/** `YYYY-MM-DD` for the IST calendar day a UTC instant falls on. */
export function istDayKey(d: Date): string {
  const s = new Date(d.getTime() + IST_OFFSET_MIN * 60_000);
  return `${s.getUTCFullYear()}-${pad(s.getUTCMonth() + 1)}-${pad(s.getUTCDate())}`;
}

/** IST "today" as a UTC-midnight Date we can iterate in getUTC* space. */
export function istToday(now: Date): Date {
  const s = new Date(now.getTime() + IST_OFFSET_MIN * 60_000);
  return new Date(Date.UTC(s.getUTCFullYear(), s.getUTCMonth(), s.getUTCDate()));
}

/** UTC instant of 00:00 IST on the given IST calendar date. */
export function istMidnightUTC(y: number, m: number, day: number): Date {
  return new Date(Date.UTC(y, m, day) - IST_OFFSET_MIN * 60_000);
}

/** `YYYY-MM-DD` for a Date already expressed in UTC-midnight space. */
export const keyOf = (d: Date): string =>
  `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export const addDays = (d: Date, n: number): Date => new Date(d.getTime() + n * DAY_MS);
