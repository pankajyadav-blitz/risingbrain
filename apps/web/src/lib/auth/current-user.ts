/**
 * Server-side "who is this request" helper for Server Components and route
 * handlers. Verifies the access JWT from the cookie — pure crypto, no DB hit —
 * and returns the caller's identity + role, or null when signed out.
 */
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { COOKIES } from "./constants";
import { verifyAccessToken } from "./jwt";
import type { AppRole } from "./constants";

export interface CurrentUser {
  id: string;
  role: AppRole;
  sid: string;
}

// Both are wrapped in React `cache()` so the persistent app layout's navbar and
// the page below it share ONE token verification / user query per request,
// instead of each re-fetching.
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const token = (await cookies()).get(COOKIES.ACCESS)?.value;
  if (!token) return null;
  const claims = await verifyAccessToken(token);
  if (!claims) return null;
  return { id: claims.sub, role: claims.role, sid: claims.sid };
});

/**
 * How long the *chrome* is allowed to wait on Postgres before it gives up and
 * renders signed-out-ish. Deliberately far below the pool's 15s connect
 * timeout: a public page that renders in 2.5s degraded beats one that blocks
 * for 15s and then throws.
 */
const CHROME_DB_BUDGET_MS = 2_500;

/**
 * Fail-soft profile lookup for **navigation chrome only**.
 *
 * The public landing page must render even when Postgres is unreachable — with
 * a serverless Postgres (Neon) that suspends on idle, a cold start or a dropped
 * socket is a normal event, not an exception. `getCurrentUserProfile()` throws
 * on a DB error, which takes the whole marketing route to the error boundary;
 * here we swallow it and fall back to the JWT claims, which need no I/O.
 *
 * This mirrors `getCurrentStreak()`, which already hides its badge rather than
 * failing the page.
 *
 * NOT for anything that makes an auth decision: `/api/auth/me` 401s on null and
 * `/profile` redirects to /login on null, so silently returning null there
 * would log a signed-in user out on a transient blip. Those keep using the
 * strict `getCurrentUserProfile()` and are expected to fail loudly.
 */
export const getCurrentUserProfileForChrome = cache(
  async (): Promise<{ name: string | null; role: AppRole } | null> => {
    const current = await getCurrentUser();
    if (!current) return null; // genuinely signed out — no DB hit at all

    try {
      const profile = await Promise.race([
        getCurrentUserProfile(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("chrome profile lookup timed out")), CHROME_DB_BUDGET_MS)
        ),
      ]);
      if (profile) return { name: profile.name, role: profile.role as AppRole };
    } catch (err) {
      console.error("[auth] profile lookup failed, falling back to token claims:", err);
    }

    // DB unreachable (or the row vanished): keep the visitor visibly signed in
    // using the verified token. The navbar already renders a null name as
    // "Profile", so this degrades cleanly.
    return { name: null, role: current.role };
  }
);

/** Full user record from Postgres — use only when you need profile fields. */
export const getCurrentUserProfile = cache(async () => {
  const current = await getCurrentUser();
  if (!current) return null;
  return prisma.user.findUnique({
    where: { id: current.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
      currentStreak: true,
      longestStreak: true,
    },
  });
});
