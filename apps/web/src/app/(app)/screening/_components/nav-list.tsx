"use client";

import { useEffect, useRef } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
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

  if (!active) return null;

  return (
    <div>
      <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
        {active.name}
      </p>
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
                onMouseEnter={() => router.prefetch(href)}
                onFocus={() => router.prefetch(href)}
                scroll={false}
                aria-current={isActive ? "page" : undefined}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                  isActive
                    ? "bg-rb-green-500/15 font-semibold text-brand ring-1 ring-rb-green-500/30"
                    : "text-muted hover:bg-surface-2 hover:text-foreground"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{t.name}</span>
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
    </div>
  );
}
