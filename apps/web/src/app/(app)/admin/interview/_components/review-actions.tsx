"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Loader2,
  RotateCcw,
  ShieldBan,
  Trash2,
  Undo2,
  X,
} from "lucide-react";
import { PublishStatus } from "@risingbrain/database/enums";
import type { InterviewReviewAction } from "@/lib/admin/schemas";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { adminMutate } from "../../_lib/mutate";

/**
 * The ruling buttons on one queued submission.
 *
 * A small client island rather than a client-rendered queue: the cards
 * themselves — including each write-up's markdown body — are server-rendered by
 * `page.tsx`, so reviewing a long post ships no extra JavaScript and reuses the
 * reader's own render pipeline. Only the decisions are interactive.
 *
 * Which buttons appear depends on where the post already is: publishing a
 * PUBLISHED post is a no-op, and "send back to review" only means something once
 * a post is live. The API re-checks the role on every call, so the button set is
 * ergonomics, not access control.
 */
export function ReviewActions({
  id,
  status,
  authorEmail,
  authorBlocked,
  authorIsAdmin,
}: {
  id: string;
  status: PublishStatus;
  authorEmail: string;
  authorBlocked: boolean;
  authorIsAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<InterviewReviewAction | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");
  const [confirm, setConfirm] = useState<"delete" | "block" | null>(null);

  async function run(action: InterviewReviewAction, payloadNote?: string) {
    setBusy(action);
    setError(null);
    const r = await adminMutate("PATCH", "/api/admin/interview", {
      id,
      action,
      ...(payloadNote ? { note: payloadNote } : {}),
    });
    setBusy(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setRejecting(false);
    setConfirm(null);
    setNote("");
    // Re-pull the server-rendered queue: a ruling moves the row to another tab,
    // so patching it in place would leave it sitting under the wrong heading.
    router.refresh();
  }

  async function remove() {
    setBusy("delete");
    setError(null);
    const r = await adminMutate("DELETE", "/api/admin/interview", { id });
    setBusy(null);
    if (!r.ok) {
      setError(r.error);
      return;
    }
    setConfirm(null);
    router.refresh();
  }

  const pending = status === PublishStatus.PENDING_REVIEW;
  const published = status === PublishStatus.PUBLISHED;
  const anyBusy = busy !== null;

  return (
    <div className="mt-4 border-t border-border pt-3.5">
      <div className="flex flex-wrap items-center gap-2">
        {!published && (
          <ActionButton
            tone="approve"
            busy={busy === "publish"}
            disabled={anyBusy}
            onClick={() => void run("publish")}
            icon={Check}
          >
            {pending ? "Approve & publish" : "Publish"}
          </ActionButton>
        )}

        {status !== PublishStatus.REJECTED && (
          <ActionButton
            tone="reject"
            busy={busy === "reject"}
            disabled={anyBusy}
            onClick={() => setRejecting((v) => !v)}
            icon={X}
          >
            Reject
          </ActionButton>
        )}

        {published && (
          <ActionButton
            tone="neutral"
            busy={busy === "unpublish"}
            disabled={anyBusy}
            onClick={() => void run("unpublish")}
            icon={Undo2}
          >
            Back to review
          </ActionButton>
        )}

        {status !== PublishStatus.ARCHIVED && (
          <ActionButton
            tone="neutral"
            busy={busy === "archive"}
            disabled={anyBusy}
            onClick={() => void run("archive")}
            icon={RotateCcw}
          >
            Archive
          </ActionButton>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <ActionButton
            tone="reject"
            busy={busy === "block_author"}
            // A blocked author is already offline, and admin accounts are handled
            // on /admin/users — the API rejects both, this just says so up front.
            disabled={anyBusy || authorBlocked || authorIsAdmin}
            onClick={() => setConfirm("block")}
            icon={ShieldBan}
          >
            {authorBlocked ? "Author blocked" : "Block author"}
          </ActionButton>
          <ActionButton
            tone="reject"
            busy={busy === "delete"}
            disabled={anyBusy}
            onClick={() => setConfirm("delete")}
            icon={Trash2}
          >
            Delete
          </ActionButton>
        </div>
      </div>

      {/* Rejection note — inline rather than a dialog, because the moderator is
          writing it while reading the post right above it. */}
      {rejecting && (
        <div className="mt-3 rounded-2xl border border-rose-500/25 bg-rose-500/5 p-3">
          <label className="block text-xs font-medium text-muted">
            Why is this being turned down?
            <span className="ml-1 font-normal text-muted/70">· the author sees this</span>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              maxLength={1000}
              autoFocus
              placeholder="e.g. Add the round-by-round questions — right now this is one line."
              className="mt-1.5 w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted/70 focus:border-rose-500/50 focus:ring-2 focus:ring-rose-500/20"
            />
          </label>
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="glass-pill rounded-full px-4 py-1.5 text-sm text-muted transition-colors hover:text-foreground"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!note.trim() || anyBusy}
              onClick={() => void run("reject", note.trim())}
              className="inline-flex items-center gap-1.5 rounded-full bg-rose-500 px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
            >
              {busy === "reject" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Send rejection
            </button>
          </div>
        </div>
      )}

      {error && (
        <p role="alert" className="mt-2.5 text-xs text-rose-600 dark:text-rose-300">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={confirm === "delete"}
        title="Delete this experience permanently?"
        message="The write-up, its likes and every reply under it are erased for good. Use Archive instead if it just needs to come off the feed."
        confirmLabel="Delete forever"
        busy={busy === "delete"}
        onConfirm={() => void remove()}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm === "block"}
        title="Block this author?"
        message={`“${authorEmail}” is logged out immediately and blocked from signing in. Anything they have waiting in the queue is rejected; posts already published stay up until you archive them.`}
        confirmLabel="Block author"
        busy={busy === "block_author"}
        onConfirm={() => void run("block_author")}
        onCancel={() => setConfirm(null)}
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
