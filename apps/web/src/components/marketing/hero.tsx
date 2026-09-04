import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container } from "./primitives";
import { PatternRecognition } from "./pattern-recognition";

/**
 * Hero.
 *
 * Centered and text-first, which is what the strongest learning platforms
 * actually ship (Boot.dev, Educative, Exponent, Frontend Masters, ZTM) — the
 * copy-left/screenshot-right split is a B2B SaaS convention. An education
 * product has no single screen that explains it, so the structure is
 * claim → mechanism → tracks → CTA → proof, with the product panel below the
 * fold-line rather than beside the headline.
 *
 * The founder credential that used to sit in a pill above the H1 has moved to
 * the Founder section, which says the same thing with far more weight. A
 * coloured badge floating above the headline is also one of the most
 * recognisable generated-page tells, so the slot is better spent on the track
 * row — which proves breadth and is the highest-intent click on the page.
 */

/** The tracks, doubling as the hero's first visual layer and as navigation. */
const tracks = [
  { label: "DSA Sheets", href: "/sheet" },
  { label: "Domain", href: "/domain" },
  { label: "Aptitude", href: "/screening" },
  { label: "Interview Stories", href: "/interview" },
  { label: "Courses", href: "/courses" },
];

export function Hero() {
  return (
    <Container>
      <section className="stagger relative py-20 sm:py-28">
        <h1 className="display-1 mx-auto max-w-4xl text-center font-bold">
          Crack your dream <span className="text-gradient">product company</span> from any college.
        </h1>

        {/* Subcopy names the mechanism and the audience — not more benefit. */}
        <p className="lead mx-auto mt-6 text-center text-muted">
          A pattern-first placement track for students without a coding culture around them —
          curated sheets, core CS, aptitude and real interview breakdowns, in one sequence.
        </p>

        {/* Track row: the hero's visual layer, and its highest-intent click. */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
          {tracks.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className="chip rounded-full border border-border bg-surface px-4 py-2 text-sm text-muted hover:text-foreground"
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* One filled primary, one ghost secondary — never two filled. */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/signup"
              className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
            >
              Start the sheet — free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/sheet"
              className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold text-muted transition-colors hover:text-foreground"
            >
              Browse it first →
            </Link>
          </div>
          {/* Time-cost microcopy removes the biggest unspoken objection. */}
          <p className="text-xs text-muted">No card. The first pattern takes about 10 minutes.</p>
        </div>

        {/* Product proof, below the CTA — no tilt, no glow, no fake browser. */}
        <div className="mx-auto mt-16 max-w-5xl">
          <PatternRecognition />
        </div>
      </section>
    </Container>
  );
}
