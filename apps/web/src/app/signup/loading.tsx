import { Skeleton } from "@/components/loading/loading-shell";

/** Instant skeleton for the auth (signup) screen — mirrors the split-card layout. */
export default function SignupLoading() {
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="glass grid w-full max-w-5xl overflow-hidden rounded-3xl lg:grid-cols-2">
        {/* Left brand rail (desktop only) */}
        <div className="hidden flex-col justify-between border-r border-border bg-gradient-to-br from-rb-green-900/30 via-surface/20 to-surface-2/40 p-10 lg:flex">
          <Skeleton className="h-10 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
          <Skeleton className="h-4 w-1/2" />
        </div>

        {/* Right form */}
        <div className="p-8 sm:p-10">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="mt-3 h-4 w-2/3" />
          <div className="mt-8 space-y-4">
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-2xl" />
          </div>
          <Skeleton className="mx-auto mt-6 h-4 w-1/2" />
        </div>
      </div>
    </div>
  );
}
