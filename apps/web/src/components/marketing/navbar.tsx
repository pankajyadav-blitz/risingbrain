import Link from "next/link";
import { Brain, ChevronDown, LayoutDashboard, LogOut, User } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { DetailsAutoClose } from "@/components/details-auto-close";
import { NavScroll } from "@/components/marketing/nav-scroll";
import { StreakBadge } from "@/components/streak-badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentStreak } from "@/lib/streak";

export interface NavUser {
  name: string | null;
  role: string;
}

/**
 * Minimal marketing navbar. A landing page's nav has one job — convert — so it
 * deliberately drops the app's section tabs (those live in the signed-in icon
 * rail) and leads with a single "Start free" CTA. Logo left, actions right,
 * generous whitespace. Auth-aware: signed-in visitors get a compact profile
 * menu (Dashboard / Logout) and their streak instead.
 *
 * Server component — the auth state is resolved server-side; the only client
 * islands are the theme toggle, streak badge, logout button and scroll state.
 */
export async function Navbar({ user }: { user: NavUser | null }) {
  const firstName = user?.name?.split(" ")[0] ?? "Profile";

  // Streak is only fetched (and rendered) for signed-in users, so anonymous
  // landing visitors trigger no backend call. `null` = hide the badge.
  let streak: number | null = null;
  if (user) {
    const current = await getCurrentUser();
    if (current) streak = await getCurrentStreak(current.id);
  }

  return (
    <header
      id="site-header"
      className="sticky top-0 z-50 px-4 pt-4 transition-[padding] duration-300 sm:px-6 lg:px-10 xl:px-16 2xl:px-24"
    >
      {/* Progressive blur + background fade so content scrolling under the
          floating pill dissolves into the page rather than showing through. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-background via-background/80 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <DetailsAutoClose />
      <NavScroll />
      <nav className="nav-pill glass relative flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-[padding,box-shadow,background-color] duration-300 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5" aria-label="RisingBrain home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rb-green-500">
            <Brain className="h-5 w-5 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Rising<span className="text-rb-green-400">Brain</span>
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3">
          {streak !== null && <StreakBadge streak={streak} />}
          <ThemeToggle />

          {user ? (
            // Compact profile menu — pure-HTML <details> disclosure; the only
            // client island inside is the logout button.
            <details
              data-autoclose
              className="relative [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="glass-pill flex max-w-[12rem] cursor-pointer list-none items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-foreground">
                <User className="h-4 w-4 shrink-0 text-accent" />
                <span className="hidden min-w-0 flex-1 truncate sm:inline">{firstName}</span>
                <ChevronDown className="h-4 w-4 shrink-0 text-muted" />
              </summary>
              <div className="animate-in absolute right-0 top-full mt-2 w-48 rounded-2xl border border-border bg-surface p-2 shadow-xl">
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <LogoutButton className="flex w-full items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                  <>
                    <LogOut className="h-4 w-4" /> Logout
                  </>
                </LogoutButton>
              </div>
            </details>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-xl px-3.5 py-2 text-sm font-semibold text-muted transition-colors hover:text-foreground sm:block"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="btn-glow rounded-xl px-4 py-2 text-sm font-semibold"
              >
                Start free
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
