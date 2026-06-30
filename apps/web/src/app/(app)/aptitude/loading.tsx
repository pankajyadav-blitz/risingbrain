import { Container } from "@/components/marketing/primitives";
import { AptitudeWorkspaceSkeleton } from "./_components/workspace-skeleton";

/**
 * Fallback for `/aptitude` while its layout's session lookup resolves. The navbar
 * + footer persist from the (app) layout, so this only renders the workspace
 * body — a pure skeleton (header + index + paper), the same one the layout
 * streams behind <Suspense>, so there's no half-real content during loading.
 */
export default function AptitudeLoading() {
  return (
    <main className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
      <Container className="py-6 sm:py-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <AptitudeWorkspaceSkeleton />
      </Container>
    </main>
  );
}
