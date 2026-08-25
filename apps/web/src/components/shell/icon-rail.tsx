"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  ListTodo,
  Database,
  NotebookPen,
  GraduationCap,
  MessagesSquare,
  Shield,
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  User,
  type LucideIcon,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { LogoutButton } from "@/components/logout-button";
import { DetailsAutoClose } from "@/components/details-auto-close";
import { StreakBadge } from "@/components/streak-badge";
import type { NavItem } from "@/lib/rbac";

/** Map a nav label to its icon. Falls back to a generic icon. */
const ICONS: Record<string, LucideIcon> = {
  Sheets: ListTodo,
  Domain: Database,
  Screening: NotebookPen,
  Courses: GraduationCap,
  Interview: MessagesSquare,
  Admin: Shield,
};

/** Generic fallback icon for any nav label without an explicit mapping. */
const FALLBACK_ICON: LucideIcon = ListTodo;

export interface RailUser {
  name: string | null;
  role: string;
}

/**
 * The far-left icon rail — the top-level section switcher for the signed-in app
 * shell. Icon-only on desktop with a hover label; a `<details>` drawer on mobile.
 * Active section is derived from the URL. Nav items are decided server-side
 * (`getNavForRole`) and passed in, so the browser never sees links a role can't
 * use.
 */
export function IconRail({
  items,
  user,
  streak = null,
}: {
  items: NavItem[];
  user: RailUser | null;
  streak?: number | null;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <DetailsAutoClose />
      {/* ===== Desktop rail (floating glass card) ===== */}
      <aside className="glass hidden w-[76px] shrink-0 flex-col items-center gap-1 rounded-2xl py-4 lg:flex">
        <Link
          href="/"
          aria-label="RisingBrain home"
          className="mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-rb-green-500 text-black transition-transform hover:scale-105"
        >
          <Brain className="h-6 w-6" strokeWidth={2.5} />
        </Link>

        <nav className="flex flex-1 flex-col items-center gap-1.5">
          {items.map((item) => {
            const Icon = ICONS[item.label] ?? FALLBACK_ICON;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`group relative grid h-12 w-12 place-items-center rounded-xl transition-all ${
                  active
                    ? "bg-rb-green-500/15 text-brand ring-1 ring-rb-green-500/40"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                {active && (
                  <span className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r bg-brand" />
                )}
                <Icon className="h-[22px] w-[22px]" />
                {/* Hover label */}
                <span className="glass pointer-events-none absolute left-full z-50 ml-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs font-semibold opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-2">
          {streak !== null && <StreakBadge streak={streak} />}
          <ThemeToggle />
          {user ? (
            <details data-autoclose className="relative [&_summary::-webkit-details-marker]:hidden">
              <summary
                className="grid h-11 w-11 cursor-pointer list-none place-items-center rounded-full bg-gradient-to-br from-rb-green-400 to-rb-green-700 text-sm font-bold text-rb-green-900 ring-2 ring-rb-green-500/30"
                aria-label="Account menu"
              >
                {initials(user.name)}
              </summary>
              <div className="glass animate-in absolute bottom-0 left-full z-50 ml-3 w-48 rounded-2xl p-2">
                <div className="truncate px-3 py-2 text-sm font-semibold">
                  {user.name ?? "RisingBrain user"}
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <LogoutButton className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                  <>
                    <LogOut className="h-4 w-4" /> Logout
                  </>
                </LogoutButton>
              </div>
            </details>
          ) : (
            <Link
              href="/login"
              aria-label="Log in"
              className="grid h-11 w-11 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
            >
              <LogIn className="h-5 w-5" />
            </Link>
          )}
        </div>
      </aside>

      {/* ===== Mobile top bar ===== */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface/70 px-4 py-3 backdrop-blur-xl lg:hidden">
        <Link href="/" className="flex items-center gap-2.5" aria-label="RisingBrain home">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-rb-green-500">
            <Brain className="h-5 w-5 text-black" strokeWidth={2.5} />
          </span>
          <span className="text-lg font-semibold tracking-tight">
            Rising<span className="text-rb-green-400">Brain</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {streak !== null && <StreakBadge streak={streak} />}
          <ThemeToggle />
          <details data-autoclose className="relative [&_summary::-webkit-details-marker]:hidden">
            <summary
              className="glass-pill grid h-9 w-9 cursor-pointer list-none place-items-center rounded-xl"
              aria-label="Menu"
            >
              <Menu className="h-5 w-5" />
            </summary>
            <div className="glass animate-in absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl p-2">
              {items.map((item) => {
                const Icon = ICONS[item.label] ?? FALLBACK_ICON;
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-rb-green-500/15 text-brand"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {item.label}
                  </Link>
                );
              })}
              <div className="my-1 h-px bg-border" />
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                  >
                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                  </Link>
                  <LogoutButton className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
                    <>
                      <LogOut className="h-4 w-4" /> Logout
                    </>
                  </LogoutButton>
                </>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <User className="h-4 w-4" /> Log in
                </Link>
              )}
            </div>
          </details>
        </div>
      </header>
    </>
  );
}

function initials(name: string | null) {
  return (
    name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "RB"
  );
}
