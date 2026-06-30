import { Container, GlassCard } from "./primitives";

const stats: [string, string][] = [
  ["50k+", "Learners mentored"],
  ["496+", "Curated problems"],
  ["500+", "Placed at top firms"],
  ["85+", "Topic-wise patterns"],
];

export function Stats() {
  return (
    <Container>
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([num, label]) => (
          <GlassCard key={label} className="px-5 py-6 text-center">
            <div className="text-2xl font-bold text-accent sm:text-3xl">{num}</div>
            <div className="mt-1 text-xs text-muted sm:text-sm">{label}</div>
          </GlassCard>
        ))}
      </section>
    </Container>
  );
}
