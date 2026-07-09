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

          {/* Full-height flex chain lets the workspace fill the space between
              navbar and footer: the index stays in view, the paper scrolls
              on its own, footer flush — no blank space. */}
          <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6 lg:overflow-hidden">
            {/* LEFT (@nav slot): the selected category's topics, scrolls independently */}
            <aside className="hidden lg:block lg:h-full lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:pr-1">
              {nav}
            </aside>

            {/* MAIN ([topicId] paper): lazy per-topic, scrolls independently */}
            <section className="min-w-0 lg:h-full lg:flex-1 lg:overflow-y-auto">
              {children}
            </section>
          </div>
        </div>
      </SelectedCategoryProvider>
    </ProgressProvider>
  );
}
