"use client";

import { useState, type ReactNode } from "react";
import { BookOpen, Code2 } from "lucide-react";

/**
 * The Notes | Example switch inside a topic view — the Domain analogue of
 * Screening's `PaperTabs` (Notes | Practice).
 *
 * Lands on **Notes** (theory + diagrams) and flips to **Example** (clean,
 * copy-ready code). Both panels are pre-rendered on the server and toggled with
 * `hidden` (never unmounted). When a topic has no example the tab bar is omitted
 * and the notes render on their own.
 */
export function ContentTabs({ notes, example }: { notes: ReactNode; example: ReactNode | null }) {
  const hasExample = example != null;
  const [tab, setTab] = useState<"notes" | "example">("notes");

  if (!hasExample) return <>{notes}</>;

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
            tab === "example" ? "translate-x-full" : "translate-x-0"
          }`}
        />
        <TabButton
          active={tab === "notes"}
          onClick={() => setTab("notes")}
          icon={<BookOpen className="h-4 w-4" />}
          label="Notes"
        />
        <TabButton
          active={tab === "example"}
          onClick={() => setTab("example")}
          icon={<Code2 className="h-4 w-4" />}
          label="Example"
        />
      </div>

      <div role="tabpanel" hidden={tab !== "notes"}>
        {notes}
      </div>
      <div role="tabpanel" hidden={tab !== "example"}>
        {example}
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
