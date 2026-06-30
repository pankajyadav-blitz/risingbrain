import Link from "next/link";
import {
  ArrowRight,
  Calculator,
  Database,
  Layers,
  ListChecks,
  MessageSquareQuote,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, GlassCard } from "./primitives";

type Feature = {
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
};

const features: Feature[] = [
  {
    href: "/sheet",
    icon: ListChecks,
    title: "DSA Sheets",
    desc: "The curated SWE Sheet and a focused Last-Minute 100 for revision day.",
    tag: "Pattern-first",
  },
  {
    href: "/sql",
    icon: Database,
    title: "SQL Queries",
    desc: "Problem, best approach and the clean query — side by side.",
    tag: "Window funcs",
  },
  {
    href: "/aptitude",
    icon: Calculator,
    title: "Aptitude",
    desc: "Crisp topic theory plus MCQ practice to sharpen your speed.",
    tag: "MCQ drills",
  },
  {
    href: "/interview",
    icon: MessageSquareQuote,
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
            const Icon = f.icon;
            return (
              <Link key={f.href} href={f.href} className="group block h-full">
                <GlassCard hover className="relative h-full overflow-hidden p-6">
                  {/* Accent line + corner glow, revealed on hover. */}
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-rb-green-400/70 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span
                    aria-hidden
                    className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-rb-green-500/20 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                  />

                  <div className="relative mb-5 flex items-start justify-between">
                    <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="glass-pill rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-muted">
                      {f.tag}
                    </span>
                  </div>

                  <h3 className="relative mb-1.5 text-lg font-semibold transition-colors group-hover:text-accent">
                    {f.title}
                  </h3>
                  <p className="relative text-sm leading-relaxed text-muted">{f.desc}</p>

                  <div className="relative mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-accent">
                    Explore
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
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
