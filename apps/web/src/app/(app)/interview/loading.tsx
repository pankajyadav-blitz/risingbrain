import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/** Instant skeleton for the Interview Experiences feed while it streams in. */
export default function InterviewLoading() {
  return (
    <main className="flex-1">
      <Container>
        <section className="py-14 sm:py-20">
          {/* Header */}
          <div className="mx-auto mb-10 flex max-w-2xl flex-col items-center text-center">
            <Skeleton className="h-7 w-44 rounded-full" />
            <Skeleton className="mt-4 h-10 w-3/4 rounded-xl" />
            <Skeleton className="mt-4 h-4 w-full max-w-xl" />
            <Skeleton className="mt-2 h-4 w-5/6 max-w-xl" />
            <div className="mt-7 flex flex-wrap justify-center gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-9 w-32 rounded-full" />
              ))}
            </div>
          </div>

          {/* Share CTA */}
          <div className="mb-6 flex justify-center">
            <Skeleton className="h-12 w-56 rounded-full" />
          </div>

          {/* Filter / search bar */}
          <div className="glass mb-4 rounded-2xl p-3 sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <Skeleton className="h-10 w-full rounded-xl lg:max-w-sm" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-8 w-16 rounded-full" />
                ))}
              </div>
            </div>
          </div>

          {/* Results toolbar */}
          <div className="mb-5 flex items-center justify-between px-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-7 w-28 rounded-full" />
          </div>

          {/* Feed grid */}
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass flex flex-col rounded-3xl p-5">
                {/* Header */}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Skeleton className="h-11 w-11 shrink-0 rounded-2xl" />
                    <div className="min-w-0">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="mt-1.5 h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
                </div>
                {/* Meta chips */}
                <div className="mb-3 flex gap-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                {/* Title + excerpt */}
                <Skeleton className="mb-2 h-4 w-5/6" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-full" />
                <Skeleton className="mt-1.5 h-3 w-2/3" />
                {/* Tags */}
                <div className="mb-4 mt-3 flex gap-1.5">
                  <Skeleton className="h-4 w-12 rounded-full" />
                  <Skeleton className="h-4 w-14 rounded-full" />
                </div>
                {/* Footer */}
                <div className="mt-auto flex items-center justify-between border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <div>
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="mt-1 h-2.5 w-12" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </Container>
    </main>
  );
}
