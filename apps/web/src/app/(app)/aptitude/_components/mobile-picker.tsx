"use client";

import { usePathname, useRouter } from "next/navigation";
import type { AptIndexCategory } from "../_data";

/** Mobile-only grouped <select> that mirrors the desktop `@nav` slot. */
export function MobilePicker({ categories }: { categories: AptIndexCategory[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const activeId = pathname.split("/")[2] ?? "";

  return (
    <div className="mb-4 lg:hidden">
      <label className="mb-1.5 block text-xs font-medium text-muted">Choose a topic</label>
      <select
        value={activeId}
        onChange={(e) => router.push(`/aptitude/${e.target.value}`)}
        className="glass-pill w-full rounded-xl px-4 py-3 text-sm font-medium text-foreground"
      >
        {categories.map((c) => (
          <optgroup key={c.id} label={c.name}>
            {c.topics.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}
