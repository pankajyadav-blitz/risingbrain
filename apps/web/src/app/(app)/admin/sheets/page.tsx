import { getAdminDsaTree, getAllCompanies } from "./_data";
import { DsaManager } from "./_components/dsa-manager";

/**
 * Sheets (DSA) admin editor. Server-fetches the full tree + company catalog and
 * hands them to the client manager. `router.refresh()` after each write re-runs
 * this server component, so the tree the client sees always reflects the DB.
 */
export default async function AdminSheetsPage() {
  const [tree, companies] = await Promise.all([getAdminDsaTree(), getAllCompanies()]);
  return <DsaManager tree={tree} companies={companies} />;
}
