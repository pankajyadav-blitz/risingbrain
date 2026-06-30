import { Code2, Database, Brain } from "lucide-react";
import type { SectionStat } from "../_data";

const ICONS = {
  dsa: Code2,
  sql: Database,
  aptitude: Brain,
} as const;

// Per-difficulty bar accent.
const DIFF_COLOR: Record<string, string> = {
  Easy: "bg-emerald-500",
  Medium: "bg-amber-500",
  Hard: "bg-rose-500",
};
const DIFF_TEXT: Record<string, string> = {
  Easy: "text-emerald-500",
  Medium: "text-amber-500",
  Hard: "text-rose-500",
};

function pct(solved: number, total: number) {
  return total > 0 ? Math.round((solved / total) * 100) : 0;
}

/** A radial progress ring with the percentage inside. */
function Ring({ value }: { value: number }) {
  const size = 64;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(1, value / 100));
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
          className="stroke-rb-green-500 transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums text-foreground">{value}%</span>
    </span>
  );
}

function SectionCard({ section }: { section: SectionStat }) {
  const Icon = ICONS[section.key];
  return (
    <div className="glass glass-hover rounded-3xl p-5 sm:p-6">
      <div className="flex items-center gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rb-green-500/15 text-accent">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold tracking-tight">{section.label}</h3>
          <p className="text-xs text-muted">
            <span className="font-semibold text-foreground tabular-nums">{section.solved}</span>{" "}
            of {section.total} solved
          </p>
        </div>
        <Ring value={pct(section.solved, section.total)} />
      </div>

      {section.byDifficulty ? (
        <div className="mt-5 space-y-3">
          {section.byDifficulty.map((d) => (
            <div key={d.label}>
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className={`font-medium ${DIFF_TEXT[d.label]}`}>{d.label}</span>
                <span className="tabular-nums text-muted">
                  {d.solved} / {d.total}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                <div
                  className={`h-full rounded-full ${DIFF_COLOR[d.label]} transition-[width] duration-700 ease-out`}
                  style={{ width: `${pct(d.solved, d.total)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-5">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-muted">Overall progress</span>
            <span className="tabular-nums text-muted">
              {section.solved} / {section.total}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-rb-green-500 transition-[width] duration-700 ease-out"
              style={{ width: `${pct(section.solved, section.total)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SectionStats({ sections }: { sections: SectionStat[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sections.map((s) => (
        <SectionCard key={s.key} section={s} />
      ))}
    </div>
  );
}
