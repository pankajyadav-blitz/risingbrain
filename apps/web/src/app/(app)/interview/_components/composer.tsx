"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Building2, Hourglass, Loader2, PenLine, Save, X } from "lucide-react";
import { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";
import {
  RichTextEditor,
  type RichTextEditorHandle,
} from "@/components/editor/rich-text-editor";

const VERDICTS: { value: InterviewVerdict; label: string }[] = [
  { value: InterviewVerdict.SELECTED, label: "Selected" },
  { value: InterviewVerdict.REJECTED, label: "Rejected" },
  { value: InterviewVerdict.PENDING, label: "Pending" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: Difficulty.EASY, label: "Easy" },
  { value: Difficulty.MEDIUM, label: "Medium" },
  { value: Difficulty.HARD, label: "Hard" },
];

const inputCls =
  "w-full rounded-xl border border-border bg-surface/60 px-3.5 py-2.5 text-sm text-foreground outline-none transition-colors placeholder:text-muted focus:border-rb-green-500/50 focus:ring-2 focus:ring-rb-green-500/20";

/**
 * The draft an existing experience is loaded into for editing. Fetched from
 * `GET /api/interview/[id]`, which converts the stored markdown back to HTML.
 */
export interface ExperienceDraft {
  id: string;
  company: string;
  role: string;
  verdict: InterviewVerdict;
  difficulty: Difficulty;
  roundsCount: number;
  title: string;
  excerpt: string;
  tags: string[];
  bodyHtml: string;
}

/**
 * Portal modal for writing an interview experience — used both to submit a new
 * one and, when `initial` is supplied, to edit an existing one. The two share a
 * component because they are the same form over the same fields; splitting them
 * would mean maintaining two copies of it.
 *
 * Submitting does NOT publish: `POST /api/interview` queues the write-up for
 * moderator approval, so a successful save swaps the form for a "waiting on
 * review" confirmation instead of navigating to a post that isn't public yet.
 *
 * The body is a TipTap surface (see `RichTextEditor`); its HTML is submitted as
 * `body`, and the API converts that to markdown before storing it, so published
 * posts share one format with the seeded ones.
 */
export function Composer({
  onClose,
  initial,
  onSaved,
}: {
  onClose: () => void;
  /** Present = edit mode. Absent = publish a new experience. */
  initial?: ExperienceDraft;
  /** Called after a successful edit, so the page can refresh in place. */
  onSaved?: () => void;
}) {
  const router = useRouter();
  const editorRef = useRef<RichTextEditorHandle>(null);
  const [mounted, setMounted] = useState(false);
  const editing = Boolean(initial);

  const [company, setCompany] = useState(initial?.company ?? "");
  const [role, setRole] = useState(initial?.role ?? "");
  const [verdict, setVerdict] = useState<InterviewVerdict>(
    initial?.verdict ?? InterviewVerdict.PENDING
  );
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initial?.difficulty ?? Difficulty.MEDIUM
  );
  const [rounds, setRounds] = useState(initial?.roundsCount ?? 3);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  /** Set once the submission is in the queue — swaps the form for the receipt. */
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Esc closes + lock body scroll while open.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !saving) onClose();
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, saving]);

  async function submit() {
    setError(null);
    const editor = editorRef.current;
    const html = editor?.getHTML() ?? "";
    const bodyText = (editor?.getText() ?? "").trim();

    if (!company.trim() || !role.trim() || !title.trim() || !bodyText) {
      setError("Company, role, title and the experience body are all required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        editing ? `/api/interview/${initial!.id}` : "/api/interview",
        {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          verdict,
          difficulty,
          roundsCount: Number(rounds),
          title: title.trim(),
          excerpt: excerpt.trim(),
          tags: tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          body: html,
        }),
      }
      );
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = (await res.json()) as { id?: string; status?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      if (editing) {
        // Already on the post — pull the updated server render rather than
        // navigating to the page we are standing on. The edit put the post back
        // in the review queue, so what refreshes in is the pending banner.
        onClose();
        onSaved?.();
        router.refresh();
      } else {
        // Nothing to navigate to: the new post is queued, not live. Show the
        // receipt, and refresh underneath so "Your submissions" picks it up.
        setSubmitted(true);
        setSaving(false);
        router.refresh();
      }
    } catch {
      setError("Network error. Please try again.");
      setSaving(false);
    }
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className="animate-in fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={() => !saving && onClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={editing ? "Edit your interview experience" : "Share your interview experience"}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
      >
        {submitted ? (
          <SubmittedReceipt onClose={onClose} />
        ) : (
          <>
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rb-green-500/15 text-accent ring-1 ring-rb-green-500/20">
                <PenLine className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[11px] font-medium uppercase tracking-wide text-accent">
                  {editing ? "Edit experience" : "New experience"}
                </p>
                <h3 className="text-base font-semibold text-foreground">
                  {editing ? "Update your experience" : "Share your interview experience"}
                </h3>
              </div>
            </div>
            <button
              type="button"
              onClick={() => !saving && onClose()}
              aria-label="Close"
              className="glass-pill grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Scrollable form */}
          <div className="flex-1 space-y-5 overflow-y-auto bg-surface/30 px-5 py-5 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Company" required>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Google"
                    className={`${inputCls} pl-9`}
                  />
                </div>
              </Field>
              <Field label="Role" required>
                <input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  placeholder="e.g. SDE-1"
                  className={inputCls}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Verdict">
                <Segmented
                  options={VERDICTS}
                  value={verdict}
                  onChange={(v) => setVerdict(v as InterviewVerdict)}
                />
              </Field>
              <Field label="Difficulty">
                <Segmented
                  options={DIFFICULTIES}
                  value={difficulty}
                  onChange={(v) => setDifficulty(v as Difficulty)}
                />
              </Field>
            </div>

            <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
              <Field label="Rounds">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={rounds}
                  onChange={(e) => setRounds(Math.max(1, Number(e.target.value) || 1))}
                  className={inputCls}
                />
              </Field>
              <Field label="Tags" hint="comma separated">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="DSA, System Design, Behavioral"
                  className={inputCls}
                />
              </Field>
            </div>

            <Field label="Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Google SDE-1 interview — 5 rounds, lots of DP"
                className={inputCls}
              />
            </Field>

            <Field label="Short summary" hint="optional">
              <input
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="One line that previews your story on the feed."
                className={inputCls}
              />
            </Field>

            {/* Body — shared TipTap editor. No underline tool: the body becomes
                markdown on save, and markdown has no underline, so offering it
                would silently drop the styling the moment the post is published. */}
            <Field label="Your experience" required>
              <RichTextEditor
                ref={editorRef}
                initialHTML={initial?.bodyHtml ?? ""}
                ariaLabel="Experience body"
                placeholder="Walk through each round: questions asked, what worked, what you'd do differently, and tips for the next candidate…"
                minHeightClass="min-h-[220px]"
              />
            </Field>

            {error && (
              <p className="rounded-xl bg-rose-500/10 px-3.5 py-2.5 text-sm text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-300">
                {error}
              </p>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
            <span className="hidden text-xs text-muted sm:block">
              {editing
                ? "Edits go back through review before they're live again."
                : "Reviewed by a moderator before it reaches the feed."}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => !saving && onClose()}
                className="glass-pill rounded-full px-4 py-2 text-sm text-muted transition-colors hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void submit()}
                disabled={saving}
                className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-rb-green-500 px-5 py-2 text-sm font-semibold text-black transition-opacity disabled:opacity-70"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />{" "}
                    {editing ? "Saving…" : "Submitting…"}
                  </>
                ) : editing ? (
                  <>
                    <Save className="h-4 w-4" /> Save changes
                  </>
                ) : (
                  <>
                    <PenLine className="h-4 w-4" /> Submit for review
                  </>
                )}
              </button>
            </div>
          </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}

