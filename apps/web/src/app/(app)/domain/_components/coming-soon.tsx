import { Construction } from "lucide-react";
import type { DomainCategoryMeta } from "../_categories";

/**
 * Placeholder view for a Domain section whose content isn't wired up yet. It
 * lays out the SAME shell future sections will use — a left topics sidebar and a
 * right content pane — so the structure is visible and ready: when the section
 * ships, replace `<ComingSoon>` with the real sidebar + content in
 * `domain-workspace.tsx`.
 */
export function ComingSoon({ category }: { category: DomainCategoryMeta }) {
  const Icon = category.icon;
  return (
    <div className="pb-16 pt-2 lg:flex lg:gap-6">
      {/* LEFT: topics sidebar (placeholder) — the future per-section index. */}
      <aside className="hidden lg:block lg:w-72 lg:shrink-0">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
          {category.label} topics
        </p>
        <ul className="space-y-0.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted/60"
            >
              <span className="h-2 w-2 shrink-0 rounded-full bg-surface-2" />
              <span className="h-3 flex-1 rounded bg-surface-2" style={{ maxWidth: `${70 - i * 6}%` }} />
            </li>
          ))}
        </ul>
      </aside>

      {/* RIGHT: content pane — the coming-soon message for now. */}
      <section className="min-w-0 lg:flex-1">
        <div className="glass flex flex-col items-center rounded-3xl px-6 py-16 text-center sm:py-20">
          <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20">
            <Icon className="h-8 w-8" />
          </span>
          <h2 className="mt-6 text-2xl font-bold tracking-tight sm:text-3xl">
            {category.label} <span className="text-gradient">coming soon</span>
          </h2>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-muted sm:text-base">
            {category.blurb}
          </p>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-muted">
            <Construction className="h-3.5 w-3.5" /> In the works
          </span>
        </div>
      </section>
    </div>
  );
}
