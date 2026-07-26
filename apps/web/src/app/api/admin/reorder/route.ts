import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/lib/db";
import { CACHE_TAGS, type CacheTag } from "@/lib/cache";
import { requireAdmin, parse, writeErrorResponse } from "../_guard";
import { reorderPayload } from "@/lib/admin/schemas";

/**
 * Generic move-up/move-down: swaps the `order` value between two sibling rows of
 * one content entity, in a transaction, then busts that entity's public cache.
 * One route serves every orderable model so the per-entity routes stay focused
 * on create/update/delete. The client passes the two neighbours to swap.
 */
type Entry = {
  tag: CacheTag;
  read: (id: string) => Promise<{ order: number } | null>;
  write: (id: string, order: number) => Prisma.PrismaPromise<unknown>;
};

const ENTITIES: Record<string, Entry> = {
  dsaSheet: {
    tag: CACHE_TAGS.dsaCatalog,
    read: (id) => prisma.dsaSheet.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.dsaSheet.update({ where: { id }, data: { order } }),
  },
  dsaTopic: {
    tag: CACHE_TAGS.dsaCatalog,
    read: (id) => prisma.dsaTopic.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.dsaTopic.update({ where: { id }, data: { order } }),
  },
  dsaPattern: {
    tag: CACHE_TAGS.dsaCatalog,
    read: (id) => prisma.dsaPattern.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.dsaPattern.update({ where: { id }, data: { order } }),
  },
  dsaProblem: {
    tag: CACHE_TAGS.dsaCatalog,
    read: (id) => prisma.dsaProblem.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.dsaProblem.update({ where: { id }, data: { order } }),
  },
  domainTopic: {
    tag: CACHE_TAGS.domainCatalog,
    read: (id) => prisma.domainTopic.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.domainTopic.update({ where: { id }, data: { order } }),
  },
  quizCategory: {
    tag: CACHE_TAGS.quizCatalog,
    read: (id) => prisma.quizCategory.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.quizCategory.update({ where: { id }, data: { order } }),
  },
  quizTopic: {
    tag: CACHE_TAGS.quizCatalog,
    read: (id) => prisma.quizTopic.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.quizTopic.update({ where: { id }, data: { order } }),
  },
  quizQuestion: {
    tag: CACHE_TAGS.quizCatalog,
    read: (id) => prisma.quizQuestion.findUnique({ where: { id }, select: { order: true } }),
    write: (id, order) => prisma.quizQuestion.update({ where: { id }, data: { order } }),
  },
};

export async function POST(req: Request) {
  const guard = await requireAdmin(req);
  if (guard.error) return guard.error;
  const parsed = await parse(req, reorderPayload);
  if (parsed.error) return parsed.error;
  const { entity, aId, bId } = parsed.data;

  const e = ENTITIES[entity];
  if (!e) return NextResponse.json({ error: "Unknown entity" }, { status: 400 });

  try {
    const [a, b] = await Promise.all([e.read(aId), e.read(bId)]);
    if (!a || !b) return NextResponse.json({ error: "Record not found." }, { status: 404 });

    // If two siblings share an order value, nudge one so the swap is visible.
    const [aOrder, bOrder] = a.order === b.order ? [b.order + 1, b.order] : [b.order, a.order];
    await prisma.$transaction([e.write(aId, aOrder), e.write(bId, bOrder)]);
    revalidateTag(e.tag, { expire: 0 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return writeErrorResponse(err, "reorder");
  }
}
