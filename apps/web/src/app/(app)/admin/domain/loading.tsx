import { ManagerSkeleton } from "../_components/skeletons";

/** Instant skeleton for the Domain editor while the topic list is fetched. */
export default function AdminDomainLoading() {
  return <ManagerSkeleton sidebarTitle="Topics" />;
}
