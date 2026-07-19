"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, PenLine } from "lucide-react";

/**
 * The Notes | Practice switch inside a topic's paper.
 *
 * Lands on **Notes** (the topic theory + diagrams) and flips to **Practice**
 * (the graded MCQs) — "first the notes, then the questions". Both panels are
 * rendered once and toggled with `hidden`, never unmounted, so the practice
 * attempt state (selected options, submitted verdicts) survives switching back
 * and forth. It sits *inside* the shared `PaperAttemptProvider`, so the panels'
 * client children keep their context.
 *
 * When a topic has no notes (e.g. Puzzles), the tab bar is omitted and the
 * practice panel renders on its own.
 */
export function PaperTabs({
  notes,
  practice,
  questionCount,
}: {
  notes: ReactNode | null;
  practice: ReactNode;
  questionCount: number;
}) {
  const hasNotes = notes != null;
  const [tab, setTab] = useState<"notes" | "practice">(hasNotes ? "notes" : "practice");

  if (!hasNotes) return <>{practice}</>;

  return (
    <>
      <div
        role="tablist"
        aria-label="Topic view"
        className="relative mb-6 inline-grid grid-cols-2 rounded-xl bg-surface-2 p-1"
      >
        {/* Sliding green pill marking the active tab. It's one element that
            translates between the two cells rather than a background on each
            button, so the selection visibly *moves* instead of blinking.
            The grid is gapless with p-1, so a cell is exactly `50% - 0.25rem`
            wide and `translate-x-full` lands the pill precisely on cell two. */}
        <span
          aria-hidden
          className={`pointer-events-none absolute inset-y-1 left-1 w-[calc(50%-0.25rem)] rounded-lg bg-rb-green-500/15 shadow-[0_2px_10px_rgba(53,164,92,0.22)] ring-1 ring-inset ring-rb-green-500/35 transition-transform duration-300 ease-out motion-reduce:transition-none ${
            tab === "practice" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        <TabButton
          active={tab === "notes"}
          onClick={() => setTab("notes")}
          icon={<BookOpen className="h-4 w-4" />}
          label="Notes"
        />
        <TabButton
          active={tab === "practice"}
          onClick={() => setTab("practice")}
          icon={<PenLine className="h-4 w-4" />}
          label={`Practice · ${questionCount}`}
        />
      </div>

      <div role="tabpanel" hidden={tab !== "notes"}>
        {notes}
      </div>
      <div role="tabpanel" hidden={tab !== "practice"}>
        {practice}
      </div>
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative z-10 flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "text-brand" : "text-muted hover:text-foreground"
      }`}
    >
      {/* `relative z-10` lifts the label above the absolutely-positioned pill —
          a positioned sibling would otherwise paint over static content. */}
      <span
        className={`transition-transform duration-300 ease-out motion-reduce:transition-none ${
          active ? "scale-110" : "scale-100"
        }`}
      >
        {icon}
      </span>
      {label}
    </button>
  );
}
