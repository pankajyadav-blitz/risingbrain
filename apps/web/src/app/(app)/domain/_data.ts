import { cacheLife, cacheTag } from "next/cache";
import { prisma } from "@/lib/db";
import { CACHE_TAGS } from "@/lib/cache";

/**
 * The published SQL problem list — lightweight fields only (the heavy
 * description/approach/solution are lazy-loaded per card via /api/domain/[id]).
 * Shared, seeded content: cached cross-request and tagged for revalidation.
 * Reads no cookies.
 */
export async function getSqlCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.sqlCatalog);

  return prisma.sqlProblem.findMany({
    where: { isPublished: true },
    orderBy: [{ order: "asc" }, { title: "asc" }],
    select: {
      id: true,
      slug: true,
      title: true,
      difficulty: true,
      topic: true,
      tags: true,
    },
  });
}
