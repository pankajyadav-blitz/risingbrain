/**
 * Shared loader for the Domain section, used by the full seed (prisma/seed.ts), the
 * standalone `db:seed-domain` (scripts/seed-domain.ts) and the per-subject
 * `db:seed-domain-sql` (scripts/seed-domain-sql.ts) so they can never drift.
 *
 * Data sources:
 *   - seed/domain-*.json        — topics + markdown notes per subject
 *   - seed/domain-examples.json — authored, copy-ready code per topic slug
 *
 * Clears `domain_topics` and reloads it; safe to run repeatedly. `seedDomainSubject()`
 * narrows that to a single subject.
 */
import type { PrismaClient, DomainSubject } from "../generated/prisma/client";
import oopsData from "../seed/domain-oops.json";
import dbmsData from "../seed/domain-dbms.json";
import osData from "../seed/domain-os.json";
import cnData from "../seed/domain-cn.json";
import sqlData from "../seed/domain-sql.json";
import exampleData from "../seed/domain-examples.json";

// One entry per subject file. Add a subject by dropping its seed JSON in and
// listing it here — the loader, index and UI are all data-driven from this.
const SUBJECT_FILES = [oopsData, dbmsData, osData, cnData, sqlData];

type DomainTopicJson = {
  subject: string;
  groupLabel: string;
  phase?: number;
  groupOrder?: number;
  order: number;
  slug: string;
  title: string;
  summary?: string;
  notes: string;
  /**
   * Inline copy-ready code. Subjects whose example ships with the extracted content
   * (SQL) carry it here; the authored-Java subjects keep theirs in
   * seed/domain-examples.json, keyed by slug.
   */
  example?: string | null;
  /** Figure count, informational — the figure paths live inline in `notes`. */
  figures?: number;
};

const examples = exampleData as Record<string, string>;

/** Find the authored example for a topic slug, tolerating the "&"→"and" slug form. */
function exampleFor(slug: string): string | null {
  return examples[slug] ?? examples[slug.replace(/-and-/g, "-")] ?? null;
}

/**
 * Retry a DB op through transient connection drops. Hosted Postgres (Neon) auto-
 * suspends its compute when idle, so the first few ops after a pause can fail
 * with ETIMEDOUT / "Connection terminated" while it cold-starts.
 */
async function withRetry<T>(fn: () => Promise<T>, label: string, tries = 6): Promise<T> {
  let lastErr: unknown;
  for (let i = 1; i <= tries; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      if (i < tries) await new Promise((r) => setTimeout(r, 3000));
    }
  }
  throw new Error(`${label} failed after ${tries} attempts: ${String(lastErr)}`);
}

/** Map one seed-JSON topic onto a `domain_topics` row. */
function toRow(t: DomainTopicJson) {
  return {
    subject: t.subject as DomainSubject,
    slug: t.slug,
    title: t.title,
    groupLabel: t.groupLabel,
    groupOrder: t.groupOrder ?? t.phase ?? 0,
    summary: t.summary ?? null,
    notes: t.notes,
    // An inline example wins; otherwise fall back to the authored examples file.
    example: t.example ?? exampleFor(t.slug),
    order: t.order,
  };
}

/** Insert in small batches so a single dropped connection retries cheaply. */
async function insertRows(prisma: PrismaClient, data: ReturnType<typeof toRow>[]) {
  for (let i = 0; i < data.length; i += 10) {
    const batch = data.slice(i, i + 10);
    await withRetry(() => prisma.domainTopic.createMany({ data: batch }), `insert batch @${i}`);
  }
}

export async function seedDomain(
  prisma: PrismaClient
): Promise<{ topics: number; withExample: number }> {
  const topics = SUBJECT_FILES.flat() as DomainTopicJson[];

  // Warm the connection (cold-start safe) before mutating.
  await withRetry(() => prisma.domainTopic.count(), "warm-up");
  await withRetry(() => prisma.domainTopic.deleteMany(), "clear domain_topics");

  const data = topics.map(toRow);
  await insertRows(prisma, data);
  return { topics: topics.length, withExample: data.filter((d) => d.example).length };
}

/**
 * Reseed ONE subject in place — clears only that subject's rows and reloads them,
 * leaving the other subjects (and every other table) untouched. Backs
 * `db:seed-domain-sql`, so re-extracting one PDF doesn't disturb the rest.
 */
export async function seedDomainSubject(
  prisma: PrismaClient,
  subject: DomainSubject
): Promise<{ topics: number; withExample: number }> {
  const topics = (SUBJECT_FILES.flat() as DomainTopicJson[]).filter((t) => t.subject === subject);
  if (topics.length === 0) throw new Error(`No seed topics found for subject ${subject}`);

  await withRetry(() => prisma.domainTopic.count(), "warm-up");
  await withRetry(
    () => prisma.domainTopic.deleteMany({ where: { subject } }),
    `clear domain_topics (${subject})`
  );

  const data = topics.map(toRow);
  await insertRows(prisma, data);
  return { topics: topics.length, withExample: data.filter((d) => d.example).length };
}
