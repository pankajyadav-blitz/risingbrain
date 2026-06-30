import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/** Instant skeleton for the SQL practice page while the problem list streams in. */
export default function SqlLoading() {
  return (
    <main className="flex-1">
      <Container>
        <section className="py-16 sm:py-20">
          {/* Header */}
          <div className="mx-auto mb-12 flex max-w-2xl flex-col items-center text-center">
            <Skeleton className="h-7 w-32 rounded-full" />
            <Skeleton className="mt-4 h-9 w-2/3 rounded-xl" />
            <Skeleton className="mt-3 h-4 w-full max-w-md" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-md" />
            <div className="mt-6 flex gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-7 w-20 rounded-full" />
              ))}
            </div>
          </div>

          {/* Grouped problem cards */}
          <div className="mx-auto max-w-3xl space-y-12">
            {Array.from({ length: 2 }).map((_, g) => (
              <div key={g}>
                {/* Topic heading + count */}
                <div className="mb-5 flex items-center gap-3">
                  <Skeleton className="h-4 w-32" />
                  <span className="h-px flex-1 bg-border" aria-hidden />
                  <Skeleton className="h-3 w-16" />
                </div>
                <div className="grid gap-5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="glass rounded-3xl p-6 sm:p-7">
                      {/* Title + difficulty */}
                      <div className="flex items-start justify-between gap-4">
                        <Skeleton className="h-6 w-1/2" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      {/* Topic + tags */}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Skeleton className="h-6 w-24 rounded-full" />
                        <Skeleton className="h-6 w-16 rounded-full" />
                      </div>
                      {/* Approach & solution disclosure bar */}
                      <Skeleton className="mt-5 h-11 w-full rounded-2xl" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
