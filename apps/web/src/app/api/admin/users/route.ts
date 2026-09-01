import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { requireAdmin, parse, writeErrorResponse } from "../_guard";
import { userUpdate } from "@/lib/admin/schemas";

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  disabledAt: true,
  createdAt: true,
  // No `currentStreak`: nothing in the app ever WRITES User.currentStreak (the
  // real streak is derived from ActivityDay by lib/streak.ts), so shipping it
  // rendered a flame badge that read 0 for every user regardless of activity.
} as const;

/**
 * GET /api/admin/users?email=<query>
 *
 * Search users BY EMAIL only — we never dump the whole table. Needs ≥2 chars;
 * returns up to 20 case-insensitive matches. ADMIN only (read: no write-limit).
 */
export async function GET(req: Request) {
  const admin = await getCurrentUser();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (admin.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams.get("email")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ users: [] });

  const users = await prisma.user.findMany({
    where: { email: { contains: q, mode: "insensitive" } },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: USER_SELECT,
  });
  return NextResponse.json({ users });
}

/**
 * PATCH /api/admin/users  { id, role?, disabled? }
 *
 * Update a user's role and/or enable/disable them. Any role change or a disable
 * revokes the user's live sessions so it takes effect (they must re-login). An
 * admin can't disable or re-role their own account (avoids self-lockout).
 */
export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, userUpdate);
  if (parsed.error) return parsed.error;
  const { id, role, disabled } = parsed.data;

  if (id === guard.user.id) {
    return NextResponse.json(
      { error: "You can't change or disable your own account." },
      { status: 400 },
    );
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(role !== undefined && { role }),
        ...(disabled !== undefined && { disabledAt: disabled ? new Date() : null }),
      },
      select: USER_SELECT,
    });

    // A role change or a disable must invalidate any live session so the change
    // is enforced immediately (the access token otherwise carries the old role
    // for up to its 15-min lifetime).
    if (role !== undefined || disabled === true) {
      await revokeAllUserSessions(id);
    }

    return NextResponse.json({ ok: true, user: updated });
  } catch (e) {
    return writeErrorResponse(e, "user-update");
  }
}
