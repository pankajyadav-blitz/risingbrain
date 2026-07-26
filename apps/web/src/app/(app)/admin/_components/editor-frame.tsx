"use client";

/**
 * Editor shell for a selected node: a sticky header (breadcrumb + title +
 * reorder/delete), a scrollable, readable-width field column, and a sticky
 * footer save bar with live status. Managers drop their fields in as `children`.
 */
import { ArrowDown, ArrowUp, Check, Loader2, Save, Trash2, type LucideIcon } from "lucide-react";
import { cn } from "@risingbrain/ui/cn";
import { FormError } from "./fields";

export function EditorFrame({
  eyebrow,
  breadcrumb,
  title,
  icon: Icon,
  onMoveUp,
  onMoveDown,
  onDelete,
  dirty,
  saving,
  saved,
  error,
  onSave,
  onReset,
  saveLabel = "Save changes",
  children,
}: {
  eyebrow: string;
  breadcrumb?: string[];
  title: string;
  icon?: LucideIcon;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onDelete?: () => void;
  dirty: boolean;
  saving: boolean;
  saved: boolean;
  error: string | null;
  onSave: () => void;
  onReset: () => void;
  saveLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 shrink-0 border-b border-border bg-surface/80 px-5 py-4 backdrop-blur-xl lg:static lg:bg-transparent lg:backdrop-blur-none">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {Icon && (
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rb-green-500/12 text-accent ring-1 ring-rb-green-500/20">
                <Icon className="h-5 w-5" />
              </span>
            )}
            <div className="min-w-0">
              <p className="flex flex-wrap items-center gap-1 text-[11px] font-medium uppercase tracking-wide text-accent">
                {breadcrumb && breadcrumb.length > 0 ? (
                  breadcrumb.map((c, i) => (
                    <span key={i} className="flex items-center gap-1">
                      {i > 0 && <span className="text-muted/50">/</span>}
                      <span className="max-w-[10rem] truncate normal-case text-muted">{c}</span>
                    </span>
                  ))
                ) : (
                  <span>{eyebrow}</span>
                )}
              </p>
              <h2 className="truncate text-lg font-semibold text-foreground">{title}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {onMoveUp && (
              <IconBtn label="Move up" onClick={onMoveUp} disabled={saving}>
                <ArrowUp className="h-4 w-4" />
              </IconBtn>
            )}
            {onMoveDown && (
              <IconBtn label="Move down" onClick={onMoveDown} disabled={saving}>
                <ArrowDown className="h-4 w-4" />
              </IconBtn>
            )}
            {onDelete && (
              <IconBtn label="Delete" onClick={onDelete} disabled={saving} danger>
                <Trash2 className="h-4 w-4" />
              </IconBtn>
            )}
          </div>
        </div>
      </div>

      {/* Fields — wide, using the available editor width */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6 lg:py-6">
        <div className="mx-auto max-w-5xl space-y-4">
          {children}
          {error && <FormError>{error}</FormError>}
        </div>
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 z-10 flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface/80 px-5 py-3 backdrop-blur-xl lg:static lg:bg-transparent">
        <span className="flex items-center gap-1.5 text-xs text-muted">
          {saving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </>
          ) : saved && !dirty ? (
            <>
              <Check className="h-3.5 w-3.5 text-accent" /> Saved
            </>
          ) : dirty ? (
            <span className="text-amber-500">Unsaved changes</span>
          ) : (
            ""
          )}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onReset}
            disabled={!dirty || saving}
            className="rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-40"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-rb-green-500 px-5 py-2 text-sm font-semibold text-black transition-opacity disabled:opacity-50"
          >
            <Save className="h-4 w-4" /> {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "grid h-9 w-9 place-items-center rounded-xl border border-border bg-surface/60 text-muted transition-colors disabled:opacity-40",
        danger ? "hover:border-rose-500/40 hover:text-rose-500" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

/** Rich empty-state shown when no node is selected. */
export function EditorEmpty({
  icon: Icon,
  title,
  message,
}: {
  icon?: LucideIcon;
  title: string;
  message: string;
}) {
  return (
    <div className="grid h-full place-items-center px-6 py-16 text-center">
      <div className="max-w-sm">
        {Icon && (
          <span className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
            <Icon className="h-7 w-7" />
          </span>
        )}
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1.5 text-sm text-muted">{message}</p>
      </div>
    </div>
  );
}
