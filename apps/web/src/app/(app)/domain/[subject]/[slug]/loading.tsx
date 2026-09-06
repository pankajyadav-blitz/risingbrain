import { TopicSkeleton } from "../../_components/workspace-skeleton";

/**
 * Instant skeleton shown while a topic's content streams in (the lazy fetch). It's
 * the Suspense fallback for ONLY the `children` (content) slot — the shell (navbar,
 * tabs, search) and the `@nav` index stay put, so just this pane swaps. Shares
 * <TopicSkeleton> with the workspace fallback so they never drift.
 */
export default function DomainTopicLoading() {
  return <TopicSkeleton />;
}
