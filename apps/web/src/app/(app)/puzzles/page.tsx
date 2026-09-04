import { redirect } from "next/navigation";
import { getFirstTopicId } from "../_quiz/data";
import { PUZZLES_ROUTE } from "../_quiz/routes";

/**
 * `/puzzles` index. There's no "all topics" view — the workspace is always
 * focused on one topic — so redirect to the first topic's paper. The shell
 * (navbar, header, `@nav` index) lives in `layout.tsx` and is shared.
 */
export default async function PuzzlesIndexPage() {
  const firstTopicId = await getFirstTopicId(PUZZLES_ROUTE.kinds);
  if (firstTopicId) redirect(`/puzzles/${firstTopicId}`);

  return (
    <p className="py-12 text-center text-sm text-muted">
      No {PUZZLES_ROUTE.emptyLabel} published yet.
    </p>
  );
}
