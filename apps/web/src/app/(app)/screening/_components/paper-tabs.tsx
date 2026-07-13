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
        className="mb-6 inline-flex rounded-xl bg-surface-2 p-1"
      >
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
      className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted hover:text-foreground"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
