"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { AptIndexCategory } from "../_data";

/**
 * The active CATEGORY (Quant Aptitude / Logical Reasoning / Puzzles), shared
 * across the parallel-route boundary: the top `<CategoryTabs>` (in the workspace)
 * sets it, and the `@nav` slot's `<NavList>` + the mobile `<MobilePicker>` read it
 * to show ONLY that category's topics. Lives in one provider — rendered by the
 * workspace around both branches — exactly like `ProgressProvider`.
 *
 * The active category defaults to the one owning the currently-open topic (from
 * the URL) so a deep/shared link lands on the right list, and follows the paper
 * when the open topic moves to another category.
 */
type SelectedCategoryValue = {
  categories: AptIndexCategory[];
  selectedId: string;
  select: (id: string) => void;
};

const SelectedCategoryContext = createContext<SelectedCategoryValue | null>(null);

export function SelectedCategoryProvider({
  categories,
  children,
}: {
  categories: AptIndexCategory[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const activeTopicId = pathname.split("/")[2] ?? "";

  const categoryOfActive = useMemo(
    () => categories.find((c) => c.topics.some((t) => t.id === activeTopicId))?.id,
    [categories, activeTopicId]
  );

  const [selectedId, setSelectedId] = useState(
    () => categoryOfActive ?? categories[0]?.id ?? ""
  );

  useEffect(() => {
    if (categoryOfActive) setSelectedId(categoryOfActive);
  }, [categoryOfActive]);

  const value = useMemo<SelectedCategoryValue>(
    () => ({ categories, selectedId, select: setSelectedId }),
    [categories, selectedId]
  );

  return (
    <SelectedCategoryContext.Provider value={value}>
      {children}
    </SelectedCategoryContext.Provider>
  );
}

export function useSelectedCategory() {
  return useContext(SelectedCategoryContext);
}
