import Image from "next/image";
import { Award, ExternalLink, Rocket, Sparkles, Users, type LucideIcon } from "lucide-react";
import { Container, GlassCard } from "./primitives";
import { InstagramIcon, LinkedInIcon, YouTubeIcon } from "./brand-icons";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/risingbrain/", Icon: LinkedInIcon },
  { label: "YouTube", href: "https://www.youtube.com/@rbanjalikumari", Icon: YouTubeIcon },
  { label: "Instagram", href: "https://www.instagram.com/rbanjali.codes/", Icon: InstagramIcon },
];

const metrics: [LucideIcon, string, string][] = [
  [Users, "100+", "Mentored 1:1"],
  [Rocket, "150k+", "Community"],
  [Award, "Top tech", "Placements"],
];

export function Founder() {
  return (
    <Container>
      <section id="founder" className="py-16">
        <GlassCard className="overflow-hidden p-0">
          <div className="grid gap-0 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="relative flex flex-col items-center justify-center gap-5 bg-rb-green-900/25 p-10 text-center">
              <div className="relative h-32 w-32 overflow-hidden rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.35)] ring-4 ring-rb-green-500/30">
                <Image
                  src="/team/anjali-kumari.jpg"
                  alt="Anjali Kumari"
                  fill
                  sizes="128px"
                  className="object-cover"
                  priority
                />
              </div>
              <div>
                <div className="text-xl font-bold">Anjali Kumari</div>
                <div className="text-sm text-accent">Founder &amp; CEO, RisingBrain</div>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-xs text-muted">
                <span className="glass-pill rounded-full px-3 py-1">ex-Walmart</span>
                <span className="glass-pill rounded-full px-3 py-1">ex-Morgan Stanley</span>
                <span className="glass-pill rounded-full px-3 py-1">ex-Nagarro</span>
              </div>
              <div className="flex gap-2">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Anjali on ${s.label}`}
                    className="glass-pill grid h-10 w-10 place-items-center rounded-xl text-muted transition-colors hover:text-accent"
                  >
                    <s.Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            <div className="p-8 sm:p-10">
              <div className="mb-4">
                <span className="glass-pill inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium text-accent">
                  <Sparkles className="h-3.5 w-3.5" />
                  Meet the founder
                </span>
              </div>
              <h2 className="text-2xl font-bold sm:text-3xl">
                Built by someone who <span className="text-gradient">walked the path</span>
              </h2>
              <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                <p>
                  Anjali Kumari is a software engineer turned educator who has worked at{" "}
                  <strong className="text-foreground">Walmart Global Tech</strong>,{" "}
                  <strong className="text-foreground">Morgan Stanley</strong> and Nagarro. An ECE
                  graduate from PSIT Kanpur, she broke into product companies from a non-CS,
                  non-metro background — and built RisingBrain so the next generation wouldn&apos;t
                  have to figure it out alone.
                </p>
                <p>
                  Through her <strong className="text-foreground">30-Day DSA Challenge</strong> and
                  daily breakdowns, she has mentored{" "}
                  <strong className="text-foreground">100+ engineers 1:1</strong> and reached a
                  community of <strong className="text-foreground">150k+</strong> learners across
                  LinkedIn, YouTube and Instagram.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-3">
                {metrics.map(([Icon, num, label]) => (
                  <div key={label} className="glass-pill rounded-2xl px-3 py-3 text-center">
                    <Icon className="mx-auto h-4 w-4 text-accent" />
                    <div className="mt-1 text-base font-bold">{num}</div>
                    <div className="text-[11px] text-muted">{label}</div>
                  </div>
                ))}
              </div>

              <a
                href="https://www.linkedin.com/company/risingbrain/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-glow mt-6 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
              >
                Connect with Anjali <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          </div>
        </GlassCard>
      </section>
    </Container>
  );
}
