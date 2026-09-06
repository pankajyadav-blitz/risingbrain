"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Layers,
  Loader2,
  MessageCircle,
  MessagesSquare,
  PenLine,
  Search,
  SlidersHorizontal,
  TriangleAlert,
  X,
} from "lucide-react";
import { Avatar } from "@/components/marketing/primitives";
import { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";
import type { FeedExperience } from "../_lib/types";
import type { FeedParams, FeedSort } from "../_data";
import { DIFFICULTY_META, VERDICT_META, monogram } from "../_lib/format";
import { LikeButton } from "./like-button";
import { Composer } from "./composer";

const VERDICT_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "All" },
  { value: InterviewVerdict.SELECTED, label: "Selected" },
  { value: InterviewVerdict.REJECTED, label: "Rejected" },
  { value: InterviewVerdict.PENDING, label: "Pending" },
];

const DIFFICULTY_CHIPS: { value: string; label: string }[] = [
  { value: "", label: "Any" },
  { value: Difficulty.EASY, label: "Easy" },
  { value: Difficulty.MEDIUM, label: "Medium" },
  { value: Difficulty.HARD, label: "Hard" },
];

const SORT_CHIPS: { value: FeedSort; label: string }[] = [
  { value: "new", label: "Newest" },
  { value: "top", label: "Top" },
];

