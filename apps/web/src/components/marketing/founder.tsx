import Image from "next/image";
import { ExternalLink, Rocket, Users, type LucideIcon } from "lucide-react";
import { Container, Eyebrow, GlassCard } from "./primitives";
import { InstagramIcon, LinkedInIcon, YouTubeIcon } from "./brand-icons";
import { Reveal } from "@/components/motion/reveal";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/risingbrain/", Icon: LinkedInIcon },
  { label: "YouTube", href: "https://www.youtube.com/@rbanjalikumari", Icon: YouTubeIcon },
  { label: "Instagram", href: "https://www.instagram.com/rbanjali.codes/", Icon: InstagramIcon },
];

/** Where she worked before RisingBrain — the section's strongest trust signal,
 *  so it gets its own labelled row rather than three 12px pills. */
const previously = ["Walmart Global Tech", "Morgan Stanley", "Nagarro"];

/**
 * Two metrics, not three.
 *
 * The third cell used to read "Top tech / Placements" — a phrase sitting in a
 * slot the other two fill with numbers, so the eye expects three figures and
 * finds two. A 2-up of real, sourced numbers reads stronger than a 3-up padded
 * with a label. If there's a genuine placement count, this goes back to three.
 */
const metrics: [LucideIcon, string, string][] = [
  [Users, "100+", "Mentored 1:1"],
  [Rocket, "450K+", "Community reached"],
];

/**
 * Meet the founder.
 *
 * Rebuilt from a centred-avatar layout. The old version put a 128px circular
 * portrait in a tinted box beside two paragraphs of muted body text — which
 * made the human face the smallest element in the one section whose entire job
 * is to introduce a person. The source image is 900×900, so it can carry a
 * full-bleed editorial crop instead.
 *
 * Changes worth knowing:
 *  - Portrait runs the full height of the card, with a scrim carrying the name,
 *    role and socials over it. One block instead of four stacked centred ones.
 *  - `ex-Walmart` etc. were 12px muted pills AND repeated verbatim in the first
 *    prose paragraph. They're now a single labelled "Previously" row, and the
 *    prose no longer re-lists them.
 *  - Scroll-reveal on the card, matching Stats / Reviews / FAQ.
 */
export function Founder() {
  return (
    <Container>
      <section id="founder" className="py-16">
        <Reveal>
          <GlassCard className="overflow-hidden p-0">
            <div className="grid gap-0 lg:grid-cols-[0.85fr_1.15fr]">
              {/* Portrait — full-bleed, with the identity block scrimmed over
                  the base so the photo isn't competing with a caption below it. */}
              <div className="relative min-h-[24rem] lg:min-h-full">
                <Image
                  src="/team/anjali-kumari.jpg"
                  alt="Anjali Kumari, founder of RisingBrain"
                  fill
                  sizes="(min-width: 1024px) 42vw, 100vw"
                  className="object-cover object-top"
                  priority
                />
                {/* Scrim: opaque at the base, clear by mid-frame, so the text
                    stays legible without greying out the whole portrait. */}
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent"
                />
                <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                  <div className="text-xl font-bold text-white">Anjali Kumari</div>
                  <div className="mt-0.5 text-sm text-rb-green-400">
                    Founder &amp; CEO, RisingBrain
                  </div>
                  <div className="mt-4 flex gap-2">
                    {socials.map((s) => (
                      <a
                        key={s.label}
                        href={s.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Anjali on ${s.label}`}
                        className="grid h-10 w-10 place-items-center rounded-xl border border-white/20 bg-white/10 text-white/80 backdrop-blur transition-colors hover:bg-white/20 hover:text-white"
                      >
                        <s.Icon className="h-4 w-4" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Story column. */}
              <div className="p-8 sm:p-10">
                <Eyebrow>
                  <span className="h-1.5 w-1.5 rounded-full bg-rb-green-400" />
                  Meet the founder
                </Eyebrow>

                <h2 className="mt-4 text-2xl font-bold sm:text-3xl">
                  Built by someone who <span className="text-gradient">walked the path</span>
                </h2>

                <div className="mt-4 space-y-3 text-sm leading-relaxed text-muted">
                  <p>
                    An ECE graduate from PSIT Kanpur, Anjali broke into product companies from a
                    non-CS, non-metro background — no coding culture, no seniors to ask, no
                    roadmap. She built RisingBrain so the next student wouldn&apos;t have to figure
                    it out alone.
                  </p>
                  <p>
                    Through her <strong className="text-foreground">30-Day DSA Challenge</strong>{" "}
                    and daily breakdowns, she has mentored{" "}
                    <strong className="text-foreground">100+ engineers 1:1</strong> and reached a
                    community of <strong className="text-foreground">450K+</strong> learners across
                    LinkedIn, YouTube and Instagram.
                  </p>
                </div>

                {/* Credentials, promoted out of 12px muted pills. */}
                <div className="mt-6 border-t border-border pt-5">
                  <div className="text-[11px] uppercase tracking-wider text-muted">Previously</div>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    {previously.map((c, i) => (
                      <span key={c} className="flex items-center gap-3">
                        {i > 0 && <span aria-hidden className="text-border">·</span>}
                        <span className="text-sm font-semibold">{c}</span>
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                  {metrics.map(([Icon, num, label]) => (
                    <div key={label} className="glass-pill rounded-2xl px-4 py-3">
                      <Icon className="h-4 w-4 text-accent" />
                      <div className="mt-1.5 text-lg font-bold tabular-nums">{num}</div>
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
        </Reveal>
      </section>
    </Container>
  );
}
