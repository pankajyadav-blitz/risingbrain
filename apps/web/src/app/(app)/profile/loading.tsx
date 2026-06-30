import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/** Instant skeleton for the Profile dashboard while stats + heatmap stream in. */
export default function ProfileLoading() {
  return (
    <main className="flex-1 py-8 sm:py-10">
      <Container className="space-y-6">
        {/* Identity header */}
        <div className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <Skeleton className="h-20 w-20 shrink-0 rounded-full" />
            <div className="w-full sm:flex-1">
              <Skeleton className="mx-auto h-7 w-48 sm:mx-0" />
              <Skeleton className="mx-auto mt-2 h-4 w-40 sm:mx-0" />
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="glass-pill flex items-center gap-3 rounded-2xl px-4 py-3"
              >
                <Skeleton className="h-6 w-6 rounded" />
                <div>
                  <Skeleton className="h-5 w-10" />
                  <Skeleton className="mt-1.5 h-2.5 w-20" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Per-section progress */}
        <section>
          <Skeleton className="h-5 w-36" />
          <Skeleton className="mt-2 h-3 w-72 max-w-full" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="glass rounded-3xl p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="mt-1.5 h-3 w-28" />
                  </div>
                  <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
                </div>
                <div className="mt-5 space-y-3">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j}>
                      <div className="mb-1 flex justify-between">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-10" />
                      </div>
                      <Skeleton className="h-1.5 w-full rounded-full" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Activity heatmap */}
        <div className="glass rounded-3xl p-5 sm:p-7">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <Skeleton className="h-5 w-44" />
              <Skeleton className="mt-1.5 h-3 w-32" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <div className="flex items-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-3 w-3 rounded-[2px]" />
                ))}
              </div>
            </div>
          </div>
          {/* Month columns */}
          <div className="overflow-hidden">
            <div className="flex min-w-[760px] gap-3">
              {Array.from({ length: 12 }).map((_, m) => (
                <div key={m} className="flex flex-1 flex-col gap-2">
                  <Skeleton className="mx-auto h-2.5 w-6" />
                  <Skeleton className="h-20 w-full rounded-[3px]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
