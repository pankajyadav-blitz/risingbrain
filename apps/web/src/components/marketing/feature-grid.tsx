import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Container, Eyebrow } from "./primitives";
import { FeatureArt, type FeatureArtKey } from "./feature-banners";

type Feature = {
  key: FeatureArtKey;
  href: string;
  title: string;
  desc: string;
  tag: string;
  /** Inventory metadata — only where the repo already states a real number. */
  meta?: string;
};

/**
 * The five tracks, shown as equal cards (stacking to two columns on `sm` and one
 * on mobile). DOM order is visual order.
 */
const features: Feature[] = [
  {
    key: "sheets",
    href: "/sheet",
    title: "DSA Sheets",
    desc: "The curated SWE Sheet, sequenced pattern-by-pattern rather than topic-by-topic — plus a focused Last-Minute 100 for revision day.",
    tag: "Pattern-first",
    meta: "496 problems · 85 patterns",
  },
  {
    key: "domain",
    href: "/domain",
    title: "Domain",
    desc: "SQL, DBMS and OS — the problem, the best approach and the clean answer, side by side.",
    tag: "Core CS",
  },
  {
    key: "screening",
    href: "/screening",
    title: "Screening",
    desc: "Quant aptitude and logical reasoning — crisp theory, then timed MCQ practice.",
    tag: "MCQ drills",
  },
  {
    key: "puzzles",
    href: "/puzzles",
    title: "Puzzles",
    desc: "Classic interview brainteasers — logic, weighing, parity and optimisation — each with a diagram, staged hints and a worked solution.",
    tag: "Lateral thinking",
    meta: "84 puzzles · 12 patterns",
  },
  {
    key: "interview",
    href: "/interview",
    title: "Interview Stories",
    desc: "Round-by-round breakdowns from candidates who sat the loop — what got asked, what they'd do differently, and how it ended.",
    tag: "Community",
  },
];

export function FeatureGrid() {
  return (
    <Container>
      <section className="relative py-24">
        <div className="mb-14 max-w-2xl">
          <Eyebrow>
            <Layers className="h-3.5 w-3.5" /> What you get
          </Eyebrow>
          {/* Heading makes the claim; the number lives one line down, in the
              subcopy, so the headline stays clean. */}
          <h2 className="display-2 mt-5 font-bold">
            Four tracks, <span className="text-gradient">one sequence</span>
          </h2>
          <p className="lead mt-4 text-muted">
            Each section picks up where the last leaves off — so you always know what to open next
            instead of tab-hopping across five sites.
          </p>
        </div>

        {/* Five tracks, all on ONE row from `lg` up — the Container has no hard
            max-width, so the row grows with the screen instead of capping. */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5">
          {features.map((f) => {
            return (
              <Link
                key={f.href}
                href={f.href}
                className="feat-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface hover:border-rb-green-500/40"
              >
                {/* Banner — an animated canvas evoking the section. */}
                <div className="feat-banner relative h-44 overflow-hidden">
                  <FeatureArt artKey={f.key} className="absolute inset-0 h-full w-full" />
                  <span className="glass-pill absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                    {f.tag}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <h3 className="text-lg font-semibold transition-colors group-hover:text-accent">
                    {f.title}
                  </h3>
                  <p className="mt-2 max-w-[52ch] text-sm leading-relaxed text-muted">{f.desc}</p>

                  {/* Wraps rather than collides: at five-across the meta text and
                      the Explore affordance can exceed one line on a 1280px screen. */}
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pt-6">
                    {/* Inventory metadata is the depth proof — a title says
                        nothing, a count says the content exists. */}
                    {f.meta ? (
                      <span className="font-mono text-xs text-muted">{f.meta}</span>
                    ) : (
                      <span />
                    )}
                    <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
