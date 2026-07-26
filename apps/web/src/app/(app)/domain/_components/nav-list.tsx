"use client";

import { useEffect, useRef } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useSelectedSubject } from "./selected-subject";
import type { DomainSubjectIndex } from "../_data";

/**
 * Trailing slot of a topic link. While THIS link's navigation is in flight,
 * `useLinkStatus` flips `pending` true, so we swap in a spinner — instant feedback
 * the moment a topic is clicked, before its content streams in.
 */
function NavTrailing() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-accent" aria-label="Loading" />
  );
}

/**
 * The left index (`@nav` parallel slot). The subject is chosen by the top
 * `<CategoryTabs>`; this list shows ONLY the selected subject's topics, bucketed
 * into its groups (e.g. phases). Each topic is a prefetch-on-hover <Link>
 * (`/domain/<topicId>`) so the click is instant (lazy load). The active topic is
 * derived from the URL, keeping the nav and the content always in sync.
 */
export function NavList({ subjects }: { subjects: DomainSubjectIndex[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const ctx = useSelectedSubject();
  const activeId = pathname.split("/")[2] ?? "";

  const selected = ctx?.selected || subjects[0]?.subject || "";
  const active = subjects.find((s) => s.subject === selected) ?? subjects[0];

  // Keep the active topic in view when it (or the selected subject) changes.
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest" });
  }, [activeId, selected]);

  if (!active) return null;

  return (
    <nav className="space-y-6">
      {active.groups.map((group) => (
        <div key={group.label}>
          <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-accent">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.topics.map((t) => {
              const isActive = t.id === activeId;
              const href = `/domain/${t.id}`;
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
                    <span className="min-w-0 flex-1 truncate">{t.title}</span>
                    <NavTrailing />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
