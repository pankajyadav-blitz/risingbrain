"use client";

/**
 * Responsive master-detail frame shared by all three managers.
 *
 * The list and the editor are TWO independent glass panels separated by a gap
 * (the app's floating-panels look), each with its own header and its own scroll.
 * Desktop (lg+): side-by-side, both filling height. Mobile: a single panel — the
 * list, or, once a node is selected, the editor with a "Back to list" bar.
 */
import { ChevronLeft } from "lucide-react";
import { cn } from "@risingbrain/ui/cn";

export function ManagerShell({
  sidebarTitle,
  sidebarAction,
  sidebar,
  detail,
  hasSelection,
  onBack,
}: {
  sidebarTitle: string;
  sidebarAction?: React.ReactNode;
  sidebar: React.ReactNode;
  detail: React.ReactNode;
  hasSelection: boolean;
  onBack: () => void;
}) {
  return (
    // Both panels fill a common height rather than the editor sizing to content:
    // it keeps the two columns visually balanced, and it pins the editor's save bar
    // to the bottom of the panel instead of letting it float mid-screen under a
    // short form. Each panel CLIPS on the outside and SCROLLS on the inside, so its
    // scrollbar stays inside the rounded corner instead of poking through it.
    <div className="flex min-h-0 flex-col gap-3 p-3 lg:h-full lg:flex-row">
      {/* ===== List panel ===== */}
      <aside
        className={cn(
          "glass flex-col overflow-hidden rounded-3xl lg:flex lg:h-full lg:w-[300px] lg:shrink-0 xl:w-[340px]",
          hasSelection ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {sidebarTitle}
          </span>
          {sidebarAction}
        </div>
        <div className="pane-scroll min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">{sidebar}</div>
      </aside>

      {/* ===== Editor panel ===== */}
      <section
        className={cn(
          "glass min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl lg:flex lg:h-full",
          hasSelection ? "flex" : "hidden lg:flex",
        )}
      >
        {hasSelection && (
          <button
            type="button"
            onClick={onBack}
            className="flex shrink-0 items-center gap-1.5 border-b border-border px-4 py-3 text-sm font-medium text-muted transition-colors hover:text-foreground lg:hidden"
          >
            <ChevronLeft className="h-4 w-4" /> Back to list
          </button>
        )}
        {detail}
      </section>
    </div>
  );
}
