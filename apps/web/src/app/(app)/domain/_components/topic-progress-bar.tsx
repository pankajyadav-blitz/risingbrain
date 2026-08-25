"use client";

import { LockKeyhole } from "lucide-react";
import { useDomainProgress } from "./progress-provider";

/**
 * Score bar in the topic header. Reflects the STORED mark for this topic's
 * practice set (updated only on submit) — `score/total` + %. Shows a neutral
 * "Not attempted" state until the learner has submitted at least once, and
 * renders nothing at all for a topic with no questions.
 */
export function TopicProgressBar({ topicId, total }: { topicId: string; total: number }) {
  const progress = useDomainProgress();
  const signedIn = progress?.signedIn ?? false;

  if (total === 0) return null;

  if (!signedIn) {
    return (
      <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted">
        <LockKeyhole className="h-3.5 w-3.5" />
        <a href="/login" className="font-medium text-accent hover:underline">
          Sign in
        </a>{" "}
        to track your score
      </p>
    );
  }

  const stored = progress?.getTopicScore(topicId);

  if (!stored) {
    return (
      <p className="mt-3 text-xs text-muted">
        Not attempted yet — answer the practice questions and submit to score.
      </p>
    );
  }

  const denom = stored.total || total;
  const pct = denom > 0 ? Math.round((stored.score / denom) * 100) : 0;

  return (
    <div className="mt-4 flex items-center gap-3">
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2 ring-1 ring-border">
        <div
          className="h-full rounded-full bg-rb-green-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
        {stored.score} / {denom}
      </span>
      <span className="shrink-0 font-mono text-sm font-bold text-accent">{pct}%</span>
    </div>
  );
}
