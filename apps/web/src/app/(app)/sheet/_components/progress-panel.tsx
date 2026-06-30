"use client";

import type { DifficultyValue } from "./types";

export type DifficultyStat = Record<DifficultyValue, { solved: number; total: number }>;

const DIFF_META: {
  key: DifficultyValue;
  label: string;
  ring: string;
  text: string;
  bar: string;
}[] = [
  { key: "EASY", label: "Easy", ring: "stroke-emerald-500", text: "text-emerald-500", bar: "bg-emerald-500" },
  { key: "MEDIUM", label: "Medium", ring: "stroke-amber-500", text: "text-amber-500", bar: "bg-amber-500" },
  { key: "HARD", label: "Hard", ring: "stroke-rose-500", text: "text-rose-500", bar: "bg-rose-500" },
];

function pct(solved: number, total: number) {
  return total > 0 ? Math.round((solved / total) * 100) : 0;
}

/** A circular progress ring with the percentage inside, in the given color. */
export function Ring({
  solved,
  total,
  ringClass,
  size = 64,
  stroke = 6,
  big = false,
}: {
  solved: number;
  total: number;
  ringClass: string;
  size?: number;
  stroke?: number;
  big?: boolean;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const value = pct(solved, total);
  const offset = c * (1 - value / 100);
  return (
    <span className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-surface-2" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          className={`${ringClass} transition-[stroke-dashoffset] duration-700 ease-out`}
        />
      </svg>
      <span className="absolute flex flex-col items-center leading-none">
        <span
          className={`font-bold tabular-nums text-foreground ${big ? "text-2xl" : "text-xs"}`}
        >
          {value}%
        </span>
        {big ? (
          <span className="mt-1 text-[11px] tabular-nums text-muted">
            {solved}/{total}
          </span>
        ) : null}
      </span>
    </span>
  );
}

/**
 * Combined progress across ALL sheets, one circular ring per difficulty.
 * Cardless so it can be embedded in the merged stats container (see SheetStats).
 * Compact column on large screens (rings stacked), a row on small screens.
 * Updates live as problems are toggled.
 */
export function ProgressContent({ difficulty }: { difficulty: DifficultyStat }) {
  const totalSolved = DIFF_META.reduce((s, d) => s + difficulty[d.key].solved, 0);
  const totalAll = DIFF_META.reduce((s, d) => s + difficulty[d.key].total, 0);

  return (
    <div className="flex shrink-0 items-center justify-center gap-6 sm:gap-8 lg:flex-col lg:gap-4">
      {/* Total across all sheets */}
      <div className="flex shrink-0 flex-col items-center">
        <Ring
          solved={totalSolved}
          total={totalAll}
          ringClass="stroke-rb-green-500"
          size={96}
          stroke={9}
          big
        />
        <p className="mt-1.5 text-[11px] text-muted">All sheets</p>
      </div>

      {/* Per-difficulty rings */}
      <div className="flex gap-4 sm:gap-5 lg:gap-3">
        {DIFF_META.map((d) => {
          const { solved, total } = difficulty[d.key];
          return (
            <div key={d.key} className="flex flex-col items-center gap-1.5">
              <Ring solved={solved} total={total} ringClass={d.ring} size={50} stroke={5} />
              <div className="text-center">
                <div className={`text-[11px] font-semibold ${d.text}`}>{d.label}</div>
                <div className="text-[10px] tabular-nums text-muted">
                  {solved}/{total}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Overall total (solved/all) across every sheet — used beside the big ring. */
export function overallTotals(difficulty: DifficultyStat) {
  return Object.values(difficulty).reduce(
    (a, d) => ({ solved: a.solved + d.solved, total: a.total + d.total }),
    { solved: 0, total: 0 }
  );
}

/**
 * Per-difficulty progress as horizontal bars stacked vertically (Easy → Medium
 * → Hard). Compact alternative to the difficulty rings; fills horizontal space
 * and keeps the panel short. Updates live as problems are toggled.
 */
export function DifficultyBars({ difficulty }: { difficulty: DifficultyStat }) {
  return (
    <div className="flex w-full flex-col justify-center gap-3">
      {DIFF_META.map((d) => {
        const { solved, total } = difficulty[d.key];
        const value = pct(solved, total);
        return (
          <div key={d.key}>
            <div className="mb-1 flex items-center justify-between text-[11px]">
              <span className={`font-semibold ${d.text}`}>{d.label}</span>
              <span className="tabular-nums text-muted">
                {solved}/{total}
                <span className="ml-1.5 text-muted/70">{value}%</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full ${d.bar} transition-[width] duration-700 ease-out`}
                style={{ width: `${value}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Standalone card wrapper around ProgressContent (kept for reuse/back-compat). */
export function ProgressPanel({ difficulty }: { difficulty: DifficultyStat }) {
  return (
    <div className="glass rounded-3xl p-7">
      <h3 className="mb-5 text-base font-semibold tracking-tight">Your progress</h3>
      <ProgressContent difficulty={difficulty} />
    </div>
  );
}
