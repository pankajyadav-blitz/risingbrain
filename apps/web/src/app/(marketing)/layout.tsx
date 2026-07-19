import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Reveal } from "@/components/motion/reveal";
import { getCurrentUserProfileForChrome } from "@/lib/auth/current-user";

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
  // Fail-soft: this is the public landing page, so a Postgres hiccup must
  // degrade the navbar, not replace the page with the error boundary.
  const user = await getCurrentUserProfileForChrome();

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar user={user} />
      {children}
      <Reveal>
        <Footer />
      </Reveal>
    </div>
  );
}
