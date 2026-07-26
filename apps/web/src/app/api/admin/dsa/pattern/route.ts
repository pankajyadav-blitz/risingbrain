import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { dsaPatternCreate, dsaPatternUpdate, idPayload } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";

const bust = () => revalidateTag(CACHE_TAGS.dsaCatalog, { expire: 0 });

/** POST create · PATCH update · DELETE (cascades to problems). */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, dsaPatternCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const siblings = await prisma.dsaPattern.findMany({
      where: { topicId: d.topicId },
      select: { slug: true },
    });
    const created = await prisma.dsaPattern.create({
      data: {
        topicId: d.topicId,
        name: d.name,
        slug: uniqueSlug(d.name, siblings.map((s) => s.slug)),
        strategy: d.strategy ?? null,
        identification: d.identification ?? null,
        order: d.order ?? siblings.length,
      },
      select: { id: true },
    });
    bust();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return writeErrorResponse(e, "dsa-pattern-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, dsaPatternUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.dsaPattern.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.strategy !== undefined && { strategy: d.strategy ?? null }),
        ...(d.identification !== undefined && { identification: d.identification ?? null }),
        ...(d.order !== undefined && { order: d.order }),
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "dsa-pattern-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.dsaPattern.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "dsa-pattern-delete");
  }
}
