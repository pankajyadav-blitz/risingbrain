import { redirect } from "next/navigation";
import { getFirstTopic } from "./_data";
import { domainTopicHref } from "./_categories";

/**
 * `/domain` index. There's no "all topics" view — the workspace is always focused
 * on one topic — so redirect to the first topic. The shell (navbar, subject tabs,
 * search, `@nav` index) lives in `layout.tsx` and is shared.
 */
export default async function DomainIndexPage() {
  const first = await getFirstTopic();
  if (first) redirect(domainTopicHref(first.subject, first.slug));

  return <p className="py-12 text-center text-sm text-muted">No domain topics published yet.</p>;
}
