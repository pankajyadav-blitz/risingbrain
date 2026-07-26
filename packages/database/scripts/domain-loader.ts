/**
 * Shared loader for the Domain section, used by both the full seed
 * (prisma/seed.ts) and the standalone `db:seed-domain` (scripts/seed-domain.ts)
 * so the two can never drift.
 *
 * Data sources:
 *   - seed/domain.json          — topics + markdown notes (PDF-extracted; see
 *                                 scripts/extract-oops.ts)
 *   - seed/domain-examples.json — authored, copy-ready code per topic slug
 *
 * Clears `domain_topics` and reloads it; safe to run repeatedly.
 */
import type { PrismaClient, DomainSubject } from "../generated/prisma/client";
import oopsData from "../seed/domain-oops.json";
import dbmsData from "../seed/domain-dbms.json";
import osData from "../seed/domain-os.json";
import cnData from "../seed/domain-cn.json";
import exampleData from "../seed/domain-examples.json";

// One entry per subject file. Add a subject by extracting its seed JSON and
// listing it here — the loader, index and UI are all data-driven from this.
// (OS / CN come from the "*WithDiagram.pdf" sources via scripts/extract-os.ts
// and scripts/extract-cn.ts.)
const SUBJECT_FILES = [oopsData, dbmsData, osData, cnData];

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

export async function seedDomain(
  prisma: PrismaClient
): Promise<{ topics: number; withExample: number }> {
  const topics = SUBJECT_FILES.flat() as DomainTopicJson[];

  // Warm the connection (cold-start safe) before mutating.
  await withRetry(() => prisma.domainTopic.count(), "warm-up");
  await withRetry(() => prisma.domainTopic.deleteMany(), "clear domain_topics");

  let withExample = 0;
  const data = topics.map((t) => {
    const example = exampleFor(t.slug);
    if (example) withExample += 1;
    return {
      subject: t.subject as DomainSubject,
      slug: t.slug,
      title: t.title,
      groupLabel: t.groupLabel,
      groupOrder: t.groupOrder ?? t.phase ?? 0,
      summary: t.summary ?? null,
      notes: t.notes,
      example,
      order: t.order,
    };
  });

  // Insert in small batches so a single dropped connection retries cheaply.
  for (let i = 0; i < data.length; i += 10) {
    const batch = data.slice(i, i + 10);
    await withRetry(() => prisma.domainTopic.createMany({ data: batch }), `insert batch @${i}`);
  }
  return { topics: topics.length, withExample };
}
