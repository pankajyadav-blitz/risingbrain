import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentStreak } from "@/lib/streak";

/**
 * GET /api/streak
 *
 * Authoritative current streak for the signed-in user. Lets the navbar streak
 * flame refresh itself in place (without a full-page reload) after the user
 * records activity — e.g. solving a problem on /sheet. Returns `{ streak }`
 * where `streak` is `null` for signed-out users (same contract the navbar uses).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ streak: null }, { status: 401 });

  const streak = await getCurrentStreak(user.id);
  return NextResponse.json({ streak });
}
