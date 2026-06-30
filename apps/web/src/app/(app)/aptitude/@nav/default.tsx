import { getAptitudeIndex } from "../_data";
import { NavList } from "../_components/nav-list";

/**
 * The left index, rendered into the `@nav` parallel slot. `default.tsx` covers
 * every `/aptitude/*` URL (the slot has no `[topicId]` of its own), so the index
 * stays mounted while only the paper changes. The query is shared with the
 * layout via React `cache()`.
 */
export default async function AptitudeNavSlot() {
  const { categories } = await getAptitudeIndex();
  return <NavList categories={categories} />;
}
