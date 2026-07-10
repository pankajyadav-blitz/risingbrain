import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentUserProfile } from "@/lib/auth/current-user";

/**
 * Marketing chrome — the public landing page (and any other top-nav marketing
 * route) keeps the floating glass Navbar + Footer. The signed-in app sections
 * live in the sibling `(app)` group, which uses the icon-rail dashboard shell
 * instead. Route groups don't affect URLs, so `/` still resolves here.
 */
export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={profile ? { name: profile.name, role: profile.role } : null} />
      {children}
      <Reveal>
        <Footer />
      </Reveal>
    </div>
  );
}
