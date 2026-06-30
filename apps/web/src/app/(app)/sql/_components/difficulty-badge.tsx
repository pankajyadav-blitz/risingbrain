import { Difficulty } from "@risingbrain/database/enums";

const styles: Record<Difficulty, string> = {
  EASY: "bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-500/20",
  MEDIUM: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/20",
  HARD: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/20",
};

const labels: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

/** Subtle, on-theme difficulty pill (EASY → emerald, MEDIUM → amber, HARD → rose). */
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles[difficulty]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      {labels[difficulty]}
    </span>
  );
}
