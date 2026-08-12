"use client";

import { CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { usePaperAttempt } from "./paper-attempt";

/**
 * Compact Retake button for the paper header — mirrors the one in the bottom
 * SubmitBar so a finished test can be restarted without scrolling down. Renders
 * nothing until the paper has been submitted.
 */
export function TopRetakeButton() {
  const { submitted, result, retake } = usePaperAttempt();
  if (!submitted || !result) return null;

  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={retake}
      className="glass-pill glass-hover inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-accent"
      title={`Scored ${result.score}/${result.total} (${pct}%)`}
    >
      <RotateCcw className="h-4 w-4" /> Retake test
    </button>
  );
}

/**
 * End-of-paper action bar. While the test is open it shows answered/total and a
 * single Submit that grades the whole paper. After submit it shows the score and
 * a Retake button. Sticky to the bottom of the scrolling paper so it's always
 * reachable.
 */
export function SubmitBar() {
  const attempt = usePaperAttempt();
  // NOTE ON THE STICKY BARS BELOW: solid `bg-surface`, not a translucent +
  // `backdrop-blur` band. The paper pane is a rounded, clipping card, and a child
  // with `backdrop-filter` is not clipped by an ancestor's border radius in
  // Chromium — a blurred bar renders its square corner over the card's rounded
  // bottom one. It has to be opaque regardless, since questions scroll under it.
  const { total, answeredCount, submitted, result, submitting, error } = attempt;

  if (submitted && result) {
    const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="sticky bottom-0 z-10 mt-6 border-t border-border bg-surface py-4">
        <div className="flex flex-col gap-4 rounded-2xl bg-rb-green-500/10 px-5 py-4 ring-1 ring-rb-green-500/25 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-rb-green-500/20 text-brand">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground">Test submitted</p>
              <p className="text-xs text-muted">
                You scored{" "}
                <span className="font-bold tabular-nums text-foreground">
                  {result.score}/{result.total}
                </span>{" "}
                ({pct}%). Review the answers and hints above.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={attempt.retake}
            className="glass-pill glass-hover inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" /> Retake test
          </button>
        </div>
      </div>
    );
  }

  const unanswered = total - answeredCount;
  return (
    <div className="sticky bottom-0 z-10 mt-6 border-t border-border bg-surface/80 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-2/40 px-5 py-3.5 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm">
          <span className="font-semibold tabular-nums text-foreground">
            {answeredCount}/{total}
          </span>{" "}
          <span className="text-muted">answered</span>
          {unanswered > 0 ? (
            <span className="ml-2 text-xs text-muted">
              · {unanswered} unanswered will score 0
            </span>
          ) : null}
          {error ? <span className="ml-2 text-xs text-rose-500">{error}</span> : null}
        </div>
        <button
          type="button"
          onClick={attempt.submit}
          disabled={submitting || answeredCount === 0}
          className="btn-glow inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Submitting…" : "Submit test"}
        </button>
      </div>
    </div>
  );
}
