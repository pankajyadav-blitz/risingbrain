import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { issueOtp } from "@/lib/auth/otp";
import { limitAuth, clientId } from "@/lib/auth/rate-limit";

/**
 * Forgot-password step 1: email a reset code. Per product requirement this tells
 * the user when no account exists (rather than masking it). Social-login-only
 * accounts (no password yet) ARE allowed through — their email is already
 * provider-verified, so the same OTP → new-password flow lets them SET a
 * password and gain credential login alongside their social login.
 */
export async function POST(req: Request) {
  const rl = await limitAuth(clientId(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 900) } }
    );
  }

  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "We couldn't find an account with that email." },
      { status: 404 }
    );
  }

  try {
    await issueOtp({ purpose: "reset", email });
  } catch {
    return NextResponse.json(
      { error: "Couldn't send the reset email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
