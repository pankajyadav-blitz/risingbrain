import { Fragment } from "react";

/**
 * The topic's one-line subtitle.
 *
 * `DomainTopic.summary` is authored alongside the markdown `notes` and inherits
 * its habits — a SQL topic's summary opens "`DISTINCT` removes duplicate rows…"
 * — but it is a plain string field, so rendering it as text printed the
 * backticks on screen. Rather than run a markdown parser over one line, this
 * handles the single construct that actually appears in the data: inline code.
 * Anything else is shown verbatim, which is the right failure mode for a
 * subtitle.
 */
export function TopicSummary({ summary }: { summary: string }) {
  // Split on `code` spans, keeping the delimiters' contents (odd indices).
  const parts = summary.split(/`([^`]+)`/g);

  return (
    <p className="mt-3 max-w-[72ch] text-[0.975rem] leading-relaxed text-muted">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code
            key={i}
            className="rounded-md border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-foreground"
          >
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </p>
  );
}
