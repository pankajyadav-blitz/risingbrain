"use client";

import { useEffect, useRef } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useTruncationTooltip } from "@/components/shell/truncation-tooltip";
import { useProgress } from "./progress-provider";
import { useSelectedCategory } from "./selected-category";
import type { AptIndexCategory } from "../_data";

/**
 * Trailing slot of a topic link. While THIS link's navigation is in flight,
 * `useLinkStatus` flips `pending` true (it must render inside the <Link>), so we
 * swap the count for a spinner — instant feedback the moment a topic is clicked,
 * even before its paper streams in.
 */
function NavTrailing({ label, done }: { label: string; done: boolean }) {
  const { pending } = useLinkStatus();
  if (pending) {
    return <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" aria-label="Loading" />;
  }
  return (
    <span className={`shrink-0 text-[11px] tabular-nums ${done ? "text-accent" : "text-muted"}`}>
      {label}
    </span>
  );
}

/**
 * The left index (`@nav` parallel slot). The category is chosen by the top
 * `<CategoryTabs>`; this list shows ONLY the selected category's topics, each a
 * prefetch-on-hover <Link> (`/screening/<topicId>`) so the click is instant
 * (lazy load). The active topic is derived from the URL, keeping the nav and the
 * paper always in sync.
 */
export function NavList({ categories }: { categories: AptIndexCategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgress();
  const ctx = useSelectedCategory();
  const signedIn = progress?.signedIn ?? false;
  const activeId = pathname.split("/")[2] ?? "";

  const selectedId = ctx?.selectedId ?? categories[0]?.id ?? "";
  const active = categories.find((c) => c.id === selectedId) ?? categories[0];

  // Keep the active topic in view when it (or the selected category) changes.
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeId, selectedId]);

  // The index column is narrow, so long topic names are truncated; this reveals
  // the rest on hover/focus.
  const { tipProps, tooltip } = useTruncationTooltip();

  if (!active) return null;

  return (
    // No top padding: the category header sits flush against the panel's top
    // edge, so nothing shows above it and it clips cleanly to the rounded corner.
    <div className="px-3 pb-3">
      {/* Sticky within the index's own scrollport, so the category stays labelled
          while you scroll its topics. Pulled to the panel's full width so nothing
          shows through beside it.

          Solid `surface-2`, NOT a translucent + `backdrop-blur` band: a child with
          `backdrop-filter` is not clipped by an ancestor's border radius in
          Chromium, so a blurred bar renders square over the panel's rounded top
          corner. It also has to be opaque anyway — rows scroll under it. */}
      <div className="sticky top-0 z-10 -mx-3 mb-1.5 flex items-baseline justify-between gap-2 border-b border-border/70 bg-surface-2 px-6 py-2">
        <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-accent">
          {active.name}
        </p>
        <span className="shrink-0 text-[11px] font-medium tabular-nums text-muted">
          {active.topics.length}
        </span>
      </div>
      <ul className="space-y-0.5">
        {active.topics.map((t) => {
          const sc = progress?.getTopicScore(t.id);
          const isActive = t.id === activeId;
          const done = signedIn && Boolean(sc);
          const href = `/screening/${t.id}`;
          return (
            <li key={t.id}>
              <Link
                href={href}
                ref={isActive ? activeRef : undefined}
                prefetch={false}
                {...tipProps(t.name)}
                onPointerEnter={() => router.prefetch(href)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                // `scroll-mt-10` clears the sticky category header, so the
                // keep-active-in-view scroll never parks a topic under it.
                className={`flex w-full scroll-mt-10 items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-rb-green-500/15 font-semibold text-brand ring-1 ring-rb-green-500/30"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span data-truncate className="min-w-0 flex-1 truncate">
                  {t.name}
                </span>
                <NavTrailing
                  label={signedIn && sc ? `${sc.score}/${t.total}` : String(t.total)}
                  done={done}
                />
              </Link>
            </li>
          );
        })}
        {active.topics.length === 0 ? (
          <li className="px-3 py-2 text-sm text-muted">No topics in this category yet.</li>
        ) : null}
      </ul>
      {tooltip}
    </div>
  );
}
