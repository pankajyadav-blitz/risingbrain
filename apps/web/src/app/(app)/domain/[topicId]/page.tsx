import { notFound } from "next/navigation";
import { getDomainTopic } from "../_data";
import { TopicView } from "../_components/topic-view";

/**
 * One topic's content. This segment is fetched lazily — only when a topic is
 * navigated to (warmed on hover by the nav's prefetch). It loads ONLY this topic's
 * notes + practice questions, never the whole subject. Reads no cookies → fully
 * prefetchable (the learner's marks come from the layout-seeded provider).
 */
export default async function DomainTopicPage({
  params,
}: {
  params: Promise<{ topicId: string }>;
}) {
  const { topicId } = await params;
  const topic = await getDomainTopic(topicId);
  if (!topic) notFound();

  return <TopicView topic={topic} />;
}
