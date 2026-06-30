import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Container, GlassCard } from "./primitives";

export function CtaBanner() {
  return (
    <Container>
      <section className="py-16">
        <GlassCard className="flex flex-col items-center justify-between gap-4 p-8 text-center sm:flex-row sm:text-left">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">
              Ready to start your placement journey?
            </h2>
            <p className="mt-1 text-sm text-muted">
              Begin with the curated sheet — free, forever. No card, no catch.
            </p>
          </div>
          <Link
            href="/signup"
            className="btn-glow inline-flex shrink-0 items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Start learning free <ArrowRight className="h-4 w-4" />
          </Link>
        </GlassCard>
      </section>
    </Container>
  );
}
