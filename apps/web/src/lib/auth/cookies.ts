/**
 * Cookie helpers (server only). Tokens live in HttpOnly cookies — never in
 * localStorage — so they're not reachable from JS (XSS-safe).
 */
import { cookies, headers } from "next/headers";
import { env } from "../env";
import {
  COOKIES,
  ACCESS_TTL_SECONDS,
  REFRESH_TTL_SECONDS,
  REFRESH_COOKIE_PATH,
} from "./constants";
import type { IssuedTokens } from "./session";

export async function setAuthCookies(tokens: IssuedTokens): Promise<void> {
  const jar = await cookies();
  // Mark cookies Secure whenever the request is actually served over HTTPS. The
  // most reliable signal is the proxy/load-balancer's `x-forwarded-proto`, so a
  // real HTTPS deployment gets Secure cookies even if NODE_ENV/APP_URL are
  // misconfigured. Falls back to env.secureCookies (prod build OR https APP_URL).
  // Spoofing the header can't downgrade another user's cookies, and forcing it
  // "https" over a plain-http request only breaks the sender's own session.
  const forwardedProto = (await headers()).get("x-forwarded-proto");
  const secure = env.secureCookies || forwardedProto === "https";

  // "Remember me": when persistent, give cookies an explicit max-age so they
  // survive a browser restart. Otherwise omit max-age entirely to make them
  // session cookies that the browser discards on close. The server-side session
  // TTL (Redis/DB) is unchanged either way — this only affects cookie storage.
  jar.set(COOKIES.ACCESS, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    ...(tokens.persistent ? { maxAge: ACCESS_TTL_SECONDS } : {}),
  });

  jar.set(COOKIES.REFRESH, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "strict",
    path: REFRESH_COOKIE_PATH,
    ...(tokens.persistent ? { maxAge: REFRESH_TTL_SECONDS } : {}),
  });
}

export async function clearAuthCookies(): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIES.ACCESS, "", { httpOnly: true, path: "/", maxAge: 0 });
  jar.set(COOKIES.REFRESH, "", { httpOnly: true, path: REFRESH_COOKIE_PATH, maxAge: 0 });
}

export async function readRefreshCookie(): Promise<string | undefined> {
  const jar = await cookies();
  return jar.get(COOKIES.REFRESH)?.value;
}
