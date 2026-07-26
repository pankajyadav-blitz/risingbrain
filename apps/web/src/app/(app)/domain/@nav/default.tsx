import { getDomainIndex } from "../_data";
import { NavList } from "../_components/nav-list";

/**
 * The left index, rendered into the `@nav` parallel slot. `default.tsx` covers
 * every `/domain/*` URL (the slot has no `[topicId]` of its own), so the index
 * stays mounted while only the content changes. The query is the shared, cached
 * `getDomainIndex()`.
 */
export default async function DomainNavSlot() {
  const { subjects } = await getDomainIndex();
  return <NavList subjects={subjects} />;
}