/**
 * What the author sees the moment their write-up is queued. It replaces the
 * form rather than closing the modal outright: "the dialog vanished" is
 * indistinguishable from "the save failed", and the one thing this screen has to
 * get across is that the post is safe but not yet public.
 */
function SubmittedReceipt({ onClose }: { onClose: () => void }) {
  return (
    <div className="px-6 py-10 text-center sm:px-10">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-500/15 text-amber-500 ring-1 ring-amber-500/20">
        <Hourglass className="h-7 w-7" />
      </span>
      <h3 className="mt-6 text-xl font-bold tracking-tight text-foreground">
        Sent for review
      </h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
        Thanks for writing this up. A moderator reads every experience before it
        reaches the feed — yours appears there once it is approved. You&rsquo;ll
        find it under <span className="text-foreground">Your submissions</span> in
        the meantime, and you can keep editing it until then.
      </p>
      <button
        type="button"
        onClick={onClose}
        className="btn-glow mt-7 inline-flex items-center gap-2 rounded-full bg-rb-green-500 px-6 py-2.5 text-sm font-semibold text-black"
      >
        Done
      </button>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted">
        {label}
        {required && <span className="text-rose-500">*</span>}
        {hint && <span className="font-normal text-muted/70">· {hint}</span>}
      </span>
      {children}
    </label>
  );
}

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex gap-1 rounded-xl border border-border bg-surface/60 p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "bg-rb-green-500/15 text-brand ring-1 ring-rb-green-500/30"
                : "text-muted hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
