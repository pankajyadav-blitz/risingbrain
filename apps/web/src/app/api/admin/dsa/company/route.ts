import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../../_guard";
import { companyCreate, companyUpdate, idPayload } from "@/lib/admin/schemas";
import { uniqueSlug } from "@/lib/admin/slug";

const bust = () => revalidateTag(CACHE_TAGS.dsaCatalog, { expire: 0 });

/**
 * Company catalog for DSA problem tagging. POST create · PATCH update · DELETE
 * (cascades to ProblemCompany, un-tagging the problems). Returns the created
 * company so the problem form can immediately select a newly-added firm.
 */
export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, companyCreate);
  if (parsed.error) return parsed.error;
  const d = parsed.data;

  try {
    const existing = await prisma.company.findMany({ select: { slug: true } });
    const created = await prisma.company.create({
      data: {
        name: d.name,
        slug: uniqueSlug(d.name, existing.map((c) => c.slug)),
        logoUrl: d.logoUrl ?? null,
      },
      select: { id: true, name: true, slug: true, logoUrl: true },
    });
    bust();
    return NextResponse.json({ ok: true, company: created });
  } catch (e) {
    return writeErrorResponse(e, "company-create");
  }
}

export async function PATCH(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, companyUpdate);
  if (parsed.error) return parsed.error;
  const { id, ...d } = parsed.data;

  try {
    await prisma.company.update({
      where: { id },
      data: {
        ...(d.name !== undefined && { name: d.name }),
        ...(d.logoUrl !== undefined && { logoUrl: d.logoUrl ?? null }),
      },
    });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "company-update");
  }
}

export async function DELETE(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, idPayload);
  if (parsed.error) return parsed.error;

  try {
    await prisma.company.delete({ where: { id: parsed.data.id } });
    bust();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return writeErrorResponse(e, "company-delete");
  }
}
