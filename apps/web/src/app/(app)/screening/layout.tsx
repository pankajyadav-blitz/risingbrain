import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/marketing/primitives";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AptitudeWorkspace } from "./_components/workspace";
import { AptitudeWorkspaceSkeleton } from "./_components/workspace-skeleton";

export const metadata: Metadata = {
  title: "Screening",
  description:
    "Topic-wise aptitude, logical reasoning and puzzle drills with crisp theory, key formulae and MCQ practice to sharpen your speed.",
};

/**
 * `/screening` shell. Uses a parallel route: the `@nav` slot (left index) and the
 * `children` slot (the `[topicId]` paper) render side by side and stream
 * independently. This layout persists across topic navigations, so the live
 * progress provider is seeded ONCE here and the per-topic paper loads lazily.
 *
 * Publicly accessible — guests can read all questions, but interactive actions
 * (selecting answers, hints, submitting) redirect to /login via paper-attempt.tsx.
 *
 * SCROLL MODEL (desktop): this route fills the shell's center column and scrolls
 * its two panes independently — the topic index and the paper each own a
 * scrollport, so neither drags the other out of view. `data-fills-scrollport` is
 * what opts into that (see the rule of the same name in globals.css); without it
 * the shared page-enter wrapper sizes to content and both panes lose their
 * height, collapsing back to one page-level scroll.
 *
 * The navbar + footer come from the parent (app) layout. Only the (fast) session
 * lookup is awaited here; the header + index + paper all stream together inside
 * one <Suspense> via <AptitudeWorkspace>, so the loading screen is a pure
 * skeleton (no half-real header) until the data resolves.
 */
export default async function AptitudeLayout({
  children,
  nav,
}: {
  children: React.ReactNode;
  nav: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <main data-fills-scrollport className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
      {/* On desktop the panes fill the shell, so a full `py-8` bottom gutter is
          just dead space under them — trim it and give the rows the height. */}
      <Container
        tight
        className="py-6 sm:py-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col lg:pt-5 lg:pb-3"
      >
        <Suspense fallback={<AptitudeWorkspaceSkeleton />}>
          <AptitudeWorkspace profileId={user?.id ?? null} nav={nav}>
            {children}
          </AptitudeWorkspace>
        </Suspense>
      </Container>
    </main>
  );
}
