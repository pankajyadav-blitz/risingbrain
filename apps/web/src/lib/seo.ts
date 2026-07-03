/**
 * Shared SEO constants — single source of truth for the site's canonical URL,
 * name, description and keywords. Consumed by the root metadata, sitemap,
 * robots, web manifest and JSON-LD structured data so they never drift.
 *
 * `siteUrl` comes from APP_URL (set to the real production domain in prod — it
 * powers `metadataBase`, canonical links, Open Graph URLs and the sitemap).
 */
export const SITE_NAME = "RisingBrain";

export const siteUrl = new URL(process.env.APP_URL || "http://localhost:3000");

export const SITE_DESCRIPTION =
  "Founder-led, pattern-first placement platform: curated DSA sheets, SQL practice, aptitude & logical reasoning, real interview experiences and courses — everything you need to crack your dream product company, from any college.";

export const SITE_KEYWORDS = [
  "DSA sheets",
  "coding interview preparation",
  "LeetCode patterns",
  "SQL practice",
  "aptitude test",
  "logical reasoning",
  "placement preparation",
  "interview experiences",
  "system design",
  "product company interview",
  "data structures and algorithms",
  "RisingBrain",
];

/** Absolute URL for a site-relative path. */
export const absoluteUrl = (path = "/"): string => new URL(path, siteUrl).toString();
