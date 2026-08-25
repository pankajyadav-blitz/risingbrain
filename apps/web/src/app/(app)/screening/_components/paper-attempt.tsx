"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { useProgress } from "./progress-provider";
import type { AptReviewEntry } from "../_data";
import { redirectToLogin } from "@/lib/auth/redirect";
import { refreshStreakBadge } from "@/lib/streak-client";

/**
 * Owns ONE topic paper's attempt. Each QuestionCard reads/writes its slice here
 * instead of holding private state, so the end-of-paper Submit bar can grade the
 * whole paper at once.
 *
 * NOTHING is graded while the paper is open. Picking an option only records the
 * choice locally — answers can be changed freely and no verdict (or colour)
 * appears until Submit. That is what makes it a paper rather than a quiz show:
 * you answer, you hand it in, then you find out.
 *
 * Opening a hint at any point before submitting forfeits that question's mark.
 * (It used to be "before answering", which only meant anything while answers
 * locked on selection; now that they don't, opening a hint always leaves room to
 * change the answer, so it always costs the mark.)
 *
 * A topic that the learner already submitted (per the global progress seed)
 * starts in review mode. After a fresh submit we flip to review mode and push
 * the graded result into the global provider (live nav score + review on revisit).
 */
export type QState = {
  selectedKey: string | null;
  hintUsed: boolean; // opened a hint before submitting → no mark
  hintOpen: boolean; // hint is currently revealed
};

const EMPTY: QState = {
  selectedKey: null,
  hintUsed: false,
  hintOpen: false,
};

type AttemptValue = {
  topicId: string;
  total: number;
  answeredCount: number;
  submitted: boolean;
  result: { score: number; total: number } | null;
  submitting: boolean;
  error: string | null;
  getState: (questionId: string) => QState;
  select: (questionId: string, key: string) => void;
  toggleHint: (questionId: string) => void;
  submit: () => void;
  retake: () => void;
};

const AttemptContext = createContext<AttemptValue | null>(null);

export function PaperAttemptProvider({
  topicId,
  questionIds,
  children,
}: {
  topicId: string;
  questionIds: string[];
  children: React.ReactNode;
}) {
  const progress = useProgress();
  const seededScore = progress?.getTopicScore(topicId);

  const [states, setStates] = useState<Record<string, QState>>({});
  // Submitted if it was already graded (seed) or graded this session.
  const [submitted, setSubmitted] = useState<boolean>(Boolean(seededScore));
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    seededScore ?? null
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keep a ref of states so `submit` reads the latest without being a dependency.
  const statesRef = useRef(states);
  statesRef.current = states;

  const getState = useCallback(
    (questionId: string) => states[questionId] ?? EMPTY,
    [states]
  );

  const patch = useCallback((questionId: string, next: Partial<QState>) => {
    setStates((prev) => ({
      ...prev,
      [questionId]: { ...EMPTY, ...prev[questionId], ...next },
    }));
  }, []);

  // Purely local: no request, no verdict. Re-picking simply replaces the choice.
  const select = useCallback(
    (questionId: string, key: string) => {
      if (!progress?.signedIn) { redirectToLogin(); return; }
      if (submitted) return;
      patch(questionId, { selectedKey: key });
    },
    [submitted, patch, progress?.signedIn]
  );

  const toggleHint = useCallback(
    (questionId: string) => {
      if (!progress?.signedIn) { redirectToLogin(); return; }
      const cur = statesRef.current[questionId] ?? EMPTY;
      const opening = !cur.hintOpen;
      // Penalize the first reveal made while the paper is still open — after
      // submitting, hints are just part of the review and cost nothing.
      const hintUsed = cur.hintUsed || (opening && !submitted);
      patch(questionId, { hintOpen: opening, hintUsed });
    },
    [submitted, patch, progress?.signedIn]
  );

  const submit = useCallback(() => {
    if (!progress?.signedIn) { redirectToLogin(); return; }
    if (submitting || submitted) return;
    setSubmitting(true);
    setError(null);
    const answers = questionIds
      .map((id) => ({ id, st: statesRef.current[id] ?? EMPTY }))
      .filter((x) => x.st.selectedKey !== null)
      .map((x) => ({
        questionId: x.id,
        selectedKey: x.st.selectedKey as string,
        hintUsed: x.st.hintUsed,
      }));
    void (async () => {
      try {
        const res = await fetch("/api/screening/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ topicId, answers }),
        });
        if (!res.ok) throw new Error("submit failed");
        const data = (await res.json()) as {
          score: number;
          total: number;
          review: Array<
            AptReviewEntry & { questionId: string; selectedKey: string | null }
          >;
        };
        const reviewMap: Record<string, AptReviewEntry> = {};
        for (const r of data.review) {
          if (r.selectedKey === null) continue; // only answered questions get a row
          reviewMap[r.questionId] = {
            selectedKey: r.selectedKey,
            isCorrect: r.isCorrect,
            awarded: r.awarded,
            hintUsed: r.hintUsed,
            answerKey: r.answerKey,
            explanation: r.explanation ?? null,
          };
        }
        progress?.applySubmission(
          topicId,
          { score: data.score, total: data.total },
          reviewMap,
          questionIds
        );
        setResult({ score: data.score, total: data.total });
        setSubmitted(true);
        // Submitting a test can extend the streak (today became active) — refresh
        // the navbar flame in place from the authoritative value, no reload.
        void refreshStreakBadge();
      } catch {
        setError("Couldn't submit the test. Please try again.");
      } finally {
        setSubmitting(false);
      }
    })();
  }, [submitting, submitted, questionIds, topicId, progress]);

  // Start a fresh attempt — clears local answers and re-opens the test. The
  // stored mark stays until the next submit replaces it.
  const retake = useCallback(() => {
    setStates({});
    setSubmitted(false);
    setResult(null);
    setError(null);
  }, []);

  const answeredCount = useMemo(
    () => questionIds.reduce((n, id) => n + (states[id]?.selectedKey ? 1 : 0), 0),
    [questionIds, states]
  );

  const value = useMemo<AttemptValue>(
    () => ({
      topicId,
      total: questionIds.length,
      answeredCount,
      submitted,
      result,
      submitting,
      error,
      getState,
      select,
      toggleHint,
      submit,
      retake,
    }),
    [topicId, questionIds.length, answeredCount, submitted, result, submitting, error, getState, select, toggleHint, submit, retake]
  );

  return <AttemptContext.Provider value={value}>{children}</AttemptContext.Provider>;
}

export function usePaperAttempt() {
  const ctx = useContext(AttemptContext);
  if (!ctx) throw new Error("usePaperAttempt must be used within PaperAttemptProvider");
  return ctx;
}
