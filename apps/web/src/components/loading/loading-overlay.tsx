"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

/**
 * Full-screen black-translucent overlay with a centered circular spinner.
 * Portaled to <body> so it escapes any clipping/stacking context (dropdowns,
 * cards, etc.). Use it to cover the "frozen" gap during a full-page redirect,
 * where a button's own loading state has already reset.
 */
export function LoadingOverlay({
  show,
  label = "Loading",
}: {
  show: boolean;
  label?: string;
}) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => setMounted(true), []);

  if (!show || !mounted) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className="fixed inset-0 z-[100] grid place-items-center bg-black/60"
    >
      <Loader2 className="h-10 w-10 animate-spin text-white" />
    </div>,
    document.body
  );
}
