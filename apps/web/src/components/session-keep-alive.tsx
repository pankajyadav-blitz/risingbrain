"use client";

import { useEffect } from "react";

// Refresh comfortably before the 15-minute access-token TTL so in-page API
// calls (notes, progress, likes…) keep working without a navigation.
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

/**
 * Silently rotates the access token in the background while the user is active,
 * so it never expires mid-session. Mounted only when a session cookie is present
 * (see RootLayout). Stops pinging once the session is gone (401).
 */
export function SessionKeepAlive() {
  useEffect(() => {
    let stopped = false;

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
  }, []);

  return null;
}
