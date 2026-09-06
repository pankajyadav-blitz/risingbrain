import { notFound } from "next/navigation";
import { getDomainTopic } from "../../_data";
import { SUBJECT_BY_SLUG } from "../../_categories";
import { TopicView } from "../../_components/topic-view";

/**
 * One topic's content, addressed by `<subject>/<slug>`. This segment is fetched
 * lazily — only when a topic is navigated to (warmed on hover by the nav's
 * prefetch). It loads ONLY this topic's notes + practice questions, never the
 * whole subject. Reads no cookies → fully prefetchable (the learner's marks come
 * from the layout-seeded provider).
 */
export default async function DomainTopicPage({
  params,
}: {
  params: Promise<{ subject: string; slug: string }>;
}) {
  const { subject: subjectSlug, slug } = await params;

  const subject = SUBJECT_BY_SLUG[subjectSlug];
  if (!subject) notFound();

  const topic = await getDomainTopic(subject, slug);
  if (!topic) notFound();

  return <TopicView topic={topic} />;
}
