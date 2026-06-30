import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/** Instant skeleton for a single interview experience while it streams in. */
export default function InterviewDetailLoading() {
  return (
    <main className="flex-1">
      <Container>
        <article className="mx-auto max-w-3xl py-10 sm:py-14">
          {/* Back link */}
          <Skeleton className="mb-8 h-4 w-32" />

          {/* Header card */}
          <header className="glass rounded-3xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                <Skeleton className="h-12 w-12 shrink-0 rounded-2xl" />
                <div className="min-w-0">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="mt-1.5 h-4 w-24" />
                </div>
              </div>
              <Skeleton className="h-7 w-24 shrink-0 rounded-full" />
            </div>

            {/* Meta chips */}
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>

            {/* Title */}
            <Skeleton className="mt-5 h-8 w-5/6 rounded-xl" />
            <Skeleton className="mt-2 h-8 w-2/3 rounded-xl" />

            {/* Author */}
            <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
              <Skeleton className="h-9 w-9 rounded-full" />
              <div className="leading-tight">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="mt-1.5 h-3 w-16" />
              </div>
            </div>

            {/* Tags */}
            <div className="mt-4 flex flex-wrap gap-1.5">
              <Skeleton className="h-4 w-14 rounded-full" />
              <Skeleton className="h-4 w-12 rounded-full" />
              <Skeleton className="h-4 w-16 rounded-full" />
            </div>
          </header>

          {/* Body */}
          <div className="mt-8 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-6 h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-10/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>

          {/* Like bar */}
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <Skeleton className="h-10 w-24 rounded-full" />
            <Skeleton className="h-10 w-32 rounded-full" />
          </div>

          {/* Comments */}
          <div className="mt-8 space-y-4">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="mt-2 h-4 w-full" />
                  <Skeleton className="mt-1.5 h-4 w-4/5" />
                </div>
              </div>
            ))}
          </div>
        </article>
      </Container>
    </main>
  );
}
