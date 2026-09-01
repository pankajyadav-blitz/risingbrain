import { NextResponse } from "next/server";
import { verifyResetSchema } from "@/lib/auth/validation";
import { verifyOtp, issueResetToken, OtpStoreUnavailableError } from "@/lib/auth/otp";
import { checkAuthLimit, checkAccountLimit } from "@/lib/auth/rate-limit";

const OTP_ERRORS: Record<string, string> = {
  expired: "That code has expired. Please request a new one.",
  invalid: "That code isn't right. Please check and try again.",
  too_many: "Too many incorrect attempts. Please request a new code.",
};

/** A fresh response each call — a Response body is single-use, never shareable. */
const storeDown = () =>
  NextResponse.json(
    { error: "Verification is temporarily unavailable. Please try again in a moment." },
    { status: 503 }
  );

/**
 * Forgot-password step 2: verify the emailed code and hand back a single-use
 * reset token that authorizes the new-password step.
 */
export async function POST(req: Request) {
  const ipLimited = await checkAuthLimit(req);
  if (ipLimited) return ipLimited;

  const parsed = verifyResetSchema.safeParse(await req.json().catch(() => null));
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

  const result = await verifyOtp({ purpose: "reset", email, code });
  if (!result.ok) {
    // "unavailable" is the store failing, not the user's code being wrong —
    // answering 400 there tells someone holding a correct code that it is bad.
    if (result.reason === "unavailable") return storeDown();
    return NextResponse.json(
      { error: OTP_ERRORS[result.reason] ?? "Verification failed" },
      { status: 400 }
    );
  }

  try {
    const token = await issueResetToken(email);
    return NextResponse.json({ ok: true, token });
  } catch (err) {
    if (err instanceof OtpStoreUnavailableError) return storeDown();
    throw err;
  }
}
