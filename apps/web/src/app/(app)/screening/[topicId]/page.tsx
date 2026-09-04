import { notFound, redirect } from "next/navigation";
import { getQuizTopic } from "../../_quiz/data";
import { Paper } from "../../_quiz/components/paper";
import { SCREENING_ROUTE, routeForKind } from "../../_quiz/routes";

/**
 * One topic's paper. This segment is fetched lazily — only when a topic is
 * navigated to (warmed on hover by the nav's prefetch). It loads ONLY this
 * topic's questions, never the whole bank.
 */
export default async function ScreeningTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const paper = await getQuizTopic(topicId);
  if (!paper) notFound();

  // A topic id belonging to the sibling route (an old bookmark from before
  // puzzles were split out) renders the right paper under the wrong nav — send
  // it where it lives now instead.
  if (!SCREENING_ROUTE.kinds.includes(paper.kind)) {
    redirect(`${routeForKind(paper.kind).basePath}/${topicId}`);
  }

  return <Paper paper={paper} />;
}
