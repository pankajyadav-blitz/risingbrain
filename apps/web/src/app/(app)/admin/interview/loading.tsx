import { QueueSkeleton } from "../_components/skeletons";

/**
 * Instant skeleton for the interview review queue. Four tabs (Pending,
 * Published, Rejected, Archived) so the tab row doesn't reflow when the real
 * counts land.
 */
export default function AdminInterviewLoading() {
  return <QueueSkeleton tabs={4} />;
}
