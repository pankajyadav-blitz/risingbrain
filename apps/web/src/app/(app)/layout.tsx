import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

/**
 * Shared chrome for the whole marketing + signed-in app. The navbar and footer
 * live HERE — in a persistent layout, not in each page — so they stay mounted
 * across every navigation in this group; only the page body below swaps to a
 * `loading.tsx` skeleton while the next route streams. That's what keeps the nav
 * links clickable during loading, instead of being replaced by a dead skeleton.
 *
 * Auth pages (`/login`, `/signup`) sit OUTSIDE this group, so they render with
 * no navbar. The user lookup is request-cached, so pages that also need the
 * profile don't pay for a second query.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar
        user={profile ? { name: profile.name, role: profile.role } : null}
      />
      {children}
      <Reveal>
        <Footer />
      </Reveal>
    </div>
  );
}
