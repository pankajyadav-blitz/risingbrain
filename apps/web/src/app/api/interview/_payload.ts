import "server-only";
import { InterviewVerdict, Difficulty } from "@/lib/db";
import { sanitizeRichText } from "@/lib/sanitize";
import { htmlToMarkdown, containsHtmlMarkup } from "@/lib/html-to-markdown";

/**
 * Validation + normalisation for an interview experience, shared by `POST
 * /api/interview` (publish) and `PATCH /api/interview/[id]` (edit).
 *
 * It lives here rather than being duplicated per route because the two must not
 * drift: an edit that skipped a check the create path applies would be a way to
 * put content into a published row that could never have been published
 * directly. Same rules, one implementation.
 */

const VERDICTS = new Set<string>(Object.values(InterviewVerdict));
const DIFFICULTIES = new Set<string>(Object.values(Difficulty));

const MAX_TAGS = 12;
/** Guards Postgres against a multi-megabyte paste; far above any real write-up. */
const MAX_BODY_CHARS = 200_000;

export interface ExperienceFields {
  company: string;
  role: string;
  verdict: InterviewVerdict;
  difficulty: Difficulty;
  roundsCount: number;
  title: string;
  excerpt: string | null;
  /** Markdown — converted from the editor's HTML. */
  body: string;
  tags: string[];
}

export type ParseResult =
  | { ok: true; data: ExperienceFields }
  | { ok: false; error: string; status: number };

const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

export function parseExperiencePayload(raw: Record<string, unknown>): ParseResult {
  const company = str(raw.company);
  const role = str(raw.role);
  const title = str(raw.title);
  const body = str(raw.body);
  const excerptRaw = str(raw.excerpt);
  const verdict = str(raw.verdict);
  const difficulty = str(raw.difficulty);
  const roundsCount = Number(raw.roundsCount);
  const tags = Array.isArray(raw.tags)
    ? raw.tags
        .map((t) => String(t).trim())
        .filter(Boolean)
        .slice(0, MAX_TAGS)
    : [];

  if (body.length > MAX_BODY_CHARS) {
    return { ok: false, error: "That experience is too long.", status: 413 };
  }

  // The body is HTML from the editor — strip tags to confirm it actually carries
  // text, so an empty "<p></p>" can't pass as a written experience.
  const bodyText = body
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .trim();

  if (!company || !role || !title || !bodyText) {
    return {
      ok: false,
      error: "Company, role, title and body are required.",
      status: 400,
    };
  }
  if (!VERDICTS.has(verdict)) {
    return { ok: false, error: "Invalid verdict.", status: 400 };
  }
  if (!DIFFICULTIES.has(difficulty)) {
    return { ok: false, error: "Invalid difficulty.", status: 400 };
  }
  if (!Number.isInteger(roundsCount) || roundsCount < 1 || roundsCount > 30) {
    return { ok: false, error: "Rounds must be a whole number ≥ 1.", status: 400 };
  }

  // `InterviewExperience.body` is markdown, but the editor produces HTML.
  // Sanitize while it is still HTML — that is where scripts, event handlers and
  // `javascript:` URLs live — then convert, so a user's post is stored in the
  // same format as the seeded ones. A body that already is markdown is stored
  // untouched: the render path never enables raw HTML, and turndown would escape
  // markdown's own syntax (`**bold**` → `\*\*bold\*\*`).
  const markdownBody = containsHtmlMarkup(body)
    ? htmlToMarkdown(sanitizeRichText(body))
    : body;

  return {
    ok: true,
    data: {
      company: company.slice(0, 120),
      role: role.slice(0, 120),
      verdict: verdict as InterviewVerdict,
      difficulty: difficulty as Difficulty,
      roundsCount,
      title: title.slice(0, 180),
      // Derive an excerpt from the body when the author left it blank.
      excerpt:
        excerptRaw.slice(0, 280) || bodyText.replace(/\s+/g, " ").slice(0, 180) || null,
      body: markdownBody,
      tags,
    },
  };
}
