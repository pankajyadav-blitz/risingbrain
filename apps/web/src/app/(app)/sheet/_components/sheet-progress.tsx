"use client";

import { createContext, useContext } from "react";
import type { DifficultyValue } from "./types";

/**
 * Lets a ProblemRow report a solve/un-solve to the combined difficulty panel
 * (delta +1 when newly solved, -1 when un-solved) without threading callbacks
 * through Topic → Pattern → Row. The provider lives in SheetSelector.
 */
export const SheetProgressContext = createContext<(difficulty: DifficultyValue, delta: number) => void>(
  () => {}
);

export function useSheetProgress() {
  return useContext(SheetProgressContext);
}

/**
 * Whether the current visitor is signed in. Provided once at the SheetSelector
 * level so any deeply-nested interactive component (ProblemRow, NoteModal…)
 * can gate its actions and redirect to /login when the user is a guest.
 */
export const SheetGuestContext = createContext<boolean>(false);

export function useSheetSignedIn() {
  return useContext(SheetGuestContext);
}

/**
 * Lets a ProblemRow report a bookmark add/remove up to SheetSelector so the
 * live "bookmarked only" filter set stays in sync with the row's optimistic
 * state — without threading callbacks through Topic → Pattern → Row.
 */
export const SheetBookmarkContext = createContext<(problemId: string, bookmarked: boolean) => void>(
  () => {}
);

export function useSheetBookmarkReport() {
  return useContext(SheetBookmarkContext);
}
