"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";

/** Where a tooltip should sit, in viewport coordinates. */
type Tip = { text: string; top: number; left: number };

/** Marks the element whose text may be clipped. Put it on the truncating span. */
export const TRUNCATE_ATTR = "data-truncate";

/**
 * Reveals the full text of a truncated label on hover/focus — used by the index
 * columns on /domain and /screening, whose narrow panels clip long topic names.
 *
 * Shared because both indexes need the same three non-obvious behaviours:
 *
 *  ① It PORTALS to <body>. Both index panels clip their overflow to a rounded
 *    corner, so a tooltip rendered in place would be cut off at the panel edge.
 *  ② It only fires when the label is ACTUALLY clipped (`scrollWidth >
 *    clientWidth`). Echoing text the reader can already see is noise, and on a
 *    wide display it would fire on every row.
 *  ③ It is `aria-hidden`. The full text is already in the DOM — only visually
 *    truncated — so assistive tech reads it without this duplicate.
 *
 * Usage: spread `tipProps(text)` onto the hoverable row, put `TRUNCATE_ATTR` on
 * the truncating span inside it, and render `tooltip` somewhere in the tree.
 */
export function useTruncationTooltip() {
  const [tip, setTip] = useState<Tip | null>(null);

  const hide = useCallback(() => setTip(null), []);

  const show = useCallback((el: HTMLElement, text: string) => {
    const label = el.querySelector<HTMLElement>(`[${TRUNCATE_ATTR}]`);
    if (!label || label.scrollWidth <= label.clientWidth) return;
    const r = el.getBoundingClientRect();
    setTip({
      text,
      top: r.top + r.height / 2,
      // Beside the panel, clamped so a long title can't run off-screen.
      left: Math.min(r.right + 10, window.innerWidth - 336),
    });
  }, []);

  // Positioned in viewport coordinates, so any scroll or resize would strand it
  // beside the wrong row — drop it rather than tracking. Capture phase, since the
  // element that scrolls is a descendant pane, not the window.
  useEffect(() => {
    if (!tip) return;
    window.addEventListener("scroll", hide, true);
    window.addEventListener("resize", hide);
    return () => {
      window.removeEventListener("scroll", hide, true);
      window.removeEventListener("resize", hide);
    };
  }, [tip, hide]);

  /** Handlers for the hoverable row. Focus is covered too, for keyboard users. */
  const tipProps = useCallback(
    (text: string) => ({
      onMouseEnter: (e: React.MouseEvent<HTMLElement>) => show(e.currentTarget, text),
      onFocus: (e: React.FocusEvent<HTMLElement>) => show(e.currentTarget, text),
      onMouseLeave: hide,
      onBlur: hide,
    }),
    [show, hide],
  );

  const tooltip = tip
    ? createPortal(
        <div
          aria-hidden
          style={{ top: tip.top, left: tip.left }}
          // Solid surface, NOT `.glass`: a tooltip floats over body text, and a
          // translucent panel lets that text show through the very words it is
          // there to make readable.
          className="pointer-events-none fixed z-50 max-w-xs -translate-y-1/2 rounded-lg border border-border bg-surface-2 px-3 py-2 text-xs font-medium leading-snug text-foreground shadow-[var(--shadow-card-hover)]"
        >
          {tip.text}
        </div>,
        document.body,
      )
    : null;

  return { tipProps, hideTip: hide, tooltip };
}
