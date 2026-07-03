"use client";

import { useEffect } from "react";
import "./globals.css";

/**
 * Last-resort boundary — catches errors thrown by the ROOT layout itself, which
 * the normal `error.tsx` can't reach. It replaces the entire document, so it
 * must render its own <html>/<body>. Kept dependency-free and inline-styled (the
 * font/theme setup in the root layout is bypassed here) but on-brand: dark
 * background, green accent, a reload action.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error boundary caught:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        style={{
          minHeight: "100vh",
          margin: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#e5e7eb",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 520 }}>
          <div
            style={{
              width: 72,
              height: 72,
              margin: "0 auto 24px",
              borderRadius: 20,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(34,197,94,0.12)",
              border: "1px solid rgba(34,197,94,0.25)",
              fontSize: 34,
            }}
          >
            ⚠️
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: "0 0 12px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#9ca3af", fontSize: 16, lineHeight: 1.6, margin: "0 0 28px" }}>
            The app hit an unexpected error and couldn&apos;t recover on its own.
            Please reload — if it persists, we&apos;re already looking into it.
          </p>
          {error.digest && (
            <p style={{ color: "#6b7280", fontSize: 12, fontFamily: "monospace", margin: "0 0 20px" }}>
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              cursor: "pointer",
              border: "none",
              borderRadius: 14,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 700,
              color: "#04140b",
              background: "#22c55e",
            }}
          >
            Reload the app
          </button>
        </div>
      </body>
    </html>
  );
}
