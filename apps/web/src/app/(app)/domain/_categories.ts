import { Boxes, Cpu, Database, Network, Shapes, type LucideIcon } from "lucide-react";
import type { DomainSubject } from "@risingbrain/database/enums";

/**
 * Presentation metadata for the Domain subjects (label / icon / blurb) — the
 * discriminating `DomainSubject` enum lives in the DB, this only decorates it.
 *
 * The set of subjects actually shown is DATA-DRIVEN: `getDomainIndex()` returns
 * only the subjects that have published topics, in this display order, so seeding
 * a new subject makes its tab appear (and with one subject the tab bar collapses
 * to a plain header). No `available` flag / placeholder tabs — if it's not in the
 * DB, it isn't rendered.
 */
export type DomainSubjectMeta = {
  subject: DomainSubject;
  /** URL segment for this subject — `/domain/<slug>/<topicSlug>`. */
  slug: string;
  /** Tab / header label. */
  label: string;
  /** One-line pitch shown under the subject header. */
  blurb: string;
  icon: LucideIcon;
};

export const SUBJECT_META: Record<DomainSubject, DomainSubjectMeta> = {
  OOPS: {
    subject: "OOPS",
    slug: "oops",
    label: "OOP",
    blurb: "The four pillars, SOLID, and design questions that separate juniors from seniors.",
    icon: Shapes,
  },
  SQL: {
    subject: "SQL",
    slug: "sql",
    label: "SQL",
    blurb: "Query patterns and the joins, windows and aggregates interviewers reach for.",
    icon: Database,
  },
  DBMS: {
    subject: "DBMS",
    slug: "dbms",
    label: "DBMS",
    blurb: "Transactions, normalization, indexing and concurrency — the DB internals interviewers probe.",
    icon: Boxes,
  },
  OS: {
    subject: "OS",
    slug: "os",
    label: "Operating Systems",
    blurb: "Processes, scheduling, memory, deadlocks and synchronization, explained for interviews.",
    icon: Cpu,
  },
  CN: {
    subject: "CN",
    slug: "cn",
    label: "Computer Networks",
    blurb: "The OSI/TCP-IP stack, routing, and the protocols that come up in every SDE screen.",
    icon: Network,
  },
};

/** Display order for subjects that have content. */
export const SUBJECT_ORDER: DomainSubject[] = ["OOPS", "SQL", "DBMS", "OS", "CN"];

/**
 * URL segment → subject. The route is `/domain/[subject]/[slug]`, so the subject
 * arrives as text and has to be validated back into the enum before it can be
 * queried; an unknown segment is simply not a subject.
 */
export const SUBJECT_BY_SLUG: Record<string, DomainSubject> = Object.fromEntries(
  Object.values(SUBJECT_META).map((m) => [m.slug, m.subject])
);

/**
 * Canonical href for a topic.
 *
 * The subject segment is what makes this work: `DomainTopic.slug` is unique only
 * WITHIN a subject (both SQL and DBMS publish a "views" topic), so the pair is the
 * address — and it is exactly the `@@unique([subject, slug])` the table already
 * enforces.
 */
export function domainTopicHref(subject: DomainSubject, topicSlug: string): string {
  return `/domain/${SUBJECT_META[subject].slug}/${topicSlug}`;
}
