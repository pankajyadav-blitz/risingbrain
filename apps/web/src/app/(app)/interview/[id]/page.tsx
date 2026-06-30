import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Layers, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma } from "@/lib/db";
import { Container } from "@/components/marketing/primitives";
import { Avatar } from "@/components/marketing/primitives";
import {
  DIFFICULTY_META,
  VERDICT_META,
  monogram,
  timeAgo,
} from "../_lib/format";
import { LikeButton } from "../_components/like-button";
import { Comments } from "../_components/comments";
import type { CommentItem } from "../_lib/types";

async function getExperience(id: string) {
  return prisma.interviewExperience.findFirst({
    where: { id, status: "PUBLISHED" },
    include: {
      author: { select: { name: true, image: true } },
      comments: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { name: true, image: true } },
        },
      },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const exp = await prisma.interviewExperience.findFirst({
    where: { id, status: "PUBLISHED" },
    select: { title: true, company: true, role: true, excerpt: true },
  });
  if (!exp) return { title: "Interview experience — RisingBrain" };
  return {
    title: `${exp.title} — RisingBrain`,
    description:
      exp.excerpt ?? `${exp.company} · ${exp.role} interview experience.`,
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [current, exp] = await Promise.all([
    getCurrentUser(),
    getExperience(id),
  ]);

  if (!exp) notFound();

  const signedIn = Boolean(current);
  let liked = false;
  if (current) {
    const like = await prisma.interviewLike.findUnique({
      where: {
        userId_experienceId: { userId: current.id, experienceId: exp.id },
      },
      select: { id: true },
    });
    liked = Boolean(like);
  }

  const verdict = VERDICT_META[exp.verdict];
  const difficulty = DIFFICULTY_META[exp.difficulty];
  const VerdictIcon = verdict.icon;
  const authorName = exp.author.name ?? "Anonymous";
  const comments: CommentItem[] = exp.comments.map((c) => ({
    id: c.id,
    body: c.body,
    createdAt: c.createdAt.toISOString(),
    createdAtLabel: timeAgo(c.createdAt),
    author: { name: c.author.name, image: c.author.image },
  }));

  return (
    <main className="flex-1">
      <Container>
        <article className="mx-auto max-w-3xl py-10 sm:py-14">
          <Link
            href="/interview"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All experiences
          </Link>

          {/* Header */}
          <header className="glass animate-in rounded-3xl p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3.5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-base font-bold text-accent ring-1 ring-rb-green-500/20">
                  {monogram(exp.company)}
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {exp.company}
                  </h2>
                  <p className="truncate text-sm text-muted">{exp.role}</p>
                </div>
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${verdict.pill}`}
              >
                <VerdictIcon className="h-4 w-4" />
                {verdict.label}
              </span>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${difficulty.pill}`}
              >
                {difficulty.label}
              </span>
              <span className="glass-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted">
                <Layers className="h-3 w-3" />
                {exp.roundsCount} {exp.roundsCount === 1 ? "round" : "rounds"}
              </span>
            </div>

            <h1 className="mt-5 text-2xl font-bold leading-tight tracking-tight text-foreground sm:text-3xl">
              {exp.title}
            </h1>

            <div className="mt-5 flex items-center gap-3 border-t border-border pt-5">
              <Avatar
                name={authorName}
                src={exp.author.image ?? undefined}
                className="h-9 w-9 text-xs"
              />
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">
                  {authorName}
                </p>
                <p className="text-xs text-muted">{timeAgo(exp.createdAt)}</p>
              </div>
            </div>

            {exp.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {exp.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-muted"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Body */}
          <div
            className="prose-doc mt-8 space-y-3 leading-relaxed text-foreground/90 [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-rb-green-500/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_p]:leading-relaxed [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: bodyHtml(exp.body) }}
          />

          {/* Like bar */}
          <div className="mt-8 flex items-center gap-3 border-t border-border pt-6">
            <LikeButton
              experienceId={exp.id}
              initialLiked={liked}
              initialCount={exp.likeCount}
              signedIn={signedIn}
              size="lg"
            />
            <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-muted">
              <MessageCircle className="h-4 w-4" />
              <span className="tabular-nums">{comments.length}</span>
              {comments.length === 1 ? "comment" : "comments"}
            </span>
          </div>

          <Comments
            experienceId={exp.id}
            initialComments={comments}
            signedIn={signedIn}
          />
        </article>
      </Container>
    </main>
  );
}

/**
 * Render the stored body. Composer bodies are HTML; legacy/plain-text bodies
 * carry no tags, so wrap them in a paragraph with line breaks preserved.
 */
function bodyHtml(body: string): string {
  const looksHtml = /<[a-z][\s\S]*>/i.test(body);
  if (looksHtml) return body;
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");
  return `<p>${escaped}</p>`;
}
