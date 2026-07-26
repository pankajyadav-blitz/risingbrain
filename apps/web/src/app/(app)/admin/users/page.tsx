import { getCurrentUser } from "@/lib/auth/current-user";
import { UsersManager } from "./_components/users-manager";

/**
 * User management — search-only (by email); we never list the whole table. The
 * current admin's id is passed down so the UI can disable self-actions (the API
 * blocks them too).
 */
export default async function AdminUsersPage() {
  const me = await getCurrentUser();
  return <UsersManager currentUserId={me?.id ?? ""} />;
}
