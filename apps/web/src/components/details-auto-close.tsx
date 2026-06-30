"use client";

import { useEffect } from "react";

/**
 * Closes any open `<details data-autoclose>` disclosure when the user clicks
 * outside it (or presses Escape). Lets us keep the pure-HTML `<details>` nav
 * dropdowns — no per-dropdown state — while still getting click-away dismissal.
 * Render this once near the dropdowns; it only attaches document listeners.
 */
export function DetailsAutoClose() {
  useEffect(() => {
    const closeOutside = (e: Event) => {
      const target = e.target as Node | null;
      document
        .querySelectorAll<HTMLDetailsElement>("details[data-autoclose][open]")
        .forEach((d) => {
          if (!target || !d.contains(target)) d.removeAttribute("open");
        });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      document
        .querySelectorAll<HTMLDetailsElement>("details[data-autoclose][open]")
        .forEach((d) => d.removeAttribute("open"));
    };

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return null;
}
