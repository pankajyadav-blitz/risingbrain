import type { AptKind } from "./data";

/**
 * The two routes built on the shared quiz workspace. Both render the SAME paper
 * UI over the SAME tables (quiz_categories / quiz_topics / quiz_questions and the
 * user progress tables); they differ only in which QuizCategory kinds they show.
 *
 * Puzzles were split out of /screening because they are a different kind of
 * practice — figure-heavy lateral-thinking problems rather than timed quant and
 * reasoning drills — and burying them behind a third tab on the screening page
 * hid them. Keeping ONE data model means one submit endpoint, one progress
 * model and one admin manager still cover both.
 *
 * Adding a kind to one list and removing it from the other is the whole
 * migration: no schema change, no data movement.
 */
export type QuizRouteConfig = {
  kinds: AptKind[];
  /** Route prefix the index/picker navigate within. */
  basePath: string;
  /** Noun for the "nothing published yet" message. */
  emptyLabel: string;
};

export const SCREENING_ROUTE: QuizRouteConfig = {
  kinds: ["APTITUDE", "LOGICAL_REASONING"],
  basePath: "/screening",
  emptyLabel: "quizzes",
};

export const PUZZLES_ROUTE: QuizRouteConfig = {
  kinds: ["PUZZLE"],
  basePath: "/puzzles",
  emptyLabel: "puzzles",
};

/**
 * The route that owns a given kind. Puzzles used to live under /screening, so
 * bookmarked `/screening/<puzzleTopicId>` links still arrive here — the paper
 * pages use this to redirect them to the right route instead of rendering a
 * puzzle inside a nav that no longer lists it.
 */
export function routeForKind(kind: AptKind): QuizRouteConfig {
  return PUZZLES_ROUTE.kinds.includes(kind) ? PUZZLES_ROUTE : SCREENING_ROUTE;
}
