import type { DifficultyValue } from "./types";

// Colours only. The set of difficulties itself is never enumerated in the UI —
// it comes from the loaded DB rows — so an unknown value degrades to a neutral
// pill instead of crashing on a missing key.
const STYLES: Record<string, string> = {
  EASY: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
  HARD: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20",
};

const FALLBACK = "bg-surface-2 text-muted ring-1 ring-border";

/** "MEDIUM" → "Medium". Derived from the stored value, never a lookup table. */
export function difficultyLabel(difficulty: string) {
  return difficulty.charAt(0) + difficulty.slice(1).toLowerCase();
}

/** Pill colour classes for a difficulty, neutral for anything unrecognised. */
export function difficultyClass(difficulty: string) {
  return STYLES[difficulty] ?? FALLBACK;
}

/** A subtle, on-theme difficulty pill (EASY/MEDIUM/HARD). */
export function DifficultyBadge({ difficulty }: { difficulty: DifficultyValue }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${difficultyClass(difficulty)}`}
    >
      {difficultyLabel(difficulty)}
    </span>
  );
}
