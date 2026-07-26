import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { dsaSheetCreate, dsaSheetUpdate, idPayload } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";

const bust = () => revalidateTag(CACHE_TAGS.dsaCatalog, { expire: 0 });

/** POST create · PATCH update · DELETE (cascades to topics→patterns→problems). */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, dsaSheetCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const siblings = await prisma.dsaSheet.findMany({ select: { slug: true } });
    const created = await prisma.dsaSheet.create({
      data: {
        name: d.name,
        slug: uniqueSlug(d.name, siblings.map((s) => s.slug)),
        description: d.description ?? null,
        order: d.order ?? siblings.length,
        isPublished: d.isPublished ?? true,
      },
      select: { id: true },
    });
    bust();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (e) {
    return writeErrorResponse(e, "dsa-sheet-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, dsaSheetUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.dsaSheet.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.description !== undefined && { description: d.description ?? null }),
        ...(d.order !== undefined && { order: d.order }),
        ...(d.isPublished !== undefined && { isPublished: d.isPublished }),
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "dsa-sheet-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.dsaSheet.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "dsa-sheet-delete");
  }
}
