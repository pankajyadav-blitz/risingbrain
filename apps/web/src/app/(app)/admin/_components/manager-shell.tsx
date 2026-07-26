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
    // `lg:items-start` stops the two panels from stretching to a common height —
    // the list keeps its own full-height scroll, the editor sizes to its content.
    <div className="flex min-h-0 flex-col gap-3 p-3 lg:h-full lg:flex-row lg:items-start">
      {/* ===== List panel ===== */}
      <aside
        className={cn(
          "flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 lg:flex lg:h-full lg:w-[300px] lg:shrink-0 xl:w-[340px]",
          hasSelection ? "hidden lg:flex" : "flex",
        )}
      >
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
          <span className="text-sm font-semibold text-foreground">{sidebarTitle}</span>
          {sidebarAction}
        </div>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">{sidebar}</div>
      </aside>

      {/* ===== Editor panel — sizes to its own content, capped at the viewport
              height so long forms scroll internally instead of stretching. ===== */}
      <section
        className={cn(
          "min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-border bg-surface/40 lg:flex lg:max-h-full lg:self-start",
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
