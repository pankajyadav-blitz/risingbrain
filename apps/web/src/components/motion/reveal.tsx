"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

type RevealProps = {
  children: ReactNode;
  /** Extra delay before the reveal settles, in ms (for manual staggering). */
  delay?: number;
  /** Element to render as. Defaults to a div. */
  as?: ElementType;
  /** Reveal only once (default) or every time it re-enters the viewport. */
  once?: boolean;
  className?: string;
};

/**
 * Scroll-reveal wrapper. Adds the `.in` class (see theme.css `.reveal`) when the
 * element scrolls into view, lifting it gently into place. Rendered as a small
 * client leaf so the pages it wraps can stay server components.
 *
 * Under `prefers-reduced-motion` the CSS guard in theme.css keeps it fully
 * visible, so there is no hidden content if JS/observer never fires either.
 */
export function Reveal({
  children,
  delay = 0,
  as,
  once = true,
  className = "",
}: RevealProps) {
  const Tag = (as ?? "div") as ElementType;
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Failsafe: if IntersectionObserver is unavailable, just show it.
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setShown(false);
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [once]);

  return (
    <Tag
      ref={ref}
      className={`reveal ${shown ? "in" : ""} ${className}`.trim()}
      style={delay ? ({ "--reveal-delay": `${delay}ms` } as React.CSSProperties) : undefined}
    >
      {children}
    </Tag>
  );
}
