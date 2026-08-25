/**
 * Per-figure display sizing for the notes content (Domain + Screening).
 *
 * `figure-dimensions.json` carries each figure's DISPLAY size, not its intrinsic pixel
 * size. The figures come from several tools at several export scales — Mermaid renders,
 * Carbon code screenshots, designed slides, PDF extractions — so intrinsic width says
 * nothing about how big a picture should look: a four-box diagram exported at 1827px
 * wide and a dense timing chart drawn at 1408px are the same box on screen but one has
 * 52px lettering and the other 6px. `scripts/gen-figure-dimensions.ts` measures the text
 * inside each figure and scales it so every figure's lettering lands at the same size;
 * see that file for how the measurement works.
 *
 * This module does NOT pick a final width. It resolves each figure's own numbers —
 * display size and aspect ratio — and hands them to CSS as custom properties. The actual
 * width is then computed by `.notes-prose img[data-measured]` in globals.css against the
 * LIVE column width and viewport height, so it re-resolves on resize and rotate with no
 * JS and no re-render.
 *
 * That split is the point: a width baked in here is a px constant that was correct at
 * one viewport. Emitting a fixed `min(100%, 360px)` is what made a small result chip
 * render at 32% of a desktop column but full-bleed (and upscaled, so blurry) on a phone,
 * and let a tall diagram render taller than the screen it was on. Both bounds belong
 * where the viewport is known.
 */
import figureDimensions from "./figure-dimensions.json";

// Typed as plain arrays, not a tuple: JSON carries no length guarantee, so the
// pair is validated in `figureSize` instead of asserted here.
const DIMENSIONS: Record<string, number[]> = figureDimensions;

export interface FigureSize {
  /**
   * Display width in CSS px — the width at which this figure's own text reads at the
   * same size as every other figure's. Also the `width` attribute, so the browser gets
   * an aspect box before the bitmap arrives and the page doesn't shift.
   */
  width: number;
  /** Display height, at the same scale as `width`. */
  height: number;
  /** width / height, so CSS can convert a height ceiling into a width ceiling. */
  aspectRatio: number;
}

/**
 * Look up a figure by its public path (`/study-notes/…`) and resolve its sizing inputs.
 * Returns null for an unknown path — the caller then omits the custom properties and
 * `.notes-prose img` (without `[data-measured]`) renders it at intrinsic size instead.
 */
export function figureSize(src: string): FigureSize | null {
  // Tolerate a query string or hash on the path; the manifest is keyed on the bare URL.
  const key = src.replace(/[?#].*$/, "");
  const dim = DIMENSIONS[key];
  if (!dim || dim.length < 2) return null;

  const [width, height] = dim as [number, number];
  if (!(width > 0) || !(height > 0)) return null;

  // 4dp is well past what a sub-pixel width can resolve, and keeps the emitted
  // custom property short.
  return { width, height, aspectRatio: Number((width / height).toFixed(4)) };
}
