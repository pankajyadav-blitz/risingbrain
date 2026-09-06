"use client";

import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { DifficultyBadge, difficultyLabel } from "./difficulty-badge";
import type { DifficultyValue } from "./types";

/** "ALL" is the default — no difficulty constraint. */
export type DifficultyFilterValue = DifficultyValue | "ALL";

export type DifficultyOption = { value: DifficultyValue; count: number };

/**
 * Difficulty picker for the sheet toolbar.
 *
 * The options are NOT a hardcoded Easy/Medium/Hard list: the caller derives them
 * from the difficulties the loaded sheet data actually contains (with their live
 * problem counts), so the control always mirrors the database. Defaults to "All".
 *
 * Uses the same `<details data-autoclose>` disclosure as the rest of the app's
 * dropdowns, so click-away / Escape dismissal comes free from `DetailsAutoClose`.
 */
export function DifficultyFilter({
  options,
  value,
  total,
  onChange,
}: {
  options: DifficultyOption[];
  value: DifficultyFilterValue;
  total: number;
  onChange: (value: DifficultyFilterValue) => void;
}) {
  const isFiltered = value !== "ALL";

  // Selecting an option closes the disclosure; the click-away handler only fires
  // for clicks *outside* the panel.
  const pick = (next: DifficultyFilterValue, el: HTMLElement) => {
    onChange(next);
    el.closest("details")?.removeAttribute("open");
  };

  const item = (active: boolean) =>
    `flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-xs font-semibold transition-colors ${
      active
        ? "bg-rb-green-500/15 text-brand"
        : "text-muted hover:bg-surface-2 hover:text-foreground"
    }`;

  return (
    <details
      data-autoclose
      className="group relative shrink-0 [&_summary::-webkit-details-marker]:hidden"
    >
      <summary
        aria-label="Filter by difficulty"
        title={isFiltered ? `Difficulty: ${difficultyLabel(value)}` : "Filter by difficulty"}
        className={`flex cursor-pointer list-none items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
          isFiltered
            ? "bg-rb-green-500/15 text-brand ring-1 ring-rb-green-500/40"
            : "glass text-muted hover:text-foreground"
        }`}
      >
        <SlidersHorizontal className="h-4 w-4 shrink-0" />
        <span className="hidden sm:inline">
          {isFiltered ? difficultyLabel(value) : "Difficulty"}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 opacity-70 transition-transform duration-200 group-open:rotate-180" />
      </summary>

      <div className="animate-in absolute right-0 top-full z-30 mt-2 w-56 rounded-2xl border border-border bg-surface p-2 shadow-xl">
        <button
          type="button"
          onClick={(e) => pick("ALL", e.currentTarget)}
          aria-pressed={!isFiltered}
          className={item(!isFiltered)}
        >
          <span>All difficulties</span>
          <span className="tabular-nums text-muted">{total}</span>
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={(e) => pick(o.value, e.currentTarget)}
            aria-pressed={value === o.value}
            className={item(value === o.value)}
          >
            <DifficultyBadge difficulty={o.value} />
            <span className="tabular-nums text-muted">{o.count}</span>
          </button>
        ))}
      </div>
    </details>
  );
}
