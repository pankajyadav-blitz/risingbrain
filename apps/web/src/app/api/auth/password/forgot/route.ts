import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/auth/validation";
import { issueOtp, OtpStoreUnavailableError } from "@/lib/auth/otp";
import { checkAuthLimit, checkAccountLimit } from "@/lib/auth/rate-limit";

/**
 * Forgot-password step 1: email a reset code. Per product requirement this tells
 * the user when no account exists (rather than masking it). Social-login-only
 * accounts (no password yet) ARE allowed through — their email is already
 * provider-verified, so the same OTP → new-password flow lets them SET a
 * password and gain credential login alongside their social login.
 */
export async function POST(req: Request) {
  const ipLimited = await checkAuthLimit(req);
  if (ipLimited) return ipLimited;

  const parsed = forgotPasswordSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email } = parsed.data;
  // Second bucket, keyed by the account under attack rather than by a header the
  // caller controls. See checkAccountLimit.
  const accountLimited = await checkAccountLimit(email);
  if (accountLimited) return accountLimited;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { error: "We couldn't find an account with that email." },
      { status: 404 }
    );
  }

  try {
    await issueOtp({ purpose: "reset", email });
  } catch (err) {
    // Two different failures wearing one message before: the verification store
    // being unreachable is not "the email bounced", and 502 invited the user to
    // retry a mailer that was working fine.
    if (err instanceof OtpStoreUnavailableError) {
      return NextResponse.json(
        { error: "Verification is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: "Couldn't send the reset email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true });
}
