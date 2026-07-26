"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSelectedSubject } from "./selected-subject";
import type { DomainSubjectIndex } from "../_data";

/**
 * Mobile-only topic picker. The subject is chosen by the top `<CategoryTabs>`, so
 * this lists ONLY the selected subject's topics — grouped with `<optgroup>` to
 * mirror the desktop `@nav` sections.
 */
export function MobilePicker({ subjects }: { subjects: DomainSubjectIndex[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const ctx = useSelectedSubject();
  const activeId = pathname.split("/")[2] ?? "";

  const selected = ctx?.selected || subjects[0]?.subject || "";
  const active = subjects.find((s) => s.subject === selected) ?? subjects[0];
  if (!active) return null;

  const hasActive = active.groups.some((g) => g.topics.some((t) => t.id === activeId));

  return (
    <div className="mb-4 lg:hidden">
      <label className="mb-1.5 block text-xs font-medium text-muted">
        {active.label} · choose a topic
      </label>
      <select
        value={hasActive ? activeId : ""}
        onChange={(e) => router.push(`/domain/${e.target.value}`)}
        className="glass-pill w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground"
      >
        {hasActive ? null : (
          <option value="" disabled>
            Select a topic…
          </option>
        )}
        {active.groups.map((g) => (
          <optgroup key={g.label} label={g.label}>
            {g.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
