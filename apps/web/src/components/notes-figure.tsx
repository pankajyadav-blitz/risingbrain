import { figureSize } from "@/lib/figure-size";

/**
 * The `img` renderer shared by the Domain and Screening notes.
 *
 * Sizes each figure from its own intrinsic dimensions (see `lib/figure-size.ts`)
 * instead of giving every one the same width, and passes `width`/`height` through so
 * the browser reserves the right aspect box before the bitmap arrives — no layout
 * shift as a long topic loads. Frame styling stays in `globals.css`
 * (`.notes-prose img`), which is also the fallback for a figure that isn't in the
 * manifest yet.
 */
export function NotesFigure({ src, alt }: { src?: string | Blob; alt?: string }) {
  if (typeof src !== "string") return null;
  const size = figureSize(src);

  return (
    // A plain <img> on purpose: the path comes from markdown at runtime, so
    // next/image can't statically analyse it. The manifest supplies the intrinsic
    // dimensions next/image would otherwise provide.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      loading="lazy"
      decoding="async"
      {...(size ? { width: size.width, height: size.height } : {})}
      style={size ? { width: size.cssWidth } : undefined}
    />
  );
}
