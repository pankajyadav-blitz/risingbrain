/**
 * Shared loader for the Domain section, used by the full seed (prisma/seed.ts), the
 * standalone `db:seed-domain` (scripts/seed-domain.ts) and the per-subject
 * `db:seed-domain-sql` (scripts/seed-domain-sql.ts) so they can never drift.
 *
 * Data sources:
 *   - seed/domain-*.json        — topics + markdown notes per subject
 *   - seed/domain-examples.json — authored, copy-ready code per topic slug
 *   - seed/domain-*-quiz.json   — the practice MCQs, keyed by topic slug
 *
 * The code examples used to live in their own `DomainTopic.example` column behind
 * a second tab; that column is gone, so an authored example is APPENDED to its
 * topic's notes as a final "## Example" section — the content survives, the topic
 * just reads top to bottom now.
 *
 * Clears `domain_topics` and reloads it; safe to run repeatedly. `seedDomainSubject()`
 * narrows that to a single subject. Questions cascade with their topic, so
 * deleting the topics clears the old questions too.
 */
import type { PrismaClient, DomainSubject } from "../generated/prisma/client";
import oopsData from "../seed/domain-oops.json";
import dbmsData from "../seed/domain-dbms.json";
import osData from "../seed/domain-os.json";
import cnData from "../seed/domain-cn.json";
import sqlData from "../seed/domain-sql.json";
import exampleData from "../seed/domain-examples.json";
import dbmsQuiz from "../seed/domain-dbms-quiz.json";

// One entry per subject file. Add a subject by dropping its seed JSON in and
// listing it here — the loader, index and UI are all data-driven from this.
const SUBJECT_FILES = [oopsData, dbmsData, osData, cnData, sqlData];

// Practice questions, one file per subject that has them. A subject without a
// quiz file simply shows its notes with no Practice tab.
const QUIZ_FILES = [dbmsQuiz];

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

type DomainQuestionJson = {
  subject: string;
  /** `DomainTopic.slug` this question belongs to. */
  topicSlug: string;
  order: number;
  prompt: string;
  options: Array<{ key: string; label: string }>;
  answerKey: string;
  explanation?: string | null;
  difficulty?: string | null;
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

/**
 * Map one seed-JSON topic onto a `domain_topics` row, folding its code example
 * into the notes (see the file header — there is no `example` column any more).
 */
function toRow(t: DomainTopicJson) {
  // An inline example wins; otherwise fall back to the authored examples file.
  const example = t.example ?? exampleFor(t.slug);
  const notes = example ? `${t.notes.trimEnd()}\n\n## Example\n\n${example.trim()}\n` : t.notes;
  return {
    subject: t.subject as DomainSubject,
    slug: t.slug,
    title: t.title,
    groupLabel: t.groupLabel,
    groupOrder: t.groupOrder ?? t.phase ?? 0,
    summary: t.summary ?? null,
    notes,
    order: t.order,
  };
}

/** Does this topic ship a code example (inline or authored)? Reporting only. */
function hasExample(t: DomainTopicJson): boolean {
  return Boolean(t.example ?? exampleFor(t.slug));
}

/** Insert in small batches so a single dropped connection retries cheaply. */
async function insertRows(prisma: PrismaClient, data: ReturnType<typeof toRow>[]) {
  for (let i = 0; i < data.length; i += 10) {
    const batch = data.slice(i, i + 10);
    await withRetry(() => prisma.domainTopic.createMany({ data: batch }), `insert batch @${i}`);
  }
}

/**
 * Load the practice questions for the topics just inserted. Resolves each
 * question's `topicSlug` against the rows in the DB, so a question whose topic
 * was renamed or dropped is reported rather than silently lost.
 */
async function insertQuestions(
  prisma: PrismaClient,
  subjects: DomainSubject[]
): Promise<number> {
  const questions = (QUIZ_FILES.flat() as DomainQuestionJson[]).filter((q) =>
    subjects.includes(q.subject as DomainSubject)
  );
  if (questions.length === 0) return 0;

  const topics = await withRetry(
    () =>
      prisma.domainTopic.findMany({
        where: { subject: { in: subjects } },
        select: { id: true, slug: true, subject: true },
      }),
    "load topic ids"
  );
  // Keyed by subject AND slug, matching `DomainTopic`'s `@@unique([subject, slug])`.
  // Slugs are only unique WITHIN a subject — "views" already exists under both SQL
  // and DBMS — so a slug-only map silently kept whichever row came last and
  // attached questions to the wrong subject's topic, without tripping the
  // unknown-slug warning below.
  const topicKey = (subject: string, slug: string) => `${subject}\u0000${slug}`;
  const idByKey = new Map(topics.map((t) => [topicKey(t.subject, t.slug), t.id]));

  const rows = [];
  for (const q of questions) {
    const topicId = idByKey.get(topicKey(q.subject, q.topicSlug));
    if (!topicId) {
      console.warn(
        `⚠️  question for unknown topic "${q.subject}/${q.topicSlug}" — skipped`
      );
      continue;
    }
    rows.push({
      topicId,
      prompt: q.prompt,
      options: q.options,
      answerKey: q.answerKey,
      explanation: q.explanation ?? null,
      difficulty: (q.difficulty ?? null) as never,
      order: q.order,
    });
  }

  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20);
    await withRetry(
      () => prisma.domainQuestion.createMany({ data: batch }),
      `insert questions @${i}`
    );
  }
  return rows.length;
}

export async function seedDomain(
  prisma: PrismaClient
): Promise<{ topics: number; withExample: number; questions: number }> {
  const topics = SUBJECT_FILES.flat() as DomainTopicJson[];

  // Warm the connection (cold-start safe) before mutating.
  await withRetry(() => prisma.domainTopic.count(), "warm-up");
  await withRetry(() => prisma.domainTopic.deleteMany(), "clear domain_topics");

  const data = topics.map(toRow);
  await insertRows(prisma, data);
  const subjects = [...new Set(data.map((d) => d.subject))];
  const questions = await insertQuestions(prisma, subjects);
  return { topics: topics.length, withExample: topics.filter(hasExample).length, questions };
}

/**
 * Reseed ONE subject in place — clears only that subject's rows and reloads them,
 * leaving the other subjects (and every other table) untouched. Backs
 * `db:seed-domain-sql`, so re-extracting one PDF doesn't disturb the rest.
 */
export async function seedDomainSubject(
  prisma: PrismaClient,
  subject: DomainSubject
): Promise<{ topics: number; withExample: number; questions: number }> {
  const topics = (SUBJECT_FILES.flat() as DomainTopicJson[]).filter((t) => t.subject === subject);
  if (topics.length === 0) throw new Error(`No seed topics found for subject ${subject}`);

  await withRetry(() => prisma.domainTopic.count(), "warm-up");
  // Questions cascade with their topic, so this clears the subject's old
  // practice sets as well. A learner's answers cascade too — the questions they
  // referred to no longer exist after a content reseed.
  await withRetry(
    () => prisma.domainTopic.deleteMany({ where: { subject } }),
    `clear domain_topics (${subject})`
  );

  const data = topics.map(toRow);
  await insertRows(prisma, data);
  const questions = await insertQuestions(prisma, [subject]);
  return { topics: topics.length, withExample: topics.filter(hasExample).length, questions };
}
