import { Brain } from "lucide-react";

/**
 * Building blocks for route-level `loading.tsx` files (Next.js App Router
 * instant Suspense fallbacks). These are 100% static — no `await`, no data
 * fetch — so React can stream them to the browser the instant a navigation
 * starts, long before the real page's server work resolves.
 */

/** A single pulsing placeholder. Mirrors the look used in the aptitude skeleton. */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded bg-surface-2 ${className}`} />;
}

/**
 * Static twin of the real <Navbar>. The logo + link labels are static in the
 * real nav too, so we render them for real — only the auth-dependent right side
 * is unknown mid-navigation, so it shows neutral placeholders.
 *
 * The placeholders mirror the real right-side cluster slot-for-slot AND at the
 * same breakpoints (theme toggle + profile/login pill are `sm:` only; the
 * hamburger is `lg:hidden`), so the cluster keeps the exact same width as it
 * loads — no button shift. Pass `signedIn` on auth-gated routes (e.g. /screening)
 * so the streak badge's width is reserved too.
 */
export function NavbarSkeleton({
  signedIn = false,
}: { signedIn?: boolean } = {}) {
  const links = ["Sheets", "Domain", "Screening", "Courses", "Interview"];
  return (
    <header className="sticky top-0 z-50 px-4 pt-4 sm:px-6 lg:px-10 xl:px-16 2xl:px-24">
      {/* Matches the real navbar's progressive blur/fade backdrop. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-background via-background/80 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <nav className="glass relative flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 sm:px-6">
        <span className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rb-green-500">
            <Brain className="h-5 w-5 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Rising<span className="text-rb-green-400">Brain</span>
          </span>
        </span>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((label) => (
            <li
              key={label}
              className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted"
            >
              {label}
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {/* Streak badge — signed-in only (rounded-xl px-2.5 py-1.5) */}
          {signedIn ? <Skeleton className="h-8 w-14 rounded-xl" /> : null}
          {/* Theme toggle — sm+ only, h-9 w-9 rounded-full */}
          <Skeleton className="hidden h-9 w-9 rounded-full sm:block" />
          {/* Profile / Get-started pill — sm+ only */}
          <Skeleton className="hidden h-9 w-28 rounded-xl sm:block" />
          {/* Mobile menu (hamburger) — lg:hidden, h-9 w-9 rounded-xl */}
          <Skeleton className="h-9 w-9 rounded-xl lg:hidden" />
        </div>
      </nav>
    </header>
  );
}
