import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/** The combined-progress ring panel that sits in the hero's right rail. */
function ProgressPanelSkeleton() {
  return (
    <div className="glass rounded-3xl p-7">
      <Skeleton className="mb-5 h-5 w-32" />
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
        <div className="flex shrink-0 flex-col items-center">
          <Skeleton className="h-[108px] w-[108px] rounded-full" />
          <Skeleton className="mt-2 h-3 w-16" />
        </div>
        <div className="hidden self-stretch border-l border-border sm:block" />
        <div className="flex w-full justify-around gap-3 sm:w-auto sm:gap-5">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-16 w-16 rounded-full" />
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-2.5 w-10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Instant skeleton for the DSA Sheets page while sheets + progress stream in. */
export default function SheetLoading() {
  return (
    <main className="flex-1">
      <Container className="py-8 sm:py-12">
        {/* Hero row: title block + progress rail */}
        <div className="lg:flex lg:items-center lg:justify-between lg:gap-8">
          <div className="lg:max-w-2xl">
            <Skeleton className="h-12 w-3/4 rounded-xl sm:h-14" />
            <Skeleton className="mt-2 h-12 w-2/3 rounded-xl sm:h-14" />
            <Skeleton className="mt-4 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-5/6" />
            <div className="mt-6 flex flex-wrap gap-2.5">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-28 rounded-full" />
              ))}
            </div>
          </div>
          <aside className="hidden lg:block lg:w-[28rem] lg:shrink-0">
            <ProgressPanelSkeleton />
          </aside>
        </div>

        {/* Progress panel on mobile */}
        <div className="mb-2 mt-4 lg:hidden">
          <ProgressPanelSkeleton />
        </div>

        {/* Sheet tabs */}
        <div className="mt-8 flex flex-wrap gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="glass-pill flex items-center gap-3 rounded-2xl px-6 py-4"
            >
              <Skeleton className="h-10 w-10 rounded-full" />
              <div>
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-16" />
              </div>
            </div>
          ))}
        </div>

        {/* Topic accordion rows */}
        <div className="mt-6 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="glass rounded-3xl px-4 py-6 sm:px-6 sm:py-7"
            >
              <div className="flex items-center gap-4">
                <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-5 w-1/3" />
                  <div className="mt-2 flex items-center gap-3">
                    <Skeleton className="h-1.5 w-full max-w-xs rounded-full" />
                    <Skeleton className="h-3 w-12 shrink-0" />
                  </div>
                </div>
                <Skeleton className="hidden h-3 w-20 sm:block" />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </main>
  );
}
