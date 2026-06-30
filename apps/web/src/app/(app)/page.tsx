import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Stats } from "@/components/marketing/stats";
import { FeatureGrid } from "@/components/marketing/feature-grid";
import { Reviews } from "@/components/marketing/reviews";
import { Founder } from "@/components/marketing/founder";
import { Community } from "@/components/marketing/community";
import { CtaBanner } from "@/components/marketing/cta-banner";
import { Faq } from "@/components/marketing/faq";

export const metadata: Metadata = {
  title: "RisingBrain — Crack your dream product company from any college",
  description:
    "Founder-led, pattern-first placement platform with curated DSA sheets, SQL, aptitude, a real coding arena, live contests and mentorship — all in one place.",
};

// The navbar (and its auth-aware Profile/Login state) now lives in the shared
// (app) layout, so this page is purely the marketing sections — all static
// server components, so it streams fast.
export default function HomePage() {
  return (
    <main className="flex-1">
      <Hero />
      <Stats />
      <FeatureGrid />
      <Reviews />
      <Founder />
      <Community />
      <CtaBanner />
      <Faq />
    </main>
  );
}
