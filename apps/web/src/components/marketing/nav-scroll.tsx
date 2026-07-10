"use client";

import { useEffect } from "react";

/**
 * Tiny client island (renders nothing) that flags the sticky header with a
 * `data-scrolled` attribute once the page has scrolled past the top. The navbar
 * itself stays a server component; theme.css styles `#site-header[data-scrolled]`
 * to tighten the floating pill (stronger surface + shadow) as you scroll.
 */
export function NavScroll() {
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      if (window.scrollY > 8) header.setAttribute("data-scrolled", "");
      else header.removeAttribute("data-scrolled");
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return null;
}
