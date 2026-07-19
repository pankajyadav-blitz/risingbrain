import { Skeleton } from "@/components/loading/loading-shell";
import { Container } from "@/components/marketing/primitives";

/**
 * Instant skeleton for the Courses "coming soon" page.
 *
 * Mirrors `page.tsx`'s frame exactly — same `Container tight` gutters and same
 * `max-w-3xl` column. If the two drift apart the content visibly jumps sideways
 * the moment the real page swaps in.
 */
export default function CoursesLoading() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center py-20 text-center">
      <Container tight>
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
          <Skeleton className="h-20 w-20 rounded-3xl" />
          <Skeleton className="mt-7 h-12 w-48 rounded-full" />
          <Skeleton className="mt-6 h-12 w-3/4 max-w-xl rounded-xl" />
          <Skeleton className="mt-5 h-4 w-full max-w-md" />
          <Skeleton className="mt-2 h-4 w-5/6 max-w-md" />
          <div className="mt-9 flex flex-wrap justify-center gap-2.5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-9 w-40 rounded-full" />
            ))}
          </div>
          <Skeleton className="mt-10 h-11 w-52 rounded-2xl" />
        </div>
      </Container>
    </main>
  );
}
