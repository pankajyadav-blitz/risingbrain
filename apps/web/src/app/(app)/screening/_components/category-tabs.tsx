"use client";

import { Brain, Calculator, Puzzle, type LucideIcon } from "lucide-react";
import { useProgress } from "./progress-provider";
import { useSelectedCategory } from "./selected-category";
import type { AptKind } from "../_data";

const KIND_ICON: Record<AptKind, LucideIcon> = {
  APTITUDE: Calculator,
  LOGICAL_REASONING: Brain,
  PUZZLE: Puzzle,
};

/**
 * The category selector — a full-width segmented control at the TOP of the
 * screening workspace (mirrors the DSA sheet's sheet-tabs). One category is
 * active at a time; picking one filters the sidebar / mobile picker to just its
 * topics. Signed-in learners also see that category's solved percentage.
 */
export function CategoryTabs() {
  const ctx = useSelectedCategory();
  const progress = useProgress();
  const signedIn = progress?.signedIn ?? false;
  if (!ctx) return null;
  const { categories, selectedId, select } = ctx;

  return (
    <div role="tablist" aria-label="Choose a category" className="flex flex-wrap gap-2.5 sm:gap-3">
      {categories.map((c) => {
        const Icon = KIND_ICON[c.kind] ?? Calculator;
        const isActive = c.id === selectedId;
        const total = c.topics.reduce((s, t) => s + t.total, 0);
        const score = c.topics.reduce(
          (s, t) => s + (progress?.getTopicScore(t.id)?.score ?? 0),
          0
        );
        const pct = total > 0 ? Math.round((score / total) * 100) : 0;
        return (
          <button
            key={c.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => select(c.id)}
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
                {c.name}
              </span>
              <span className="text-xs font-medium text-muted">
                {c.topics.length} {c.topics.length === 1 ? "topic" : "topics"}
                {signedIn ? ` · ${pct}%` : ""}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
