"use client";

/**
 * Redirects the browser to the login page, preserving the current path as
 * `?next=` so the login flow can send the user back after signing in.
 * Safe to call from any client component — no-op on the server.
 */
export function redirectToLogin() {
  if (typeof window === "undefined") return;
  const next = encodeURIComponent(window.location.pathname + window.location.search);
  window.location.href = `/login?next=${next}`;
}
