"use client";

import { useCallback, useId, useRef, useState } from "react";
import { ChevronDown, Lightbulb, Tag } from "lucide-react";
import type { Difficulty } from "@risingbrain/database/enums";
import { GlassCard } from "@/components/marketing/primitives";
import { DifficultyBadge } from "./difficulty-badge";
import { redirectToLogin } from "@/lib/auth/redirect";

/** The light fields SSR-rendered on the list — no heavy content. */
export interface ProblemListItem {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  topic: string | null;
  tags: string[];
}

/** Heavy content fetched lazily from /api/sql/[id]. */
interface ProblemDetail {
  description: string;
  bestApproach: string;
  solutionQuery: string;
}

/**
 * Module-level cache so re-opening a card (or re-hovering) is instant and never
 * re-fetches. Keyed by problem id; stores the in-flight promise so concurrent
 * hover + click share one request.
 */
const detailCache = new Map<string, Promise<ProblemDetail>>();

function fetchDetail(id: string): Promise<ProblemDetail> {
  const cached = detailCache.get(id);
  if (cached) return cached;

  const promise = fetch(`/api/sql/${id}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load problem (${res.status})`);
      return res.json() as Promise<ProblemDetail>;
    })
    .catch((err) => {
      // Don't poison the cache on failure — allow a later retry.
      detailCache.delete(id);
      throw err;
    });

  detailCache.set(id, promise);
  return promise;
}

/** A single SQL problem: light SSR shell + hover-loaded approach & solution. */
export function ProblemCard({ problem, signedIn = false }: { problem: ProblemListItem; signedIn?: boolean }) {
  const [detail, setDetail] = useState<ProblemDetail | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const panelId = useId();

  const load = useCallback(() => {
    if (!signedIn || detail || loadingRef.current) return;
    loadingRef.current = true;
    setError(null);
    fetchDetail(problem.id)
      .then((data) => setDetail(data))
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Something went wrong.")
      )
      .finally(() => {
        loadingRef.current = false;
      });
  }, [detail, problem.id, signedIn]);

  const toggle = useCallback(() => {
    if (!signedIn) { redirectToLogin(); return; }
    load();
    setOpen((v) => !v);
  }, [signedIn, load]);

  return (
    <GlassCard
      hover
      className="overflow-hidden p-6 sm:p-7"
      // Prefetch heavy content on hover/focus so it's ready before the toggle.
    >
      <div
        data-sql-id={problem.id}
        onMouseEnter={load}
        onFocus={load}
        onTouchStart={load}
      >
        {/* Header: title + difficulty */}
        <div className="flex items-start justify-between gap-4">
          <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{problem.title}</h3>
          <DifficultyBadge difficulty={problem.difficulty} />
        </div>

        {/* Topic + tags */}
        {(problem.topic || problem.tags.length > 0) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {problem.topic && (
              <span className="glass-pill inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-accent">
                <Tag className="h-3 w-3" />
                {problem.topic}
              </span>
            )}
            {problem.tags.map((tag) => (
              <span
                key={tag}
                className="glass-pill rounded-full px-2.5 py-1 text-[11px] font-medium text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Approach & solution disclosure */}
        <div className="mt-5">
          <button
            type="button"
            onClick={toggle}
            aria-expanded={open}
            aria-controls={panelId}
            className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-2xl bg-surface-2 px-4 py-3 text-sm font-semibold transition-colors hover:text-accent"
          >
            <span className="inline-flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-accent" />
              {open ? "Hide approach & solution" : "Show approach & solution"}
            </span>
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-muted transition-transform duration-300 ${
                open ? "rotate-180" : ""
              }`}
            />
          </button>

          {open && (
            <div id={panelId} className="mt-4 space-y-5 animate-in">
              {error ? (
                <p className="rounded-xl bg-surface-2 px-4 py-3 text-sm text-rose-400">{error}</p>
              ) : detail ? (
                <ProblemBody detail={detail} />
              ) : (
                <ProblemShimmer />
              )}
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

function ProblemBody({ detail }: { detail: ProblemDetail }) {
  return (
    <>
      {/* Plain-English statement */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Problem</h4>
        <p className="mt-2 text-sm leading-relaxed text-foreground/90">{detail.description}</p>
      </div>

      {/* Best approach */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Best approach</h4>
        <div className="mt-2 rounded-xl border-l-2 border-rb-green-500/40 bg-surface-2 px-4 py-3">
          <p className="text-sm leading-relaxed text-foreground/90">{detail.bestApproach}</p>
        </div>
      </div>

      {/* Solution */}
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Solution</h4>
        <div className="mt-2 overflow-hidden rounded-xl border border-border bg-surface-2">
          <div className="flex items-center gap-2 border-b border-border px-4 py-2">
            <span className="flex gap-1.5" aria-hidden>
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500/40" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/40" />
            </span>
            <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-muted">
              SQL
            </span>
          </div>
          <pre className="overflow-x-auto whitespace-pre px-4 py-4 font-mono text-sm leading-relaxed text-foreground/90">
            <code>{detail.solutionQuery}</code>
          </pre>
        </div>
      </div>
    </>
  );
}

/** Shimmer placeholder shown while heavy content is still loading. */
function ProblemShimmer() {
  return (
    <div className="space-y-5" aria-hidden>
      <div className="space-y-2">
        <div className="h-3 w-20 animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-full animate-pulse rounded bg-surface-2" />
        <div className="h-4 w-5/6 animate-pulse rounded bg-surface-2" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-24 animate-pulse rounded bg-surface-2" />
        <div className="h-16 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
      <div className="space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-surface-2" />
        <div className="h-28 w-full animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}
