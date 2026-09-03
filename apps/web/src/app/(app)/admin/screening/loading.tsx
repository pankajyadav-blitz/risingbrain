import { ManagerSkeleton } from "../_components/skeletons";

/** Instant skeleton for the Screening editor while the quiz tree is fetched. */
export default function AdminScreeningLoading() {
  return <ManagerSkeleton sidebarTitle="Categories" />;
}
