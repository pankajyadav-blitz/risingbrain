"use client";

import { ArrowDown, CheckCircle2, Loader2, RotateCcw, Send } from "lucide-react";
import { usePracticeAttempt } from "./practice-attempt";
import { scrollToQuestion } from "@/lib/attempt-draft";

/**
 * Compact Retake button for the topic header — mirrors the one in the bottom
 * SubmitBar so a finished set can be restarted without scrolling down. Renders
 * nothing until the set has been submitted.
 */
export function TopRetakeButton() {
  const { submitted, result, retake } = usePracticeAttempt();
  if (!submitted || !result) return null;

  const pct = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={retake}
      className="glass-pill glass-hover inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-accent"
      title={`Scored ${result.score}/${result.total} (${pct}%)`}
    >
      <RotateCcw className="h-4 w-4" /> Retake
    </button>
  );
}

/**
 * End-of-set action bar. While the practice set is open it shows answered/total
 * and a single Submit that grades everything. After submit it shows the score
 * and a Retake button. Sticky to the bottom of the scrolling pane so it's always
 * reachable.
 *
 * Submit stays disabled until every question is answered — a blank is graded as
 * wrong, so handing in a partial set costs marks the learner did not mean to
 * lose. Because a disabled control with no explanation is a dead end, the count
 * beside it doubles as a link to the first unanswered question.
 */
export function SubmitBar() {
  const attempt = usePracticeAttempt();
  // NOTE ON THE STICKY BARS BELOW: solid `bg-surface`, not a translucent +
  // `backdrop-blur` band — a child with `backdrop-filter` is not clipped by an
  // ancestor's border radius in Chromium, and questions scroll under it anyway.
  const { total, answeredCount, firstUnansweredId, complete, submitted, result, submitting, error } =
    attempt;

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
              <p className="text-sm font-semibold text-foreground">Answers submitted</p>
              <p className="text-xs text-muted">
                You scored{" "}
                <span className="font-bold tabular-nums text-foreground">
                  {result.score}/{result.total}
                </span>{" "}
                ({pct}%). Review the answers and explanations above.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={attempt.retake}
            className="glass-pill glass-hover inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted hover:text-accent"
          >
            <RotateCcw className="h-4 w-4" /> Retake
          </button>
        </div>
      </div>
    );
  }

  const unanswered = total - answeredCount;
  return (
    <div className="sticky bottom-0 z-10 mt-6 border-t border-border bg-surface/80 py-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 rounded-2xl bg-surface-2/40 px-5 py-3.5 ring-1 ring-border sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 text-sm">
          <span className="font-semibold tabular-nums text-foreground">
            {answeredCount}/{total}
          </span>{" "}
          <span className="text-muted">answered</span>
          {/* A disabled button with no reason is a dead end, so the count is
              followed by what is missing and a way to get there. */}
          {unanswered > 0 ? (
            <button
              type="button"
              onClick={() => firstUnansweredId && scrollToQuestion(firstUnansweredId)}
              className="ml-2 inline-flex items-center gap-1 rounded-full px-1.5 text-xs font-medium text-accent hover:underline"
            >
              <ArrowDown className="h-3 w-3" />
              {unanswered} left — go to the first
            </button>
          ) : null}
          {error ? <span className="ml-2 text-xs text-rose-500">{error}</span> : null}
          {/* Reassurance that leaving does not cost the work. Shown only once
              there is work to lose. */}
          {answeredCount > 0 && unanswered > 0 ? (
            <p className="mt-1 text-[11px] text-muted">Your answers are saved on this device.</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={attempt.submit}
          disabled={submitting || !complete}
          title={complete ? undefined : `Answer all ${total} questions to submit`}
          className="btn-glow inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {submitting ? "Submitting…" : "Submit answers"}
        </button>
      </div>
    </div>
  );
}
