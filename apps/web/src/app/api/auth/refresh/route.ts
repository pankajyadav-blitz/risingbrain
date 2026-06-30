import { NextResponse } from "next/server";
import { rotateSession } from "@/lib/auth/session";
import { setAuthCookies, clearAuthCookies, readRefreshCookie } from "@/lib/auth/cookies";

export const runtime = "nodejs";

/**
 * Exchanges a valid refresh token for a fresh access token (and rotates the
 * refresh token). Called by the client when the access token expires.
 */
export async function POST(req: Request) {
  const refresh = await readRefreshCookie();
  if (!refresh) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const tokens = await rotateSession(refresh, {
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });

  if (!tokens) {
    await clearAuthCookies();
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  await setAuthCookies(tokens);
  return NextResponse.json({ ok: true });
}

/** Only allow redirecting back to a local path (no open-redirects). */
function safePath(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/sheet";
  return raw;
}

/**
 * Redirecting variant used by the edge proxy: when a page request arrives with
 * an expired access token but a live refresh token, the proxy bounces here. We
 * rotate the session, set fresh cookies and 302 back to the original page — so
 * the user never sees a logout. On failure we clear cookies and send to /login.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = safePath(url.searchParams.get("redirect"));

  const refresh = await readRefreshCookie();
  const tokens = refresh
    ? await rotateSession(refresh, {
        userAgent: req.headers.get("user-agent"),
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
      })
    : null;

  if (!tokens) {
    await clearAuthCookies();
    const login = new URL("/login", url.origin);
    login.searchParams.set("callbackUrl", target);
    return NextResponse.redirect(login);
  }

  await setAuthCookies(tokens);
  return NextResponse.redirect(new URL(target, url.origin));
}
