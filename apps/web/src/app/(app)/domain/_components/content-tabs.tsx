"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, PenLine } from "lucide-react";

/**
 * The Notes | Practice switch inside a topic view — the Domain analogue of
 * Screening's `PaperTabs`.
 *
 * Lands on **Notes** (theory, diagrams and worked examples) and flips to
 * **Practice** (the topic's graded MCQs) — "first the notes, then the
 * questions". Both panels are rendered once and toggled with `hidden`, never
 * unmounted, so an in-flight attempt (selected options, verdicts) survives
 * switching back and forth. It sits *inside* the shared
 * `PracticeAttemptProvider`, so the panels' client children keep their context.
 *
 * A topic with no questions yet renders its notes on their own, with no tab bar.
 *
 * (There used to be a Notes | Example switch here; the examples now live inline
 * in the notes, so the second tab is the practice set instead.)
 */
export function ContentTabs({
  notes,
  practice,
  questionCount,
}: {
  notes: ReactNode;
  practice: ReactNode | null;
  questionCount: number;
}) {
  const hasPractice = practice != null && questionCount > 0;
  const [tab, setTab] = useState<"notes" | "practice">("notes");

  if (!hasPractice) return <>{notes}</>;

  return (
    <>
      <div
        role="tablist"
        aria-label="Topic view"
        className="relative mb-6 inline-grid grid-cols-2 rounded-xl bg-surface-2 p-1"
      >
        {/* Sliding pill marking the active tab (see PaperTabs for the geometry). */}
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
      {/* `relative z-10` lifts the label above the absolutely-positioned pill. */}
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
