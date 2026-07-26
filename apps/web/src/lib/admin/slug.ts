/**
 * Slug helpers for admin content creation. Slugs are generated ONCE at creation
 * and never changed on update — DsaProblem/DomainTopic slugs are stable external
 * references (progress/notes/heatmap keys), so mutating them would orphan data.
 */
import { slugify } from "@risingbrain/core/utils";

/**
 * Derive a slug from `name`, de-duplicated against the parent's existing sibling
 * slugs by appending `-2`, `-3`, … (matches the seed's `uniqueSlug` behaviour).
 */
export function uniqueSlug(name: string, taken: Iterable<string>): string {
  const base = slugify(name) || "item";
  const set = new Set(taken);
  if (!set.has(base)) return base;
  let n = 2;
  while (set.has(`${base}-${n}`)) n += 1;
  return `${base}-${n}`;
}
