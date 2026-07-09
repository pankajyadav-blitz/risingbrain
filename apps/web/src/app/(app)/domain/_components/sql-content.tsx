import { Database } from "lucide-react";
import { Eyebrow } from "@/components/marketing/primitives";
import type { Difficulty } from "@risingbrain/database/enums";
import { DifficultyBadge } from "./difficulty-badge";
import { ProblemCard, type ProblemListItem } from "./problem-card";

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
const FALLBACK_TOPIC = "General";

/**
 * The SQL section's view — the existing grouped-by-topic problem listing, lifted
 * out of the old page so it can be rendered as one tab inside the Domain shell.
 * Unchanged behaviour: SSR shows only the light list; each card lazy-loads its
 * heavy fields from `/api/domain/[id]` on hover.
 */
export function SqlContent({
  problems,
  signedIn,
}: {
  problems: ProblemListItem[];
  signedIn: boolean;
}) {
  // Group by topic, preserving the DB ordering within each group.
  const groups = new Map<string, ProblemListItem[]>();
  for (const p of problems) {
    const key = p.topic?.trim() || FALLBACK_TOPIC;
    const bucket = groups.get(key);
    if (bucket) bucket.push(p);
    else groups.set(key, [p]);
  }

  return (
    <section className="relative pb-16 pt-2">
      {/* Soft brand spotlight behind the heading. */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 -z-10 h-72 w-[44rem] max-w-full -translate-x-1/2 rounded-full bg-rb-green-500/10 blur-3xl"
      />

      {/* Header */}
      <div className="mx-auto mb-12 max-w-2xl text-center">
        <div className="flex justify-center">
          <Eyebrow>
            <Database className="h-3.5 w-3.5" /> SQL practice
          </Eyebrow>
        </div>
        <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
          Query like an <span className="text-gradient">engineer</span>
        </h2>
        <p className="mt-3 text-muted">
          Every problem follows the same rhythm — a plain-English statement, the optimal way to
          reason about it, and a clean, copy-ready query you can actually ship. Hover a card to
          load it.
        </p>

        {/* Static difficulty legend */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {DIFFICULTIES.map((d) => (
            <DifficultyBadge key={d} difficulty={d} />
          ))}
        </div>
      </div>

      {/* Problems, grouped by topic */}
      {problems.length === 0 ? (
        <p className="mx-auto max-w-md text-center text-muted">
          No problems published yet. Check back soon.
        </p>
      ) : (
        <div className="mx-auto max-w-3xl space-y-12 animate-in">
          {Array.from(groups.entries()).map(([topic, items]) => (
            <div key={topic}>
              {/* Topic heading + count */}
              <div className="mb-5 flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-accent">
                  {topic}
                </h3>
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="text-xs font-medium text-muted">
                  {items.length} {items.length === 1 ? "problem" : "problems"}
                </span>
              </div>

              <div className="grid gap-5">
                {items.map((problem) => (
                  <ProblemCard key={problem.id} problem={problem} signedIn={signedIn} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
