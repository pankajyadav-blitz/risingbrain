import { notFound, permanentRedirect, redirect } from "next/navigation";
import { SUBJECT_BY_SLUG, domainTopicHref } from "../_categories";
import { getFirstTopicOfSubject, getTopicLocationById } from "../_data";

/**
 * `/domain/<subject>` — two jobs, because a single segment under /domain is
 * ambiguous now that topics live at `<subject>/<slug>`:
 *
 *  1. A real subject ("sql") opens that subject's first topic, so the subject is
 *     a linkable entry point rather than a dead URL.
 *  2. Anything else is tried as a LEGACY topic id. Topic URLs used to be
 *     `/domain/<cuid>`; those links redirect to the nested address instead of
 *     404ing.
 */
export default async function DomainSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject: segment } = await params;

  const subject = SUBJECT_BY_SLUG[segment];
  if (subject) {
    const first = await getFirstTopicOfSubject(subject);
    if (first) redirect(domainTopicHref(subject, first));
    notFound();
  }

  const legacy = await getTopicLocationById(segment);
  if (legacy) permanentRedirect(domainTopicHref(legacy.subject, legacy.slug));

  notFound();
}
