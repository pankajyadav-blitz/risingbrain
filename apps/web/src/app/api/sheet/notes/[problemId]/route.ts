import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { sanitizeRichText } from "@/lib/sanitize";
import { checkWriteLimit, isUnknownReference } from "../../_guards";

// A note is rich-text HTML. Cap it well above any realistic note while blocking
// multi-MB payloads that would bloat Postgres. Bytes guard the request body
// before it's buffered; chars guard the parsed content (header can be absent).
const MAX_NOTE_BYTES = 200_000;
const MAX_NOTE_CHARS = 50_000;

/**
 * GET  /api/sheet/notes/[problemId] -> { content }
 * PUT  /api/sheet/notes/[problemId]  { content } -> { ok, hasNote }
 *
 * A single private markdown note per user per problem. An empty PUT deactivates
 * the note (isActive: false) — the row is retained and re-activated if the user
 * writes a note again — so the "has note" indicator stays accurate without ever
 * deleting data.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { problemId } = await params;

  const note = await prisma.userProblemNote.findUnique({
    where: { userId_problemId: { userId: user.id, problemId } },
    select: { content: true, isActive: true },
  });

  return NextResponse.json({ content: note?.isActive ? note.content : "" });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ problemId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const limited = await checkWriteLimit(req, user.id);
  if (limited) return limited;

  // Reject oversized bodies before buffering them into memory.
  const declaredLength = Number(req.headers.get("content-length") ?? 0);
  if (declaredLength > MAX_NOTE_BYTES) {
    return NextResponse.json({ error: "Note too large" }, { status: 413 });
  }

  const { problemId } = await params;

  let body: { content?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const rawContent = typeof body.content === "string" ? body.content.trim() : "";

  if (rawContent.length > MAX_NOTE_CHARS) {
    return NextResponse.json({ error: "Note too large" }, { status: 413 });
  }

  // The note is rich-text HTML from a contentEditable — sanitize before storing
  // so a stored payload can't run when the editor re-hydrates it via innerHTML.
  const content = rawContent ? sanitizeRichText(rawContent) : "";

  try {
    if (!content) {
      // Deactivate rather than delete. If no row exists there's nothing to
      // clear, so skip the write entirely (avoids an FK error on unknown ids).
      await prisma.userProblemNote.updateMany({
        where: { userId: user.id, problemId, isActive: true },
        data: { isActive: false },
      });
      return NextResponse.json({ ok: true, hasNote: false });
    }

    await prisma.userProblemNote.upsert({
      where: { userId_problemId: { userId: user.id, problemId } },
      create: { userId: user.id, problemId, content, isActive: true },
      update: { content, isActive: true },
    });
  } catch (e) {
    // Unknown problemId → FK violation. Treat as a bad request, not a 500.
    if (isUnknownReference(e)) {
      return NextResponse.json({ error: "Unknown problem" }, { status: 400 });
    }
    console.error("sheet/notes upsert failed", e);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, hasNote: true });
}
