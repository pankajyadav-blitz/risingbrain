import { getAptitudeIndex, getProgressSeed } from "../_data";
import { ProgressProvider } from "./progress-provider";
import { SelectedCategoryProvider } from "./selected-category";
import { CategoryTabs } from "./category-tabs";
import { MobilePicker } from "./mobile-picker";

/**
 * The data-driven aptitude shell — header + index + paper — split out of the
 * layout so the WHOLE thing streams behind one <Suspense>. That's deliberate:
 * the header (including the static title) is rendered here too, so while the two
 * expensive queries (`getAptitudeIndex` + `getProgressSeed`) resolve the user
 * sees a pure skeleton, not half-real / half-skeleton content.
 *
 * `nav` (the `@nav` parallel slot) and `children` (the `[topicId]` paper) are
 * passed straight through; the live progress provider that links the index
 * counters and the paper's status dots is seeded here, once.
 */
export async function AptitudeWorkspace({
  profileId,
  children,
  nav,
}: {
  profileId: string | null;
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  const { categories } = await getAptitudeIndex();
  const seed = profileId
    ? await getProgressSeed(profileId)
    : { reviewByQuestion: {}, submittedTopics: {} };

  if (categories.length === 0) {
    return (
      <p className="pb-20 text-muted">No quizzes have been published yet. Check back soon.</p>
    );
  }

  return (
    <ProgressProvider
      signedIn={Boolean(profileId)}
      initialReviewByQuestion={seed.reviewByQuestion}
      initialSubmittedTopics={seed.submittedTopics}
    >
      <SelectedCategoryProvider categories={categories}>
        {/* Category selector on top (full width) — replaces the old page header */}
        <div className="mb-6 lg:shrink-0">
          <CategoryTabs />
        </div>

        <div className="pb-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pb-0">
          {/* Mobile: topic picker (scoped to the selected category) replaces the sidebar */}
          <MobilePicker categories={categories} />

          {/* Two independent scrollports. Both panes are clipped to the SAME row
              height, so whichever list is longer scrolls inside its own column and
              neither can drag the other out of view or leave it blank. The row's
              height is definite only because the route opts into filling the shell
              (`data-fills-scrollport` on the layout's <main>).

              Each pane CLIPS on the outside and SCROLLS on the inside: scrollbars
              are painted outside the border radius, so a rounded element that
              scrolls itself shows a square bar poking through its top corner.
              Nesting puts the bar inside the parent's clip. And the card lives on
              the pane, never also on the child — two rounded boxes never line up
              once the scrollbar takes width off the inner one. */}
          <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6 lg:overflow-hidden">
            {/* LEFT (@nav slot): the selected category's topics, scrolls
                independently. Deliberately NOT a card — no glass fill, no radius,
                no shadow — just a divider rule against the paper, so the index
                reads as part of the page rather than a second floating panel. One
                FIXED width at every breakpoint, not growing at xl: any extra width
                belongs to the paper. Long titles clip, and `useTruncationTooltip`
                reveals the full name on hover/focus. `pr-2` sits outside the
                scroller, so it is a real gutter between the rows and the divider
                rule (the scrollbar rides inside it). */}
            <aside className="hidden lg:flex lg:h-full lg:w-[228px] lg:shrink-0 lg:flex-col lg:overflow-hidden lg:border-r lg:border-border lg:pr-2">
              <div className="pane-scroll min-h-0 flex-1 overflow-y-auto">{nav}</div>
            </aside>

            {/* MAIN ([topicId] paper): lazy per-topic, scrolls independently. No
                card either — the paper reads directly on the page, so the full
                column width goes to the questions instead of a frame + its inset.
                `pr-3` is the only inset: it keeps content off the scrollbar. */}
            <section className="min-w-0 lg:h-full lg:flex-1 lg:overflow-hidden">
              <div className="pane-scroll lg:h-full lg:overflow-y-auto lg:pr-3">{children}</div>
            </section>
          </div>
        </div>
      </SelectedCategoryProvider>
    </ProgressProvider>
  );
}
