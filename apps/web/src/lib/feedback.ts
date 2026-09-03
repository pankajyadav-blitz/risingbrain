/**
 * Shared rules for the product-feedback widget. Pure — no `server-only`, no
 * Prisma — because both sides need the same numbers: the route enforces them and
 * the widget has to *say* what they are before someone writes a note they
 * aren't allowed to send.
 */

/**
 * How many pieces of feedback one account may have sitting UNREAD at once.
 *
 * This is deliberately not a time window. The thing being protected is an
 * admin's inbox, so the quota is released by that inbox being read (or the row
 * being deleted) rather than by the clock — someone who sent two notes nobody
 * has looked at yet gains nothing from waiting an hour, and someone whose
 * feedback was read straight away is never throttled at all.
 */
export const FEEDBACK_PENDING_LIMIT = 2;

/** Guards Postgres against a multi-megabyte paste; far above any real note. */
export const FEEDBACK_MAX_CHARS = 20_000;

/** Ratings the widget offers. 1–5 stars, or none at all — see `Feedback.rating`. */
export const FEEDBACK_MIN_RATING = 1;
export const FEEDBACK_MAX_RATING = 5;

/** What each star means, in the same order the widget renders them. */
export const RATING_LABELS: Record<number, string> = {
  1: "Frustrating",
  2: "Rough",
  3: "Okay",
  4: "Good",
  5: "Love it",
};

/** Shape of `GET /api/feedback` — what the widget needs to render its state. */
export interface FeedbackQuota {
  /** Unread notes this user currently has open. */
  pending: number;
  /** How many more they may send right now. */
  remaining: number;
  limit: number;
  /**
   * Whether this account has EVER sent feedback. The one-time nudge asks for a
   * first impression, so it must not appear for someone who already gave one —
   * and that fact has to come from the server, since a browser they have never
   * used before has no local record of it.
   */
  hasEverSent: boolean;
}

/** The message shown (and returned by the API) when the quota is used up. */
export const FEEDBACK_LIMIT_MESSAGE =
  `You already have ${FEEDBACK_PENDING_LIMIT} pieces of feedback waiting to be read. ` +
  `You can send more once the team has gone through them.`;
