"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw, Check } from "lucide-react";
import { cn } from "@risingbrain/ui/cn";
import { adminMutate } from "../_lib/mutate";

const TAGS = ["dsa-catalog", "domain-catalog", "quiz-catalog"] as const;

/**
 * Manually bust all three public content-cache tags via the existing
 * `/api/admin/revalidate` route. The editors already do this on every write, so
 * this is only needed after an out-of-band change (e.g. a re-seed).
 */
export function RevalidateButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  async function run() {
    setState("busy");
    for (const tag of TAGS) {
      await adminMutate("POST", "/api/admin/revalidate", { tag });
    }
    router.refresh();
    setState("done");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={() => void run()}
      disabled={state === "busy"}
      className="glass-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground disabled:opacity-60"
    >
      {state === "done" ? (
        <Check className="h-4 w-4 text-accent" />
      ) : (
        <RefreshCw className={cn("h-4 w-4", state === "busy" && "animate-spin")} />
      )}
      {state === "done" ? "Refreshed" : "Refresh caches"}
    </button>
  );
}
