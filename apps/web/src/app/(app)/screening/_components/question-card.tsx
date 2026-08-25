"use client";

import {
  CheckCircle2,
  Lightbulb,
  Sparkles,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { useProgress } from "./progress-provider";
import { usePaperAttempt } from "./paper-attempt";

export type AptOption = { key: string; label: string };

export type AptQuestion = {
  id: string;
  prompt: string;
  options: AptOption[];
  difficulty: "EASY" | "MEDIUM" | "HARD" | null;
  hint: string | null;
};

/**
 * Auto-formats prompts that contain structured content so they display
 * cleanly even when the DB row has no embedded newlines yet.
 *
 * Rules applied in order:
 * 1. "Statements: 1. … 2. … Conclusions: I. … II. …"
 *    → each numbered/roman item on its own line with a blank line between blocks
 * 2. Semicolon-separated symbol definitions (blood-relation coding questions)
 *    → each definition on its own line
 * 3. Already-formatted prompts (contains \n) → pass through unchanged
 */
function formatPrompt(raw: string): string {
  // Already has line breaks — trust the seed data.
  if (raw.includes("\n")) return raw;

  // Pattern: Statements / Conclusions blocks
  const assertionMatch = raw.match(
    /^(Statements?:)\s*(.+?)\s*(Conclusions?:)\s*(.+)$/is
  );
  if (assertionMatch) {
    const [, sLabel, sBody, cLabel, cBody] = assertionMatch;
    const fmt = (block: string) =>
      block
        .replace(/(\d+)\.\s+/g, "\n$1. ")
        .replace(/([IVX]+)\.\s+/g, "\n$1. ")
        .trim();
    return `${sLabel}\n${fmt(sBody!)}\n\n${cLabel}\n${fmt(cBody!)}`;
  }

  // Pattern: semicolon-separated symbol/code definitions
  if (/[A-Z]\s*[@#+$*-]\s*[A-Z]\s+means/i.test(raw) && raw.includes(";")) {
    return raw.replace(/;\s*/g, "\n").trim();
  }

  // Pattern: multi-condition seating / family puzzles — split on ". " between sentences
  if (
    /sitting (in a row|around|in two parallel)/i.test(raw) ||
    /family (consists|of \w+ persons)/i.test(raw)
  ) {
    return raw.replace(/\.\s+(?=[A-Z])/g, ".\n").trim();
  }

  return raw;
}

const DIFFICULTY_STYLE: Record<string, string> = {
  EASY: "text-rb-green-500 bg-rb-green-500/10 ring-rb-green-500/20",
  MEDIUM: "text-amber-500 bg-amber-500/10 ring-amber-500/20",
  HARD: "text-rose-500 bg-rose-500/10 ring-rose-500/20",
};

/**
 * A single MCQ in the graded test flow. While the test is open it ships the
 * prompt, options and hint only — never the answer — and picking an option just
 * marks it as chosen: no verdict, no colour, and the choice can be changed as
 * often as the learner likes. Opening the hint (top-right) before submitting
 * forfeits that question's mark. Once the paper is submitted the card flips to
 * review mode: the correct answer, the explanation and the hint are all revealed.
 */
export function QuestionCard({ question, index }: { question: AptQuestion; index: number }) {
  const { id, options, difficulty, hint } = question;
  const prompt = formatPrompt(question.prompt);
  const attempt = usePaperAttempt();
  const progress = useProgress();

  const reviewMode = attempt.submitted;
  const review = progress?.getReview(id); // present only for answered, submitted Qs
  const st = attempt.getState(id);

  const answeredInReview = reviewMode && review;

  // ---- per-question status dot ---------------------------------------------
  // Before submit the dot only says "answered / not answered" — it must not leak
  // whether the choice was right.
  let dot: "correct" | "awarded" | "wrong" | "answered" | "none" = "none";
  if (reviewMode) {
    if (review) dot = review.awarded ? "awarded" : review.isCorrect ? "correct" : "wrong";
  } else if (st.selectedKey) {
    dot = "answered";
  }

  function optionClass(key: string) {
    if (reviewMode) {
      if (!review) return "border-border bg-surface-2 text-muted opacity-60";
      if (key === review.answerKey)
        return "border-emerald-500/60 bg-emerald-500/12 text-foreground ring-1 ring-emerald-500/40";
      if (key === review.selectedKey)
        return "border-rose-500/60 bg-rose-500/12 text-foreground ring-1 ring-rose-500/40";
      return "border-border bg-surface-2 text-muted opacity-60";
    }
    // attempt mode — "chosen", never "right" or "wrong"
    return st.selectedKey === key
      ? "border-rb-green-500/60 bg-rb-green-500/10 text-foreground ring-1 ring-rb-green-500/40"
      : "border-border bg-surface-2 text-muted hover:border-rb-green-500/40 hover:text-foreground cursor-pointer";
  }

  function optionIcon(key: string): LucideIcon | null {
    if (reviewMode && review) {
      if (key === review.answerKey) return CheckCircle2;
      if (key === review.selectedKey) return XCircle;
      return null;
    }
    return null;
  }

  const showHint = hint && (reviewMode || st.hintOpen);

  return (
    <div data-question-id={id} className="py-5">
      <div className="flex items-start gap-3">
        <span className="shrink-0 text-sm font-bold tabular-nums text-accent">{index}.</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <p className="whitespace-pre-line text-sm font-medium leading-relaxed text-foreground sm:text-[15px]">
              {prompt}
            </p>
            <div className="flex shrink-0 items-center gap-2">
              {difficulty ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${
                    DIFFICULTY_STYLE[difficulty] ?? ""
                  }`}
                >
                  {difficulty}
                </span>
              ) : null}
              {hint && !reviewMode ? (
                <button
                  type="button"
                  onClick={() => attempt.toggleHint(id)}
                  aria-pressed={st.hintOpen}
                  title="Show hint (forfeits the mark)"
                  className={`grid h-7 w-7 place-items-center rounded-full ring-1 transition-colors ${
                    st.hintOpen || st.hintUsed
                      ? "bg-amber-500/15 text-amber-500 ring-amber-500/30"
                      : "bg-surface-2 text-muted ring-border hover:text-amber-500"
                  }`}
                >
                  <Lightbulb className="h-4 w-4" />
                </button>
              ) : null}
              <StatusDot status={dot} />
            </div>
          </div>

          {/* Options */}
          <fieldset className="mt-3 grid gap-2 sm:grid-cols-2" disabled={reviewMode}>
            <legend className="sr-only">Choose an answer</legend>
            {options.map((o) => {
              const Icon = optionIcon(o.key);
              const highlighted =
                (reviewMode && review && o.key === review.answerKey) ||
                (!reviewMode && st.selectedKey === o.key);
              return (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => attempt.select(id, o.key)}
                  aria-pressed={st.selectedKey === o.key}
                  className={`flex w-full items-start gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${optionClass(
                    o.key
                  )}`}
                >
                  <span
                    className={`mt-px grid h-5 w-5 shrink-0 place-items-center rounded-md font-mono text-[11px] font-bold uppercase ${
                      highlighted ? "bg-rb-green-500/25 text-accent" : "bg-background/60 text-muted"
                    }`}
                  >
                    {o.key}
                  </span>
                  <span className="flex-1 leading-relaxed">{o.label}</span>
                  {Icon ? (
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${
                        Icon === CheckCircle2 ? "text-emerald-500" : "text-rose-500"
                      }`}
                    />
                  ) : null}
                </button>
              );
            })}
          </fieldset>

          {/* Feedback — the chosen option's green/red mark conveys the verdict,
              so no separate correct/incorrect chip is shown here. */}
          <div className="mt-3 space-y-3">
            {/* Hint */}
            {showHint ? (
              <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-3 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-amber-500">
                  <Lightbulb className="h-3.5 w-3.5" /> Hint
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">{hint}</p>
              </div>
            ) : null}

            {/* Explanation — review only */}
            {answeredInReview && review.explanation ? (
              <div className="rounded-xl border border-rb-green-500/25 bg-rb-green-500/[0.07] px-3 py-3">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-accent">
                  <Sparkles className="h-3.5 w-3.5" /> Explanation
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {review.explanation}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Per-question status indicator:
 *  - filled green tick  → correct & mark awarded   (review only)
 *  - amber tick         → correct but no mark (hint used, review only)
 *  - filled rose dot    → incorrect                (review only)
 *  - filled accent dot  → answered, not yet submitted — no verdict implied
 *  - blank outlined dot → not yet answered / skipped
 */
function StatusDot({
  status,
}: {
  status: "correct" | "awarded" | "wrong" | "answered" | "none";
}) {
  if (status === "awarded" || status === "correct") {
    return (
      <span
        title={status === "awarded" ? "Correct" : "Correct (no mark)"}
        className={status === "awarded" ? "text-emerald-500" : "text-amber-500"}
      >
        <CheckCircle2 className="h-5 w-5" />
      </span>
    );
  }
  if (status === "wrong") {
    return (
      <span title="Incorrect" className="grid h-5 w-5 place-items-center" aria-label="Incorrect">
        <span className="h-3 w-3 rounded-full bg-rose-500" />
      </span>
    );
  }
  if (status === "answered") {
    return (
      <span title="Answered" className="grid h-5 w-5 place-items-center" aria-label="Answered">
        <span className="h-3 w-3 rounded-full bg-rb-green-500/70" />
      </span>
    );
  }
  return (
    <span title="Not answered" className="grid h-5 w-5 place-items-center" aria-label="Not answered">
      <span className="h-3 w-3 rounded-full border-2 border-border" />
    </span>
  );
}
