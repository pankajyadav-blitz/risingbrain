import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Static skeletons for the admin route's `loading.tsx` files.
 *
 * They render INSIDE the admin layout (the section header + tabs are already on
 * screen by then), so each one only has to stand in for the scrollport's
 * content. Everything here is 100% static — no `await`, no data — so React can
 * stream it the instant a tab is clicked.
 */

/**
 * Twin of <ManagerShell> for the three tree editors (Sheets, Domain, Screening).
 * Mirrors it panel-for-panel and at the same breakpoints: two glass cards side
 * by side from `lg`, and below that only the list — the editor is `hidden` until
 * something is selected, which is exactly the state a fresh load lands in.
 */
export function ManagerSkeleton({ sidebarTitle }: { sidebarTitle: string }) {
  return (
    <div className="flex min-h-0 flex-col gap-3 p-3 lg:h-full lg:flex-row">
      {/* ===== List panel ===== */}
      <aside className="glass flex flex-col overflow-hidden rounded-3xl lg:h-full lg:w-[300px] lg:shrink-0 xl:w-[340px]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border bg-surface-2 px-4 py-2.5">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-accent">
            {sidebarTitle}
          </span>
          <Skeleton className="h-6 w-16 rounded-lg" />
        </div>
        {/* Tree rows, indented in the same 16px steps as <TreeRow depth>, so the
            list keeps its shape as the real tree replaces it. */}
        <div className="min-h-0 flex-1 space-y-0.5 p-2">
          {[0, 1, 1, 0, 1, 1, 2, 0, 1, 0, 0, 1].map((depth, i) => (
            <div
              key={i}
              className="flex items-center gap-2 py-2"
              style={{ paddingLeft: 4 + depth * 16 }}
            >
              <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
              <Skeleton className="h-4 w-4 shrink-0 rounded" />
              <Skeleton className={`h-3.5 ${["w-40", "w-28", "w-32", "w-36"][i % 4]}`} />
            </div>
          ))}
        </div>
      </aside>

      {/* ===== Editor panel ===== */}
      <section className="glass hidden min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-3xl lg:flex lg:h-full">
        {/* Header band — same opaque surface-2 as <EditorFrame>. */}
        <div className="shrink-0 border-b border-border bg-surface-2 px-5 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="mt-1.5 h-5 w-56" />
            </div>
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
            <Skeleton className="h-9 w-9 shrink-0 rounded-xl" />
          </div>
        </div>

        {/* Field column */}
        <div className="min-h-0 flex-1 px-4 py-5 sm:px-6 lg:py-6">
          <div className="mx-auto max-w-5xl space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-2 h-10 w-full rounded-xl" />
              </div>
            ))}
            <div>
              <Skeleton className="h-3 w-28" />
              <Skeleton className="mt-2 h-40 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-surface-2 px-5 py-3">
          <Skeleton className="h-3 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-20 rounded-full" />
            <Skeleton className="h-9 w-36 rounded-full" />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Twin of the two server-rendered lists (the interview queue and the feedback
 * inbox): intro copy, status tabs, a search bar and a stack of glass cards.
 * `tabs`/`cards` are per-route so each keeps its own width and density.
 */
export function QueueSkeleton({ tabs, cards = 3 }: { tabs: number; cards?: number }) {
  return (
    <div className="mx-auto max-w-4xl px-4 pb-10 pt-6 sm:px-6">
      {/* Intro paragraph */}
      <Skeleton className="h-4 w-full max-w-prose" />
      <Skeleton className="mt-2 h-4 w-4/5 max-w-prose" />

      {/* Status tabs */}
      <div className="mt-5 flex flex-wrap gap-1.5">
        {Array.from({ length: tabs }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-28 rounded-full" />
        ))}
      </div>

      {/* Search */}
      <div className="mt-4 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>

      {/* Cards */}
      <div className="mt-5 space-y-4">
        {Array.from({ length: cards }).map((_, i) => (
          <div key={i} className="glass rounded-3xl p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="mt-1.5 h-3 w-24" />
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>

            <Skeleton className="mt-4 h-4 w-3/4" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-2/3" />

            <div className="mt-3 flex flex-wrap gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Action row */}
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3.5">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div>
                <Skeleton className="h-3 w-24" />
                <Skeleton className="mt-1 h-2.5 w-32" />
              </div>
              <Skeleton className="ml-auto h-9 w-28 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
