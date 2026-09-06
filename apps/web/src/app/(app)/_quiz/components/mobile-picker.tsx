"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSelectedCategory } from "./selected-category";
import type { AptIndexCategory } from "../data";

/**
 * Mobile-only topic picker. The category is chosen by the top `<CategoryTabs>`
 * (shown on every viewport), so this lists ONLY the selected category's topics —
 * mirroring the desktop `@nav` slot.
 */
export function MobilePicker({
  categories,
  basePath,
}: {
  categories: AptIndexCategory[];
  /** Route this picker navigates within — "/screening" or "/puzzles". */
  basePath: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const ctx = useSelectedCategory();
  const activeSlug = pathname.split("/")[2] ?? "";

  const selectedId = ctx?.selectedId ?? categories[0]?.id ?? "";
  const active = categories.find((c) => c.id === selectedId) ?? categories[0];
  if (!active) return null;

  return (
    <div className="mb-4 lg:hidden">
      <label className="mb-1.5 block text-xs font-medium text-muted">
        {active.name} · choose a topic
      </label>
      <select
        value={active.topics.some((t) => t.slug === activeSlug) ? activeSlug : ""}
        onChange={(e) => router.push(`${basePath}/${e.target.value}`)}
        className="glass-pill w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground"
      >
        {/* Placeholder shown when the open topic isn't in this category yet. */}
        {active.topics.some((t) => t.slug === activeSlug) ? null : (
          <option value="" disabled>
            Select a topic…
          </option>
        )}
        {active.topics.map((t) => (
          <option key={t.id} value={t.slug}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}
