/**
 * Post-auth redirect validation, shared by the client auth form and the refresh
 * route so both apply the SAME rule.
 *
 * `?callbackUrl=` / `?redirect=` arrive from the query string, so they are
 * attacker-controlled on a page users are trained to trust. Anything that leaves
 * the origin is a credential-phishing primitive: sign in for real, then land on
 * a lookalike that asks to "confirm" the password.
 *
 * Deliberately no `new URL()` parse-and-compare-origin here. That check is easy
 * to write and easy to get wrong, because the WHATWG parser normalises input
 * BEFORE the origin exists to compare — see the two cases below. A plain string
 * allowlist ("starts with a single slash, contains nothing that can re-point it")
 * has no such gap.
 *
 * No `server-only` import: this module is pulled into a Client Component.
 */

const FALLBACK = "/sheet";

export function safeRedirectPath(raw: string | null | undefined, fallback = FALLBACK): string {
  if (typeof raw !== "string" || raw === "") return fallback;

  // The URL parser STRIPS tab, LF and CR from anywhere in the input, so a check
  // run before stripping sees a different string than the browser will navigate
  // to: "/\t/evil.com" passes a "starts with one slash" test, then collapses to
  // "//evil.com" — protocol-relative, off-origin. Strip first, validate after.
  const cleaned = Array.from(raw)
    .filter((ch) => {
      const code = ch.codePointAt(0)!;
      return code > 0x1f && code !== 0x7f;
    })
    .join("");

  if (!cleaned.startsWith("/")) return fallback;
  // "//host" is protocol-relative. "\" is treated as "/" for special schemes, so
  // "/\evil.com" resolves to https://evil.com/ — this is the case the old
  // `safePath` in the refresh route missed.
  if (cleaned.startsWith("//") || cleaned.includes("\\")) return fallback;

  return cleaned;
}
