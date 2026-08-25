import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/auth/validation";
import { hashPassword } from "@/lib/auth/password";
import { issueOtp, OtpStoreUnavailableError } from "@/lib/auth/otp";
import { isMailConfigured } from "@/lib/mail/mailer";
import { limitAuth, clientId } from "@/lib/auth/rate-limit";

/**
 * Signup step 1: validate the details, ensure the email is free, hash the
 * password, then email a 6-digit code. NO User row is created here — the pending
 * account lives in Redis until the code is verified at /register/verify.
 */
export async function POST(req: Request) {
  const rl = await limitAuth(clientId(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 900) } }
    );
  }

  if (!isMailConfigured()) {
    return NextResponse.json(
      { error: "Email sending isn't configured yet. Please try again later." },
      { status: 503 }
    );
  }

  const parsed = registerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing?.passwordHash) {
    // A real credential account already exists — don't let them create a second.
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in instead." },
      { status: 409 }
    );
  }
  // If `existing` has NO passwordHash it's an OAuth-only account; we allow adding
  // a password to it (merge) once the email code is verified — fall through.

  // Hash now, store the hash (never the plaintext) with the pending signup.
  const passwordHash = await hashPassword(password);
  try {
    await issueOtp({ purpose: "signup", email, signup: { name, passwordHash } });
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
      { error: "Couldn't send the verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, email });
}
