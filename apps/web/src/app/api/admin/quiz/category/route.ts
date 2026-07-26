import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { quizCategoryCreate, quizCategoryUpdate, idPayload } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";

const bust = () => revalidateTag(CACHE_TAGS.quizCatalog, { expire: 0 });

/** POST create · PATCH update · DELETE (cascades to topics→questions). */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizCategoryCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const siblings = await prisma.quizCategory.findMany({ select: { slug: true } });
    const created = await prisma.quizCategory.create({
      data: {
        kind: d.kind,
        name: d.name,
        slug: uniqueSlug(d.name, siblings.map((s) => s.slug)),
        order: d.order ?? siblings.length,
      },
      select: { id: true },
    });
    bust();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return writeErrorResponse(e, "quiz-category-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, quizCategoryUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.quizCategory.update({
      where: { id },
      data: {
        ...(d.kind !== undefined && { kind: d.kind }),
        ...(d.name !== undefined && { name: d.name }),
        ...(d.order !== undefined && { order: d.order }),
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-category-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.quizCategory.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "quiz-category-delete");
  }
}
