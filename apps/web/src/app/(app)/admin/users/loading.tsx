import { Skeleton } from "@/components/loading/loading-shell";

/**
 * Instant skeleton for Users. The page itself is search-only — nothing is listed
 * until an admin types an email — so this stands in for the intro line and the
 * search bar, not for a result set that isn't coming.
 */
export default function AdminUsersLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 pb-10 pt-6 sm:px-6">
      <div className="mb-1 max-w-prose">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="mt-2 h-4 w-3/5" />
      </div>

      <div className="mt-4 flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-28 rounded-xl" />
      </div>

      <div className="mt-5 grid place-items-center rounded-2xl border border-dashed border-border px-4 py-12">
        <Skeleton className="mb-3 h-7 w-7 rounded-full" />
        <Skeleton className="h-3.5 w-56" />
      </div>
    </div>
  );
}
