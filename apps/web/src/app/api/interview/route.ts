import { NextResponse } from "next/server";
import { prisma, InterviewVerdict, Difficulty } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { checkWriteLimit } from "@/lib/auth/rate-limit";
import { sanitizeRichText } from "@/lib/sanitize";
import { htmlToMarkdown, containsHtmlMarkup } from "@/lib/html-to-markdown";

const VERDICTS = new Set<string>(Object.values(InterviewVerdict));
const DIFFICULTIES = new Set<string>(Object.values(Difficulty));

/**
 * POST /api/interview
 *
 * Publishes a new interview experience authored by the current user. Auth is
 * required; anonymous callers get a 401. Returns the new experience `{ id }`.
 */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  let raw: Record<string, unknown>;
  try {
    raw = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const company = str(raw.company);
  const role = str(raw.role);
  const title = str(raw.title);
  const body = str(raw.body);
  const excerptRaw = str(raw.excerpt);
  const verdict = str(raw.verdict);
  const difficulty = str(raw.difficulty);
  const roundsCount = Number(raw.roundsCount);
  const tags = Array.isArray(raw.tags)
    ? raw.tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 12)
    : [];

  // A body authored in the WYSIWYG editor is HTML — strip tags to confirm it
  // actually carries text (an empty "<br>" must not pass validation).
  const bodyText = body.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").trim();

  if (!company || !role || !title || !bodyText) {
    return NextResponse.json(
      { error: "Company, role, title and body are required." },
      { status: 400 }
    );
  }
  if (!VERDICTS.has(verdict)) {
    return NextResponse.json({ error: "Invalid verdict." }, { status: 400 });
  }
  if (!DIFFICULTIES.has(difficulty)) {
    return NextResponse.json({ error: "Invalid difficulty." }, { status: 400 });
  }
  if (!Number.isInteger(roundsCount) || roundsCount < 1 || roundsCount > 30) {
    return NextResponse.json({ error: "Rounds must be a whole number ≥ 1." }, { status: 400 });
  }

  // `InterviewExperience.body` is markdown, but the composer is a
  // contentEditable surface that submits HTML. Sanitize it while it is still
  // HTML — that is where scripts, event handlers and `javascript:` URLs live —
  // then convert, so a user's post is stored in the same format as the seeded
  // ones. A body that already is markdown is stored untouched: the render path
  // never enables raw HTML, and turndown would escape markdown's own syntax
  // (`**bold**` → `\*\*bold\*\*`).
  const markdownBody = containsHtmlMarkup(body)
    ? htmlToMarkdown(sanitizeRichText(body))
    : body;

  // Derive an excerpt from the body when the author left it blank.
  const excerpt =
    excerptRaw.slice(0, 280) ||
    bodyText.replace(/\s+/g, " ").slice(0, 180) ||
    null;

  const created = await prisma.interviewExperience.create({
    data: {
      authorId: user.id,
      company: company.slice(0, 120),
      role: role.slice(0, 120),
      verdict: verdict as InterviewVerdict,
      difficulty: difficulty as Difficulty,
      roundsCount,
      title: title.slice(0, 180),
      excerpt,
      body: markdownBody,
      tags,
      status: "PUBLISHED",
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id });
}
