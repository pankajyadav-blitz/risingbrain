"use client";

import { useEffect } from "react";

// Refresh comfortably before the 15-minute access-token TTL so in-page API
// calls (notes, progress, likes…) keep working without a navigation.
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

/** Per-tab latch so a recovery reload can never become a reload loop. */
const RELOADED_KEY = "rb:session-recovered";

/**
 * Silently rotates the access token in the background while the user is active,
 * so it never expires mid-session. Mounted only when a session cookie is present
 * (see RootLayout). Stops pinging once the session is gone (401).
 *
 * `stale` means the server saw a refresh cookie but no usable access token — the
 * session is recoverable and needs renewing NOW, not in 12 minutes. The edge proxy
 * normally repairs this before the page renders; this covers what it can't (a
 * request it doesn't match, a non-GET entry, a rotate whose cookie didn't stick)
 * so a signed-in user is never left looking logged out for a whole interval.
 */
export function SessionKeepAlive({ stale = false }: { stale?: boolean }) {
  useEffect(() => {
    let stopped = false;

    // Rendered with a healthy token: arm the latch again so a lapse later in this
    // tab's life still gets its one recovery reload.
    if (!stale) sessionStorage.removeItem(RELOADED_KEY);

    async function refresh() {
      if (stopped || document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/auth/refresh", {
          method: "POST",
          cache: "no-store",
        });
        if (res.status === 401) stopped = true; // session ended — stop pinging
      } catch {
        /* transient network error — the next tick will retry */
      }
    }

    // Recover an already-lapsed token immediately, then re-render so the server
    // components pick up the restored identity (navbar, streak, progress).
    //
    // The reload is fired at most ONCE per tab. If the rotate reports success but
    // the server still can't see an access cookie (misconfigured Secure cookies
    // over plain http, for instance) `stale` stays true on the way back, and
    // without this guard that would be an infinite reload loop.
    if (stale && !sessionStorage.getItem(RELOADED_KEY)) {
      void (async () => {
        if (stopped) return;
        try {
          const res = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
          if (stopped) return;
          if (res.ok) {
            sessionStorage.setItem(RELOADED_KEY, "1");
            window.location.reload();
          } else if (res.status === 401) {
            stopped = true;
          }
        } catch {
          /* offline — the interval below retries */
        }
      })();
    }

    const interval = setInterval(refresh, REFRESH_INTERVAL_MS);
    // Returning to a backgrounded tab is the most likely moment to be near
    // expiry — refresh immediately on re-focus.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [stale]);

  return null;
}
