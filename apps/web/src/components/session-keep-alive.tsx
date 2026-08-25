"use client";

import { useEffect } from "react";

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
 *
 * EVERY rotation here is a real refresh-token rotation, so uncoordinated pings are
 * not free: each one invalidates the token the other tabs (and the edge proxy's
 * in-flight bounce) are holding. This used to fire on every single tab focus, in
 * every tab, which meant a user alt-tabbing between two tabs generated a steady
 * stream of rotation races — survivable only because of the rotation grace window,
 * and a hard logout whenever that window was unavailable. So the work is gated
 * twice: a `localStorage` timestamp shared by every tab decides whether a rotation
 * is DUE at all, and a Web Lock makes sure only one tab performs it.
 */

/** How long an access token is left alone before we renew it (TTL is 15m). */
const REFRESH_INTERVAL_MS = 12 * 60 * 1000;
/** Floor on how often ANY tab may rotate, used by the urgent recovery path. */
const MIN_REFRESH_GAP_MS = 60 * 1000;
/** Cheap wall-clock check; the network call is gated by the timestamps above. */
const TICK_MS = 60 * 1000;

/** Per-tab latch so a recovery reload can never become a reload loop. */
const RELOADED_KEY = "rb:session-recovered";
/** Cross-tab: when any tab last completed a rotation. */
const LAST_REFRESH_KEY = "rb:session-refreshed-at";
/** Cross-tab: only the holder may rotate. */
const LOCK_NAME = "rb:session-refresh";

function lastRefreshAt(): number {
  try {
    return Number(localStorage.getItem(LAST_REFRESH_KEY)) || 0;
  } catch {
    return 0; // private mode / storage disabled — degrade to per-tab behaviour
  }
}

function markRefreshed() {
  try {
    localStorage.setItem(LAST_REFRESH_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

type Outcome =
  /** Rotated; cookies are fresh. */
  | "ok"
  /** The refresh token is genuinely dead — stop pinging. */
  | "expired"
  /** Not due, or another tab is doing it. */
  | "skipped"
  /** Offline, or the store was unavailable (503) — stay armed and retry. */
  | "failed";

async function rotate(): Promise<Outcome> {
  try {
    const res = await fetch("/api/auth/refresh", { method: "POST", cache: "no-store" });
    if (res.ok) {
      markRefreshed();
      return "ok";
    }
    // Only a 401 is a verdict. A 503 means the session store couldn't be reached,
    // which says nothing about whether the session is still good.
    return res.status === 401 ? "expired" : "failed";
  } catch {
    return "failed";
  }
}

/**
 * Rotate at most once across every open tab. `minGapMs` is how recently another
 * tab must have rotated for this call to be unnecessary.
 */
async function rotateOnce(minGapMs: number): Promise<Outcome> {
  const run = async (): Promise<Outcome> =>
    Date.now() - lastRefreshAt() < minGapMs ? "skipped" : rotate();

  const locks = (navigator as Navigator & { locks?: LockManager }).locks;
  if (!locks) return run(); // Safari < 15.4 and friends: timestamp gate only

  // `ifAvailable` so a tab that loses the lock returns immediately instead of
  // queueing up a redundant rotation behind the winner.
  const outcome = await locks.request(LOCK_NAME, { ifAvailable: true }, (lock) =>
    lock ? run() : Promise.resolve<Outcome>("skipped")
  );
  return outcome ?? "skipped";
}

export function SessionKeepAlive({ stale = false }: { stale?: boolean }) {
  useEffect(() => {
    let stopped = false;

    if (!stale) {
      // Rendered with a healthy token: arm the latch again so a lapse later in
      // this tab's life still gets its one recovery reload.
      sessionStorage.removeItem(RELOADED_KEY);
      // First tab of a new browser session — start the clock from "we are known
      // good right now", so simply focusing the tab doesn't rotate immediately.
      if (lastRefreshAt() === 0) markRefreshed();
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
        const outcome = await rotateOnce(MIN_REFRESH_GAP_MS);
        if (stopped) return;
        if (outcome === "expired") {
          stopped = true;
        } else if (outcome === "ok" || outcome === "skipped") {
          // "skipped" means another tab rotated moments ago, so the cookie jar is
          // already repaired — this render is just holding a stale server pass.
          sessionStorage.setItem(RELOADED_KEY, "1");
          window.location.reload();
        }
        // "failed" → offline or store down; the tick below retries.
      })();
    }

    // A short tick reading a cheap timestamp, rather than a 12-minute timer:
    // browsers throttle timers in background tabs, so a long interval silently
    // drifts past the access token's expiry.
    const tick = () => {
      if (stopped || document.visibilityState !== "visible") return;
      void rotateOnce(REFRESH_INTERVAL_MS).then((outcome) => {
        if (outcome === "expired") stopped = true;
      });
    };

    const interval = setInterval(tick, TICK_MS);
    // Returning to a backgrounded tab is the most likely moment to be near
    // expiry — check immediately on re-focus (the gate decides if it's due).
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
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
