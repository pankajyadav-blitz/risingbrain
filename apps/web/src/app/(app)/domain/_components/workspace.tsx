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
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-3 lg:overflow-hidden">
          {/* LEFT (@nav slot): the selected subject's topics. A panel matching the
              content card, so the reader reads as a matched pair rather than a
              bare list beside a card. Narrower than the content pane and held to a
              tight gutter — the index is for scanning, the notes are for reading,
              so the width belongs to the notes. */}
          {/* The panel clips (`overflow-hidden` + radius) and an INNER element
              scrolls. Scrollbars are painted outside the border radius, so a
              rounded element that scrolls itself shows a square bar poking through
              its top corner; nesting puts the bar inside the parent's clip. */}
          <aside className="glass hidden lg:flex lg:h-full lg:w-60 lg:shrink-0 lg:flex-col lg:overflow-hidden lg:rounded-3xl xl:w-64">
            <div className="pane-scroll min-h-0 flex-1 overflow-y-auto">{nav}</div>
          </aside>

          {/* MAIN ([topicId] view): lazy per-topic, scrolls independently. Same
              clip-outside / scroll-inside split as the index, so this pane's bar is
              held inside the rounded corner too. The scroller wraps `children`
              rather than living in the topic view, so every state routed here — the
              skeleton, the index page, not-found — scrolls without knowing about it.

              THE CARD LIVES HERE, not on the topic view. Two rounded boxes (a
              clipping shell around a glass card) never line up once the scrollbar
              takes width off the inner one — the radii end up concentric but
              offset, which reads as a doubled corner. One box, one radius. */}
          <section className="glass min-w-0 rounded-3xl lg:h-full lg:flex-1 lg:overflow-hidden">
            <div className="pane-scroll lg:h-full lg:overflow-y-auto">{children}</div>
          </section>
        </div>
      </div>
    </SelectedSubjectProvider>
  );
}
