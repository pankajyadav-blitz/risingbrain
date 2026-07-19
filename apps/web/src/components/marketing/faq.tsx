import { MessageCircleQuestion, Plus } from "lucide-react";
import { Container, Eyebrow } from "./primitives";
import { Reveal } from "@/components/motion/reveal";

// Exported so the home page can emit matching FAQPage JSON-LD for rich results.
export const faqs = [
  {
    q: "Is RisingBrain free to start?",
    a: "Yes. The curated SWE sheet, aptitude drills and a large chunk of the practice arena are free forever — no card, no catch. Premium adds the mentorship cohort, mock interviews and the campus training track.",
  },
  {
    q: "Who is this platform for?",
    a: "Students from tier-2/3 colleges with no coding culture, working professionals switching to product roles, and anyone preparing for SDE interviews. If you have raw motivation but no roadmap, RisingBrain gives you the structure.",
  },
  {
    q: "Do I need a CS degree to use it?",
    a: "Not at all. Our founder broke into product companies from a non-CS, non-metro background. The tracks start from fundamentals and build up — your branch or college tier doesn't decide your ceiling here.",
  },
  {
    q: "How is this different from just grinding LeetCode?",
    a: "LeetCode gives you problems; RisingBrain gives you patterns. We sequence ~496 problems across 85 topic-wise patterns so you stop memorising solutions and start recognising shapes — the way interviews actually test you.",
  },
  {
    q: "Do you offer mentorship and campus programs?",
    a: "Yes. Anjali has mentored 100+ engineers 1:1, and we run structured placement-training programs for colleges with a TPO dashboard and batch analytics. Reach out via the founder's LinkedIn to bring it to your campus.",
  },
];

/**
 * Server component — the accordion is a native <details>/<summary> disclosure,
 * so it works with zero client JS. The `+` icon rotates via the `group-open`
 * marker; the first item is open by default.
 *
 * Layout is a sticky two-column split rather than a centered column. The
 * centered version left the section as a narrow strip of cards in an otherwise
 * full-bleed page, which read as an afterthought; anchoring the heading to a
 * sticky left rail fills the width and keeps the section title in view while
 * you read down the answers.
 *
 * The shared `name="faq"` keeps the group exclusive: opening one item closes
 * whichever was open. Note the trade-off — closing an item that sits ABOVE the
 * one you clicked shifts the page upward mid-click. `scroll-margin-top` on the
 * items plus the browser's default scroll anchoring absorbs most of it; if it
 * ever feels like it jumps, this attribute is the cause.
 */
export function Faq() {
  return (
    <Container>
      <section id="faq" className="py-16">
        {/* Disclosure animation: the modern `::details-content` pseudo +
            `interpolate-size` so block-size can transition to/from `auto`.
            The answer also drifts up slightly as it expands, so the reveal
            reads as one motion instead of a box growing around static text.
            Everything here sits behind a reduced-motion guard. */}
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .rb-faq { interpolate-size: allow-keywords; }
            .rb-faq::details-content {
              block-size: 0;
              overflow: clip;
              transition: block-size 0.35s var(--ease-soft), content-visibility 0.35s allow-discrete;
            }
            .rb-faq[open]::details-content { block-size: auto; }
            .rb-faq-a {
              opacity: 0;
              transform: translateY(-4px);
              transition: opacity 0.3s ease 0.1s, transform 0.3s var(--ease-soft) 0.1s;
            }
            .rb-faq[open] .rb-faq-a { opacity: 1; transform: translateY(0); }
          }
        `}</style>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,22rem)_1fr] lg:gap-16">
          {/* Left rail — sticks while the answers scroll past it. */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <div className="mb-4">
              <Eyebrow>
                <span className="h-1.5 w-1.5 rounded-full bg-rb-green-400" />
                FAQ
              </Eyebrow>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Questions, <span className="text-gradient">answered</span>
            </h2>
            <p className="mt-3 text-muted">
              Everything you might want to know before you start your prep with RisingBrain.
            </p>

            {/* The rail would otherwise be dead space on tall viewports, and
                "my question isn't here" is the one FAQ outcome with nowhere to go. */}
            <a
              href="https://www.linkedin.com/company/risingbrain/"
              target="_blank"
              rel="noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              <MessageCircleQuestion className="h-4 w-4" />
              Still have a question?
            </a>
          </div>

          {/* Right column — the questions, revealed in sequence on scroll to
              match the Stats and Reviews bands above. */}
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <Reveal key={f.q} delay={i * 70}>
                <details
                  name="faq"
                  open={i === 0}
                  className="rb-faq glass group rounded-2xl open:border-rb-green-500/30 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left">
                    <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rb-green-500/15 text-accent transition-transform duration-300 group-open:rotate-45">
                      <Plus className="h-4 w-4" />
                    </span>
                  </summary>
                  <p className="rb-faq-a px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
                </details>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </Container>
  );
}
