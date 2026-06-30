"use client";

import { useMemo, useState } from "react";
import { Brain, ChevronLeft, ChevronRight, Flame } from "lucide-react";
import type { SheetActivity } from "../_data";

/**
 * Attractive month calendar for the DSA sheet hero — shows how active the user
 * has been solving sheet problems. Each day cell is tinted by how many problems
 * were solved that IST day; today is ringed; a flame badge tracks the live solve
 * streak. Pages back through the trailing months the server provided.
 *
 * Lives under the ProgressPanel in the hero's right rail, inside
 * SheetProgressContext, so `todayDelta` lets it update optimistically the moment
 * a problem is toggled (no refetch).
 */

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

// Icon stroke color per activity level (rb-green-500 = #35a45c).
const BRAIN_COLOR = [
  "",
  "rgba(53,164,92,0.50)",
  "rgba(53,164,92,0.72)",
  "rgba(53,164,92,0.92)",
  "#35a45c",
] as const;

/** Exact Twemoji 😢 crying face (U+1F622) — pixel-faithful recreation. */
function RegretFace() {
  return (
    <svg viewBox="0 0 36 36" className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
      {/* face */}
      <path fill="#FFCC4D" d="M36 18c0 9.941-8.059 18-18 18-9.94 0-18-8.059-18-18C0 8.06 8.06 0 18 0c9.941 0 18 8.06 18 18"/>
      {/* eyes */}
      <ellipse fill="#664500" cx="11.5" cy="17" rx="2.5" ry="3.5"/>
      <ellipse fill="#664500" cx="24.5" cy="17" rx="2.5" ry="3.5"/>
      {/* brows + mouth */}
      <path fill="#664500" d="M5.999 13.5c-.208 0-.419-.065-.599-.2-.442-.331-.531-.958-.2-1.4 3.262-4.35 7.616-4.4 7.8-4.4.552 0 1 .448 1 1 0 .551-.445.998-.996 1-.155.002-3.568.086-6.204 3.6-.196.262-.497.4-.801.4zm24.002 0c-.305 0-.604-.138-.801-.4-2.641-3.521-6.061-3.599-6.206-3.6-.55-.006-.994-.456-.991-1.005.003-.551.447-.995.997-.995.184 0 4.537.05 7.8 4.4.332.442.242 1.069-.2 1.4-.18.135-.39.2-.599.2zm-6.516 14.879C23.474 28.335 22.34 24 18 24s-5.474 4.335-5.485 4.379c-.053.213.044.431.232.544.188.112.433.086.596-.06C13.352 28.855 14.356 28 18 28c3.59 0 4.617.83 4.656.863.095.09.219.137.344.137.084 0 .169-.021.246-.064.196-.112.294-.339.239-.557z"/>
      {/* teardrop */}
      <path fill="#5DADEC" d="M16 31c0 2.762-2.238 5-5 5s-5-2.238-5-5 4-10 5-10 5 7.238 5 10z"/>
    </svg>
  );
}

// Mirror of the server's intensity bucketing (kept local so this client
// component never imports the prisma-backed `_data` module at runtime).
function levelFor(count: number): 0 | 1 | 2 | 3 | 4 {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 6) return 3;
  return 4;
}

