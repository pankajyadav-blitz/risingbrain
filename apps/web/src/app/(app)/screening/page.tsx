import { redirect } from "next/navigation";
import { getFirstTopicSlug } from "../_quiz/data";
import { SCREENING_ROUTE } from "../_quiz/routes";

/**
 * `/screening` index. There's no "all topics" view — the workspace is always
 * focused on one topic — so redirect to the first topic's paper. The shell
 * (navbar, header, `@nav` index) lives in `layout.tsx` and is shared.
 */
export default async function ScreeningIndexPage() {
  const firstTopicSlug = await getFirstTopicSlug(SCREENING_ROUTE.kinds);
  if (firstTopicSlug) redirect(`/screening/${firstTopicSlug}`);

  return (
    <p className="py-12 text-center text-sm text-muted">
      No {SCREENING_ROUTE.emptyLabel} published yet.
    </p>
  );
}
