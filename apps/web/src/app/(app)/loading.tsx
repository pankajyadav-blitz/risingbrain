import { Container } from "@/components/marketing/primitives";
import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Fallback for the marketing home (hero + stats) and the default for any (app)
 * segment that lacks its own loading.tsx. The navbar + footer live in the (app)
 * layout and persist across navigation, so this only renders the page body.
 */
export default function HomeLoading() {
  return (
    <main className="flex-1">
      <Container className="text-center">
        {/* Hero */}
        <section className="py-16 sm:py-24">
          <Skeleton className="mx-auto mb-6 h-8 w-44 rounded-full" />
          <Skeleton className="mx-auto h-12 w-full max-w-3xl rounded-xl sm:h-16" />
          <Skeleton className="mx-auto mt-3 h-12 w-2/3 max-w-2xl rounded-xl sm:h-16" />
          <Skeleton className="mx-auto mt-6 h-5 w-full max-w-2xl" />
          <Skeleton className="mx-auto mt-2 h-5 w-5/6 max-w-xl" />

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Skeleton className="h-11 w-48 rounded-2xl" />
            <Skeleton className="h-11 w-44 rounded-2xl" />
          </div>

          <div className="mt-12 flex flex-col items-center gap-3">
            <div className="flex items-center">
              <div className="flex -space-x-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton
                    key={i}
                    className="h-10 w-10 rounded-full border-2 border-background"
                  />
                ))}
              </div>
              <Skeleton className="ml-3 h-7 w-28 rounded-full" />
            </div>
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
        </section>

        {/* Stats */}
        <section className="grid grid-cols-2 gap-3 pb-16 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass rounded-3xl px-5 py-6">
              <Skeleton className="mx-auto h-8 w-16" />
              <Skeleton className="mx-auto mt-2 h-3 w-20" />
            </div>
          ))}
        </section>
      </Container>
    </main>
  );
}