function prettyDate(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function SheetCalendar({
  activity,
  todayDelta = 0,
}: {
  activity: SheetActivity;
  todayDelta?: number;
}) {
  const { months } = activity;
  const lastIdx = months.length - 1;
  const [idx, setIdx] = useState(lastIdx);
  const isCurrentMonth = idx === lastIdx;
  const month = months[idx]!;

  // Apply the live "solved today" delta to today's cell (current month only).
  const { cells, activeDays, solved } = useMemo(() => {
    let activeDays = 0;
    let solved = 0;
    const cells = month.cells.map((c) => {
      let count = c.count;
      if (isCurrentMonth && c.isToday && todayDelta) count = Math.max(0, count + todayDelta);
      if (count > 0) {
        activeDays += 1;
        solved += count;
      }
      return { ...c, count, level: c.future ? 0 : levelFor(count) };
    });
    return { cells, activeDays, solved };
  }, [month, isCurrentMonth, todayDelta]);

  // Live streak: extend/retract by today's net change regardless of which month
  // is being viewed (the streak is "now", not the viewed month).
  const baseToday = months[lastIdx]!.cells.find((c) => c.isToday)?.count ?? 0;
  const liveToday = Math.max(0, baseToday + todayDelta);
  let streak = activity.currentStreak;
  if (baseToday === 0 && liveToday > 0) streak += 1;
  else if (baseToday > 0 && liveToday === 0) streak = Math.max(0, streak - 1);

  return (
    <div className="mx-auto w-full min-w-0 max-w-[22rem] flex-1 lg:mx-0">
      {/* Header: live streak badge + month pager */}
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`grid h-9 w-9 place-items-center rounded-xl transition-colors ${
              streak > 0
                ? "bg-rb-green-500/15 text-brand ring-1 ring-inset ring-rb-green-500/30"
                : "bg-surface-2 text-muted"
            }`}
          >
            <Flame className="h-[18px] w-[18px]" />
          </span>
          <div className="leading-tight">
            <div className="text-lg font-bold tabular-nums text-foreground">
              {streak}
              <span className="ml-1 text-xs font-medium text-muted">
                day{streak === 1 ? "" : "s"}
              </span>
            </div>
            <div className="text-[11px] font-medium text-muted">solve streak</div>
          </div>
        </div>

        <div className="glass-pill flex items-center gap-0.5 rounded-xl p-0.5">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            aria-label="Previous month"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[6.5rem] text-center text-sm font-semibold text-foreground">
            {month.label}
          </span>
          <button
            type="button"
            onClick={() => setIdx((i) => Math.min(lastIdx, i + 1))}
            disabled={isCurrentMonth}
            aria-label="Next month"
            className="grid h-7 w-7 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Weekday header */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={i}
            className="text-center text-[10px] font-semibold uppercase tracking-wide text-muted/80"
          >
            {w}
          </div>
        ))}
      </div>

      {/* Day grid — emoji fills each square cell */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: month.leading }).map((_, i) => (
          <div key={`pad-${i}`} aria-hidden />
        ))}
        {cells.map((c) => (
          <div
            key={c.key}
            title={
              c.future
                ? prettyDate(c.key)
                : c.count === 0
                  ? `No solves on ${prettyDate(c.key)}`
                  : `${c.count} solved on ${prettyDate(c.key)}`
            }
            className={`aspect-square rounded-lg p-[2px] transition-all ${
              c.future
                ? "opacity-25"
                : `bg-surface-2/50 ring-1 ring-inset ring-border/30 hover:scale-[1.08] ${
                    c.isToday ? "ring-2 ring-rb-green-300" : ""
                  }`
            }`}
          >
            {c.future ? (
              /* future days: show the date number so the calendar remains navigable */
              <div className="flex h-full items-center justify-center">
                <span className="text-[10px] font-semibold tabular-nums text-muted">{c.day}</span>
              </div>
            ) : c.count > 0 ? (
              <div className="flex h-full w-full items-center justify-center">
                <Brain
                  className="h-[70%] w-[70%]"
                  strokeWidth={1.75}
                  style={{ color: BRAIN_COLOR[c.level] }}
                />
              </div>
            ) : c.key >= activity.joinedKey ? (
              /* past day with no solves, but account existed — show regret face */
              <RegretFace />
            ) : null /* day before account was created — show nothing */}
          </div>
        ))}
      </div>

      {/* Footer: summary + brain-colour intensity legend */}
      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-2.5">
        <p className="text-xs text-muted">
          <span className="font-semibold text-foreground">{activeDays}</span> active{" "}
          {activeDays === 1 ? "day" : "days"} ·{" "}
          <span className="font-semibold text-foreground">{solved}</span> solved
        </p>
        <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted/80">
          <span>Less</span>
          <div className="flex items-center gap-1">
            {([1, 2, 3, 4] as const).map((level) => (
              <span
                key={level}
                className="h-3 w-3 rounded-full ring-1 ring-inset ring-border/30"
                style={{ background: BRAIN_COLOR[level] }}
              />
            ))}
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  );
}
