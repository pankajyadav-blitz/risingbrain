"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import type { DomainSubject } from "@risingbrain/database/enums";
import type { DomainSubjectIndex } from "../_data";
import { SUBJECT_BY_SLUG } from "../_categories";

/**
 * The active SUBJECT (OOP / SQL / …), shared across the parallel-route boundary:
 * the top `<CategoryTabs>` sets it, and the `@nav` slot's `<NavList>` + the mobile
 * `<MobilePicker>` read it to show ONLY that subject's topics — the same shape as
 * Screening's `SelectedCategoryProvider`.
 *
 * Defaults to the subject owning the currently-open topic (from the URL) so a
 * deep/shared link lands on the right list, and follows the content when the open
 * topic moves to another subject.
 */
type SelectedSubjectValue = {
  subjects: DomainSubjectIndex[];
  selected: DomainSubject | "";
  select: (s: DomainSubject) => void;
};

const SelectedSubjectContext = createContext<SelectedSubjectValue | null>(null);

export function SelectedSubjectProvider({
  subjects,
  children,
}: {
  subjects: DomainSubjectIndex[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // `/domain/<subject>/<slug>` states the subject outright, so this reads it from
  // the URL rather than hunting the whole index for the topic that owns it.
  const subjectOfActive = useMemo(() => {
    const subject = SUBJECT_BY_SLUG[pathname.split("/")[2] ?? ""];
    return subject && subjects.some((s) => s.subject === subject) ? subject : undefined;
  }, [subjects, pathname]);

  const [selected, setSelected] = useState<DomainSubject | "">(
    () => subjectOfActive ?? subjects[0]?.subject ?? ""
  );

  useEffect(() => {
    if (subjectOfActive) setSelected(subjectOfActive);
  }, [subjectOfActive]);

  const value = useMemo<SelectedSubjectValue>(
    () => ({ subjects, selected, select: setSelected }),
    [subjects, selected]
  );

  return (
    <SelectedSubjectContext.Provider value={value}>{children}</SelectedSubjectContext.Provider>
  );
}

export function useSelectedSubject() {
  return useContext(SelectedSubjectContext);
}
