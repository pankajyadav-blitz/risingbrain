"use client";

import { useState } from "react";
import {
  DOMAIN_CATEGORIES,
  type DomainCategoryKey,
  type DomainCategoryMeta,
} from "../_categories";
import { CategoryTabs } from "./category-tabs";
import { ComingSoon } from "./coming-soon";
import { SqlContent } from "./sql-content";
import type { ProblemListItem } from "./problem-card";

/**
 * Client shell for the Domain section — the same shape as the Screening
 * workspace: a category selector on top, then the selected category's view. The
 * category lives in local state (no URL routing yet — each section's content is
 * different and none but SQL exists), defaulting to the first tab.
 *
 * ── Extension point ──────────────────────────────────────────────────────────
 * When a new section ships: set `available: true` in `_categories.ts`, build its
 * view component, and add a branch to `renderContent` below. Each section owns
 * its own layout (sidebar + content, full-width, whatever fits), so their very
 * different content models never have to agree on one shape.
 */
export function DomainWorkspace({
  sqlProblems,
  signedIn,
}: {
  sqlProblems: ProblemListItem[];
  signedIn: boolean;
}) {
  const [selectedKey, setSelectedKey] = useState<DomainCategoryKey>(
    DOMAIN_CATEGORIES[0]?.key ?? "sql"
  );
  const selected =
    DOMAIN_CATEGORIES.find((c) => c.key === selectedKey) ?? DOMAIN_CATEGORIES[0];

  // The registry is a non-empty constant, so this never happens at runtime — it
  // just satisfies the noUncheckedIndexedAccess guard.
  if (!selected) return null;

  function renderContent(cat: DomainCategoryMeta) {
    switch (cat.key) {
      case "sql":
        return <SqlContent problems={sqlProblems} signedIn={signedIn} />;
      // case "dbms": return <DbmsContent … />;   ← wire real sections here
      default:
        return <ComingSoon category={cat} />;
    }
  }

  return (
    <div className="py-6 sm:py-8">
      {/* Category selector on top (full width) */}
      <div className="mb-6">
        <CategoryTabs
          categories={DOMAIN_CATEGORIES}
          selectedKey={selectedKey}
          onSelect={setSelectedKey}
        />
      </div>

      {renderContent(selected)}
    </div>
  );
}
