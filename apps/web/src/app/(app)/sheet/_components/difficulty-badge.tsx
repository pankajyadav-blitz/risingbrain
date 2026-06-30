import type { DifficultyValue } from "./types";

const STYLES: Record<DifficultyValue, { label: string; className: string }> = {
  EASY: {
    label: "Easy",
    className: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
  },
  MEDIUM: {
    label: "Medium",
    className: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
  },
  HARD: {
    label: "Hard",
    className: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20",
  },
};

/** A subtle, on-theme difficulty pill (EASY/MEDIUM/HARD). */
export function DifficultyBadge({ difficulty }: { difficulty: DifficultyValue }) {
  const { label, className } = STYLES[difficulty];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${className}`}
    >
      {label}
    </span>
  );
}
