import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { ArrowLeft, Layers, MessageCircle } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/current-user";
import { prisma, PublishStatus } from "@/lib/db";
import { JsonLd } from "@/components/structured-data";
import { SITE_NAME, absoluteUrl } from "@/lib/seo";
import { Container } from "@/components/marketing/primitives";
import { Avatar } from "@/components/marketing/primitives";
import {
  DIFFICULTY_META,
  REVIEW_STATUS_META,
  VERDICT_META,
  monogram,
  timeAgo,
} from "../_lib/format";
import { LikeButton } from "../_components/like-button";
import { Comments } from "../_components/comments";
import { ExperienceBody } from "../_components/experience-body";
import { OwnerActions } from "../_components/owner-actions";
import type { CommentItem } from "../_lib/types";

/**
 * The post, whatever state it is in — who may SEE it is decided by the caller.
 * A post sitting in the review queue still needs a page: its author has to be
 * able to read back what they submitted, and act on a moderator's note.
 */
async function getExperience(slug: string) {
  return prisma.interviewExperience.findUnique({
    where: { slug },
    include: {
      // `authorId` rides along on the row already; it is what decides whether the
      // edit/delete controls render.
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
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const exp = await prisma.interviewExperience.findUnique({
    where: { slug },
    select: { title: true, company: true, role: true, excerpt: true, tags: true, status: true, createdAt: true, updatedAt: true },
  });
  // Unreviewed, rejected and removed posts get a bare, `noindex` head: the page
  // exists for its author, not for search engines, and describing it in metadata
  // would leak an unapproved title into link previews.
  if (!exp || exp.status !== PublishStatus.PUBLISHED) {
    return { title: "Interview experience", robots: { index: false, follow: false } };
  }
  const description = exp.excerpt ?? `${exp.company} · ${exp.role} interview experience.`;
  const url = `/interview/${slug}`;
  return {
    title: exp.title, // template appends "— RisingBrain"
    description,
    keywords: [exp.company, exp.role, "interview experience", ...exp.tags],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: exp.title,
      description,
      publishedTime: exp.createdAt.toISOString(),
      modifiedTime: exp.updatedAt.toISOString(),
      tags: exp.tags,
    },
    twitter: { card: "summary_large_image", title: exp.title, description },
  };
}

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [current, exp] = await Promise.all([
    getCurrentUser(),
    getExperience(slug),
  ]);

  if (!exp) {
    // Posts were addressed by primary key before slugs, and those links are in
    // the wild (they were the ones in sitemap.xml). Send a still-valid id to the
    // canonical URL permanently, so search engines move their equity across.
    const legacy = await prisma.interviewExperience.findUnique({
      where: { id: slug },
      select: { slug: true },
    });
    if (legacy) permanentRedirect(`/interview/${legacy.slug}`);
    notFound();
  }

  const isAuthor = current?.id === exp.authorId;
  const isAdmin = current?.role === "ADMIN";
  const published = exp.status === PublishStatus.PUBLISHED;
  // The moderation gate. A post that has not been approved is readable only by
  // the person who wrote it and by the moderators who rule on it; to everyone
  // else it does not exist — the same 404 an unknown id gets, so the URL can't
  // be used to confirm that a queued post is there.
  if (!published && !isAuthor && !isAdmin) notFound();

  const signedIn = Boolean(current);
  const review = REVIEW_STATUS_META[exp.status];
  const ReviewIcon = review.icon;
  let liked = false;
  if (current && published) {
    const like = await prisma.interviewLike.findUnique({
      where: {
        userId_experienceId: { userId: current.id, experienceId: exp.id },
      },
      select: { isActive: true },
    });
    liked = Boolean(like?.isActive);
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

  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: exp.title.slice(0, 110),
    description: exp.excerpt ?? `${exp.company} · ${exp.role} interview experience.`,
    datePublished: exp.createdAt.toISOString(),
    dateModified: exp.updatedAt.toISOString(),
    author: { "@type": "Person", name: authorName },
    keywords: [exp.company, exp.role, ...exp.tags].join(", "),
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: absoluteUrl(`/interview/${exp.slug}`),
  };

  return (
    <main className="flex-1">
      {/* Structured data describes public content — a post nobody outside this
          page can read has none to describe. */}
      {published && <JsonLd data={articleLd} />}
      <Container>
        <article className="mx-auto max-w-3xl py-10 sm:py-14">
          <Link
            href="/interview"
            className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> All experiences
          </Link>

          {/* Moderation banner — only ever rendered for the author or an admin,
              since nobody else can reach a non-published post. It explains where
              the write-up stands and, on a rejection, what to fix. */}
          {!published && (
            <div className="glass animate-in mb-5 rounded-3xl p-5">
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${review.pill}`}
                >
                  <ReviewIcon className="h-4 w-4" />
                  {review.label}
                </span>
                <p className="min-w-0 flex-1 text-sm leading-relaxed text-muted">{review.blurb}</p>
              </div>
              {exp.reviewNote && (
                <p className="mt-3 rounded-2xl bg-surface-2/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                  <span className="font-medium text-muted">Moderator note: </span>
                  “{exp.reviewNote}”
                </p>
              )}
            </div>
          )}

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

            <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
              <Avatar
                name={authorName}
                src={exp.author.image ?? undefined}
                className="h-9 w-9 text-xs"
              />
              <div className="leading-tight">
                <p className="text-sm font-medium text-foreground">
                  {authorName}
                </p>
                <p className="text-xs text-muted">
                  {timeAgo(exp.createdAt)}
                  {exp.updatedAt.getTime() - exp.createdAt.getTime() > 60_000 && (
                    <> · edited</>
                  )}
                </p>
              </div>
              {isAuthor && (
                <div className="ml-auto">
                  <OwnerActions experienceId={exp.id} />
                </div>
              )}
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
          <ExperienceBody body={exp.body} />

          {/* Like bar + replies. Both endpoints 404 on an unpublished post (a
              queued write-up has no public audience yet), so the controls stay
              out of the author's preview rather than sitting there dead. */}
          {published && (
            <>
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
            </>
          )}
        </article>
      </Container>
    </main>
  );
}
