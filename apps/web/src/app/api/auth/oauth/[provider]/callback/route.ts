import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { fetchProfile, type OAuthProvider } from "@/lib/auth/oauth";
import { createSession } from "@/lib/auth/session";
import { setAuthCookies } from "@/lib/auth/cookies";

const PROVIDERS: OAuthProvider[] = ["google", "github"];

function fail(reason: string) {
  return NextResponse.redirect(new URL(`/login?error=${reason}`, env.APP_URL));
}

/**
 * OAuth redirect target: validate state, resolve the user, start a session.
 *
 * The whole body is guarded. Everything after the provider handshake talks to
 * Postgres — resolving the user, linking the identity, creating the session — and
 * none of it was wrapped, so any database problem surfaced as a bare HTTP 500 on
 * the callback URL, with nothing logged and the user staring at a browser error
 * page mid-sign-in. That is exactly what a rotated database password produced.
 * A failure here is now logged (so it is diagnosable at all) and lands the user
 * back on /login with a reason, like every other failure in this handler.
 */
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  try {
    return await handleCallback(req, ctx);
  } catch (err) {
    console.error("[auth] oauth callback failed:", err);
    return fail("oauth_failed");
  }
}

async function handleCallback(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (!PROVIDERS.includes(provider as OAuthProvider)) return fail("unknown_provider");
  const p = provider as OAuthProvider;

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const { cookies } = await import("next/headers");
  const jar = await cookies();
  const storedState = jar.get("oauth_state")?.value;
  const codeVerifier = jar.get("oauth_verifier")?.value ?? "";

  if (!code || !state || !storedState || state !== storedState) {
    return fail("oauth_state");
  }

  let profile;
  try {
    profile = await fetchProfile(p, code, codeVerifier);
  } catch {
    return fail("oauth_exchange");
  }

  // Resolve the user by the OAUTH LINK first, and only then by email.
  //
  // Resolving by email alone (what this did before) made the `oauth_accounts`
  // table decorative: the link was written but never read, so the provider
  // identity that owned an account was whatever address the provider reported
  // TODAY. A provider account linked to user A that later changes its email to
  // user B's address logged the caller straight in as user B.
  const providerEnum = p === "google" ? "GOOGLE" : "GITHUB";

  const link = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
      },
    },
    select: { userId: true },
  });

  let user = link ? await prisma.user.findUnique({ where: { id: link.userId } }) : null;

  if (!user) {
    // No link yet, so this identity has to be matched to an account by email —
    // which is only sound when the PROVIDER has verified that address. Without
    // this gate, adding an unconfirmed address to your own provider account is
    // enough to claim the RisingBrain account that already owns it.
    if (!profile.emailVerified) return fail("email_unverified");

    user =
      (await prisma.user.findUnique({ where: { email: profile.email } })) ??
      (await prisma.user.create({
        data: {
          email: profile.email,
          name: profile.name ?? "RisingBrain user",
          image: profile.image,
          emailVerified: new Date(),
          role: "NORMAL",
        },
      }));

    await prisma.oAuthAccount.upsert({
      where: {
        provider_providerAccountId: {
          provider: providerEnum,
          providerAccountId: profile.providerAccountId,
        },
      },
      update: { userId: user.id },
      create: {
        userId: user.id,
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
      },
    });
  }

  // Admin-disabled accounts are denied a session even with a valid OAuth
  // handshake. Checked before the profile write below so a disabled account is
  // not quietly mutated on every sign-in attempt.
  if (user.disabledAt) return fail("account_disabled");

  // Fill in image / mark the email verified opportunistically — but only on the
  // strength of an address the provider actually proved.
  if (profile.emailVerified) {
    const data: { image?: string; emailVerified?: Date } = {};
    if (profile.image && profile.image !== user.image) data.image = profile.image;
    if (!user.emailVerified) data.emailVerified = new Date();
    if (Object.keys(data).length) {
      user = await prisma.user.update({ where: { id: user.id }, data });
    }
  }

  const tokens = await createSession({
    userId: user.id,
    role: user.role,
    userAgent: req.headers.get("user-agent"),
    ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
  });
  await setAuthCookies(tokens);

  const res = NextResponse.redirect(new URL("/sheet", env.APP_URL));
  res.cookies.set("oauth_state", "", { path: "/api/auth", maxAge: 0 });
  res.cookies.set("oauth_verifier", "", { path: "/api/auth", maxAge: 0 });
  return res;
}
