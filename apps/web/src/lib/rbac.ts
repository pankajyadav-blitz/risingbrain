/**
 * Role-based access control. Pure & edge-safe (no Prisma/Node imports) so the
 * middleware can use it. This is the single source of truth for "who can see
 * what" — both the middleware (route gating) and server components
 * (`getNavForRole`) consume it, so access is decided on the server only.
 * See docs/ARCHITECTURE.md §2.
 */
import type { AppRole } from "./auth/constants";

export type { AppRole };

// Higher number = more privileged. Content access is hierarchical; ADMIN is the
// only role that unlocks the /admin surface (checked explicitly, not by rank).
const RANK: Record<AppRole, number> = {
  NORMAL: 0,
  STUDENT: 1,
  SUBSCRIBER: 2,
  ADMIN: 3,
};

export function hasMinRole(role: AppRole | null, min: AppRole): boolean {
  if (!role) return false;
  return RANK[role] >= RANK[min];
}

export interface RouteRequirement {
  /** Path prefix this rule applies to. */
  prefix: string;
  /** Requires a signed-in user. */
  auth?: boolean;
  /** Minimum role (implies auth). */
  minRole?: AppRole;
  /** Exact role required (implies auth) — used for ADMIN. */
  role?: AppRole;
}

/**
 * Ordered most-specific-first. The first matching prefix wins. Anything not
 * listed is public (landing, /interview read views, auth pages).
 */
export const ROUTE_ACCESS: RouteRequirement[] = [
  { prefix: "/admin", role: "ADMIN" },
  // { prefix: "/contest", minRole: "SUBSCRIBER" },
  // { prefix: "/courses/learn", auth: true },
  { prefix: "/profile", auth: true },
  { prefix: "/notes", auth: true },
];

export interface AccessResult {
  allowed: boolean;
  /** Why it was denied — drives where the middleware redirects. */
  reason?: "unauthenticated" | "forbidden";
}

export function checkRouteAccess(pathname: string, role: AppRole | null): AccessResult {
  const rule = ROUTE_ACCESS.find((r) => pathname.startsWith(r.prefix));
  if (!rule) return { allowed: true };

  const needsAuth = rule.auth || rule.minRole || rule.role;
  if (needsAuth && !role) return { allowed: false, reason: "unauthenticated" };

  if (rule.role && role !== rule.role) return { allowed: false, reason: "forbidden" };
  if (rule.minRole && !hasMinRole(role, rule.minRole)) {
    return { allowed: false, reason: "forbidden" };
  }
  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Server-driven navigation. The layout renders ONLY the tabs returned here, so
// the browser never receives links/data for sections the user can't access.
// ---------------------------------------------------------------------------

export interface NavItem {
  label: string;
  href: string;
}

export function getNavForRole(role: AppRole | null): NavItem[] {
  const nav: NavItem[] = [
    { label: "Sheets", href: "/sheet" },
    { label: "Domain", href: "/domain" },
    { label: "Screening", href: "/screening" },
    { label: "Courses", href: "/courses" },
    { label: "Interview", href: "/interview" },
  ];

  // Contests are a subscriber perk — only surface the tab when allowed.
  if (hasMinRole(role, "SUBSCRIBER")) {
    nav.push({ label: "Contests", href: "/contest" });
  }

  // Admin gets the separate management surface.
  if (role === "ADMIN") {
    nav.push({ label: "Admin", href: "/admin" });
  }

  return nav;
}
