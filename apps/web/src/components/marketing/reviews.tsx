import { Quote } from "lucide-react";
import { Avatar, Container, Eyebrow, Stars } from "./primitives";

type Review = {
  name: string;
  role: string;
  college: string;
  text: string;
};

const reviews: Review[] = [
  {
    name: "Priya Sharma",
    role: "SDE-1 @ Amazon",
    college: "NIT Bhopal",
    text: "The pattern-first sheet completely changed how I see problems. I stopped memorising and started recognising shapes — cleared Amazon's loop in my first attempt.",
  },
  {
    name: "Rahul Verma",
    role: "Software Engineer @ Walmart",
    college: "PSIT Kanpur",
    text: "Coming from a tier-3 college with zero coding culture, RisingBrain was my roadmap. The Last-Minute 100 saved me the night before my final round.",
  },
  {
    name: "Sneha Iyer",
    role: "SDE @ Microsoft",
    college: "VIT Vellore",
    text: "Anjali's explanations are gold. The interview stories told me exactly what to expect. Worth every single hour I put in.",
  },
  {
    name: "Aditya Kulkarni",
    role: "SDE @ Atlassian",
    college: "COEP Pune",
    text: "I'd grinded random LeetCode for months with no structure. Two months on RisingBrain's 85 patterns and everything finally clicked.",
  },
  {
    name: "Megha Nair",
    role: "Backend Engineer @ Flipkart",
    college: "CUSAT Kochi",
    text: "The SQL section is criminally underrated — problem, approach and clean query side by side. I aced the data round because of it.",
  },
  {
    name: "Karan Mehta",
    role: "Analyst @ Goldman Sachs",
    college: "DTU Delhi",
    text: "Aptitude drills + DSA sheets in one place meant I never tab-hopped across 5 sites. Consistency got me the offer.",
  },
  {
    name: "Ananya Reddy",
    role: "SDE-1 @ Google",
    college: "IIIT Hyderabad",
    text: "The graph and DP patterns were exactly what showed up in my Google loop. Talking through brute-force first, like the sheet teaches, made all the difference.",
  },
  {
    name: "Vikram Singh",
    role: "SWE @ Uber",
    college: "NIT Surathkal",
    text: "What sold me was the structure. Each pattern has an identification cue, so in the interview I knew within seconds which tool to reach for.",
  },
  {
    name: "Fatima Khan",
    role: "Software Engineer @ Microsoft",
    college: "Jamia Millia Islamia",
    text: "I revised the whole Last-Minute 100 in two evenings before my final. Three of those exact patterns came up. Surreal.",
  },
  {
    name: "Rohan Das",
    role: "SDE @ Razorpay",
    college: "KIIT Bhubaneswar",
    text: "The interview experiences section is a cheat code — reading real rounds from people who got in told me how to pace myself and what to ask.",
  },
  {
    name: "Ishita Gupta",
    role: "Backend Engineer @ Swiggy",
    college: "BIT Mesra",
    text: "Notes on each problem meant my revision was mine — my intuition, my edge cases. By round two I barely needed to re-read solutions.",
  },
  {
    name: "Arjun Pillai",
    role: "SDE-1 @ Meta",
    college: "Anna University",
    text: "From a college nobody recruits at to a Meta offer. The honest answer is consistency on one focused platform instead of ten scattered ones.",
  },
];

function ReviewCard({ r }: { r: Review }) {
  return (
    <div className="glass glass-hover flex w-[19rem] shrink-0 flex-col rounded-3xl p-6 sm:w-[21rem]">
      <Quote className="h-7 w-7 text-rb-green-500/40" />
      <blockquote className="mt-3 flex-1 text-sm leading-relaxed text-muted">“{r.text}”</blockquote>
      <div className="mt-5 flex items-center gap-3 border-t border-border pt-4">
        <Avatar name={r.name} />
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{r.name}</div>
          <div className="truncate text-xs text-accent">{r.role}</div>
          <div className="truncate text-xs text-muted">{r.college}</div>
        </div>
        <div className="ml-auto self-start">
          <Stars />
        </div>
      </div>
    </div>
  );
}

/** One auto-scrolling row. The list is rendered twice so the loop is seamless. */
function MarqueeRow({ items, direction }: { items: Review[]; direction: "left" | "right" }) {
  return (
    <div className="flex w-max" style={{ animation: `${direction === "left" ? "rb-marq-l" : "rb-marq-r"} 120s linear infinite` }}>
      <div className="flex gap-5 pr-5" aria-hidden={false}>
        {items.map((r) => (
          <ReviewCard key={r.name} r={r} />
        ))}
      </div>
      <div className="flex gap-5 pr-5" aria-hidden>
        {items.map((r) => (
          <ReviewCard key={`${r.name}-dup`} r={r} />
        ))}
      </div>
    </div>
  );
}

export function Reviews() {
  return (
    <section id="reviews" className="py-16">
      {/* Scoped marquee animation — slow, seamless, pauses on hover. */}
      <style>{`
        @keyframes rb-marq-l { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes rb-marq-r { from { transform: translateX(-50%); } to { transform: translateX(0); } }
        .rb-marquee:hover [style*="rb-marq"] { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .rb-marquee [style*="rb-marq"] { animation: none !important; }
        }
      `}</style>

      <Container>
        <div className="mb-10 text-center">
          <div className="mb-4">
            <Eyebrow>
              <span className="h-1.5 w-1.5 rounded-full bg-rb-green-400" />
              Loved by learners
            </Eyebrow>
          </div>
          <h2 className="text-2xl font-bold sm:text-3xl">
            What our <span className="text-gradient">students say</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted">
            Real stories from learners who turned consistent practice into product-company offers.
          </p>
        </div>
      </Container>

      {/* Full-bleed single-row marquee with soft edge fades. The vertical
          padding gives the cards' hover lift + shadow room inside the clipped
          container (otherwise overflow-hidden cuts off the top border on hover). */}
      <div
        className="rb-marquee relative overflow-hidden py-6"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 6%, black 94%, transparent)",
        }}
      >
        <MarqueeRow items={reviews} direction="left" />
      </div>
    </section>
  );
}
