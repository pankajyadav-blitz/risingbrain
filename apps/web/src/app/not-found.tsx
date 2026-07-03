import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { AmbientBackground } from "@/components/ambient-background";

/**
 * Custom 404. Rendered inside the root layout (so it gets the site fonts, theme
 * and background) but WITHOUT the app navbar/footer — hence it's a self-contained
 * full-height screen, styled to match the marketing / coming-soon aesthetic.
 */
export default function NotFound() {
  return (
    <main className="relative isolate flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      <AmbientBackground />

      <div className="animate-in mx-auto flex w-full max-w-2xl flex-col items-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20">
          <Compass className="h-9 w-9" />
        </span>

        <p className="mt-8 text-7xl font-black tracking-tight text-gradient sm:text-8xl">404</p>

        <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          This page took a <span className="text-gradient">wrong turn</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-base text-muted sm:text-lg">
          The page you&apos;re looking for doesn&apos;t exist, moved, or never did.
          Let&apos;s get you back to solving.
        </p>

        <div className="mt-10 flex justify-center">
          <Link
            href="/"
            className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            <Home className="h-4 w-4" />
            Back home
          </Link>
        </div>
      </div>
    </main>
  );
}
