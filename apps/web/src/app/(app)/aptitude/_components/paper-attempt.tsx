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
 * whole paper at once. Answering a question calls `/api/aptitude/check` for the
 * green/red color (boolean only — the correct option is never revealed mid-test);
 * opening a hint BEFORE answering forfeits that question's mark.
 *
 * A topic that the learner already submitted (per the global progress seed)
 * starts in review mode. After a fresh submit we flip to review mode and push
 * the graded result into the global provider (live nav score + review on revisit).
 */
export type QState = {
  selectedKey: string | null;
  correct: boolean | null;
  hintUsed: boolean; // opened a hint before answering → no mark
  hintOpen: boolean; // hint is currently revealed
  locked: boolean; // answered (one shot)
  checking: boolean; // /check in flight
};

const EMPTY: QState = {
  selectedKey: null,
  correct: null,
  hintUsed: false,
  hintOpen: false,
  locked: false,
  checking: false,
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

  const select = useCallback(
    (questionId: string, key: string) => {
      if (!progress?.signedIn) { redirectToLogin(); return; }
      const cur = statesRef.current[questionId] ?? EMPTY;
      if (submitted || cur.locked || cur.checking) return;
      patch(questionId, { selectedKey: key, checking: true });
      void (async () => {
        try {
          const res = await fetch("/api/aptitude/check", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionId, selectedKey: key }),
          });
          if (!res.ok) throw new Error("check failed");
          const data = (await res.json()) as { correct: boolean };
          patch(questionId, { correct: data.correct, locked: true, checking: false });
        } catch {
          // Roll back the selection so the learner can retry.
          patch(questionId, { selectedKey: null, checking: false });
          setError("Couldn't check that answer. Try again.");
        }
      })();
    },
    [submitted, patch, progress?.signedIn]
  );

  const toggleHint = useCallback(
    (questionId: string) => {
      if (!progress?.signedIn) { redirectToLogin(); return; }
      const cur = statesRef.current[questionId] ?? EMPTY;
      const opening = !cur.hintOpen;
      // Penalize only if revealing a hint before the question is answered.
      const hintUsed = cur.hintUsed || (opening && !cur.locked && !submitted);
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
        const res = await fetch("/api/aptitude/submit", {
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
        progress?.applySubmission(topicId, { score: data.score, total: data.total }, reviewMap);
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
