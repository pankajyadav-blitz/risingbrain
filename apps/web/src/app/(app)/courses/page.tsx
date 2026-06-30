import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, GraduationCap, Layers, Users, Video } from "lucide-react";

export const metadata: Metadata = {
  title: "Courses — Coming soon · RisingBrain",
  description:
    "Founder-led, structured video courses are on the way. Curated curriculum, hands-on modules and mentorship — launching soon on RisingBrain.",
};

const HIGHLIGHTS = [
  { icon: Layers, label: "Structured curriculum" },
  { icon: Video, label: "Hands-on video modules" },
  { icon: Users, label: "Mentor support" },
  { icon: BadgeCheck, label: "Completion certificates" },
];

export default function CoursesPage() {
  return (
    /* Full-bleed coming-soon that fills the whole viewport between nav and footer. */
    <main className="relative isolate flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-20 text-center">
      {/* Full-page ambient background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[40rem] w-[60rem] max-w-none -translate-x-1/2 rounded-full bg-rb-green-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-rb-green-600/10 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full bg-rb-green-400/10 blur-3xl" />
        {/* Subtle dot grid, faded toward the edges */}
        <div
          className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          style={{
            backgroundImage:
              "radial-gradient(circle, color-mix(in oklab, var(--rb-green-500) 22%, transparent) 1px, transparent 1.5px)",
            backgroundSize: "26px 26px",
          }}
        />
      </div>

      <div className="animate-in mx-auto flex w-full max-w-3xl flex-col items-center">
        <span className="grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20">
          <GraduationCap className="h-9 w-9" />
        </span>

        <div className="mt-7">
          <span className="glass-pill inline-flex items-center rounded-full px-6 py-3 text-base font-semibold uppercase tracking-wide text-accent sm:text-lg">
            Coming soon
          </span>
        </div>

        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Courses are <span className="text-gradient">on the way</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted sm:text-lg">
          We&apos;re building founder-led, structured video courses — curated
          curriculum, hands-on modules and mentorship, all in the same focused
          RisingBrain experience. Sit tight, it&apos;s worth the wait.
        </p>

        {/* What's coming — fills the page with intent */}
        <ul className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
          {HIGHLIGHTS.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="glass-pill inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-foreground"
            >
              <Icon className="h-4 w-4 text-accent" />
              {label}
            </li>
          ))}
        </ul>

        <div className="mt-10 flex justify-center">
          <Link
            href="/sheet"
            className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Start with DSA Sheets
          </Link>
        </div>
      </div>
    </main>
  );
}
