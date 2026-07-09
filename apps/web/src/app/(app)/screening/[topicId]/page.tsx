import { notFound } from "next/navigation";
import { getAptitudeTopic } from "../_data";
import { Paper } from "../_components/paper";

/**
 * One topic's paper. This segment is fetched lazily — only when a topic is
 * navigated to (warmed on hover by the nav's prefetch). It loads ONLY this
 * topic's questions, never the whole bank.
 */
export default async function AptitudeTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const paper = await getAptitudeTopic(topicId);
  if (!paper) notFound();

  return <Paper paper={paper} />;
}
