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

/** OAuth redirect target: validate state, resolve the user, start a session. */
export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
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

  // Resolve (or create) the user, then link the OAuth identity idempotently.
  const providerEnum = p === "google" ? "GOOGLE" : "GITHUB";
  let user = await prisma.user.findUnique({ where: { email: profile.email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name ?? "RisingBrain user",
        image: profile.image,
        emailVerified: new Date(),
        role: "NORMAL",
      },
    });
  } else {
    // Existing account (possibly a credentials-first user with the same email):
    // merge by linking this OAuth identity below. Fill in image / verify the
    // email opportunistically — the provider has proven ownership of it.
    const data: { image?: string; emailVerified?: Date } = {};
    if (profile.image && profile.image !== user.image) data.image = profile.image;
    if (!user.emailVerified) data.emailVerified = new Date();
    if (Object.keys(data).length) {
      user = await prisma.user.update({ where: { id: user.id }, data });
    }
  }

  await prisma.oAuthAccount.upsert({
    where: {
      provider_providerAccountId: {
        provider: providerEnum,
        providerAccountId: profile.providerAccountId,
      },
    },
    update: {},
    create: {
      userId: user.id,
      provider: providerEnum,
      providerAccountId: profile.providerAccountId,
    },
  });

  // Admin-disabled accounts are denied a session even with a valid OAuth handshake.
  if (user.disabledAt) return fail("account_disabled");

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
