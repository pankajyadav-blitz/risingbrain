import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Static skeletons for the aptitude workspace, shared so every fallback stays in
 * lockstep with the real UI:
 *  - `PaperSkeleton`            → the `[topicId]` Suspense fallback (paper pane).
 *  - `NavIndexSkeleton`         → the `@nav` index column.
 *  - `AptitudeWorkspaceSkeleton`→ the layout's streaming fallback AND the route
 *    `loading.tsx`, i.e. index + paper together inside the full-height flex chain.
 *
 * They mirror the real markup class-for-class so the swap to live content causes
 * no layout shift.
 */

/** Mirrors <Paper>: header → theory/formula notes → MCQ list. */
export function PaperSkeleton() {
  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      {/* Header */}
      <div className="mb-6 border-b border-border pb-5">
        <Skeleton className="h-3 w-24" />
        <div className="mt-1 flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-2/5" />
          <Skeleton className="h-4 w-20 shrink-0" />
        </div>
        {/* Topic progress bar */}
        <Skeleton className="mt-4 h-2 w-full rounded-full" />
      </div>

      {/* Theory / formulae note boxes */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-2 p-3.5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2 h-3 w-full" />
            <Skeleton className="mt-1.5 h-3 w-5/6" />
          </div>
        ))}
      </div>

      {/* Questions — paper style */}
      <ol className="divide-y divide-border/60">
        {Array.from({ length: 5 }).map((_, i) => (
          <li key={i} className="py-5">
            <div className="flex items-start gap-3">
              {/* Question number */}
              <Skeleton className="mt-0.5 h-4 w-4 shrink-0" />
              <div className="min-w-0 flex-1">
                {/* Prompt + difficulty pill + status dot */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="mt-1.5 h-4 w-3/4" />
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-5 rounded-full" />
                  </div>
                </div>

                {/* Options — two columns like a real MCQ paper */}
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
                    >
                      <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  ))}
                </div>

                {/* Submit action */}
                <Skeleton className="mt-3 h-9 w-28 rounded-full" />
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Mirrors <NavList>: category heading (icon + name + %) → topic link rows. */
export function NavIndexSkeleton() {
  return (
    <div className="space-y-5">
      {Array.from({ length: 3 }).map((_, c) => (
        <div key={c}>
          <div className="mb-2 flex items-center gap-2 px-2">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-28" />
            <Skeleton className="ml-auto h-3 w-8" />
          </div>
          <ul className="space-y-0.5">
            {Array.from({ length: 4 }).map((_, t) => (
              <li key={t}>
                <div className="flex items-center gap-2 rounded-xl px-3 py-2">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="ml-auto h-3 w-8 shrink-0" />
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
 * Header + index + paper together — the exact shape the live <AptitudeWorkspace>
 * renders into, so the loading screen is a PURE skeleton (no half-real header)
 * and swaps to live content with no layout shift. Used both as the layout's
 * <Suspense> fallback and the route `loading.tsx`.
 */
export function AptitudeWorkspaceSkeleton() {
  return (
    <>
      {/* Header — title, subtitle, topic/question tally */}
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3 lg:shrink-0">
        <div>
          <Skeleton className="h-8 w-64 max-w-full rounded-lg sm:h-9" />
          <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-4 w-36 shrink-0" />
      </div>

      <div className="pb-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pb-0">
        {/* Mobile: picker placeholder (replaces the sidebar) */}
        <div className="mb-4 lg:hidden">
          <Skeleton className="mb-1.5 h-3 w-20" />
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>

        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6 lg:overflow-hidden">
          {/* LEFT (@nav slot) */}
          <aside className="hidden lg:block lg:h-full lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:pr-1">
            <NavIndexSkeleton />
          </aside>

          {/* MAIN ([topicId] paper) */}
          <section className="min-w-0 lg:h-full lg:flex-1 lg:overflow-y-auto">
            <PaperSkeleton />
          </section>
        </div>
      </div>
    </>
  );
}
