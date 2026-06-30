import { Plus } from "lucide-react";
import { Container, Eyebrow } from "./primitives";

const faqs = [
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
 * so it works with zero client JS. A shared `name="faq"` makes the group
 * exclusive: opening one item auto-closes the others. The `+` icon rotates via
 * the `group-open` marker. First item is open by default.
 */
export function Faq() {
  return (
    <Container>
      <section id="faq" className="py-16">
        <div className="mb-8 text-center">
          <div className="mb-4">
            <Eyebrow>
              <span className="h-1.5 w-1.5 rounded-full bg-rb-green-400" />
              FAQ
            </Eyebrow>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            Questions, <span className="text-gradient">answered</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Everything you might want to know before you start your prep with RisingBrain.
          </p>
        </div>

        {/* Smoothly animate the disclosure open/close instead of the native
            instant snap. Uses the modern `::details-content` pseudo + `interpolate-size`
            so block-size can transition to/from `auto`; respects reduced-motion. */}
        <style>{`
          @media (prefers-reduced-motion: no-preference) {
            .rb-faq { interpolate-size: allow-keywords; }
            .rb-faq::details-content {
              block-size: 0;
              overflow: clip;
              transition: block-size 0.35s ease, content-visibility 0.35s allow-discrete;
            }
            .rb-faq[open]::details-content { block-size: auto; }
          }
        `}</style>
        <div className="mx-auto max-w-3xl space-y-3">
          {faqs.map((f, i) => (
            <details
              key={f.q}
              name="faq"
              open={i === 0}
              className="rb-faq glass group rounded-2xl open:border-rb-green-500/30 [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex w-full cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-left">
                <span className="text-sm font-semibold sm:text-base">{f.q}</span>
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-rb-green-500/15 text-accent transition-transform group-open:rotate-45">
                  <Plus className="h-4 w-4" />
                </span>
              </summary>
              <p className="px-5 pb-5 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </Container>
  );
}
