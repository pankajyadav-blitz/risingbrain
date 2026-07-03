import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

/**
 * /robots.txt — lets crawlers index the public content pages while keeping the
 * API, auth pages and per-user routes out of the index. Points bots at the
 * sitemap so they discover every public URL (incl. individual interview posts).
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/profile", "/login", "/signup"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
