import type { MetadataRoute } from "next";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/seo";

// Regenerate hourly (ISR) so interview posts published after a deploy still get
// into the sitemap for Google to discover, without a rebuild.
export const revalidate = 3600;

/**
 * /sitemap.xml — the public URL map for search engines. Combines the static
 * content hubs with every PUBLISHED interview experience (real, indexable
 * content) so Google discovers and crawls them. DB access is wrapped so a
 * transient outage degrades to the static routes instead of failing the build.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/sheet"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/domain"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/screening"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/puzzles"), changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/interview"), changeFrequency: "daily", priority: 0.8 },
    { url: absoluteUrl("/courses"), changeFrequency: "monthly", priority: 0.6 },
  ];

  try {
    const experiences = await prisma.interviewExperience.findMany({
      where: { status: "PUBLISHED" },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
      take: 5000,
    });
    const dynamicRoutes: MetadataRoute.Sitemap = experiences.map((e) => ({
      url: absoluteUrl(`/interview/${e.id}`),
      lastModified: e.updatedAt,
      changeFrequency: "weekly",
      priority: 0.6,
    }));
    return [...staticRoutes, ...dynamicRoutes];
  } catch {
    return staticRoutes;
  }
}
