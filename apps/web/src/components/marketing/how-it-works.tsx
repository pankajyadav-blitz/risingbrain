import { Route } from "lucide-react";
import { Container, Eyebrow } from "./primitives";

/**
 * How it works — the mechanism section.
 *
 * This is the section most platforms skip, and it's the one that converts a
 * vague promise ("crack product companies") into something legible ("here is
 * what you'll actually do on Monday"). It sits high, right after the feature
 * index and before any social proof.
 *
 * Structure is Linear/Vercel-style vertical bands rather than a row of three
 * numbered cards: a monospace step index on the left, and a real artifact from
 * the product on the right. The bands do double duty as a product deep-dive,
 * and the mono index carries the sequencing without the "01 / 02 / 03" card row
 * that reads as template.
 */

/* --- Step artifacts. Each is a real fragment of the product, in HTML. ---- */

/** Step 1 — patterns, as the unit of study. */
function PatternCloud() {
  const patterns = [
    { name: "Two Pointers", n: 12, on: true },
    { name: "Sliding Window", n: 9, on: false },
    { name: "Monotonic Stack", n: 7, on: false },
    { name: "Binary Search on Answer", n: 11, on: true },
    { name: "Top-K / Heap", n: 8, on: false },
    { name: "Union Find", n: 6, on: false },
    { name: "0/1 Knapsack", n: 14, on: true },
    { name: "Topological Sort", n: 5, on: false },
  ];
  return (
    <div className="flex flex-wrap gap-2">
      {patterns.map((p) => (
        <span
          key={p.name}
          className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
            p.on
              ? "border-rb-green-500/40 bg-rb-green-500/10 text-foreground"
              : "border-border bg-surface text-muted"
          }`}
        >
          {p.name}
          <span className="font-mono text-xs text-muted">{p.n}</span>
        </span>
      ))}
    </div>
  );
}

/** Step 2 — the sheet, partially rendered, fading into what's left. */
function SheetRows() {
  const rows = [
    { name: "Container With Most Water", diff: "Medium", done: true },
    { name: "Trapping Rain Water", diff: "Hard", done: true },
    { name: "3Sum", diff: "Medium", done: true },
    { name: "Sort Colors", diff: "Medium", done: false },
    { name: "Remove Nth Node From End", diff: "Medium", done: false },
  ];
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface">
      {rows.map((r) => (
        <div
          key={r.name}
          className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0"
        >
          <span
            className={`grid h-4 w-4 shrink-0 place-items-center rounded border ${
              r.done ? "border-accent bg-accent" : "border-border"
            }`}
          >
            {r.done ? (
              <svg viewBox="0 0 12 12" className="h-3 w-3" aria-hidden>
                <path
                  d="M2.5 6.2l2.2 2.2 4.8-5"
                  fill="none"
                  stroke="var(--brand-foreground)"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : null}
          </span>
          <span className={`flex-1 truncate text-sm ${r.done ? "text-muted" : "text-foreground"}`}>
            {r.name}
          </span>
          <span className="shrink-0 font-mono text-xs text-muted">{r.diff}</span>
        </div>
      ))}
      {/* The fade is the point: it proves there's more without listing it. */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-surface to-transparent" />
      <div className="absolute inset-x-0 bottom-0 py-3 text-center font-mono text-xs text-muted">
        + 491 more
      </div>
    </div>
  );
}

/** Step 3 — revision, driven by what you actually got wrong. */
function RevisionStack() {
  const items = [
    { label: "Flagged for revision", n: 14, tone: "accent" as const },
    { label: "Solved with a hint", n: 23, tone: "muted" as const },
    { label: "Notes written", n: 61, tone: "muted" as const },
  ];
  return (
    <div className="grid gap-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="flex items-center justify-between rounded-xl border border-border bg-surface px-4 py-3"
        >
          <span className="text-sm text-muted">{i.label}</span>
          <span
            className={`font-mono text-lg font-bold tabular-nums ${
              i.tone === "accent" ? "text-accent" : "text-foreground"
            }`}
          >
            {i.n}
          </span>
        </div>
      ))}
    </div>
  );
}

const steps = [
  {
    index: "1.0",
    kicker: "Recognise",
    title: "Learn the pattern, not the problem",
    body: "Every problem in the sheet is filed under the pattern that solves it, with the cue that identifies it. You stop memorising 500 solutions and start recognising 85 shapes.",
    art: <PatternCloud />,
  },
  {
    index: "2.0",
    kicker: "Practise",
    title: "Work the sequence in order",
    body: "The sheet is ordered, not alphabetical — each problem assumes the one before it. Tick as you go and your progress, notes and bookmarks stay attached to the problem, not to a spreadsheet.",
    art: <SheetRows />,
  },
  {
    index: "3.0",
    kicker: "Revise",
    title: "Revise what you actually got wrong",
    body: "Anything you flagged, needed a hint for, or wrote a note on comes back before your loop — and the Last-Minute 100 compresses the whole sheet into one evening.",
    art: <RevisionStack />,
  },
];

export function HowItWorks() {
  return (
    <Container>
      <section id="how-it-works" className="py-24">
        <div className="mb-16 max-w-2xl">
          <Eyebrow>
            <Route className="h-3.5 w-3.5" /> How it works
          </Eyebrow>
          <h2 className="display-2 mt-5 font-bold">
            Three habits, <span className="text-gradient">repeated</span>
          </h2>
          <p className="lead mt-4 text-muted">
            There is no trick to this. The platform exists to make the boring version of preparation
            impossible to lose track of.
          </p>
        </div>

        {/* Bands, not cards — separated by space and a rule rather than by
            wrapping each one in yet another glass box. */}
        <div className="flex flex-col">
          {steps.map((s, i) => (
            <div
              key={s.index}
              className={`grid items-center gap-8 py-12 lg:grid-cols-2 lg:gap-16 ${
                i > 0 ? "border-t border-border" : ""
              }`}
            >
              <div className={i % 2 === 1 ? "lg:order-2" : ""}>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-accent">{s.index}</span>
                  <span className="font-mono text-sm uppercase tracking-wide text-muted">
                    {s.kicker}
                  </span>
                </div>
                <h3 className="mt-4 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
                  {s.title}
                </h3>
                <p className="mt-3 max-w-[54ch] leading-relaxed text-muted">{s.body}</p>
              </div>
              <div className={i % 2 === 1 ? "lg:order-1" : ""}>{s.art}</div>
            </div>
          ))}
        </div>
      </section>
    </Container>
  );
}
