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

        {/* Full-height flex chain: the index stays in view, the content scrolls on
            its own, footer flush — no blank space. */}
        <div className="lg:flex lg:min-h-0 lg:flex-1 lg:gap-6 lg:overflow-hidden">
          {/* LEFT (@nav slot): the selected subject's topics, scrolls independently */}
          <aside className="hidden lg:block lg:h-full lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:pr-1">
            {nav}
          </aside>

          {/* MAIN ([topicId] view): lazy per-topic, scrolls independently */}
          <section className="min-w-0 lg:h-full lg:flex-1 lg:overflow-y-auto">{children}</section>
        </div>
      </div>
    </SelectedSubjectProvider>
  );
}
