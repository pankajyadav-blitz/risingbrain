/**
 * Per-figure display sizing for the notes content (Domain + Screening).
 *
 * The figures are screenshots extracted from source PDFs at whatever scale the PDF
 * happened to embed them, so their intrinsic widths span 212px → 2048px. That makes a
 * single hardcoded size wrong in both directions: it leaves a small "0 rows deleted"
 * result box looking lost, and lets a 755×2048 portrait diagram run a page tall.
 *
 * So nothing here is a fixed output dimension — the three bounds below are applied to
 * each figure's OWN width and height, and whichever binds first wins:
 *
 *   1. small figures are nudged up to MIN_WIDTH so they're legible next to a full table,
 *   2. but never enlarged past MAX_UPSCALE, because these are bitmaps and blur,
 *   3. and never so wide that the resulting height exceeds MAX_HEIGHT.
 *
 * The final width is emitted as `min(100%, …px)`, so the content column is still the
 * hard ceiling and everything stays responsive on a narrow viewport.
 */
import figureDimensions from "./figure-dimensions.json";

/** Smallest comfortable rendered width; below this a figure reads as an afterthought. */
const MIN_WIDTH = 360;
/** Hard cap on enlarging a small capture — past this the upscaling is visible. */
const MAX_UPSCALE = 1.8;
/** Tallest a figure may render, so portrait diagrams can't dominate the page. */
const MAX_HEIGHT = 720;

// Typed as plain arrays, not a tuple: JSON carries no length guarantee, so the
// pair is validated in `figureSize` instead of asserted here.
const DIMENSIONS: Record<string, number[]> = figureDimensions;

export interface FigureSize {
  /** Intrinsic width, for the `width` attribute (aspect-ratio box → no layout shift). */
  width: number;
  /** Intrinsic height, for the `height` attribute. */
  height: number;
  /** CSS width to render at, already clamped to the column. */
  cssWidth: string;
}

/**
 * Look up a figure by its public path (`/study-notes/…`) and work out how wide it
 * should render. Returns null for an unknown path — the caller then falls back to the
 * plain `.notes-prose img` CSS rules, so an unmeasured figure still renders sensibly.
 */
export function figureSize(src: string): FigureSize | null {
  // Tolerate a query string or hash on the path; the manifest is keyed on the bare URL.
  const key = src.replace(/[?#].*$/, "");
  const dim = DIMENSIONS[key];
  if (!dim || dim.length < 2) return null;

  const [width, height] = dim as [number, number];
  if (!(width > 0) || !(height > 0)) return null;

  const display = Math.round(
    Math.min(
      Math.max(width, MIN_WIDTH), // 1. lift small figures to a readable size
      width * MAX_UPSCALE, // 2. …without visibly upscaling them
      (MAX_HEIGHT * width) / height // 3. …and keep the rendered height bounded
    )
  );

  return { width, height, cssWidth: `min(100%, ${display}px)` };
}
