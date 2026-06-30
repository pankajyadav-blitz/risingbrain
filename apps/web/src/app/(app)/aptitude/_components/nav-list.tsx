"use client";

import { useEffect, useRef } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Brain, Calculator, Loader2, Puzzle, type LucideIcon } from "lucide-react";
import { useProgress } from "./progress-provider";
import type { AptIndexCategory, AptKind } from "../_data";

const KIND_ICON: Record<AptKind, LucideIcon> = {
  APTITUDE: Calculator,
  LOGICAL_REASONING: Brain,
  PUZZLE: Puzzle,
};

/**
 * Trailing slot of a nav item. While THIS link's navigation is in flight,
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
 * The left index, rendered into the `@nav` parallel slot. Each topic is a
 * prefetch-on-hover <Link>: hovering warms that topic's RSC payload, so the
 * click is instant (lazy load). The active item is derived from the URL
 * (`/aptitude/<topicId>`) so the nav and the paper are always in sync.
 */
export function NavList({ categories }: { categories: AptIndexCategory[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const progress = useProgress();
  const signedIn = progress?.signedIn ?? false;
  const activeId = pathname.split("/")[2] ?? "";

  // Keep the active topic in view when it changes (e.g. navigated via mobile picker).
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeId]);

  return (
    <div className="space-y-5">
      {categories.map((c) => {
        const Icon = KIND_ICON[c.kind] ?? Calculator;
        const score = c.topics.reduce((s, t) => s + (progress?.getTopicScore(t.id)?.score ?? 0), 0);
        const total = c.topics.reduce((s, t) => s + t.total, 0);
        const cp = total > 0 ? Math.round((score / total) * 100) : 0;
        return (
          <div key={c.id}>
            <div className="mb-2 flex items-center gap-2 px-2">
              <Icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-bold text-foreground">{c.name}</span>
              {signedIn ? (
                <span className="ml-auto font-mono text-[11px] text-muted">{cp}%</span>
              ) : null}
            </div>
            <ul className="space-y-0.5">
              {c.topics.map((t) => {
                const sc = progress?.getTopicScore(t.id);
                const isActive = t.id === activeId;
                const done = signedIn && Boolean(sc);
                const href = `/aptitude/${t.id}`;
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
            </ul>
          </div>
        );
      })}
    </div>
  );
}
