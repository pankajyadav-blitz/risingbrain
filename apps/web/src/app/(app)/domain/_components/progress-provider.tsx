"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { DomainReviewEntry } from "../_data";

/**
 * Live Domain GRADED state shared across the parallel `@nav` slot and the topic
 * view. Seeded once from the server (the layout never re-renders on topic
 * navigation), then updated when a practice set is submitted — so the nav score
 * counters AND the per-question review stay correct without the cookie-free
 * `[topicId]` route having to read the session.
 *
 * The Screening twin (`screening/_components/progress-provider.tsx`) holds the
 * same shape over the aptitude tables; the two are deliberately not shared, as a
 * learner's aptitude marks are not their domain marks.
 */
export type TopicScore = { score: number; total: number };

type ProgressValue = {
  signedIn: boolean;
  /** The stored mark for a topic, or undefined if never submitted. */
  getTopicScore: (topicId: string) => TopicScore | undefined;
  /** The graded review for a question, or undefined if its set isn't submitted. */
  getReview: (questionId: string) => DomainReviewEntry | undefined;
  /** Called after a successful submit to update the score + review live. */
  applySubmission: (
    topicId: string,
    score: TopicScore,
    reviews: Record<string, DomainReviewEntry>
  ) => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function DomainProgressProvider({
  signedIn,
  initialReviewByQuestion,
  initialSubmittedTopics,
  children,
}: {
  signedIn: boolean;
  initialReviewByQuestion: Record<string, DomainReviewEntry>;
  initialSubmittedTopics: Record<string, TopicScore>;
  children: React.ReactNode;
}) {
  const [reviews, setReviews] = useState<Record<string, DomainReviewEntry>>(() => ({
    ...initialReviewByQuestion,
  }));
  const [scores, setScores] = useState<Record<string, TopicScore>>(() => ({
    ...initialSubmittedTopics,
  }));

  const applySubmission = useCallback(
    (topicId: string, score: TopicScore, reviewEntries: Record<string, DomainReviewEntry>) => {
      setScores((prev) => ({ ...prev, [topicId]: score }));
      setReviews((prev) => ({ ...prev, ...reviewEntries }));
    },
    []
  );

  const getTopicScore = useCallback((topicId: string) => scores[topicId], [scores]);
  const getReview = useCallback((questionId: string) => reviews[questionId], [reviews]);

  const value = useMemo(
    () => ({ signedIn, getTopicScore, getReview, applySubmission }),
    [signedIn, getTopicScore, getReview, applySubmission]
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useDomainProgress() {
  return useContext(ProgressContext);
}
