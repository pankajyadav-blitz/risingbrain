import type { CSSProperties } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { MonthBlock } from "../_data";

// Tailwind classes per intensity level (theme-aware brand green).
const LEVEL_BG = [
  "bg-surface-2",
  "bg-rb-green-500/30",
  "bg-rb-green-500/55",
  "bg-rb-green-500/80",
  "bg-rb-green-500",
] as const;

function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * Month-divided contribution heatmap for a selected calendar year. Each month is
 * an equal-width block (flex-1) so the row fills the card edge to edge; day cells
 * are squares that scale with the block width. A year switcher links to
 * /profile?year=YYYY for historical views.
 */
export function Heatmap({
  months,
  year,
  rolling,
  availableYears,
  totalContributions,
  activeDays,
}: {
  months: MonthBlock[];
  year: number;
  rolling: boolean;
  availableYears: number[];
  totalContributions: number;
  activeDays: number;
}) {
  // Running index across every rendered cell so the bloom cascades left→right.
  // The bloom itself is driven by CSS: cells stay hidden until an ancestor
  // `.reveal` gains `.in` (see theme.css), so it plays on scroll-into-view.
  let cellIdx = 0;

  const item = (active: boolean) =>
    `flex items-center justify-between rounded-lg px-3 py-2 text-xs font-semibold tabular-nums transition-colors ${
      active
        ? "bg-rb-green-500/15 text-brand"
        : "text-muted hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {rolling ? "Activity in the last year" : `Activity in ${year}`}
          </h2>
          <p className="text-xs text-muted">
            {totalContributions} {totalContributions === 1 ? "action" : "actions"} ·{" "}
            {activeDays} active {activeDays === 1 ? "day" : "days"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Year dropdown — "Last 12 months" + every year from launch to now. */}
          <details
            data-autoclose
            className="relative [&_summary::-webkit-details-marker]:hidden"
          >
            <summary className="glass-pill flex cursor-pointer list-none items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-foreground">
              {rolling ? "Last 12 months" : year}
              <ChevronDown className="h-3.5 w-3.5 text-muted" />
            </summary>
            <div className="glass animate-in absolute right-0 top-full z-20 mt-2 max-h-72 w-44 overflow-auto rounded-2xl p-2">
              <Link href="/profile" scroll={false} className={item(rolling)}>
                Last 12 months
              </Link>
              {availableYears.map((y) => (
                <Link
                  key={y}
                  href={`/profile?year=${y}`}
                  scroll={false}
                  className={item(!rolling && y === year)}
                >
                  {y}
                </Link>
              ))}
            </div>
          </details>
          <div className="flex items-center gap-1.5 text-[11px] text-muted">
            <span>Less</span>
            {LEVEL_BG.map((bg, i) => (
              <span key={i} className={`h-3 w-3 rounded-[2px] ${bg}`} />
            ))}
            <span>More</span>
          </div>
        </div>
      </div>

      {/* Equal-width month blocks fill the card width; scrolls on small screens. */}
      <div className="overflow-x-auto pb-1">
        <div className="flex w-full min-w-[760px] items-stretch gap-3">
          {months.map((month) => (
            <div key={month.key} className="flex flex-1 flex-col gap-2">
              <div className="text-center text-[11px] font-medium text-muted">{month.label}</div>
              <div className="flex flex-1 gap-[3px]">
                {month.weeks.map((week, wi) => (
                  <div key={wi} className="flex flex-1 flex-col gap-[3px]">
                    {week.map((cell, di) =>
                      cell ? (
                        <div
                          key={cell.key}
                          style={{ "--cell-delay": `${(cellIdx++ % 90) * 7}ms` } as CSSProperties}
                          className={`cell-bloom aspect-square w-full rounded-[3px] ring-1 ring-inset ring-black/5 transition-transform duration-150 hover:scale-[1.35] dark:ring-white/5 ${LEVEL_BG[cell.level]}`}
                          title={
                            cell.count === 0
                              ? `No activity on ${prettyDate(cell.key)}`
                              : `${cell.count} action${cell.count === 1 ? "" : "s"} on ${prettyDate(cell.key)}` +
                                (cell.dsa ? ` · ${cell.dsa} DSA` : "") +
                                (cell.apt ? ` · ${cell.apt} aptitude` : "")
                          }
                        />
                      ) : (
                        <div key={`${wi}-${di}`} className="aspect-square w-full" />
                      )
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
