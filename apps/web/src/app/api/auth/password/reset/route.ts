import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { consumeResetToken } from "@/lib/auth/otp";
import { revokeAllUserSessions } from "@/lib/auth/session";
import { limitAuth, clientId } from "@/lib/auth/rate-limit";

/**
 * Forgot-password step 3: with a valid single-use reset token, set the new
 * (re-validated, freshly hashed) password. Existing sessions are revoked so a
 * stolen session can't outlive the reset.
 */
export async function POST(req: Request) {
  const rl = await limitAuth(clientId(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 900) } }
    );
  }

  const parsed = resetPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, token, password } = parsed.data;

  const tokenEmail = await consumeResetToken(token);
  if (!tokenEmail || tokenEmail !== email) {
    return NextResponse.json(
      { error: "Your reset link is invalid or has expired. Please start again." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json({ error: "Account not found." }, { status: 404 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Invalidate all existing sessions for this user (force re-login everywhere).
  await revokeAllUserSessions(user.id);

  return NextResponse.json({ ok: true });
}
