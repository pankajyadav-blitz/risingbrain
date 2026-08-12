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

  /**
   * Each section leads with ONE headline count — the unit that actually measures
   * how much content the section holds — and carries the rest as a quiet
   * supporting line. The counts are wildly uneven per section (Sheets has five,
   * Users has one), and giving them all equal weight left the dense cards cramped
   * and the sparse ones looking unfinished.
   */
  const sections = [
    {
      href: "/admin/sheets",
      icon: ListTodo,
      title: "Sheets (DSA)",
      blurb: "Sheets, topics, patterns, problems & companies.",
      primary: { label: "Problems", value: problems },
      secondary: [
        ["sheets", sheets],
        ["topics", topics],
        ["patterns", patterns],
        ["companies", companies],
      ] as const,
    },
    {
      href: "/admin/domain",
      icon: Database,
      title: "Domain",
      blurb: "OOPS · DBMS · OS · CN · SQL topic notes.",
      primary: { label: "Topics", value: domainTopics },
      secondary: [] as const,
    },
    {
      href: "/admin/screening",
      icon: NotebookPen,
      title: "Screening",
      blurb: "Aptitude / reasoning / puzzle MCQs.",
      primary: { label: "Questions", value: quizQuestions },
      secondary: [
        ["categories", quizCats],
        ["topics", quizTopics],
      ] as const,
    },
    {
      href: "/admin/users",
      icon: Users,
      title: "Users",
      blurb: "Search by email · change role · disable.",
      primary: { label: "Accounts", value: users },
      secondary: [] as const,
    },
  ];

  return (
    // `pb-10` rather than a symmetric `py-6`: this page owns its scroll now, and a
    // scrollport that ends flush with its last card reads as truncated.
    <div className="mx-auto max-w-5xl px-4 pb-10 pt-6 sm:px-6">
      {/* `items-start` so the button stays aligned to the first line once the copy
          wraps, instead of drifting to the middle of a two-line paragraph. */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <p className="max-w-prose text-sm leading-relaxed text-muted">
          Edit every content tree below. Changes save to the database and refresh the public pages
          immediately.
        </p>
        <RevalidateButton />
      </div>

      {/* Exactly four sections, so a 2×2 grid stays balanced at every width — a
          three-column track would strand the fourth card alone on its own row. */}
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.href}
              href={s.href}
              className="glass glass-hover group flex flex-col rounded-3xl p-5"
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rb-green-500/15 text-accent ring-1 ring-rb-green-500/20 transition-colors group-hover:bg-rb-green-500/25">
                  <Icon className="h-5 w-5" />
                </span>
                <h2 className="min-w-0 truncate text-base font-semibold text-foreground">
                  {s.title}
                </h2>
                <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-accent" />
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted">{s.blurb}</p>

              {/* `mt-auto` pins the figures to the bottom edge so they line up
                  across cards whose blurbs run to different lengths. */}
              <div className="mt-auto pt-5">
                <div className="flex items-baseline gap-2 border-t border-border/70 pt-4">
                  <span className="text-3xl font-bold leading-none tabular-nums text-foreground">
                    {s.primary.value}
                  </span>
                  <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted">
                    {s.primary.label}
                  </span>
                </div>
                {s.secondary.length > 0 ? (
                  <p className="mt-2.5 text-xs tabular-nums text-muted">
                    {s.secondary.map(([label, value]) => `${value} ${label}`).join(" · ")}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
