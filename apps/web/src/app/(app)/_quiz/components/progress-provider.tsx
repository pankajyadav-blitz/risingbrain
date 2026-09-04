"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { AptReviewEntry } from "../data";

/**
 * Live aptitude GRADED state shared across the parallel `@nav` slot and the topic
 * paper. Seeded once from the server (the layout never re-renders on topic
 * navigation), then updated when a test is submitted — so the nav score counters
 * AND the per-question review stay correct without the cookie-free `[topicId]`
 * paper having to read the session.
 *
 * Holds the stored mark per submitted topic + the per-question review (answer
 * key, outcome, explanation). Both are populated ONLY after a test is submitted.
 */
export type TopicScore = { score: number; total: number };

type ProgressValue = {
  signedIn: boolean;
  /** The stored mark for a topic, or undefined if never submitted. */
  getTopicScore: (topicId: string) => TopicScore | undefined;
  /** The graded review for a question, or undefined if its test isn't submitted. */
  getReview: (questionId: string) => AptReviewEntry | undefined;
  /**
   * Called after a successful submit to update the score + review live.
   *
   * `questionIds` is every question in the topic, not just the graded ones: a
   * re-attempt that answers FEWER questions than the last one must clear the
   * verdicts it no longer covers. Merging alone left them behind, so a learner who
   * answered Q1+Q2, retook, then answered only Q1 saw Q2 still wearing its old
   * green/red badge next to a score bar reading 1/2 — until a reload, which reads
   * the seed and filters on `isActive`, silently "fixed" it.
   */
  applySubmission: (
    topicId: string,
    score: TopicScore,
    reviews: Record<string, AptReviewEntry>,
    questionIds: string[]
  ) => void;
};

const ProgressContext = createContext<ProgressValue | null>(null);

export function ProgressProvider({
  signedIn,
  initialReviewByQuestion,
  initialSubmittedTopics,
  children,
}: {
  signedIn: boolean;
  initialReviewByQuestion: Record<string, AptReviewEntry>;
  initialSubmittedTopics: Record<string, TopicScore>;
  children: React.ReactNode;
}) {
  const [reviews, setReviews] = useState<Record<string, AptReviewEntry>>(
    () => ({ ...initialReviewByQuestion })
  );
  const [scores, setScores] = useState<Record<string, TopicScore>>(
    () => ({ ...initialSubmittedTopics })
  );

  const applySubmission = useCallback(
    (
      topicId: string,
      score: TopicScore,
      reviewEntries: Record<string, AptReviewEntry>,
      questionIds: string[]
    ) => {
      setScores((prev) => ({ ...prev, [topicId]: score }));
      setReviews((prev) => {
        // Drop this topic's whole slice before re-adding, so questions left
        // unanswered on a re-attempt lose their stale verdict instead of
        // surviving the merge. Other topics are untouched.
        const next = { ...prev };
        for (const id of questionIds) delete next[id];
        return { ...next, ...reviewEntries };
      });
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

export function useProgress() {
  return useContext(ProgressContext);
}
