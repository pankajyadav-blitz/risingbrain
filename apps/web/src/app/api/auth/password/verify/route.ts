import { NextResponse } from "next/server";
import { verifyResetSchema } from "@/lib/auth/validation";
import { verifyOtp, issueResetToken } from "@/lib/auth/otp";
import { limitAuth, clientId } from "@/lib/auth/rate-limit";

const OTP_ERRORS: Record<string, string> = {
  expired: "That code has expired. Please request a new one.",
  invalid: "That code isn't right. Please check and try again.",
  too_many: "Too many incorrect attempts. Please request a new code.",
};

/**
 * Forgot-password step 2: verify the emailed code and hand back a single-use
 * reset token that authorizes the new-password step.
 */
export async function POST(req: Request) {
  const rl = await limitAuth(clientId(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 900) } }
    );
  }

  const parsed = verifyResetSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, code } = parsed.data;

  const result = await verifyOtp({ purpose: "reset", email, code });
  if (!result.ok) {
    return NextResponse.json(
      { error: OTP_ERRORS[result.reason] ?? "Verification failed" },
      { status: 400 }
    );
  }

  const token = await issueResetToken(email);
  return NextResponse.json({ ok: true, token });
}
