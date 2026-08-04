import { NextResponse } from "next/server";
import { rotateSession, SessionUnavailableError } from "@/lib/auth/session";
import {
  setAuthCookies,
  clearAuthCookies,
  readRefreshCookie,
  clearRefreshAttemptCookie,
} from "@/lib/auth/cookies";

/**
 * Exchanges a valid refresh token for a fresh access token (and rotates the
 * refresh token). Called by the client when the access token expires.
 */
export async function POST(req: Request) {
  const refresh = await readRefreshCookie();
  if (!refresh) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let tokens;
  try {
    tokens = await rotateSession(refresh, {
      userAgent: req.headers.get("user-agent"),
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
  } catch (err) {
    if (err instanceof SessionUnavailableError) {
      // Store unreachable — we can't say the session is invalid, so KEEP the
      // cookies and let the caller retry. 503 also tells SessionKeepAlive to stay
      // armed (only a 401 stops its polling).
      return NextResponse.json({ error: "Temporarily unavailable" }, { status: 503 });
    }
    throw err;
  }

  if (!tokens) {
    await clearAuthCookies();
    return NextResponse.json({ error: "Session expired" }, { status: 401 });
  }

  await setAuthCookies(tokens);
  await clearRefreshAttemptCookie();
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
 * the user never sees a logout.
 *
 * `soft=1` means the proxy was renewing opportunistically on a page the visitor is
 * allowed to read anonymously. A dead refresh token then just means "browse signed
 * out" — sending them to /login would be a worse experience than the stale navbar
 * we were trying to fix. Without it (a genuinely gated route) failure goes to /login.
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const target = safePath(url.searchParams.get("redirect"));
  const soft = url.searchParams.get("soft") === "1";

  const refresh = await readRefreshCookie();
  let tokens;
  try {
    tokens = refresh
      ? await rotateSession(refresh, {
          userAgent: req.headers.get("user-agent"),
          ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        })
      : null;
  } catch (err) {
    if (err instanceof SessionUnavailableError) {
      // Can't verify right now: send them back to the page WITH their cookies
      // intact. The proxy's 10s attempt marker stops this from looping, and the
      // next navigation retries once the store recovers.
      console.error("[auth] refresh unavailable, preserving session cookies:", err);
      return NextResponse.redirect(new URL(target, url.origin));
    }
    throw err;
  }

  if (!tokens) {
    // Clears the refresh cookie too, so the proxy sees nothing to recover and
    // won't bounce this visitor here again.
    await clearAuthCookies();
    if (soft) return NextResponse.redirect(new URL(target, url.origin));
    const login = new URL("/login", url.origin);
    login.searchParams.set("callbackUrl", target);
    return NextResponse.redirect(login);
  }

  await setAuthCookies(tokens);
  await clearRefreshAttemptCookie();
  return NextResponse.redirect(new URL(target, url.origin));
}
