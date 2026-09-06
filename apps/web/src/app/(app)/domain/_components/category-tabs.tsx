"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSelectedSubject } from "./selected-subject";
import { SUBJECT_META, domainTopicHref } from "../_categories";
import type { DomainSubjectIndex } from "../_data";

/**
 * The subject selector — a full-width segmented control at the TOP of the Domain
 * workspace (mirrors Screening's category tabs). Only subjects that have content
 * are rendered (data-driven from the index). With a SINGLE subject the tab bar
 * collapses to a plain header — there is nothing to switch between.
 *
 * Picking a subject also opens its first topic, so the sidebar and the URL-driven
 * content never fall out of sync.
 */
export function CategoryTabs() {
  const ctx = useSelectedSubject();
  const router = useRouter();
  const pathname = usePathname();
  const activeTopicSlug = pathname.split("/")[3] ?? "";
  if (!ctx) return null;
  const { subjects, selected, select } = ctx;

  function open(s: DomainSubjectIndex) {
    select(s.subject);
    const already = s.groups.some((g) => g.topics.some((t) => t.slug === activeTopicSlug));
    if (already) return;
    const first = s.groups[0]?.topics[0];
    if (first) router.push(domainTopicHref(s.subject, first.slug));
  }

  // One subject → a plain header, not a lone clickable tab.
  if (subjects.length === 1) {
    const s = subjects[0]!;
    const Icon = SUBJECT_META[s.subject].icon;
    return (
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-rb-green-500 text-black">
          <Icon className="h-5 w-5" />
        </span>
        <div className="flex flex-col">
          <span className="text-lg font-bold tracking-tight text-brand">{s.label}</span>
          <span className="text-xs font-medium text-muted">{s.blurb}</span>
        </div>
      </div>
    );
  }

  return (
    <div role="tablist" aria-label="Choose a subject" className="flex flex-wrap gap-2.5 sm:gap-3">
      {subjects.map((s) => {
        const Icon = SUBJECT_META[s.subject].icon;
        const isActive = s.subject === selected;
        return (
          <button
            key={s.subject}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => open(s)}
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
                {s.label}
              </span>
              <span className="text-xs font-medium text-muted">
                {s.total} {s.total === 1 ? "topic" : "topics"}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
