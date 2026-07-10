import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Stats } from "@/components/marketing/stats";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Reviews } from "@/components/marketing/reviews";
import { Founder } from "@/components/marketing/founder";
import { Community } from "@/components/marketing/community";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Faq, faqs } from "@/components/marketing/faq";
import { Reveal } from "@/components/motion/reveal";
import { JsonLd } from "@/components/structured-data";
import { SITE_NAME, SITE_DESCRIPTION, absoluteUrl } from "@/lib/seo";

export const metadata: Metadata = {
  title: { absolute: "RisingBrain — Crack your dream product company from any college" },
  description:
    "Founder-led, pattern-first placement platform with curated DSA sheets, SQL, aptitude, a real coding arena, live contests and mentorship — all in one place.",
};

// Structured data: the brand entity (Organization), the site (WebSite, enabling
// a sitelinks search box) and the on-page FAQ (FAQPage rich result).
const organizationLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  description: SITE_DESCRIPTION,
  logo: absoluteUrl("/opengraph-image"),
};

const websiteLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: absoluteUrl("/"),
  potentialAction: {
    "@type": "SearchAction",
    target: { "@type": "EntryPoint", urlTemplate: absoluteUrl("/interview?q={search_term_string}") },
    "query-input": "required name=search_term_string",
  },
};

const faqLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
};

// The navbar (and its auth-aware Profile/Login state) now lives in the shared
// (app) layout, so this page is purely the marketing sections — all static
// server components, so it streams fast.
export default function HomePage() {
  return (
    <main className="flex-1">
      <JsonLd data={organizationLd} />
      <JsonLd data={websiteLd} />
      <JsonLd data={faqLd} />
      <Hero />
      <Stats />
      <Reveal>
        <FeatureGrid />
      </Reveal>
      <Reveal>
        <Reviews />
      </Reveal>
      <Reveal>
        <Founder />
      </Reveal>
      <Reveal>
        <Community />
      </Reveal>
      <Reveal>
        <CtaBanner />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
    </main>
  );
}
