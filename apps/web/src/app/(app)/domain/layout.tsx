import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/marketing/primitives";
import { DomainWorkspace } from "./_components/workspace";
import { DomainWorkspaceSkeleton } from "./_components/workspace-skeleton";

export const metadata: Metadata = {
  title: "Domain",
  description:
    "Core-CS interview prep — OOP, SQL, DBMS, Operating Systems and Computer Networks — each topic with focused notes and a clean, copy-ready example.",
};

/**
 * `/domain` shell. Uses a parallel route: the `@nav` slot (left index) and the
 * `children` slot (the `[topicId]` content) render side by side and stream
 * independently. This layout persists across topic navigations, so the subject
 * tabs + search live here and only the per-topic content reloads lazily.
 *
 * Publicly accessible — all notes/examples are readable by guests. There is no
 * per-user state on this route, so nothing cookie-bound is awaited here; the whole
 * workspace streams behind one <Suspense> (a pure skeleton, never half-real).
 *
 * The navbar + footer come from the parent (app) layout.
 *
 * SCROLL MODEL (desktop): this route fills the shell's center column and scrolls
 * its two panes independently — the topic index and the topic content each own a
 * scrollport, so neither drags the other out of view. `data-fills-scrollport` is
 * what opts into that (see the rule of the same name in globals.css); without it
 * the shared page-enter wrapper sizes to content and both panes lose their
 * height, collapsing back to one page-level scroll.
 */
export default function DomainLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  return (
    <main data-fills-scrollport className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
      {/* On desktop the panes fill the shell, so a full `py-8` bottom gutter is
          just dead space under them — trim it and give the rows the height. */}
      <Container
        tight
        className="py-6 sm:py-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pt-5 lg:pb-3"
      >
        <Suspense fallback={<DomainWorkspaceSkeleton />}>
          <DomainWorkspace nav={nav}>{children}</DomainWorkspace>
        </Suspense>
      </Container>
    </main>
  );
}
