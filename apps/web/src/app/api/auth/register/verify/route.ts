import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyEmailSchema } from "@/lib/auth/validation";
import { verifyOtp } from "@/lib/auth/otp";
import { createSession } from "@/lib/auth/session";
import { setAuthCookies } from "@/lib/auth/cookies";
import { checkAuthLimit, checkAccountLimit } from "@/lib/auth/rate-limit";

const OTP_ERRORS: Record<string, string> = {
  expired: "That code has expired. Please request a new one.",
  invalid: "That code isn't right. Please check and try again.",
  too_many: "Too many incorrect attempts. Please request a new code.",
};

/**
 * Signup step 2: verify the emailed code and ONLY THEN create the account from
 * the pending record (name + already-hashed password), then start a session.
 */
export async function POST(req: Request) {
  const ipLimited = await checkAuthLimit(req);
  if (ipLimited) return ipLimited;

  const parsed = verifyEmailSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, code } = parsed.data;
  // Second bucket, keyed by the account under attack rather than by a header the
  // caller controls. See checkAccountLimit.
  const accountLimited = await checkAccountLimit(email);
  if (accountLimited) return accountLimited;

  const result = await verifyOtp({ purpose: "signup", email, code });
  if (!result.ok) {
    // Store unreachable — not a verdict on the code the user typed.
    if (result.reason === "unavailable") {
      return NextResponse.json(
        { error: "Verification is temporarily unavailable. Please try again in a moment." },
        { status: 503 }
      );
    }
    return NextResponse.json(
      { error: OTP_ERRORS[result.reason] ?? "Verification failed" },
      { status: 400 }
    );
  }
  if (!result.signup) {
    // No pending payload (e.g. it expired between steps) — restart signup.
    return NextResponse.json(
      { error: "Your signup session expired. Please start again." },
      { status: 410 }
    );
  }

  // Resolve the final account. Three cases:
  //  - no user yet            → create a fresh credential account
  //  - OAuth-only user exists → MERGE: attach the password to that account
  //  - credential user exists → race with another signup; reject
  const existing = await prisma.user.findUnique({ where: { email } });
  let user;
  if (!existing) {
    user = await prisma.user.create({
      data: {
        name: result.signup.name,
        email,
        passwordHash: result.signup.passwordHash,
        emailVerified: new Date(),
        role: "NORMAL",
      },
    });
  } else if (!existing.passwordHash) {
    // Admin-disabled accounts are denied a session on every OTHER path (login,
    // OAuth callback). Without the same check here, a disabled social-login user
    // could walk the ordinary signup flow against their own address and be handed
    // a fresh session — restoring the access an admin had just taken away.
    if (existing.disabledAt) {
      return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
    }

    // Merge credentials into an existing social-login account (same verified email).
    user = await prisma.user.update({
      where: { id: existing.id },
      data: {
        passwordHash: result.signup.passwordHash,
        emailVerified: existing.emailVerified ?? new Date(),
        name: existing.name ?? result.signup.name,
      },
    });
  } else {
    return NextResponse.json(
      { error: "An account with this email already exists. Please sign in instead." },
      { status: 409 }
    );
  }

  const tokens = await createSession({
    userId: user.id,
    role: user.role,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
  await setAuthCookies(tokens);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
