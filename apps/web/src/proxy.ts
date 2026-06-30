/**
 * Edge proxy (Next.js 16's replacement for `middleware`) — the FIRST
 * access-control layer. Verifies the access JWT with pure crypto (no DB/Redis)
 * and applies the RBAC route map. Unauthorized requests are redirected before
 * any page renders. Server Components apply the second layer (gating data +
 * `getNavForRole`). See docs/ARCHITECTURE.md §2.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIES } from "@/lib/auth/constants";
import { verifyAccessToken } from "@/lib/auth/jwt";
import { checkRouteAccess } from "@/lib/rbac";

const AUTH_PAGES = ["/login", "/signup"];

export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = req.cookies.get(COOKIES.ACCESS)?.value;
  const claims = token ? await verifyAccessToken(token) : null;
  const role = claims?.role ?? null;

  // Signed-in users shouldn't see the login/signup pages.
  if (role && AUTH_PAGES.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/sheet", req.url));
  }

  const access = checkRouteAccess(pathname, role);
  if (!access.allowed) {
    if (access.reason === "unauthenticated") {
      // Expired/absent access token but a live refresh cookie? Silently rotate
      // via /api/auth/refresh (Node runtime + Redis) and bounce back, instead of
      // logging the user out. The refresh route clears cookies + sends to /login
      // if the refresh token is invalid, so this can't loop.
      const hasRefresh = Boolean(req.cookies.get(COOKIES.REFRESH)?.value);
      if (hasRefresh) {
        const refreshUrl = new URL("/api/auth/refresh", req.url);
        refreshUrl.searchParams.set("redirect", pathname + req.nextUrl.search);
        return NextResponse.redirect(refreshUrl);
      }
      const url = new URL("/login", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // Forbidden (signed in but lacking the role/subscription).
    const url = new URL("/", req.url);
    url.searchParams.set("forbidden", "1");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Run on everything except API routes, Next internals, and static assets.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
