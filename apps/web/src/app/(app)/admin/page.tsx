import Link from "next/link";
import { ListTodo, Database, NotebookPen, Users, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { RevalidateButton } from "./_components/revalidate-button";

/**
 * Admin overview: at-a-glance content counts + entry points into each section
 * editor, plus a manual cache-refresh (the editors already bust caches on every
 * write; this is a belt-and-braces button, e.g. after a re-seed).
 */
export default async function AdminOverviewPage() {
  const [sheets, topics, patterns, problems, companies, domainTopics, quizCats, quizTopics, quizQuestions, users] =
    await Promise.all([
      prisma.dsaSheet.count(),
      prisma.dsaTopic.count(),
      prisma.dsaPattern.count(),
      prisma.dsaProblem.count(),
      prisma.company.count(),
      prisma.domainTopic.count(),
      prisma.quizCategory.count(),
      prisma.quizTopic.count(),
      prisma.quizQuestion.count(),
      prisma.user.count(),
    ]);

  const sections = [
    {
      href: "/admin/sheets",
      icon: ListTodo,
      title: "Sheets (DSA)",
      blurb: "Sheets, topics, patterns, problems & companies.",
      stats: [
        ["Sheets", sheets],
        ["Topics", topics],
        ["Patterns", patterns],
        ["Problems", problems],
        ["Companies", companies],
      ] as const,
    },
    {
      href: "/admin/domain",
      icon: Database,
      title: "Domain",
      blurb: "OOPS · DBMS · OS · CN · SQL topic notes.",
      stats: [["Topics", domainTopics]] as const,
    },
    {
      href: "/admin/screening",
      icon: NotebookPen,
      title: "Screening",
      blurb: "Aptitude / reasoning / puzzle MCQs.",
      stats: [
        ["Categories", quizCats],
        ["Topics", quizTopics],
        ["Questions", quizQuestions],
      ] as const,
    },
    {
      href: "/admin/users",
      icon: Users,
      title: "Users",
      blurb: "Search by email · change role · disable.",
      stats: [["Users", users]] as const,
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">
          Edit every content tree below. Changes save to the database and refresh the public pages
          immediately.
        </p>
        <RevalidateButton />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="glass glass-hover group flex flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rb-green-500/15 text-accent ring-1 ring-rb-green-500/20">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="text-base font-semibold text-foreground">{s.title}</h2>
                <ArrowRight className="ml-auto h-4 w-4 text-muted transition-transform group-hover:translate-x-0.5" />
              </div>
              <p className="mb-4 text-sm text-muted">{s.blurb}</p>
              <dl className="mt-auto flex flex-wrap gap-x-4 gap-y-1.5">
                {s.stats.map(([label, value]) => (
                  <div key={label} className="flex items-baseline gap-1.5">
                    <dd className="text-lg font-bold tabular-nums text-foreground">{value}</dd>
                    <dt className="text-xs text-muted">{label}</dt>
                  </div>
                ))}
              </dl>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
