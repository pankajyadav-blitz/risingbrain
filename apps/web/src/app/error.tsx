"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ServerCrash, RotateCw, Home } from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";

/**
 * Root error boundary — the themed "we hit a snag" screen shown when a route
 * fails to render (a network/DB hiccup, an upstream outage, an unexpected
 * exception). `reset()` re-attempts the failed segment so a transient blip
 * recovers without a full reload. Must be a Client Component.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface it for logging/monitoring; the user only sees the friendly screen.
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <AmbientBackground />

      <div className="animate-in mx-auto flex w-full max-w-2xl flex-col items-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20">
          <ServerCrash className="h-9 w-9" />
        </span>

        <div className="mt-7">
          <span className="glass-pill inline-flex items-center rounded-full px-6 py-3 text-base font-semibold uppercase tracking-wide text-accent sm:text-lg">
            Temporarily unavailable
          </span>
        </div>

        <h1 className="mt-6 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          We&apos;re having a <span className="text-gradient">moment</span>
        </h1>
        <p className="mx-auto mt-5 max-w-md text-base text-muted sm:text-lg">
          Something went wrong on our end — most likely a brief connection or
          server hiccup. Give it a second and try again; if it keeps happening,
          we&apos;re already on it.
        </p>

        {error.digest && (
          <p className="mt-4 font-mono text-xs text-muted/70">Reference: {error.digest}</p>
        )}

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            <RotateCw className="h-4 w-4" />
            Try again
          </button>
          <Link
            href="/"
            className="glass-pill inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:text-accent"
          >
            <Home className="h-4 w-4 text-accent" />
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
