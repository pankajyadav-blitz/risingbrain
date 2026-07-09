"use client";

import type { DomainCategoryKey, DomainCategoryMeta } from "../_categories";

/**
 * The Domain category selector — a full-width segmented control on top, mirroring
 * the Screening section's `CategoryTabs`. Sections without content yet still
 * select (to preview the "coming soon" view) and carry a small "Soon" badge.
 */
export function CategoryTabs({
  categories,
  selectedKey,
  onSelect,
}: {
  categories: DomainCategoryMeta[];
  selectedKey: DomainCategoryKey;
  onSelect: (key: DomainCategoryKey) => void;
}) {
  return (
    <div role="tablist" aria-label="Choose a subject" className="flex flex-wrap gap-2.5 sm:gap-3">
      {categories.map((c) => {
        const Icon = c.icon;
        const isActive = c.key === selectedKey;
        return (
          <button
            key={c.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(c.key)}
            className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-left transition-all sm:px-5 ${
              isActive
                ? "bg-rb-green-500/15 text-brand ring-1 ring-rb-green-500/40"
                : "glass-pill text-muted hover:text-foreground"
            }`}
          >
            <span
              className={`grid h-9 w-9 shrink-0 place-items-center rounded-full ${
                isActive ? "bg-rb-green-500 text-black" : "bg-surface-2 text-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="flex flex-col">
              <span
                className={`text-sm font-semibold ${isActive ? "text-brand" : "text-foreground"}`}
              >
                {c.label}
              </span>
              <span className="text-xs font-medium text-muted">
                {c.available ? "Practice" : "Coming soon"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
