import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { quizQuestionCreate, quizQuestionUpdate, idPayload } from "@/lib/admin/schemas";

const bust = () => revalidateTag(CACHE_TAGS.quizCatalog, { expire: 0 });

/**
 * MCQ CRUD. `options` is stored in a Json column as `[{ key, label }]`; the
 * schema already guarantees distinct keys and that `answerKey` is one of them.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizQuestionCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const count = await prisma.quizQuestion.count({ where: { topicId: d.topicId } });
    const created = await prisma.quizQuestion.create({
      data: {
        topicId: d.topicId,
        prompt: d.prompt,
        options: d.options,
        answerKey: d.answerKey,
        explanation: d.explanation ?? null,
        hint: d.hint ?? null,
        difficulty: d.difficulty ?? null,
        order: d.order ?? count,
      },
      select: { id: true },
    });
    bust();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return writeErrorResponse(e, "quiz-question-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizQuestionUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.quizQuestion.update({
      where: { id },
      data: {
        prompt: d.prompt,
        options: d.options,
        answerKey: d.answerKey,
        explanation: d.explanation ?? null,
        hint: d.hint ?? null,
        difficulty: d.difficulty ?? null,
        order: d.order ?? 0,
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-question-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.quizQuestion.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-question-delete");
  }
}
