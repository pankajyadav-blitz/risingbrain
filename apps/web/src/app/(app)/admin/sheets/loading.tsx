import { ManagerSkeleton } from "../_components/skeletons";

/** Instant skeleton for the Sheets editor while the DSA tree is fetched. */
export default function AdminSheetsLoading() {
  return <ManagerSkeleton sidebarTitle="Sheets" />;
}
