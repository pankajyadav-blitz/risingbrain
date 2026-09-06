"use client";

import { useEffect, useRef } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTruncationTooltip } from "@/components/shell/truncation-tooltip";
import { useDomainProgress } from "./progress-provider";
import { useSelectedSubject } from "./selected-subject";
import type { DomainSubjectIndex } from "../_data";
import { domainTopicHref } from "../_categories";

/**
 * Trailing slot of a topic link: the practice mark once the topic's set has been
 * submitted, otherwise nothing (a topic is notes first — the question count is on
 * the tab, not here). While THIS link's navigation is in flight, `useLinkStatus`
 * flips `pending` true, so we swap in a spinner — instant feedback the moment a
 * topic is clicked, before its content streams in.
 */
function NavTrailing({ label }: { label: string | null }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return (
      <Loader2
        className="h-3.5 w-3.5 shrink-0 animate-spin text-accent"
        aria-label="Loading"
      />
    );
  }
  if (!label) return null;
  return (
    <span className="shrink-0 text-[11px] tabular-nums text-accent">
      {label}
    </span>
  );
}

/**
 * The left index (`@nav` parallel slot). The subject is chosen by the top
 * `<CategoryTabs>`; this list shows ONLY the selected subject's topics, bucketed
 * into its groups (e.g. phases). Each topic is a prefetch-on-hover <Link>
 * (`/domain/<subject>/<slug>`) so the click is instant (lazy load). The active topic is
 * derived from the URL, keeping the nav and the content always in sync.
 */
export function NavList({ subjects }: { subjects: DomainSubjectIndex[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useSelectedSubject();
  const progress = useDomainProgress();
  const signedIn = progress?.signedIn ?? false;
  // `/domain/<subject>/<slug>` — the topic slug is the THIRD segment. Scores are
  // still keyed by primary key, so rows match on slug and look up progress on id.
  const activeSlug = pathname.split("/")[3] ?? "";

  const selected = ctx?.selected || subjects[0]?.subject || "";
  const active = subjects.find((s) => s.subject === selected) ?? subjects[0];

  // Keep the active topic in view when it (or the selected subject) changes.
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeSlug, selected]);

  // The index column is narrow, so long topic titles are truncated; this reveals
  // the rest on hover/focus.
  const { tipProps, tooltip } = useTruncationTooltip();

  if (!active) return null;

  return (
    // No padding around the list: the column is a plain bordered index, not a
    // card, so rows sit flush to the page edge (their own `px-3` is the only
    // inset) and the first group header sits flush against the top.
    <nav className="pb-3">
      {active.groups.map((group) => (
        <div key={group.label} className="pb-5 last:pb-0">
          {/* Sticky within the index's own scrollport: on a long subject the phase
              you're reading stays labelled while you scroll past it. Opaque
              (`surface-2`, not a translucent blur band) because rows scroll under
              it; shares the rows' `px-3` so label and titles line up. */}
          <div className="sticky top-0 z-10 mb-1.5 flex items-baseline justify-between gap-2 border-b border-border/70 bg-surface-2 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-accent">
              {group.label}
            </p>
            <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">
              {group.topics.length}
            </span>
          </div>
          <ul className="space-y-0.5">
            {group.topics.map((t) => {
              const isActive = t.slug === activeSlug;
              const score = signedIn
                ? progress?.getTopicScore(t.id)
                : undefined;
              const href = domainTopicHref(active.subject, t.slug);
              return (
                <li key={t.id}>
                  <Link
                    href={href}
                    ref={isActive ? activeRef : undefined}
                    prefetch={false}
                    {...tipProps(t.title)}
                    onPointerEnter={() => router.prefetch(href)}
                    scroll={false}
                    aria-current={isActive ? "page" : undefined}
                    // `scroll-mt-10` clears the sticky group header, so the
                    // keep-active-in-view scroll never parks a topic under it.
                    // Tight horizontal padding — enough to keep the title (and
                    // the active row's highlight) off the column edges without
                    // spending the narrow index's width on empty space.
                    className={`flex w-full scroll-mt-10 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                      isActive
                        ? "bg-rb-green-500/15 font-semibold text-brand ring-1 ring-rb-green-500/30"
                        : "text-muted hover:bg-surface-2 hover:text-foreground"
                    }`}
                  >
                    <span data-truncate className="min-w-0 flex-1 truncate">
                      {t.title}
                    </span>
                    <NavTrailing
                      label={score ? `${score.score}/${score.total}` : null}
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {tooltip}
    </nav>
  );
}
