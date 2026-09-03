"use client";

import { Star } from "lucide-react";
import { FEEDBACK_MAX_RATING, RATING_LABELS } from "@/lib/feedback";

/**
 * The 1–5 star row, shared by the nudge and the composer so a star means the
 * same thing (and looks the same) wherever it is clicked.
 *
 * Radio semantics, not buttons: this is one choice out of five, so it is a
 * radiogroup — that is what lets it be answered with the arrow keys and read
 * correctly by a screen reader, neither of which a row of buttons gives you.
 * `value = 0` means "not rated"; the caller decides whether that is allowed.
 */
export function RatingStars({
  value,
  onChange,
  size = "md",
  label = "Rate your experience",
}: {
  value: number;
  onChange: (rating: number) => void;
  size?: "md" | "lg";
  label?: string;
}) {
  const star = size === "lg" ? "h-7 w-7" : "h-5 w-5";
  const box = size === "lg" ? "h-10 w-10" : "h-8 w-8";

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div role="radiogroup" aria-label={label} className="flex items-center gap-1">
        {Array.from({ length: FEEDBACK_MAX_RATING }, (_, i) => i + 1).map((n) => {
          const on = n <= value;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={value === n}
              aria-label={`${n} — ${RATING_LABELS[n]}`}
              title={RATING_LABELS[n]}
              // Clicking the current rating clears it: the score is optional, and
              // without this there is no way back to "I'd rather not say" once a
              // star has been touched.
              onClick={() => onChange(value === n ? 0 : n)}
              className={`grid ${box} place-items-center rounded-lg transition-transform hover:scale-110 active:scale-95 ${
                on ? "text-amber-400" : "text-muted/50 hover:text-amber-400/70"
              }`}
            >
              <Star className={`${star} ${on ? "fill-current" : ""}`} />
            </button>
          );
        })}
      </div>
      {/* Reserve the line whether or not it has text, so picking a star doesn't
          shove everything below it down by a row. */}
      <p className="h-4 text-xs font-medium text-muted">
        {value > 0 ? RATING_LABELS[value] : ""}
      </p>
    </div>
  );
}
