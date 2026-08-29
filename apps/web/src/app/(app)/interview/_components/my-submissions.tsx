import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { REVIEW_STATUS_META } from "../_lib/format";
import type { MySubmission } from "../_data";

/**
 * "Your submissions" — the author's own write-ups that the feed below cannot
 * show them, because they are still in the review queue or were sent back.
 *
 * This is the other half of the approval gate: submissions that disappear into a
 * queue with no visible trace read as lost, and a rejection is only useful if the
 * person who wrote the post can actually read the note. Rendered only for the
 * author, only when they have something outstanding.
 */
export function MySubmissions({ submissions }: { submissions: MySubmission[] }) {
  if (submissions.length === 0) return null;

  return (
    <section className="glass animate-in mb-6 rounded-3xl p-5" aria-labelledby="my-submissions-heading">
      <h2 id="my-submissions-heading" className="text-sm font-semibold text-foreground">
        Your submissions
      </h2>
      <p className="mt-1 text-xs text-muted">
        Experiences are reviewed by a moderator before they reach the feed.
      </p>

      <ul className="mt-4 space-y-2">
        {submissions.map((s) => {
          const meta = REVIEW_STATUS_META[s.status];
          const Icon = meta.icon;
          return (
            <li key={s.id}>
              <Link
                href={`/interview/${s.id}`}
                className="group flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl border border-border bg-surface/40 px-4 py-3 transition-colors hover:border-rb-green-500/30"
              >
                <span
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${meta.pill}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {meta.label}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground transition-colors group-hover:text-accent">
                    {s.title}
                  </span>
                  <span className="block truncate text-xs text-muted">
                    {s.company} · {s.role} · submitted {s.createdAtLabel}
                  </span>
                  {/* The moderator's note is the actionable part of a rejection,
                      so it is shown inline rather than one click away. */}
                  {s.reviewNote && (
                    <span className="mt-1 block text-xs leading-relaxed text-muted">
                      <span className="font-medium">Moderator: </span>“{s.reviewNote}”
                    </span>
                  )}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
