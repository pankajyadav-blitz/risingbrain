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
