import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { quizTopicCreate, quizTopicUpdate, idPayload } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";

const bust = () => revalidateTag(CACHE_TAGS.quizCatalog, { expire: 0 });

/** POST create · PATCH update · DELETE (cascades to questions). */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizTopicCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const siblings = await prisma.quizTopic.findMany({
      where: { categoryId: d.categoryId },
      select: { slug: true },
    });
    const created = await prisma.quizTopic.create({
      data: {
        categoryId: d.categoryId,
        name: d.name,
        slug: uniqueSlug(d.name, siblings.map((s) => s.slug)),
        theory: d.theory ?? null,
        formula: d.formula ?? null,
        order: d.order ?? siblings.length,
      },
      select: { id: true },
    });
    bust();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return writeErrorResponse(e, "quiz-topic-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizTopicUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.quizTopic.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.theory !== undefined && { theory: d.theory ?? null }),
        ...(d.formula !== undefined && { formula: d.formula ?? null }),
        ...(d.order !== undefined && { order: d.order }),
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-topic-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.quizTopic.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-topic-delete");
  }
}
