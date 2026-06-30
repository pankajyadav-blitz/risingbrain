"use client";

import { Rocket } from "lucide-react";
import {
  Ring,
  DifficultyBars,
  overallTotals,
  type DifficultyStat,
} from "./progress-panel";
import { SheetCalendar } from "./sheet-calendar";
import type { SheetActivity } from "../_data";

/**
 * Merged hero side-panel. The motivational greeting spans the TOP, and below it
 * sit three side-by-side containers — overall ring · per-difficulty bars ·
 * solve-streak calendar — separated by dividers. This fills the panel's width
 * (no dead space) and keeps it short so the sheet tabs stay in view.
 */
export function SheetStats({
  difficulty,
  activity,
  todayDelta = 0,
  greetingName,
}: {
  difficulty: DifficultyStat;
  activity?: SheetActivity | null;
  todayDelta?: number;
  greetingName?: string | null;
}) {
  const totals = overallTotals(difficulty);

  return (
    <div className="glass rounded-3xl p-4 sm:p-5">
      {/* Motivation message — full width across the top */}
      <div className="mb-4 flex items-center gap-3 border-b border-border pb-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-rb-green-500/15 text-brand ring-1 ring-inset ring-rb-green-500/25">
          <Rocket className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            Keep pushing{greetingName ? `, ${greetingName}` : ""}!
          </h3>
          <p className="text-sm leading-snug text-muted">
            Building mastery one problem at a time — keep the momentum going!
          </p>
        </div>
      </div>

      {/* Two containers in a single row (stack on mobile) */}
      <div className="flex flex-col gap-5 lg:flex-row lg:items-stretch lg:gap-5">
        {/* 1 · Total progress ring on top of the per-difficulty bars */}
        <div className="flex min-w-0 flex-1 flex-col justify-center gap-4">
          <div className="flex items-center gap-5 border-b border-border pb-4">
            <Ring
              solved={totals.solved}
              total={totals.total}
              ringClass="stroke-rb-green-500"
              size={124}
              stroke={11}
              big
            />
            <div className="min-w-0 leading-tight">
              <div className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Total progress
              </div>
              <div className="mt-1 text-sm font-medium text-muted">
                across all sheets
              </div>
            </div>
          </div>
          <DifficultyBars difficulty={difficulty} />
        </div>

        {/* 2 · Solve-streak calendar */}
        {activity ? (
          <>
            <div className="hidden self-stretch border-l border-border lg:block" />
            <div className="w-full shrink-0 lg:w-[17rem]">
              <SheetCalendar activity={activity} todayDelta={todayDelta} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
