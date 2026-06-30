import Link from "next/link";
import { ArrowRight, BookOpen, Sparkles } from "lucide-react";
import { Avatar, Container, Stars } from "./primitives";

const proofNames = ["Priya Sharma", "Rahul Verma", "Sneha Iyer", "Aditya Kulkarni", "Karan Mehta"];

export function Hero() {
  return (
    <Container className="text-center">
      <section className="relative py-16 sm:py-24">
        <span className="glass-pill animate-in mx-auto mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm text-accent">
          <Sparkles className="h-4 w-4" />
          Founded by Anjali Kumari · ex-Walmart &amp; Morgan Stanley
        </span>
        <h1 className="animate-in mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Crack your dream <span className="text-gradient">product company</span>
          <br />
          from any college.
        </h1>
        <p className="animate-in mx-auto mt-6 max-w-2xl text-lg text-muted">
          RisingBrain is the founder-led, pattern-first placement platform that took students from
          tier-2 &amp; tier-3 colleges to Amazon, Microsoft, Walmart and beyond — with curated
          sheets, a real coding arena, live contests and mentorship, all in one place.
        </p>
        <div className="animate-in mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/signup"
            className="btn-glow inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Start learning free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/courses"
            className="glass glass-hover inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            <BookOpen className="h-4 w-4" /> Browse courses
          </Link>
        </div>

        <div className="animate-in mt-12 flex flex-col items-center gap-3">
          <div className="flex items-center">
            <div className="flex -space-x-3">
              {proofNames.map((name) => (
                <Avatar
                  key={name}
                  name={name}
                  className="h-10 w-10 border-2 border-background text-xs"
                />
              ))}
            </div>
            <span className="glass-pill ml-3 rounded-full px-3 py-1.5 text-xs font-semibold text-accent">
              +50k learners
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Stars />
            <span>
              Rated <strong className="text-foreground">4.9/5</strong> · placed at Amazon, Microsoft,
              Walmart &amp; more
            </span>
          </div>
        </div>
      </section>
    </Container>
  );
}
