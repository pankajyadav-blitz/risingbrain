import { getAdminDomainTopics } from "./_data";
import { DomainManager } from "./_components/domain-manager";

/** Domain admin editor — server-fetch all topics, edit on the client. */
export default async function AdminDomainPage() {
  const topics = await getAdminDomainTopics();
  return <DomainManager topics={topics} />;
}
