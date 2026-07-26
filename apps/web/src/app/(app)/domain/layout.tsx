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
 */
export default function DomainLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  return (
    <main className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
      <Container tight className="py-6 sm:py-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <Suspense fallback={<DomainWorkspaceSkeleton />}>
          <DomainWorkspace nav={nav}>{children}</DomainWorkspace>
        </Suspense>
      </Container>
    </main>
  );
}
