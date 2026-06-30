import { redirect } from "next/navigation";
import { getFirstTopicId } from "./_data";

/**
 * `/aptitude` index. There's no "all topics" view — the workspace is always
 * focused on one topic — so redirect to the first topic's paper. The shell
 * (navbar, header, `@nav` index) lives in `layout.tsx` and is shared.
 */
export default async function AptitudeIndexPage() {
  const firstTopicId = await getFirstTopicId();
  if (firstTopicId) redirect(`/aptitude/${firstTopicId}`);

  return (
    <p className="py-12 text-center text-sm text-muted">No quizzes published yet.</p>
  );
}