export function InterviewFeed({
  experiences,
  signedIn,
  pendingSubmission,
  datasetEmpty,
  filters,
  page,
  totalPages,
  filteredTotal,
  globalTotal,
}: {
  experiences: FeedExperience[];
  signedIn: boolean;
  /** The author's write-up already waiting on review, if they have one. */
  pendingSubmission: { slug: string; title: string } | null;
  datasetEmpty: boolean;
  filters: FeedParams;
  page: number;
  totalPages: number;
  filteredTotal: number;
  globalTotal: number;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [composerOpen, setComposerOpen] = useState(false);
  /** Set when Share is pressed while a submission is already in the queue. */
  const [blocked, setBlocked] = useState(false);
  const [query, setQuery] = useState(filters.q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep the input in sync if the URL changes elsewhere (Clear, back/forward).
  useEffect(() => setQuery(filters.q), [filters.q]);

  /** Push updated params to the URL → the server re-queries the DB. */
  const pushParams = useCallback(
    (
      updates: Record<string, string | number | null>,
      opts: { resetPage?: boolean; scroll?: boolean } = {}
    ) => {
      const { resetPage = true, scroll = false } = opts;
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") sp.delete(key);
        else sp.set(key, String(value));
      }
      if (resetPage) sp.delete("page");
      const qs = sp.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll }));
    },
    [pathname, router, searchParams]
  );

  function onQueryChange(value: string) {
    setQuery(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => pushParams({ q: value.trim() || null }), 350);
  }

  function resetFilters() {
    setQuery("");
    pushParams({ q: null, verdict: null, difficulty: null });
  }

  function onShare() {
    if (!signedIn) {
      router.push("/login");
      return;
    }
    // An author may only have one write-up in the queue at a time, and the API
    // enforces it. Saying so here — rather than opening the composer and
    // rejecting the finished post — is the difference between a rule and a trap.
    if (pendingSubmission) {
      setBlocked(true);
      return;
    }
    setComposerOpen(true);
  }

  const filtersActive =
    filters.q !== "" || filters.verdict !== null || filters.difficulty !== null;
  const shareLabel = !signedIn
    ? "Sign in to share your experience"
    : pendingSubmission
      ? "One experience is already in review"
      : "Share your experience";

  /** The warning, once Share has been pressed with a submission still queued. */
  const pendingNotice = blocked && pendingSubmission && (
    <div
      role="alert"
      className="animate-in mx-auto mt-4 flex max-w-xl items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3.5 text-left"
    >
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
      <div className="min-w-0 text-sm leading-relaxed text-muted">
        <p className="font-semibold text-foreground">
          You already have an experience waiting for review
        </p>
        <p className="mt-0.5">
          A moderator reads every write-up before it reaches the feed, and one at a time keeps
          that queue moving. You can keep editing{" "}
          <Link
            href={`/interview/${pendingSubmission.slug}`}
            className="font-medium text-accent hover:underline"
          >
            {pendingSubmission.title}
          </Link>{" "}
          in the meantime — once it has been reviewed, you can post another.
        </p>
      </div>
      <button
        type="button"
        onClick={() => setBlocked(false)}
        aria-label="Dismiss"
        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );

  /** Share is styled down to a quiet pill while it can't actually be used. */
  const shareCls = pendingSubmission
    ? "glass-pill inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-muted"
    : "btn-glow inline-flex items-center gap-2 rounded-full bg-rb-green-500 px-6 py-3 text-sm font-semibold text-black";

  // Truly empty table → invite the first contribution (no filter UI).
  if (datasetEmpty) {
    return (
      <>
        <div className="glass animate-in mx-auto max-w-xl rounded-3xl px-6 py-14 text-center sm:px-10">
          <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-accent ring-1 ring-rb-green-500/20">
            <MessagesSquare className="h-7 w-7" />
          </span>
          <h3 className="mt-6 text-xl font-bold tracking-tight">No experiences yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Be the first to share what your interview was really like — the questions, the rounds,
            and the verdict. Your story helps the next candidate walk in prepared.
          </p>
          <button type="button" onClick={onShare} className={`mt-7 ${shareCls}`}>
            <PenLine className="h-4 w-4" />
            {shareLabel}
          </button>
          {pendingNotice}
        </div>
        {composerOpen && <Composer onClose={() => setComposerOpen(false)} />}
      </>
    );
  }

  return (
    <div>
      {/* Share CTA */}
      <div className="mb-6">
        <div className="flex justify-center">
          <button type="button" onClick={onShare} className={shareCls}>
            <PenLine className="h-4 w-4" />
            {shareLabel}
          </button>
        </div>
        {pendingNotice}
      </div>

      {/* Filter / search bar */}
      <div className="glass animate-in mb-4 rounded-2xl p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search company, role or title…"
              aria-label="Search experiences"
              className="w-full rounded-xl border border-border bg-surface/60 py-2.5 pl-10 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-rb-green-500/50 focus:ring-2 focus:ring-rb-green-500/20"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  pushParams({ q: null });
                }}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-muted transition-colors hover:bg-surface-2 hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <ChipRow>
              {VERDICT_CHIPS.map((c) => (
                <Chip
                  key={c.label}
                  active={(filters.verdict ?? "") === c.value}
                  onClick={() => pushParams({ verdict: c.value || null })}
                >
                  {c.label}
                </Chip>
              ))}
            </ChipRow>
            <span className="hidden h-5 w-px bg-border sm:block" />
            <ChipRow>
              <SlidersHorizontal className="mr-0.5 h-3.5 w-3.5 text-muted" />
              {DIFFICULTY_CHIPS.map((c) => (
                <Chip
                  key={c.label}
                  active={(filters.difficulty ?? "") === c.value}
                  onClick={() => pushParams({ difficulty: c.value || null })}
                >
                  {c.label}
                </Chip>
              ))}
            </ChipRow>
          </div>
        </div>
      </div>

      {/* Results toolbar: count + clear on the left, sort on the right */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
        <p className="flex items-center gap-2 text-sm text-muted">
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />}
          <span>
            {filtersActive ? (
              <>
                <span className="font-semibold tabular-nums text-foreground">{filteredTotal}</span>{" "}
                of {globalTotal}
              </>
            ) : (
              <span className="font-semibold tabular-nums text-foreground">{globalTotal}</span>
            )}{" "}
            {globalTotal === 1 && !filtersActive ? "experience" : "experiences"}
          </span>
          {filtersActive && (
            <button
              type="button"
              onClick={resetFilters}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
        </p>

        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-muted">Sort</span>
          {SORT_CHIPS.map((s) => (
            <Chip
              key={s.value}
              active={filters.sort === s.value}
              onClick={() => pushParams({ sort: s.value === "new" ? null : s.value })}
            >
              {s.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Results */}
      {experiences.length === 0 ? (
        <div className="glass animate-in rounded-3xl px-6 py-16 text-center">
          <p className="text-sm font-medium text-foreground">No experiences match your filters.</p>
          <p className="mt-1 text-sm text-muted">Try a different search, or widen the filters.</p>
          <button
            type="button"
            onClick={resetFilters}
            className="glass-pill glass-hover mt-5 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-accent"
          >
            <X className="h-4 w-4" /> Clear filters
          </button>
        </div>
      ) : (
        <div
          aria-busy={isPending}
          className={`grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${
            isPending ? "pointer-events-none opacity-60" : ""
          }`}
        >
          {experiences.map((e) => (
            <ExperienceCard key={e.id} exp={e} signedIn={signedIn} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && experiences.length > 0 && (
        <nav
          className="mt-10 flex items-center justify-center gap-3"
          aria-label="Pagination"
        >
          <PagerButton
            disabled={page <= 1 || isPending}
            onClick={() => pushParams({ page: page - 1 }, { resetPage: false, scroll: true })}
          >
            <ChevronLeft className="h-4 w-4" /> Prev
          </PagerButton>
          <span className="text-sm text-muted">
            Page <span className="font-semibold tabular-nums text-foreground">{page}</span> of{" "}
            <span className="tabular-nums">{totalPages}</span>
          </span>
          <PagerButton
            disabled={page >= totalPages || isPending}
            onClick={() => pushParams({ page: page + 1 }, { resetPage: false, scroll: true })}
          >
            Next <ChevronRight className="h-4 w-4" />
          </PagerButton>
        </nav>
      )}

      {composerOpen && <Composer onClose={() => setComposerOpen(false)} />}
    </div>
  );
}

function ExperienceCard({ exp, signedIn }: { exp: FeedExperience; signedIn: boolean }) {
  const verdict = VERDICT_META[exp.verdict];
  const difficulty = DIFFICULTY_META[exp.difficulty];
  const VerdictIcon = verdict.icon;
  const authorName = exp.author.name ?? "Anonymous";

  return (
    <Link
      href={`/interview/${exp.slug}`}
      data-exp-id={exp.id}
      className="group glass glass-hover animate-in flex h-full flex-col rounded-3xl p-5 transition-transform duration-300 hover:-translate-y-1"
    >
      {/* Header */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-rb-green-400/25 to-rb-green-600/10 text-sm font-bold text-accent ring-1 ring-rb-green-500/20">
            {monogram(exp.company)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate font-semibold leading-tight text-foreground">{exp.company}</h3>
            <p className="truncate text-sm text-muted">{exp.role}</p>
          </div>
        </div>
        <span
          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ${verdict.pill}`}
        >
          <VerdictIcon className="h-3.5 w-3.5" />
          {verdict.label}
        </span>
      </div>

      {/* Meta chips */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${difficulty.pill}`}>
          {difficulty.label}
        </span>
        <span className="glass-pill inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-muted">
          <Layers className="h-3 w-3" />
          {exp.roundsCount} {exp.roundsCount === 1 ? "round" : "rounds"}
        </span>
      </div>

      {/* Title + excerpt */}
      <h4 className="mb-1.5 font-semibold leading-snug text-foreground transition-colors group-hover:text-accent">
        {exp.title}
      </h4>
      {exp.excerpt && (
        <p className="mb-4 line-clamp-3 text-sm leading-relaxed text-muted">{exp.excerpt}</p>
      )}

      {/* Tags */}
      {exp.tags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {exp.tags.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-muted"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-4">
        <div className="flex min-w-0 items-center gap-2">
          <Avatar
            name={authorName}
            src={exp.author.image ?? undefined}
            className="h-7 w-7 text-[10px]"
          />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-medium text-foreground">{authorName}</p>
            <p className="text-[11px] text-muted">{exp.createdAtLabel}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-sm text-muted">
            <MessageCircle className="h-4 w-4" />
            <span className="tabular-nums">{exp.commentCount}</span>
          </span>
          <LikeButton
            experienceId={exp.id}
            initialLiked={exp.liked}
            initialCount={exp.likeCount}
            signedIn={signedIn}
          />
        </div>
      </div>
    </Link>
  );
}

function PagerButton({
  disabled,
  onClick,
  children,
}: {
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="glass-pill glass-hover inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground transition-opacity disabled:pointer-events-none disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-1.5">{children}</div>;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
        active
          ? "bg-rb-green-500/15 text-brand ring-1 ring-rb-green-500/30"
          : "glass-pill text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
