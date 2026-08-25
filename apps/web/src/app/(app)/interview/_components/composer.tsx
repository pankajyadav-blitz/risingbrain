"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Bold,
  Building2,
  Code2,
  Heading,
  Italic,
  List,
  ListOrdered,
  Loader2,
  PenLine,
  Quote,
  X,
} from "lucide-react";
import { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";

type Tool = [icon: React.ElementType, label: string, command: string, value?: string];

/**
 * No underline tool: the body is converted to markdown on save (see
 * `POST /api/interview`), and markdown has no underline — offering the button
 * would silently drop the styling once the post is published.
 */
const TOOLS: Tool[] = [
  [Bold, "Bold", "bold"],
  [Italic, "Italic", "italic"],
  [Heading, "Heading", "formatBlock", "<h3>"],
  [List, "Bulleted list", "insertUnorderedList"],
  [ListOrdered, "Numbered list", "insertOrderedList"],
  [Quote, "Quote", "formatBlock", "<blockquote>"],
  [Code2, "Code block", "formatBlock", "<pre>"],
];

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
 * Portal modal that lets a signed-in user publish an interview experience.
 * The body is a Word-like contentEditable surface driven by execCommand
 * (ported from the sheet note editor); its innerHTML is submitted as `body`,
 * and the API converts that HTML to markdown before storing it, so published
 * posts share one format with the seeded ones.
 */
export function Composer({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const bodyRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [verdict, setVerdict] = useState<InterviewVerdict>(InterviewVerdict.PENDING);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.MEDIUM);
  const [rounds, setRounds] = useState(3);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [excerpt, setExcerpt] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const cmd = useCallback((command: string, value?: string) => {
    bodyRef.current?.focus();
    document.execCommand(command, false, value);
  }, []);

  async function submit() {
    setError(null);
    const el = bodyRef.current;
    const html = el?.innerHTML ?? "";
    const bodyText = (el?.innerText ?? "").trim();

    if (!company.trim() || !role.trim() || !title.trim() || !bodyText) {
      setError("Company, role, title and the experience body are all required.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
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
      });
      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data = (await res.json()) as { id?: string; error?: string };
      if (!res.ok || !data.id) {
        setError(data.error ?? "Something went wrong. Please try again.");
        setSaving(false);
        return;
      }
      onClose();
      router.push(`/interview/${data.id}`);
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
        aria-label="Share your interview experience"
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-rb-green-500/15 text-accent ring-1 ring-rb-green-500/20">
              <PenLine className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wide text-accent">
                New experience
              </p>
              <h3 className="text-base font-semibold text-foreground">
                Share your interview experience
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

          {/* Body — WYSIWYG editor */}
          <Field label="Your experience" required>
            <div className="overflow-hidden rounded-xl border border-border">
              <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-2/50 px-2 py-1.5">
                {TOOLS.map(([Icon, label, command, value], i) => (
                  <button
                    key={i}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => cmd(command, value)}
                    aria-label={label}
                    title={label}
                    className="grid h-8 w-8 place-items-center rounded-lg text-muted transition-colors hover:bg-rb-green-500/15 hover:text-accent"
                  >
                    <Icon className="h-4 w-4" />
                  </button>
                ))}
                <span className="ml-1 hidden text-xs text-muted sm:block">
                  Select text, then format — just like a doc.
                </span>
              </div>
              <div
                ref={bodyRef}
                role="textbox"
                aria-multiline="true"
                aria-label="Experience body"
                contentEditable
                suppressContentEditableWarning
                data-ph="Walk through each round: questions asked, what worked, what you'd do differently, and tips for the next candidate…"
                className="min-h-[200px] space-y-2 overflow-y-auto bg-surface/40 px-4 py-3.5 text-sm leading-relaxed text-foreground outline-none empty:before:text-muted empty:before:content-[attr(data-ph)] [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-rb-green-500/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_ul]:list-disc [&_ul]:pl-5"
              />
            </div>
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
            Published to the community feed.
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
                  <Loader2 className="h-4 w-4 animate-spin" /> Publishing…
                </>
              ) : (
                <>
                  <PenLine className="h-4 w-4" /> Publish
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
