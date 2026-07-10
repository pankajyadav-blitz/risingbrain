import Link from "next/link";
import {
  Brain,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { DetailsAutoClose } from "@/components/details-auto-close";
import { NavScroll } from "@/components/marketing/nav-scroll";
import { StreakBadge } from "@/components/streak-badge";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentStreak } from "@/lib/streak";

const links = [
  { href: "/sheet", label: "Sheets" },
  { href: "/domain", label: "Domain" },
  { href: "/screening", label: "Screening" },
  { href: "/courses", label: "Courses" },
  { href: "/interview", label: "Interview" },
];

export interface NavUser {
  name: string | null;
  role: string;
}

/**
 * Server component — `user` is resolved server-side and the correct links are
 * rendered on the server (server-decided nav). The mobile menu is a pure-HTML
 * <details> disclosure, so the only client islands are the theme toggle and the
 * logout button.
 */
export async function Navbar({ user }: { user: NavUser | null }) {
  const firstName = user?.name?.split(" ")[0] ?? "Profile";

  // Streak is only fetched (and the flame only rendered) for signed-in users, so
  // anonymous/landing visitors trigger no backend call and stay fully static.
  // `null` means "couldn't determine" (signed out, or the lookup degraded) — the
  // badge is then hidden entirely rather than showing a misleading broken flame.
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
      {/* Progressive blur + background fade behind the bar. Anything scrolling up
          under the navbar gets blurred and dissolves into the page background
          before the top edge, instead of showing through the gap around the
          floating pill. The mask tapers the effect so it blends into the live
          content just below the bar. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-background via-background/80 to-transparent backdrop-blur-md [mask-image:linear-gradient(to_bottom,black_55%,transparent)] [-webkit-mask-image:linear-gradient(to_bottom,black_55%,transparent)]"
      />
      <DetailsAutoClose />
      <NavScroll />
      <nav className="nav-pill glass relative flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-3 transition-[padding,box-shadow,background-color] duration-300 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5"
          aria-label="RisingBrain home"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rb-green-500">
            <Brain className="h-5 w-5 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Rising<span className="text-rb-green-400">Brain</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="rounded-xl px-3.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          {streak !== null && <StreakBadge streak={streak} />}
          <ThemeToggle className="hidden sm:inline-grid" />

          {user ? (
            // Profile dropdown — pure-HTML <details> disclosure (the only client
            // island is the logout button inside it).
            <details
              data-autoclose
              className="relative hidden sm:block [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="glass-pill flex max-w-[12rem] cursor-pointer list-none items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold text-foreground transition-colors hover:text-foreground">
                <User className="h-4 w-4 shrink-0 text-accent" />
                <span className="min-w-0 flex-1 truncate">{firstName}</span>
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
            <Link
              href="/login"
              className="btn-glow hidden rounded-xl px-4 py-2 text-sm font-semibold sm:block"
            >
              Get started
            </Link>
          )}

          {/* Mobile menu — pure-HTML disclosure, closes on outside click. */}
          <details
            data-autoclose
            className="relative lg:hidden [&_summary::-webkit-details-marker]:hidden"
          >
            <summary
              className="glass-pill grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl"
              aria-label="Toggle navigation menu"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="animate-in absolute right-0 top-full mt-2 w-64 rounded-2xl border border-border bg-surface p-2 shadow-xl">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-4 py-3 text-sm font-medium text-muted hover:bg-surface-2 hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
              <div className="mt-1 flex items-center gap-2 px-2 pb-1 pt-2">
                <ThemeToggle />
                {user ? (
                  <Link
                    href="/profile"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-muted hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                ) : (
                  <Link
                    href="/login"
                    className="btn-glow flex-1 rounded-xl px-4 py-3 text-center text-sm font-semibold"
                  >
                    Get started
                  </Link>
                )}
              </div>
              {user ? (
                <LogoutButton className="btn-glow mt-1 block w-full rounded-xl px-4 py-3 text-center text-sm font-semibold" />
              ) : null}
            </div>
          </details>
        </div>
      </nav>
    </header>
  );
}
