import { NextResponse } from "next/server";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

export const runtime = "nodejs";

export async function GET() {
  const user = await getCurrentUserProfile();
  if (!user) return NextResponse.json({ user: null }, { status: 401 });
  return NextResponse.json({ user });
}
