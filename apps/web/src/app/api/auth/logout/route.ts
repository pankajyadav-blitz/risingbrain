import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revokeSession } from "@/lib/auth/session";
import { clearAuthCookies } from "@/lib/auth/cookies";

export const runtime = "nodejs";

export async function POST() {
  const current = await getCurrentUser();
  if (current) await revokeSession(current.sid);
  await clearAuthCookies();
  return NextResponse.json({ ok: true });
}
