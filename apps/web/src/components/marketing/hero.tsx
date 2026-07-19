import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Container } from "./primitives";

export function Hero() {
  return (
    <Container className="text-center">
      <section className="stagger relative py-16 sm:py-24">
        <span className="glass-pill mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-accent">
          <Sparkles className="h-4 w-4" />
          Founded by Anjali Kumari · ex-Walmart &amp; Morgan Stanley
        </span>
        <h1 className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Crack your dream <span className="text-gradient">product company</span>
          <br />
          from any college.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-muted">
          RisingBrain is the founder-led, pattern-first placement platform that took students from
          tier-2 &amp; tier-3 colleges to Amazon, Microsoft, Walmart and beyond — with curated
          sheets, a real coding arena, live contests and mentorship, all in one place.
        </p>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Start learning free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/courses"
            className="glass glass-hover inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" /> Browse courses
          </Link>
        </div>

        {/* Social proof, stated as what the method actually does rather than as a
            rating. The previous version showed stock-ish learner avatars plus
            "Rated 4.9/5 · placed at Amazon, Microsoft, Walmart" — numbers with no
            review source behind them, which reads as claim-first. */}
        <div className="mt-12 flex flex-col items-center gap-3">
          <span className="glass-pill rounded-full px-3 py-1.5 text-xs font-semibold text-accent">
            +50k learners
          </span>
          {/* Kept short enough to sit on one line from `sm` up — the longer
              phrasing wrapped even at max-w-2xl. `text-balance` evens out the
              two lines on mobile, where it has to wrap regardless. */}
          <p className="mx-auto max-w-2xl text-balance text-sm text-muted">
            People use it to recognise patterns and build logic on their own.
          </p>
        </div>
      </section>
    </Container>
  );
}
