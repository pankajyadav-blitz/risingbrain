import type { CSSProperties } from "react";
import { figureSize } from "@/lib/figure-size";

/**
 * The `img` renderer shared by the Domain and Screening notes.
 *
 * Publishes each figure's own numbers (see `lib/figure-size.ts`) as custom properties
 * and lets `.notes-prose img[data-measured]` in globals.css resolve the width against
 * the live column and viewport — so one figure isn't given the same px width on a
 * phone as on a desktop. `width`/`height` are still passed through so the browser
 * reserves the right aspect box before the bitmap arrives — no layout shift as a long
 * topic loads. A figure that isn't in the manifest gets no `data-measured`, and the
 * plain `.notes-prose img` rules render it at intrinsic size.
 */
export function NotesFigure({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (typeof src !== "string") return null;
  const size = figureSize(src);

  // Custom properties aren't in React's CSSProperties, hence the cast.
  const vars = size
    ? ({
        "--fig-nat": `${size.width}px`,
        "--fig-ar": `${size.aspectRatio}`,
      } as CSSProperties)
    : undefined;

  return (
    // A plain <img> on purpose: the path comes from markdown at runtime, so
    // next/image can't statically analyse it. The manifest supplies the dimensions
    // next/image would otherwise provide.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      {...(size ? { width: size.width, height: size.height, "data-measured": "" } : {})}
      style={vars}
    />
  );
}
