import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Static skeletons for the Domain workspace, mirroring the real markup class-for-
 * class so the swap to live content causes no layout shift:
 *  - `TopicSkeleton`          → the `[topicId]` Suspense fallback (content pane).
 *  - `NavIndexSkeleton`       → the `@nav` index column.
 *  - `DomainWorkspaceSkeleton`→ the layout's streaming fallback AND the route
 *    `loading.tsx`: header + index + content inside the full-height flex chain.
 */

/** Mirrors <TopicView>: header → tab bar → prose blocks + a figure. */
export function TopicSkeleton() {
  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-7 border-b border-border pb-6">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="mt-2 h-8 w-1/2" />
        <Skeleton className="mt-2.5 h-5 w-3/4" />
      </div>

      {/* Notes | Example tab bar */}
      <Skeleton className="mb-6 h-9 w-48 rounded-xl" />

      {/* Prose */}
      <div className="space-y-3">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-5/6" />
        <Skeleton className="my-4 h-48 w-full rounded-xl" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

/** Mirrors <NavList>: a group heading → its topic link rows. */
export function NavIndexSkeleton() {
  return (
    <div className="px-3 pb-3">
      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="pb-5 last:pb-0">
          {/* Mirrors the sticky group header (full-bleed bar + trailing count). */}
          <div className="-mx-3 mb-1.5 flex items-center justify-between border-b border-border/70 bg-surface-2 px-6 py-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-3" />
          </div>
          <ul className="space-y-0.5">
            {Array.from({ length: 4 }).map((_, t) => (
              <li key={t}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2">
                  <Skeleton className="h-3.5 w-3/4" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/**
 * Header + index + content together — the exact shape the live <DomainWorkspace>
 * renders into, so the loading screen is a PURE skeleton (no half-real header).
 */
export function DomainWorkspaceSkeleton() {
  return (
    <>
      {/* Subject header/tabs + search on top */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div>
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-1.5 h-2.5 w-56" />
          </div>
        </div>
        <Skeleton className="h-11 w-full rounded-xl sm:max-w-md" />
      </div>

      <div className="pb-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pb-0">
        {/* Mobile: picker placeholder */}
        <div className="mb-4 lg:hidden">
          <Skeleton className="mb-1.5 h-3 w-28" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-3 lg:overflow-hidden">
          <aside className="glass hidden lg:flex lg:h-full lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:rounded-3xl xl:w-64">
            <div className="pane-scroll min-h-0 flex-1 overflow-y-auto">
              <NavIndexSkeleton />
            </div>
          </aside>
          <section className="glass min-w-0 rounded-3xl lg:h-full lg:flex-1 lg:overflow-hidden">
            <div className="pane-scroll lg:h-full lg:overflow-y-auto">
              <TopicSkeleton />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}
