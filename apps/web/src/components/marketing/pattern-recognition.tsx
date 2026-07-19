"use client";

import { useEffect, useRef, useState } from "react";
import { CATALOG_STATS } from "./catalog-stats";

/**
 * Hero product proof: the pattern-recognition demo.
 *
 * Replaces the seeded activity heatmap that used to sit here. That panel had
 * two problems beyond its invented numbers:
 *
 *  1. It previewed a screen the visitor meets again, for real and EMPTY, the
 *     moment they sign up — a lush 18-day streak followed by a blank grid is a
 *     letdown the hero itself manufactured.
 *  2. It proved the streak feature, while the headline sells a pattern-first
 *     curriculum. The strongest proof visual demonstrates the actual claim.
 *
 * Everything below is real content lifted from `seed/dsa.json` — the pattern
 * names, the `identification` cues, the problems and their LeetCode refs. No
 * fabricated progress, and nothing addressed to the visitor in second person.
 */

/** Real patterns from the DSA seed. `tell` is the pattern's `identification`. */
const PATTERNS = [
  {
    name: "Sliding Window",
    topic: "Array",
    tell: "“window of size k”, “longest”, “shortest”, or “at most K”",
    problems: ["Max Consecutive Ones III", "Subarray Product Less Than K", "Longest Repeating Character Replacement"],
  },
  {
    name: "Monotonic Stack",
    topic: "Stack",
    tell: "“next greater/smaller element”, spans, or trapping area",
    problems: ["Daily Temperatures", "Next Greater Element II", "Online Stock Span"],
  },
  {
    name: "Binary Search on Answers",
    topic: "Binary Search",
    tell: "a minimum/maximum feasible value, or optimisation over a range",
    problems: ["Koko Eating Bananas", "Capacity To Ship Packages", "Aggressive Cows"],
  },
  {
    name: "Kadane’s Algorithm",
    topic: "Array",
    tell: "maximum/minimum sum or product of a contiguous subarray",
    problems: ["Maximum Subarray", "Maximum Product Subarray", "Maximum Sum Circular Subarray"],
  },
  {
    name: "Prefix Sum",
    topic: "Array",
    tell: "range sum, subarray sum, cumulative sum, or prefix-based queries",
    problems: ["Subarray Sum Equals K", "Product of Array Except Self", "Continuous Subarray Sum"],
  },
  {
    name: "Two-Pointer",
    topic: "Array",
    tell: "pairs, sorted arrays, triplets, or opposite-end traversal",
    problems: ["Two Sum II", "3Sum", "Sort Colors"],
  },
] as const;

/** How long each pattern holds before the demo advances. */
const DWELL_MS = 4200;

export function PatternRecognition() {
  const [active, setActive] = useState(0);
  // Autoplay is opt-out, not opt-in: it stops for good once the visitor picks a
  // pattern themselves, so the demo never fights a user who took control.
  const [auto, setAuto] = useState(true);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (!auto || reduced) return;
    const id = setInterval(() => setActive((i) => (i + 1) % PATTERNS.length), DWELL_MS);
    return () => clearInterval(id);
  }, [auto, reduced]);

  const current = PATTERNS[active]!;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-surface">
      {/* Window chrome — the signature element the card banners share. The
          label states what the panel IS, rather than claiming it's yours. */}
      <div className="flex items-center gap-2 border-b border-border bg-surface-2 px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-muted/40" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted/25" />
        <span className="h-2.5 w-2.5 rounded-full bg-muted/15" />
        <span className="ml-2 font-mono text-xs text-muted">pattern → problems</span>
      </div>

      <div className="grid gap-6 p-6 lg:grid-cols-[minmax(0,15rem)_1fr] lg:gap-8">
        {/* Left: the pattern rail. Doubles as the demo's progress indicator. */}
        <ul className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
          {PATTERNS.map((p, i) => {
            const on = i === active;
            return (
              <li key={p.name} className="shrink-0 lg:shrink">
                <button
                  type="button"
                  onClick={() => {
                    setActive(i);
                    setAuto(false);
                  }}
                  aria-current={on}
                  className={`relative w-full whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm transition-colors lg:whitespace-normal ${
                    on ? "bg-highlight font-medium text-foreground" : "text-muted hover:text-foreground"
                  }`}
                >
                  {/* The active bar fills over the dwell time, so the panel
                      telegraphs when it's about to move on. */}
                  <span
                    aria-hidden
                    className="absolute inset-y-1 left-0 w-[3px] overflow-hidden rounded-full"
                    style={{ background: on ? "var(--border)" : "transparent" }}
                  >
                    {on && (
                      <span
                        key={`${active}-${auto}`}
                        className="block w-full rounded-full"
                        style={{
                          background: "var(--rb-green-500)",
                          height: auto && !reduced ? "0%" : "100%",
                          animation:
                            auto && !reduced ? `pr-fill ${DWELL_MS}ms linear forwards` : undefined,
                        }}
                      />
                    )}
                  </span>
                  {p.name}
                </button>
              </li>
            );
          })}
        </ul>

        {/* Right: the resolution. Keyed on `active` so the whole block
            re-mounts and replays its entrance on every change. */}
        <div key={active} className={reduced ? undefined : "stagger"}>
          <div className="text-xs uppercase tracking-wide text-muted">When a problem mentions</div>

          <p className="mt-2 text-lg font-medium leading-snug sm:text-xl">{current.tell}</p>

          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted">reach for</span>
            <span className="text-gradient font-semibold">{current.name}</span>
            <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted">
              {current.topic}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {current.problems.map((title) => (
              <span
                key={title}
                className="rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 font-mono text-xs text-muted"
              >
                {title}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Counts come from the shared marketing figures so this strip can never
          disagree with the `Stats` band further down the same page. */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-1 border-t border-border px-6 py-3 text-xs text-muted">
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {CATALOG_STATS.patterns}+
          </span>{" "}
          patterns
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {CATALOG_STATS.problems}+
          </span>{" "}
          problems
        </span>
        <span>
          <span className="font-semibold tabular-nums text-foreground">
            {CATALOG_STATS.topics}+
          </span>{" "}
          topics
        </span>
      </div>
    </div>
  );
}

/** Tracks the motion preference live — the OS toggle applies without a reload. */
function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  const mq = useRef<MediaQueryList | null>(null);

  useEffect(() => {
    mq.current = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.current.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.current.addEventListener("change", onChange);
    return () => mq.current?.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
