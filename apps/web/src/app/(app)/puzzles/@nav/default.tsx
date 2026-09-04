import { getQuizIndex } from "../../_quiz/data";
import { NavList } from "../../_quiz/components/nav-list";
import { PUZZLES_ROUTE } from "../../_quiz/routes";

/**
 * The left index, rendered into the `@nav` parallel slot. `default.tsx` covers
 * every `/puzzles/*` URL (the slot has no `[topicId]` of its own), so the index
 * stays mounted while only the paper changes.
 */
export default async function PuzzlesNavSlot() {
  const { categories } = await getQuizIndex(PUZZLES_ROUTE.kinds);
  return <NavList categories={categories} basePath={PUZZLES_ROUTE.basePath} />;
}
