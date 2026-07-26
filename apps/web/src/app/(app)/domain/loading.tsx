import { Container } from "@/components/marketing/primitives";
import { DomainWorkspaceSkeleton } from "./_components/workspace-skeleton";

/**
 * Route-level `loading.tsx` — the instant skeleton for the whole `/domain`
 * workspace while the index streams in. Mirrors the layout's <Suspense> fallback
 * so the two never drift.
 */
export default function DomainLoading() {
  return (
    <main className="flex-1 lg:flex lg:min-h-0 lg:flex-col">
      <Container tight className="py-6 sm:py-8 lg:flex lg:min-h-0 lg:flex-1 lg:flex-col">
        <DomainWorkspaceSkeleton />
      </Container>
    </main>
  );
}
