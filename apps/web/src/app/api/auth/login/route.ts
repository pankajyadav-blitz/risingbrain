import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { loginSchema } from "@/lib/auth/validation";
import { verifyPassword } from "@/lib/auth/password";
import { createSession } from "@/lib/auth/session";
import { setAuthCookies } from "@/lib/auth/cookies";
import { limitAuth, clientId } from "@/lib/auth/rate-limit";

export async function POST(req: Request) {
  const rl = await limitAuth(clientId(req));
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSeconds ?? 900) } }
    );
  }

  const parsed = loginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, password, remember } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  // Generic message either way — don't leak which emails exist.
  const invalid = NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  if (!user || !user.passwordHash) {
    if (user && !user.passwordHash) {
      return NextResponse.json(
        { error: "This account uses social login. Continue with Google or GitHub." },
        { status: 401 }
      );
    }
    return invalid;
  }

  const ok = await verifyPassword(user.passwordHash, password);
  if (!ok) return invalid;

  // Admin-disabled accounts can authenticate but are denied a session.
  if (user.disabledAt) {
    return NextResponse.json({ error: "This account has been disabled." }, { status: 403 });
  }

  const tokens = await createSession({
    userId: user.id,
    role: user.role,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    persistent: remember,
  });
  await setAuthCookies(tokens);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
  });
}
