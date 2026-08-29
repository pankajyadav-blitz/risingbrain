"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { BookOpen, PenLine } from "lucide-react";

/**
 * The Notes | Practice switch, shared by Domain topics and Screening papers.
 *
 * The two sections had a byte-for-byte copy of this each — same sliding pill,
 * same panels, same geometry comment — which is two places to fix a tab bug and
 * two places for the two surfaces to drift apart. They are the same control over
 * the same pair of panels, so they are one component now.
 *
 * Lands on **Notes** (theory, diagrams, worked examples) and flips to
 * **Practice** (the graded MCQs) — "first the notes, then the questions". Both
 * panels are rendered once and toggled with `hidden`, never unmounted, so an
 * in-flight attempt (selected options, verdicts) survives switching back and
 * forth. It sits inside each section's attempt provider, so the panels' client
 * children keep their context.
 *
 * With only one panel's worth of content — a topic with no practice set, or a
 * Puzzles paper with no notes — the bar is omitted and that panel renders alone.
 *
 * The active tab is published through `ReadingTabProvider` because something
 * OUTSIDE this component needs it: the "On this page" rail lists the notes'
 * sections, and those sections are `hidden` while Practice is open — a contents
 * list pointing at nothing is worse than none, so the rail hides itself instead.
 */

export type ReadingTab = "notes" | "practice";

const ReadingTabContext = createContext<{
  tab: ReadingTab;
  setTab: (t: ReadingTab) => void;
} | null>(null);

/**
 * The active tab. Defaults to "notes" outside a provider — the safe answer, since
 * a page with no tab bar is showing its notes.
 */
export function useReadingTab(): ReadingTab {
  return useContext(ReadingTabContext)?.tab ?? "notes";
}

export function ReadingTabProvider({
  children,
  initial = "notes",
}: {
  children: ReactNode;
  /** Screening's Puzzles have questions but no theory, so they open on Practice. */
  initial?: ReadingTab;
}) {
  const [tab, setTab] = useState<ReadingTab>(initial);
  return (
    <ReadingTabContext.Provider value={{ tab, setTab }}>{children}</ReadingTabContext.Provider>
  );
}

export function ReadingTabs({
  notes,
  practice,
  questionCount,
}: {
  notes: ReactNode | null;
  practice: ReactNode | null;
  questionCount: number;
}) {
  const ctx = useContext(ReadingTabContext);
  const tab = ctx?.tab ?? "notes";
  const setTab = ctx?.setTab ?? (() => {});

  const hasNotes = notes != null;
  const hasPractice = practice != null && questionCount > 0;

  if (!hasNotes) return <>{practice}</>;
  if (!hasPractice) return <>{notes}</>;

  return (
    <>
      <div
        role="tablist"
        aria-label="Topic view"
        className="relative mb-6 inline-grid grid-cols-2 rounded-xl bg-surface-2 p-1"
      >
        {/* Sliding green pill marking the active tab. It's one element that
            translates between the two cells rather than a background on each
            button, so the selection visibly *moves* instead of blinking. The
            grid is gapless with p-1, so a cell is exactly `50% - 0.25rem` wide
            and `translate-x-full` lands the pill precisely on cell two. */}
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
