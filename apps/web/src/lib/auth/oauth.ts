/**
 * OAuth (Authorization Code Flow) with `arctic` — Google (PKCE) and GitHub.
 * We only use arctic for the provider handshake; sessions are our own.
 * See docs/ARCHITECTURE.md §1.
 */
import { Google, GitHub, generateState, generateCodeVerifier } from "arctic";
import { decodeJwt } from "jose";
import { env } from "../env";

export type OAuthProvider = "google" | "github";

export interface OAuthProfile {
  provider: OAuthProvider;
  providerAccountId: string;
  email: string;
  name: string | null;
  image: string | null;
}

function redirectUri(provider: OAuthProvider): string {
  return `${env.APP_URL}/api/auth/oauth/${provider}/callback`;
}

export function googleClient(): Google {
  return new Google(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET, redirectUri("google"));
}

export function githubClient(): GitHub {
  return new GitHub(env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET, redirectUri("github"));
}

export function isProviderConfigured(provider: OAuthProvider): boolean {
  return provider === "google"
    ? Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
    : Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET);
}

/** Build the provider authorization URL + the state/verifier to stash in cookies. */
export function createAuthorizationURL(provider: OAuthProvider): {
  url: URL;
  state: string;
  codeVerifier: string;
} {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();

  if (provider === "google") {
    const url = googleClient().createAuthorizationURL(state, codeVerifier, [
      "openid",
      "profile",
      "email",
    ]);
    return { url, state, codeVerifier };
  }

  // GitHub doesn't use PKCE; codeVerifier is carried but unused.
  const url = githubClient().createAuthorizationURL(state, ["read:user", "user:email"]);
  return { url, state, codeVerifier };
}

/** Exchange the code for the provider's normalized user profile. */
export async function fetchProfile(
  provider: OAuthProvider,
  code: string,
  codeVerifier: string
): Promise<OAuthProfile> {
  if (provider === "google") {
    const tokens = await googleClient().validateAuthorizationCode(code, codeVerifier);
    const claims = decodeJwt(tokens.idToken());
    return {
      provider,
      providerAccountId: claims.sub as string,
      email: (claims.email as string).toLowerCase(),
      name: (claims.name as string) ?? null,
      image: (claims.picture as string) ?? null,
    };
  }

  const tokens = await githubClient().validateAuthorizationCode(code);
  const accessToken = tokens.accessToken();
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "RisingBrain",
    Accept: "application/vnd.github+json",
  };

  const user = (await (await fetch("https://api.github.com/user", { headers })).json()) as {
    id: number;
    name: string | null;
    login: string;
    avatar_url: string | null;
    email: string | null;
  };

  let email = user.email;
  if (!email) {
    const emails = (await (
      await fetch("https://api.github.com/user/emails", { headers })
    ).json()) as { email: string; primary: boolean; verified: boolean }[];
    email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email ?? null;
  }
  if (!email) throw new Error("GitHub account has no accessible email");

  return {
    provider,
    providerAccountId: String(user.id),
    email: email.toLowerCase(),
    name: user.name ?? user.login,
    image: user.avatar_url,
  };
}
