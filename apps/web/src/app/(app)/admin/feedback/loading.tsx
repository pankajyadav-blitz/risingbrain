import { QueueSkeleton } from "../_components/skeletons";

/** Instant skeleton for the feedback inbox — two tabs (Unread, Read). */
export default function AdminFeedbackLoading() {
  return <QueueSkeleton tabs={2} />;
}
