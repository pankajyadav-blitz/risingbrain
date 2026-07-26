"use client";

/**
 * Master-detail tree primitives shared by all three managers. Each manager wires
 * its own recursion (the trees differ in depth) from these row/affordance pieces
 * so selection + expand styling stays consistent.
 */
import { ChevronRight, Plus, type LucideIcon } from "lucide-react";
import { cn } from "@risingbrain/ui/cn";

export function TreeRow({
  label,
  depth = 0,
  active = false,
  muted = false,
  expandable = false,
  expanded = false,
  icon: Icon,
  onToggle,
  onSelect,
  badge,
}: {
  label: string;
  depth?: number;
  active?: boolean;
  /** Dim the row (e.g. an unpublished item). */
  muted?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  icon?: LucideIcon;
  onToggle?: () => void;
  onSelect?: () => void;
  badge?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative flex items-center gap-0.5 rounded-lg pr-2 text-sm transition-colors",
        active ? "bg-rb-green-500/12 text-brand" : "text-foreground hover:bg-surface-2",
      )}
      style={{ paddingLeft: 4 + depth * 16 }}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-brand" />
      )}
      <button
        type="button"
        aria-label={expanded ? "Collapse" : "Expand"}
        onClick={onToggle}
        tabIndex={expandable ? 0 : -1}
        className={cn(
          "grid h-7 w-5 shrink-0 place-items-center rounded text-muted hover:text-foreground",
          expandable ? "visible" : "invisible",
        )}
      >
        <ChevronRight className={cn("h-3.5 w-3.5 transition-transform", expanded && "rotate-90")} />
      </button>
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-2 py-2 text-left"
      >
        {Icon && (
          <Icon
            className={cn("h-4 w-4 shrink-0", active ? "text-brand" : "text-muted")}
            strokeWidth={2}
          />
        )}
        <span className={cn("truncate", muted && !active && "text-muted line-through decoration-muted/40")}>
          {label}
        </span>
        {badge}
      </button>
    </div>
  );
}

/** A dashed "add child" affordance, indented to sit under its parent. */
export function AddButton({
  label,
  depth = 0,
  onClick,
}: {
  label: string;
  depth?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{ marginLeft: 4 + depth * 16 + 20 }}
      className="my-0.5 flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-muted transition-colors hover:bg-rb-green-500/10 hover:text-accent"
    >
      <Plus className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/** Section heading in the sidebar (e.g. a Domain subject). */
export function SidebarGroupLabel({
  label,
  onAdd,
}: {
  label: string;
  onAdd?: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 px-2 pb-1 pt-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</span>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-medium text-accent transition-colors hover:bg-rb-green-500/10"
        >
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
      )}
    </div>
  );
}

/** Small count/status chip for tree rows. */
export function CountBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto shrink-0 rounded-full bg-surface-2 px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted">
      {children}
    </span>
  );
}
