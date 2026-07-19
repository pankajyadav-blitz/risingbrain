import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { Container } from "./primitives";

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
  { label: "SQL & DBMS", href: "/domain" },
  { label: "Aptitude", href: "/screening" },
  { label: "Interview Stories", href: "/interview" },
  { label: "Courses", href: "/courses" },
];

/* --------------------------------------------------------------------- */
/* Product proof: the activity heatmap.                                   */
/*                                                                        */
/* This is the one visual no competitor leads with, and it is unmistakably */
/* "this product tracks real work" rather than a generic SaaS chart. The   */
/* pattern is generated from a fixed seed so server and client agree and   */
/* the render is stable between builds.                                   */
/* --------------------------------------------------------------------- */
const WEEKS = 26;
const DAYS = 7;

function heatmapLevels(): number[] {
  // Small deterministic LCG — no Math.random, so SSR and hydration match.
  let seed = 20260719;
  const next = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  return Array.from({ length: WEEKS * DAYS }, (_, i) => {
    const day = i % DAYS;
    const r = next();
    // Weekends dip, and the streak strengthens toward the present.
    const recency = 0.35 + (Math.floor(i / DAYS) / WEEKS) * 0.65;
    const weekend = day === 0 || day === 6 ? 0.55 : 1;
    const v = r * recency * weekend;
    if (v < 0.18) return 0;
    if (v < 0.34) return 1;
    if (v < 0.5) return 2;
    if (v < 0.68) return 3;
    return 4;
  });
}

const LEVEL_OPACITY = [0, 0.22, 0.42, 0.68, 1];

function Heatmap() {
  const levels = heatmapLevels();
  return (
    <div className="flex gap-[3px]" aria-hidden>
      {Array.from({ length: WEEKS }).map((_, w) => (
        <div key={w} className="flex flex-col gap-[3px]">
          {Array.from({ length: DAYS }).map((_, d) => {
            const level = levels[w * DAYS + d] ?? 0;
            return (
              <span
                key={d}
                className="h-[11px] w-[11px] rounded-[3px]"
                style={
                  level === 0
                    ? { background: "var(--highlight)", border: "1px solid var(--border)" }
                    : {
                        background: `color-mix(in srgb, var(--rb-green-500) ${
                          (LEVEL_OPACITY[level] ?? 0) * 100
                        }%, transparent)`,
                      }
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

/** A small app-chrome frame so the panel reads as product, not decoration. */
function ProductPanel() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Window chrome — the same signature element the card banners use. */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted/15" />
        <span className="ml-2 font-mono text-xs text-muted">your activity</span>
      </div>

      <div className="flex flex-col gap-8 p-6 lg:flex-row lg:items-center lg:justify-between">
        {/* The heatmap scrolls rather than shrinking — 11px cells stay 11px. */}
        <div className="-mx-1 overflow-x-auto px-1 pb-1">
          <Heatmap />
        </div>

        {/* Two stats, not three. A row of exactly three big numbers with small
            labels underneath is its own recognisable template. */}
        <div className="flex shrink-0 gap-8 lg:flex-col lg:gap-5 lg:border-l lg:border-border lg:pl-8">
          <div>
            <div className="flex items-baseline gap-1.5">
              <Flame className="h-4 w-4 self-center text-accent" />
              <span className="text-2xl font-bold tabular-nums">18</span>
              <span className="text-sm text-muted">days</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">Current streak</div>
          </div>
          <div>
            <div className="text-2xl font-bold tabular-nums">247</div>
            <div className="mt-0.5 text-xs text-muted">Problems solved</div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
          <ProductPanel />
        </div>
      </section>
    </Container>
  );
}
