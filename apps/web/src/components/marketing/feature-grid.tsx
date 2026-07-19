import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { Container, Eyebrow, GlassCard } from "./primitives";
import { FEATURE_ART, type FeatureArtKey } from "./feature-banners";

type Feature = {
  key: FeatureArtKey;
  href: string;
  title: string;
  desc: string;
  tag: string;
};

const features: Feature[] = [
  {
    key: "sheets",
    href: "/sheet",
    title: "DSA Sheets",
    desc: "The curated SWE Sheet and a focused Last-Minute 100 for revision day.",
    tag: "Pattern-first",
  },
  {
    key: "domain",
    href: "/domain",
    title: "Domain",
    desc: "SQL, DBMS, OS and more — problem, best approach and the clean answer, side by side.",
    tag: "Core CS",
  },
  {
    key: "screening",
    href: "/screening",
    title: "Screening",
    desc: "Quant aptitude, logical reasoning and puzzles — crisp theory plus MCQ practice.",
    tag: "MCQ drills",
  },
  {
    key: "interview",
    href: "/interview",
    title: "Interview Stories",
    desc: "Real experiences from real candidates — wins, lessons and round-by-round breakdowns.",
    tag: "Community",
  },
];

export function FeatureGrid() {
  return (
    <Container>
      <section className="relative py-20">
        {/* Soft brand spotlight behind the heading. */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-4 -z-10 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-rb-green-500/10 blur-3xl"
        />

        <div className="mb-12 max-w-2xl">
          <Eyebrow>
            <Layers className="h-3.5 w-3.5" /> What you get
          </Eyebrow>
          <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need, <span className="text-gradient">one place</span>
          </h2>
          <p className="mt-3 text-muted">
            Tightly-built sections, one consistent glass theme — from your first pattern to your
            final round.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => {
            const Art = FEATURE_ART[f.key];
            return (
              <Link key={f.href} href={f.href} className="group block h-full">
                <GlassCard hover className="flex h-full flex-col overflow-hidden">
                  {/* Banner — themed SVG scene on a brand-tinted gradient. */}
                  <div className="relative h-28 overflow-hidden bg-gradient-to-br from-rb-green-500/20 via-rb-green-500/[0.06] to-transparent">
                    <Art className="absolute inset-0 h-full w-full text-accent transition-transform duration-500 ease-out group-hover:scale-105" />

                    {/* Hover corner glow — drifts inward as the card lifts. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-rb-green-500/30 opacity-0 blur-2xl transition-all duration-500 ease-out group-hover:-translate-x-3 group-hover:translate-y-3 group-hover:scale-125 group-hover:opacity-100"
                    />
                    {/* Fade into the card body + accent line on hover */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface/40 to-transparent"
                    />
                    <span
                      aria-hidden
                      className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-rb-green-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                    />

                    {/* Category tag */}
                    <span className="glass-pill absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                      {f.tag}
                    </span>
                  </div>

                  {/* Content */}
                  <div className="flex flex-1 flex-col p-6">
                    <h3 className="mb-1.5 text-lg font-semibold transition-colors group-hover:text-accent">
                      {f.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted">{f.desc}</p>

                    <div className="mt-auto inline-flex items-center gap-1.5 pt-5 text-sm font-semibold text-accent">
                      Explore
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            );
          })}
        </div>
      </section>
    </Container>
  );
}
