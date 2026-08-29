"use client";

import { useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@risingbrain/ui/cn";
import { useReadingTab } from "./reading-tabs";
import type { TocItem } from "@/lib/markdown-toc";

/**
 * "On this page" — the document's sections, in the right rail. Shared by Domain
 * topics and Screening papers.
 *
 * This is what the freed width is FOR. Capping the text at a readable measure
 * leaves real space on a wide screen, and the answer to that space is a second
 * column of navigation, not a wider paragraph: Domain notes are written in a
 * fixed teaching shape (Hook → Why & what → How it works → Common confusion →
 * Interview angle → Recap), so a reader revising the night before an interview is
 * looking for one named part, not reading the essay again.
 *
 * Shown from `xl` (1280px), which is where the surplus first appears: the
 * reading sheet is capped just above its own text measure, so past that width
 * the extra pixels are not the paragraph's to take and the rail is a better use
 * of them than a wider line. Below `xl` the sheet fills what is left and the
 * sections are a scroll away rather than a screen away.
 */
export function NotesToc({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(items[0]?.id ?? null);
  const tab = useReadingTab();

  useEffect(() => {
    if (tab !== "notes" || items.length === 0) return;

    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el != null);
    if (headings.length === 0) return;

    /**
     * The active section is the LAST heading whose top has passed the reading
     * line — not whichever heading happens to be intersecting.
     *
     * IntersectionObserver was the first attempt and is the wrong tool here on
     * two counts. Its default root is the viewport, but on desktop these notes
     * scroll inside their own pane (see `workspace.tsx`), so the margins would
     * have to be expressed against a root this component does not own; and with
     * short sections the answer to "which one is current" is not "which one is
     * visible" — several are — it is "which one did you most recently scroll
     * past", which an observer does not report at all. Measuring positions is
     * both simpler and correct in either scroll container, since
     * `getBoundingClientRect` is viewport-relative regardless of who scrolls.
     */
    const LINE = 160; // px from the top of the viewport
    let frame = 0;

    const sync = () => {
      frame = 0;
      let current = headings[0]!;
      for (const h of headings) {
        if (h.getBoundingClientRect().top <= LINE) current = h;
        else break;
      }
      setActiveId(current.id);
    };
    // Coalesce the scroll storm into one measurement per frame.
    const onScroll = () => {
      if (frame === 0) frame = requestAnimationFrame(sync);
    };

    sync();
    // `capture: true` catches the scroll from whichever ancestor actually
    // scrolls — the pane on desktop, the document on mobile — without this
    // component needing to know which one that is.
    window.addEventListener("scroll", onScroll, { capture: true, passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll, { capture: true });
      window.removeEventListener("resize", onScroll);
    };
  }, [items, tab]);

  // Sections belong to the notes; while Practice is open they are `hidden`, and a
  // contents list whose links go nowhere is worse than none.
  if (items.length === 0 || tab !== "notes") return null;

  return (
    <aside
      aria-labelledby="toc-heading"
      className="sticky top-0 hidden max-h-[calc(100vh-8rem)] w-56 shrink-0 self-start overflow-y-auto py-1 xl:block"
    >
      <p
        id="toc-heading"
        className="mb-3 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.09em] text-muted"
      >
        <List className="h-3.5 w-3.5" /> On this page
      </p>
      <ul className="space-y-0.5 border-l border-border">
        {items.map((item) => {
          const active = item.id === activeId;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                aria-current={active ? "location" : undefined}
                onClick={() => setActiveId(item.id)}
                className={cn(
                  // `-ml-px` pulls each link's own border over the list's rule, so
                  // the active marker replaces that segment instead of doubling it.
                  "-ml-px block border-l-2 py-1.5 text-[13px] leading-snug transition-colors",
                  item.level === 3 ? "pl-6" : "pl-3.5",
                  active
                    ? "border-rb-green-500 font-medium text-brand"
                    : "border-transparent text-muted hover:border-border hover:text-foreground",
                )}
              >
                {item.text}
              </a>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
