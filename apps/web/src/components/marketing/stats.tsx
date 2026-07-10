import { Container, GlassCard } from "./primitives";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";

// [value, suffix, label] — the number counts up from zero when scrolled into view.
const stats: [number, string, string][] = [
  [50, "k+", "Learners mentored"],
  [496, "+", "Curated problems"],
  [500, "+", "Placed at top firms"],
  [85, "+", "Topic-wise patterns"],
];

export function Stats() {
  return (
    <Container>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([value, suffix, label], i) => (
          <Reveal key={label} delay={i * 80}>
            <GlassCard hover className="px-5 py-6 text-center">
              <div className="text-2xl font-bold tabular-nums text-accent sm:text-3xl">
                <CountUp value={value} suffix={suffix} />
              </div>
              <div className="mt-1 text-xs text-muted sm:text-sm">{label}</div>
            </GlassCard>
          </Reveal>
        ))}
      </section>
    </Container>
  );
}
