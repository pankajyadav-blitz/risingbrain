import { getQuizIndex } from "../../_quiz/data";
import { NavList } from "../../_quiz/components/nav-list";
import { SCREENING_ROUTE } from "../../_quiz/routes";

/**
 * The left index, rendered into the `@nav` parallel slot. `default.tsx` covers
 * every `/screening/*` URL (the slot has no `[topicId]` of its own), so the index
 * stays mounted while only the paper changes.
 */
export default async function ScreeningNavSlot() {
  const { categories } = await getQuizIndex(SCREENING_ROUTE.kinds);
  return <NavList categories={categories} basePath={SCREENING_ROUTE.basePath} />;
}
