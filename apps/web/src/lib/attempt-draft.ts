"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Keeps an in-progress MCQ attempt in `localStorage` so closing the tab does not
 * throw the work away.
 *
 * A practice set is graded in one shot at Submit — nothing is sent while the
 * learner answers — which is what makes it read as a paper rather than a quiz
 * show, but it also means an accidental refresh eight questions in used to lose
 * all eight. The draft is purely a client-side convenience: the server still
 * only ever sees the one submission.
 *
 * Shared by Domain (`practice-attempt.tsx`) and Screening (`paper-attempt.tsx`),
 * which hold the same shape of state — Screening's just carries hint flags too,
 * so the value type is generic.
 *
 * The draft is DELETED, not kept, once the set is submitted: the graded result
 * is authoritative from then on and lives in the progress provider, so a
 * lingering draft could only ever contradict it.
 */

/** Bump when the stored shape changes; older payloads are dropped, not migrated. */
const VERSION = 1;

/**
 * How long a draft is honoured. An attempt someone abandoned a fortnight ago is
 * not work they are coming back to finish — restoring it would silently put
 * stale answers under a set they think they are starting fresh.
 */
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

type Stored<S> = { v: number; at: number; states: Record<string, S> };

const keyFor = (scope: string, topicId: string) => `rb:attempt:${scope}:${topicId}`;

export interface AttemptDraftOptions<S> {
  /** Which section — keeps Domain and Screening drafts in separate keys. */
  scope: "domain" | "screening";
  topicId: string;
  /** The live attempt state to persist. */
  states: Record<string, S>;
  /** Questions currently on the page; anything else in the draft is discarded. */
  questionIds: string[];
  /** Called once on mount with the restored slice, if there is one. */
  onRestore: (states: Record<string, S>) => void;
  /**
   * False once the set is submitted (or was already graded on arrival). A draft
   * is neither read nor written in review mode.
   */
  enabled: boolean;
}

export function useAttemptDraft<S>({
  scope,
  topicId,
  states,
  questionIds,
  onRestore,
  enabled,
}: AttemptDraftOptions<S>): { clearDraft: () => void } {
  const key = keyFor(scope, topicId);
  // Nothing is written until the restore pass has run, so an empty first render
  // cannot overwrite a saved draft before it has been read back.
  const hydrated = useRef(false);
  // Read through refs: these change on every answer and must not re-run restore.
  const onRestoreRef = useRef(onRestore);
  onRestoreRef.current = onRestore;
  const idsRef = useRef(questionIds);
  idsRef.current = questionIds;

  const clearDraft = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* private mode / storage disabled — nothing to clean up */
    }
  }, [key]);

  // --- restore, once per topic ------------------------------------------------
  // Deliberately in an effect rather than a `useState` initializer: this runs
  // inside a Server Component tree, so an initializer would execute during SSR
  // where `localStorage` does not exist, and reading it on the hydration render
  // would produce markup that disagrees with the server's.
  useEffect(() => {
    hydrated.current = false;
    if (!enabled) {
      // Already graded — either submitted this session or seeded that way on
      // arrival. Drop any leftover draft now rather than letting it sit until it
      // ages out: the stored result is authoritative, so the draft is dead
      // weight that could only ever disagree with it.
      clearDraft();
      return;
    }

    let restored: Record<string, S> | null = null;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Stored<S>;
        const fresh = parsed?.v === VERSION && Date.now() - parsed.at < MAX_AGE_MS;
        if (!fresh) {
          window.localStorage.removeItem(key);
        } else {
          // Only questions still on the page: a content reseed mints new question
          // ids, and answers keyed to ids that no longer exist would otherwise sit
          // in the draft forever, counted as answered by nothing.
          const live = new Set(idsRef.current);
          const kept = Object.fromEntries(
            Object.entries(parsed.states ?? {}).filter(([id]) => live.has(id)),
          ) as Record<string, S>;
          if (Object.keys(kept).length > 0) restored = kept;
        }
      }
    } catch {
      /* unparseable or unavailable — treat as no draft */
    }

    if (restored) onRestoreRef.current(restored);
    hydrated.current = true;
  }, [key, enabled, clearDraft]);

  // --- persist on every change -------------------------------------------------
  useEffect(() => {
    if (!hydrated.current) return;
    try {
      if (!enabled || Object.keys(states).length === 0) {
        window.localStorage.removeItem(key);
        return;
      }
      const payload: Stored<S> = { v: VERSION, at: Date.now(), states };
      window.localStorage.setItem(key, JSON.stringify(payload));
    } catch {
      // Quota exceeded or storage blocked. A lost draft is a lost convenience,
      // never a lost submission, so this stays silent rather than alarming.
    }
  }, [key, states, enabled]);

  return { clearDraft };
}

/**
 * Bring the first unanswered question into view.
 *
 * Blocking Submit until every question is answered is only reasonable if the
 * learner can find the ones they missed — on a ten-question set, "you have 2
 * left" without a way to reach them is a puzzle, not a prompt. Both question
 * cards already carry `data-question-id` for exactly this kind of addressing.
 */
export function scrollToQuestion(questionId: string): void {
  const el = document.querySelector(`[data-question-id="${CSS.escape(questionId)}"]`);
  el?.scrollIntoView({ block: "center", behavior: "smooth" });
}
