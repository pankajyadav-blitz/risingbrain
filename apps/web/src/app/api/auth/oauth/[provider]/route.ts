import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import {
  createAuthorizationURL,
  isProviderConfigured,
  type OAuthProvider,
} from "@/lib/auth/oauth";

const PROVIDERS: OAuthProvider[] = ["google", "github"];
const TEN_MINUTES = 60 * 10;

/** Kicks off the OAuth flow: stash state/PKCE in cookies, redirect to provider. */
export async function GET(_req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const { provider } = await ctx.params;
  if (!PROVIDERS.includes(provider as OAuthProvider)) {
    return NextResponse.redirect(new URL("/login?error=unknown_provider", env.APP_URL));
  }
  const p = provider as OAuthProvider;
  if (!isProviderConfigured(p)) {
    return NextResponse.redirect(new URL("/login?error=provider_disabled", env.APP_URL));
  }

  const { url, state, codeVerifier } = createAuthorizationURL(p);
  const res = NextResponse.redirect(url);
  const opts = {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "lax" as const,
    path: "/api/auth",
    maxAge: TEN_MINUTES,
  };
  res.cookies.set("oauth_state", state, opts);
  res.cookies.set("oauth_verifier", codeVerifier, opts);
  return res;
}
