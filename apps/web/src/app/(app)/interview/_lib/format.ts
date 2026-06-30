import { CircleCheck, CircleX, Clock3, type LucideIcon } from "lucide-react";
import { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";

/** A subtle pill style for each interview verdict (light/dark aware). */
export const VERDICT_META: Record<
  InterviewVerdict,
  { label: string; icon: LucideIcon; pill: string }
> = {
  [InterviewVerdict.SELECTED]: {
    label: "Selected",
    icon: CircleCheck,
    pill: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300",
  },
  [InterviewVerdict.REJECTED]: {
    label: "Rejected",
    icon: CircleX,
    pill: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300",
  },
  [InterviewVerdict.PENDING]: {
    label: "Pending",
    icon: Clock3,
    pill: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300",
  },
};

/** A subtle pill style for each difficulty level. */
export const DIFFICULTY_META: Record<Difficulty, { label: string; pill: string }> = {
  [Difficulty.EASY]: {
    label: "Easy",
    pill: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-300",
  },
  [Difficulty.MEDIUM]: {
    label: "Medium",
    pill: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-300",
  },
  [Difficulty.HARD]: {
    label: "Hard",
    pill: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300",
  },
};

/**
 * Compact, dependency-free relative time. Each unit rolls up into the next:
 * minutes until 1 hour, hours until 24 hours, days until 30 days, months until
 * 12 months, then years. Using rounded values with `< nextBoundary` checks means
 * the value never lands on the boundary (no "60 min", "24 hr" or "12 months").
 *
 * SSR note: this reads `Date.now()`, so it must run on the SERVER only and be
 * passed down as a string — calling it while rendering a client component would
 * cause a hydration mismatch (server "now" ≠ client "now").
 */
export function timeAgo(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (!Number.isFinite(seconds)) return "";
  if (seconds < 45) return "just now";

  const fmt = (value: number, unit: string) => `${value} ${unit}${value === 1 ? "" : "s"} ago`;

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return fmt(minutes, "min");
  const hours = Math.round(seconds / 3600);
  if (hours < 24) return fmt(hours, "hr");
  const days = Math.round(seconds / 86_400);
  if (days < 30) return fmt(days, "day");
  const months = Math.round(seconds / (86_400 * 30));
  if (months < 12) return fmt(months, "month");
  const years = Math.round(seconds / (86_400 * 365));
  return fmt(years, "year");
}

/** Up-to-two-letter monogram for a company name. */
export function monogram(name: string): string {
  return (
    name
      .replace(/[^\w\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}
