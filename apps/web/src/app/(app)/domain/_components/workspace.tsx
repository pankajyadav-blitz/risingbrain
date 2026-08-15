import { getDomainIndex } from "../_data";
import { SelectedSubjectProvider } from "./selected-subject";
import { CategoryTabs } from "./category-tabs";
import { MobilePicker } from "./mobile-picker";
import { DomainSearch } from "./domain-search";

/**
 * The data-driven Domain shell — subject tabs + search + index + content — split
 * out of the layout so the WHOLE thing streams behind one <Suspense> (the header
 * renders here too, so the loading state is a pure skeleton, never half-real).
 *
 * `nav` (the `@nav` parallel slot) and `children` (the `[topicId]` view) are passed
 * straight through. The selected-subject provider that links the tabs, the sidebar
 * and the mobile picker is seeded here, once, from the cached index.
 */
export async function DomainWorkspace({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  const { subjects } = await getDomainIndex();

  if (subjects.length === 0) {
    return (
      <p className="pb-20 text-muted">No domain topics have been published yet. Check back soon.</p>
    );
  }

  return (
    <SelectedSubjectProvider subjects={subjects}>
      {/* Subject selector + search on top (full width) */}
      <div className="mb-6 flex flex-col gap-4 lg:shrink-0 lg:flex-row lg:items-center lg:justify-between">
        <CategoryTabs />
        <DomainSearch />
      </div>

      <div className="pb-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pb-0">
        {/* Mobile: topic picker (scoped to the selected subject) replaces the sidebar */}
        <MobilePicker subjects={subjects} />

        {/* Two independent scrollports. Both panes are clipped to the SAME row
            height, so whichever list is longer scrolls inside its own column and
            neither can drag the other out of view or leave it blank. The row's
            height is definite only because the route opts into filling the shell
            (`data-fills-scrollport` on the layout's <main>). */}
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6 lg:overflow-hidden">
          {/* LEFT (@nav slot): the selected subject's topics. Deliberately NOT a
              card — no glass fill, no radius, no shadow — just a divider rule
              against the content pane, so the index reads as part of the page
              rather than a second floating panel. Narrower than the content pane —
              and one FIXED width at every breakpoint, not growing at xl: the index
              is for scanning, the notes are for reading, so any extra width belongs
              to the notes. Long titles clip, and `useTruncationTooltip` reveals the
              full name on hover/focus. `pr-2` sits outside the scroller, so it is a
              real gutter between the rows and the divider rule (the scrollbar rides
              inside it) — the width is sized to absorb it plus the rows' own. */}
          <aside className="hidden lg:flex lg:h-full lg:w-[228px] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-border lg:pr-2">
            <div className="pane-scroll min-h-0 flex-1 overflow-y-auto">{nav}</div>
          </aside>

          {/* MAIN ([topicId] view): lazy per-topic, scrolls independently. No card
              either — the notes read directly on the page, so the full column width
              goes to the text instead of a frame + its inset. The scroller wraps
              `children` rather than living in the topic view, so every state routed
              here — the skeleton, the index page, not-found — scrolls without
              knowing about it, and `pr-3` is the only inset: it keeps the prose off
              the scrollbar. */}
          <section className="min-w-0 lg:h-full lg:flex-1 lg:overflow-hidden">
            <div className="pane-scroll lg:h-full lg:overflow-y-auto lg:pr-3">{children}</div>
          </section>
        </div>
      </div>
    </SelectedSubjectProvider>
  );
}
