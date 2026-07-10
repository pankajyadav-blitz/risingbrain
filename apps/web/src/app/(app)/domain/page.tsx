import type { Metadata } from "next";
import { Container } from "@/components/marketing/primitives";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getSqlCatalog } from "./_data";
import { DomainWorkspace } from "./_components/domain-workspace";

export const metadata: Metadata = {
  title: "Domain",
  description:
    "Core-CS interview prep — SQL, DBMS, Operating Systems, Computer Networks and OOPS, each with focused practice.",
};

/**
 * `/domain` shell. A category selector (SQL / DBMS / OS / CN / OOPS) on top, then
 * the selected section's view — mirroring the Screening section. Only SQL has
 * content today; the rest render a "coming soon" placeholder in the same shell.
 *
 * The SQL catalog is the cached, shared content read (`getSqlCatalog`); it's
 * fetched here and passed to the client shell. `getCurrentUser()` stays uncached
 * (per-request, cookie-based) and runs alongside it.
 */
export default async function DomainPage() {
  const [user, sqlProblems] = await Promise.all([getCurrentUser(), getSqlCatalog()]);

  return (
    <main className="flex-1">
      <Container tight className="py-6 sm:py-8">
        <Reveal>
          <DomainWorkspace sqlProblems={sqlProblems} signedIn={!!user} />
        </Reveal>
      </Container>
    </main>
  );
}
