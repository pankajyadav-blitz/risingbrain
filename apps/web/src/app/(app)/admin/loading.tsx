import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Instant skeleton for the admin Overview while its counts are queried.
 *
 * It renders inside the admin layout's scrollport, so the section header and the
 * tab bar are already on screen — this only stands in for the card grid. Each
 * child section carries its own `loading.tsx` (this one would be the wrong shape
 * for a tree editor or a review queue).
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="max-w-prose flex-1">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="mt-2 h-4 w-2/3" />
        </div>
        <Skeleton className="h-10 w-36 rounded-full" />
      </div>

      {/* Six section cards — same 3/2/1 column grid as the real page. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass flex flex-col rounded-3xl p-5">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 shrink-0 rounded-2xl" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="ml-auto h-4 w-4 shrink-0 rounded" />
            </div>

            <div className="mt-3">
              <Skeleton className="h-3.5 w-full" />
              <Skeleton className="mt-1.5 h-3.5 w-3/5" />
            </div>

            {/* `mt-auto` pins the figures to the bottom edge, as on the real card. */}
            <div className="mt-auto pt-5">
              <div className="flex items-baseline gap-2 border-t border-border/70 pt-4">
                <Skeleton className="h-8 w-14" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="mt-2.5 h-3 w-40" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
