"use client";

/**
 * Form primitives for the admin editors. `packages/ui` ships only
 * button/card/input, so the textarea/select/toggle/segmented controls the CRUD
 * forms need live here, styled to match the app's glass tokens.
 */
import { cn } from "@risingbrain/ui/cn";

export const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 hover:border-border/80 focus:border-rb-green-500/60 focus:ring-2 focus:ring-rb-green-500/20";

/**
 * A titled group of related fields — gives the long forms visual structure.
 * `cols={2}` lays the fields out in a responsive two-column grid so compact
 * fields use the editor's full width instead of stacking in one narrow column.
 */
export function Section({
  title,
  description,
  cols = 1,
  children,
}: {
  title: string;
  description?: string;
  cols?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface/40 p-4 sm:p-5">
      {/* Uppercase accent label, matching how every other index/group header in the
          app names a section — it separates the form's structure from its content
          at a glance, which a long editor needs more than a bolder body-sized title. */}
      <div className="mb-4 border-b border-border/70 pb-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          {title}
        </h3>
        {description && <p className="mt-1 text-xs text-muted">{description}</p>}
      </div>
      <div className={cols === 2 ? "grid gap-4 sm:grid-cols-2" : "space-y-4"}>{children}</div>
    </section>
  );
}

/** Make a field span both columns inside a `cols={2}` Section. */
export function FullSpan({ children }: { children: React.ReactNode }) {
  return <div className="sm:col-span-2">{children}</div>;
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-foreground">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-normal text-muted">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cn(inputCls, props.className)} />;
}

export function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(inputCls, "min-h-[120px] resize-y font-mono leading-relaxed", props.className)}
    />
  );
}

export function NumberInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input type="number" {...props} className={cn(inputCls, "w-24", props.className)} />;
}

export function Select({
  value,
  onChange,
  options,
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(inputCls, "cursor-pointer appearance-none bg-[length:1rem] pr-9", className)}
      style={{
        backgroundImage:
          "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")",
        backgroundRepeat: "no-repeat",
        backgroundPosition: "right 0.75rem center",
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-surface text-foreground">
          {o.label}
        </option>
      ))}
    </select>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5 text-sm font-medium text-foreground"
    >
      <span
        className={cn(
          "relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors",
          checked ? "bg-rb-green-500" : "bg-surface-2",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200",
            checked ? "translate-x-5" : "translate-x-0",
          )}
        />
      </span>
      {label}
    </button>
  );
}

/** Inline error/notice banner matching the auth-form styling. */
export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300">
      {children}
    </p>
  );
}

/** Read-only slug chip shown at the bottom of an editor. */
export function SlugNote({ slug }: { slug: string }) {
  return (
    <p className="flex items-center gap-1.5 text-xs text-muted">
      <span>Slug</span>
      <code className="rounded bg-surface-2 px-1.5 py-0.5 text-[11px] text-foreground">{slug}</code>
      <span className="text-muted/70">· fixed after creation</span>
    </p>
  );
}
