import { PaperSkeleton } from "../../_quiz/components/workspace-skeleton";

/**
 * Instant skeleton shown while a topic's paper streams in (the lazy fetch). It's
 * the Suspense fallback for ONLY the `children` (paper) slot — the shell
 * (navbar, header) and the `@nav` index stay put, so just this pane swaps.
 * Shares <PaperSkeleton> with the workspace fallback so they never drift.
 */
export default function PuzzlesTopicLoading() {
  return <PaperSkeleton />;
}
