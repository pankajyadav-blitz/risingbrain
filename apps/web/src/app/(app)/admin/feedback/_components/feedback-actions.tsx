"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Trash2, Undo2 } from "lucide-react";
import { FeedbackStatus } from "@risingbrain/database/enums";
import type { FeedbackReviewAction } from "@/lib/admin/schemas";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { adminMutate } from "../../_lib/mutate";

/**
 * The read / unread / delete controls on one feedback note.
 *
 * A small client island: the cards (including each note's markdown body) are
 * server-rendered by `page.tsx`, so only the decisions ship JavaScript. The API
 * re-checks the role on every call, so the button set is ergonomics, not access
 * control.
 *
 * "Mark as read" is not a cosmetic flag — it is what releases the author's
 * unread quota (see `lib/feedback.ts`), which is why the button says so.
 */
export function FeedbackActions({
  id,
  status,
  authorEmail,
}: {
  id: string;
  status: FeedbackStatus;
  authorEmail: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<FeedbackReviewAction | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  async function run(action: FeedbackReviewAction) {
    setBusy(action);
    setError(null);
    const r = await adminMutate("PATCH", "/api/admin/feedback", { id, action });
    setBusy(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    // Re-pull the server-rendered inbox: the row moves to the other tab, so
    // patching it in place would leave it sitting under the wrong heading.
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    const r = await adminMutate("DELETE", "/api/admin/feedback", { id });
    setBusy(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setConfirm(false);
    router.refresh();
  }

  const anyBusy = busy !== null;

  return (
    <div className="mt-4 border-t border-border pt-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {status === FeedbackStatus.NEW ? (
          <ActionButton
            tone="approve"
            busy={busy === "view"}
            disabled={anyBusy}
            onClick={() => void run("view")}
            icon={Check}
          >
            Mark as read
          </ActionButton>
        ) : (
          <ActionButton
            tone="neutral"
            busy={busy === "unview"}
            disabled={anyBusy}
            onClick={() => void run("unview")}
            icon={Undo2}
          >
            Back to unread
          </ActionButton>
        )}

        <ActionButton
          tone="reject"
          busy={busy === "delete"}
          disabled={anyBusy}
          onClick={() => setConfirm(true)}
          icon={Trash2}
        >
          Delete
        </ActionButton>

        <span className="ml-auto hidden text-xs text-muted sm:block">
          {status === FeedbackStatus.NEW
            ? "Reading it frees up a slot for this author."
            : "This note no longer counts against the author's limit."}
        </span>
      </div>

      {error && (
        <p role="alert" className="mt-2.5 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirm}
        title="Delete this feedback?"
        message={`The note from “${authorEmail}” is erased for good. Their slot frees up either way — use "Mark as read" if you might want to look at it again.`}
        confirmLabel="Delete forever"
        busy={busy === "delete"}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(false)}
      />
    </div>
  );
}

const TONE: Record<"approve" | "reject" | "neutral", string> = {
  approve:
    "border-rb-green-500/40 text-brand hover:bg-rb-green-500/10 disabled:hover:bg-transparent",
  reject: "border-rose-500/40 text-rose-500 hover:bg-rose-500/10 disabled:hover:bg-transparent",
  neutral: "border-border text-muted hover:text-foreground hover:bg-surface-2",
};

function ActionButton({
  tone,
  busy,
  disabled,
  onClick,
  icon: Icon,
  children,
}: {
  tone: "approve" | "reject" | "neutral";
  busy: boolean;
  disabled: boolean;
  onClick: () => void;
  icon: typeof Check;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors disabled:opacity-40 ${TONE[tone]}`}
    >
      {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
      {children}
    </button>
  );
}
