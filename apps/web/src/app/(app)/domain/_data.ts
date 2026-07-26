import { cacheLife, cacheTag } from "next/cache";
import type { DomainSubject } from "@risingbrain/database/enums";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { SUBJECT_META, SUBJECT_ORDER } from "./_categories";

/**
 * Loaders for the Domain workspace (core-CS subjects: OOPS / SQL / DBMS / OS / CN).
 *
 * Split like Screening so we never ship every topic's body up front:
 *  - `getDomainIndex` — light: the subjects that have published topics, each with
 *    its nav groups (title + slug + summary only). Feeds the tabs, `@nav` slot and
 *    mobile picker. DATA-DRIVEN — a subject appears only once it has content.
 *  - `getDomainTopic` — heavy: ONE topic's notes + example markdown, fetched
 *    per-route when navigated to (lazy).
 *
 * Both are SHARED, seeded, cookie-free content (identical for everyone, changes
 * only on a re-seed), so — like the DSA/quiz catalogs — they use `"use cache"`
 * with the `domainCatalog` tag for cross-request caching + on-demand revalidation
 * (see /api/admin/revalidate). There is no per-user state here to merge.
 */

export type DomainNavTopic = { id: string; slug: string; title: string; summary: string | null };
export type DomainNavGroup = { label: string; order: number; topics: DomainNavTopic[] };
export type DomainSubjectIndex = {
  subject: DomainSubject;
  label: string;
  blurb: string;
  groups: DomainNavGroup[];
  total: number;
};

/** Light index — the populated subjects and their grouped topic names. Cached. */
export async function getDomainIndex(): Promise<{ subjects: DomainSubjectIndex[]; total: number }> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.domainCatalog);

  const rows = await prisma.domainTopic.findMany({
    where: { isPublished: true },
    orderBy: [{ subject: "asc" }, { groupOrder: "asc" }, { order: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      summary: true,
      subject: true,
      groupLabel: true,
      groupOrder: true,
    },
  });

  // Bucket rows → subject → group, preserving DB order.
  const bySubject = new Map<DomainSubject, Map<string, DomainNavGroup>>();
  for (const r of rows) {
    let groups = bySubject.get(r.subject);
    if (!groups) {
      groups = new Map();
      bySubject.set(r.subject, groups);
    }
    let group = groups.get(r.groupLabel);
    if (!group) {
      group = { label: r.groupLabel, order: r.groupOrder, topics: [] };
      groups.set(r.groupLabel, group);
    }
    group.topics.push({ id: r.id, slug: r.slug, title: r.title, summary: r.summary });
  }

  // Emit in the configured display order; only subjects that actually have topics.
  const subjects: DomainSubjectIndex[] = [];
  for (const subject of SUBJECT_ORDER) {
    const groups = bySubject.get(subject);
    if (!groups || groups.size === 0) continue;
    const meta = SUBJECT_META[subject];
    const groupList = [...groups.values()].sort((a, b) => a.order - b.order);
    subjects.push({
      subject,
      label: meta.label,
      blurb: meta.blurb,
      groups: groupList,
      total: groupList.reduce((s, g) => s + g.topics.length, 0),
    });
  }

  return { subjects, total: subjects.reduce((s, x) => s + x.total, 0) };
}

/** First topic id in display order — `/domain` redirects here so it's never empty. */
export async function getFirstTopicId(): Promise<string | null> {
  const { subjects } = await getDomainIndex();
  for (const s of subjects) {
    for (const g of s.groups) {
      if (g.topics[0]) return g.topics[0].id;
    }
  }
  return null;
}

export type DomainTopicDetail = {
  id: string;
  slug: string;
  title: string;
  subject: DomainSubject;
  subjectLabel: string;
  groupLabel: string;
  summary: string | null;
  notes: string;
  example: string | null;
};

/**
 * Per-topic loader — only this topic's notes + example ship. Reads no cookies, so
 * the `[topicId]` segment is statically prefetchable: hovering a nav item warms
 * and caches the content, making the click feel instant.
 */
export async function getDomainTopic(id: string): Promise<DomainTopicDetail | null> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.domainCatalog);

  const t = await prisma.domainTopic.findFirst({
    where: { id, isPublished: true },
    select: {
      id: true,
      slug: true,
      title: true,
      subject: true,
      groupLabel: true,
      summary: true,
      notes: true,
      example: true,
    },
  });
  if (!t) return null;

  return {
    id: t.id,
    slug: t.slug,
    title: t.title,
    subject: t.subject,
    subjectLabel: SUBJECT_META[t.subject].label,
    groupLabel: t.groupLabel,
    summary: t.summary,
    notes: t.notes,
    example: t.example,
  };
}
