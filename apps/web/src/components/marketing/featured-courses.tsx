import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Database,
  ListChecks,
  Network,
  Rocket,
  Star,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Container, Eyebrow, GlassCard } from "./primitives";

type Level = "Beginner" | "Intermediate" | "Advanced";

type Course = {
  slug: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  level: Level;
  price: number; // 0 = free
  rating: number;
  learners: string;
  instructor: string;
};

const courses: Course[] = [
  {
    slug: "dsa-mastery",
    title: "DSA Mastery: Patterns to Product Companies",
    blurb:
      "85 topic-wise patterns across 496+ problems, sequenced exactly the way top product companies test.",
    icon: ListChecks,
    level: "Intermediate",
    price: 2999,
    rating: 4.9,
    learners: "32k",
    instructor: "Anjali Kumari",
  },
  {
    slug: "30-day-dsa-challenge",
    title: "30-Day DSA Challenge",
    blurb:
      "Anjali's signature challenge — one focused topic a day to build unstoppable consistency before placement season.",
    icon: Rocket,
    level: "Intermediate",
    price: 0,
    rating: 4.8,
    learners: "48k",
    instructor: "Anjali Kumari",
  },
  {
    slug: "sql-for-interviews",
    title: "SQL for Interviews",
    blurb:
      "From joins to window functions — problem, best approach and clean query side by side, tuned for data rounds.",
    icon: Database,
    level: "Beginner",
    price: 0,
    rating: 4.7,
    learners: "21k",
    instructor: "RisingBrain Team",
  },
  {
    slug: "system-design-fundamentals",
    title: "System Design Fundamentals",
    blurb:
      "Scalability, caching, sharding and real architectures — everything you need for the HLD interview round.",
    icon: Network,
    level: "Advanced",
    price: 3499,
    rating: 4.9,
    learners: "14k",
    instructor: "Anjali Kumari",
  },
];

const levelStyles: Record<Level, string> = {
  Beginner: "text-rb-green-300 bg-rb-green-500/15 border-rb-green-500/30",
  Intermediate: "text-amber-300 bg-amber-400/10 border-amber-400/30",
  Advanced: "text-rose-300 bg-rose-400/10 border-rose-400/30",
};

function CourseCard({ course }: { course: Course }) {
  const Icon = course.icon;
  const free = course.price === 0;
  return (
    <Link href={`/courses/${course.slug}`} className="group block h-full">
      <GlassCard hover className="flex h-full flex-col p-6">
        <div className="mb-4 flex items-center justify-between">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-rb-green-500/15 text-accent">
            <Icon className="h-5 w-5" />
          </span>
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${levelStyles[course.level]}`}
          >
            {course.level}
          </span>
        </div>

        <h3 className="text-base font-semibold leading-snug">{course.title}</h3>
        <p className="mt-1.5 flex-1 text-sm text-muted">{course.blurb}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1">
            <Star className="h-3.5 w-3.5 fill-accent text-accent" />
            {course.rating}
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> {course.learners} learners
          </span>
        </div>

        <div className="mt-3 text-xs text-muted">By {course.instructor}</div>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="text-lg font-bold">
            {free ? (
              <span className="text-accent">Free</span>
            ) : (
              <>₹{course.price.toLocaleString("en-IN")}</>
            )}
          </span>
          <span className="btn-glow inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold">
            {free ? "Start free" : "Enroll now"}
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </GlassCard>
    </Link>
  );
}

export function FeaturedCourses() {
  return (
    <Container>
      <section id="courses" className="py-16">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-4">
              <Eyebrow>
                <BookOpen className="h-4 w-4" />
                Courses
              </Eyebrow>
            </div>
            <h2 className="text-2xl font-bold sm:text-3xl">
              Founder-led <span className="text-gradient">courses</span>
            </h2>
            <p className="mt-2 max-w-xl text-muted">
              Structured, placement-focused tracks — from DSA patterns to system design — taught by
              Anjali and the RisingBrain team.
            </p>
          </div>
          <Link
            href="/courses"
            className="glass glass-hover inline-flex shrink-0 items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold"
          >
            View all courses <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {courses.map((c) => (
            <CourseCard key={c.slug} course={c} />
          ))}
        </div>
      </section>
    </Container>
  );
}
