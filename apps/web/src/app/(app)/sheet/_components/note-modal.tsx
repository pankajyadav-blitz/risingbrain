"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  Bold,
  Check,
  Code2,
  Heading,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
  Underline,
  X,
} from "lucide-react";

type Tool = [icon: React.ElementType, label: string, command: string, value?: string];

const TOOLS: Tool[] = [
  [Bold, "Bold", "bold"],
  [Italic, "Italic", "italic"],
  [Underline, "Underline", "underline"],
  [Heading, "Heading", "formatBlock", "<h3>"],
  [List, "Bulleted list", "insertUnorderedList"],
  [ListOrdered, "Numbered list", "insertOrderedList"],
  [Quote, "Quote", "formatBlock", "<blockquote>"],
  [Code2, "Code block", "formatBlock", "<pre>"],
];

type SaveStatus = "idle" | "unsaved" | "saving" | "saved";

const AUTOSAVE_MS = 2000;

/**
 * Floating, glass-themed WYSIWYG note editor. A Word-like contentEditable
 * surface driven by document.execCommand (no markdown markers, no deps). The
 * editor's innerHTML is persisted as the note `content` via GET/PUT.
 *
 * Auto-saves 2s after the user stops typing — but only once they've actually
 * edited (opening a note never writes a row), and an emptied note deletes the
 * row rather than storing an empty entry. Pending edits are flushed on close.
 */
export function NoteModal({
  problemId,
  title,
  onClose,
  onSaved,
}: {
  problemId: string;
  title: string;
  onClose: () => void;
  onSaved: (hasNote: boolean) => void;
}) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const [initialHtml, setInitialHtml] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [words, setWords] = useState(0);
  const [status, setStatus] = useState<SaveStatus>("idle");

  // dirty = the user has edited since the last successful save (gates autosave
  // so we never persist an untouched/empty note).
  const dirtyRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Loading is derived from the fetched content so the editor surface mounts in
  // the SAME render that content arrives — letting the seed effect below find
  // bodyRef.current and apply innerHTML.
  const loading = initialHtml === null;

  useEffect(() => setMounted(true), []);

  const countWords = useCallback(() => {
    const text = bodyRef.current?.innerText.trim() ?? "";
    setWords(text ? text.split(/\s+/).length : 0);
  }, []);

  // Persist the current editor content. An empty/whitespace-only note sends ""
  // so the API deletes the row instead of storing an empty entry.
  const persist = useCallback(async () => {
    const el = bodyRef.current;
    if (!el) return;
    const text = el.innerText.trim();
    const content = text ? el.innerHTML : "";
    setStatus("saving");
    try {
      const res = await fetch(`/api/sheet/notes/${problemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      // A non-2xx (e.g. session expired → 401, or rate-limited → 429) still
      // resolves the fetch. Treat it as a failure so we don't clear the dirty
      // flag / "has note" dot and falsely report "Saved".
      if (!res.ok) throw new Error(`save failed: ${res.status}`);
      const data = (await res.json()) as { hasNote?: boolean };
      onSaved(Boolean(data.hasNote));
      dirtyRef.current = false;
      setStatus("saved");
    } catch {
      setStatus("unsaved"); // keep dirty so a later flush retries
    }
  }, [problemId, onSaved]);

  // Debounced autosave — armed only by real edits.
  const scheduleAutosave = useCallback(() => {
    dirtyRef.current = true;
    setStatus("unsaved");
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void persist();
    }, AUTOSAVE_MS);
  }, [persist]);

  const handleInput = useCallback(() => {
    countWords();
    scheduleAutosave();
  }, [countWords, scheduleAutosave]);

  // Flush any pending edit, then close.
  const handleClose = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (dirtyRef.current) await persist();
    onClose();
  }, [persist, onClose]);

  // Fetch the existing note content.
  useEffect(() => {
    let active = true;
    fetch(`/api/sheet/notes/${problemId}`)
      .then((r) => (r.ok ? r.json() : { content: "" }))
      .then((d: { content?: string }) => {
        if (active) setInitialHtml(d.content ?? "");
      })
      .catch(() => {
        if (active) setInitialHtml("");
      });
    return () => {
      active = false;
    };
  }, [problemId]);

  // Seed the editor's innerHTML once content has loaded and the surface exists.
  // (Programmatic innerHTML does NOT fire `input`, so this never arms autosave.)
  useEffect(() => {
    if (initialHtml === null || !bodyRef.current) return;
    bodyRef.current.innerHTML = initialHtml;
    countWords();
    requestAnimationFrame(() => bodyRef.current?.focus());
  }, [initialHtml, countWords]);

  // Esc closes (flushing first) + lock body scroll. Clear any pending timer on
  // unmount so a late autosave can't fire after the modal is gone.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") void handleClose();
    }
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleClose]);

  const cmd = useCallback(
    (command: string, value?: string) => {
      bodyRef.current?.focus();
      document.execCommand(command, false, value);
      handleInput();
    },
    [handleInput]
  );

  if (!mounted) return null;

  return createPortal(
    <div
      className="animate-in fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={() => void handleClose()}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Note for ${title}`}
        onClick={(e) => e.stopPropagation()}
        className="glass flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl sm:rounded-3xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-accent">Note</p>
            <h3 className="truncate text-base font-semibold text-foreground">{title}</h3>
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            aria-label="Close"
            className="glass-pill grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Formatting toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-2/50 px-3 py-2">
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
          <span className="mx-2 hidden h-5 w-px bg-border sm:block" />
          <span className="hidden text-xs text-muted sm:block">
            Select text, then format — just like a doc.
          </span>
        </div>

        {/* The "page" — a Word-like writing surface */}
        <div className="flex-1 overflow-y-auto bg-surface/40 px-4 py-5 sm:px-8">
          {loading ? (
            <div className="mx-auto max-w-3xl">
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
                <Loader2 className="h-4 w-4 animate-spin text-accent" />
                Loading note…
              </div>
              <div className="space-y-3" aria-hidden>
                <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-surface-2" />
                <div className="h-3.5 w-full animate-pulse rounded-full bg-surface-2" />
                <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-surface-2" />
                <div className="h-3.5 w-3/4 animate-pulse rounded-full bg-surface-2" />
              </div>
            </div>
          ) : (
            <div
              ref={bodyRef}
              onInput={handleInput}
              role="textbox"
              aria-multiline="true"
              aria-label="Note body"
              className="mx-auto min-h-[240px] max-w-3xl space-y-2 leading-relaxed text-foreground outline-none empty:before:text-muted empty:before:content-[attr(data-ph)] sm:min-h-[320px] [&_a]:text-accent [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-rb-green-500/40 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-muted [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:rounded-lg [&_pre]:bg-surface-2 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-sm [&_ul]:list-disc [&_ul]:pl-5"
              contentEditable
              suppressContentEditableWarning
              data-ph="Jot your approach, edge cases, complexity, and gotchas…"
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3.5">
          <div className="flex items-center gap-3">
            <span className="text-xs tabular-nums text-muted">
              {words} {words === 1 ? "word" : "words"}
            </span>
            <SaveIndicator status={status} />
          </div>
          <button
            type="button"
            onClick={() => void handleClose()}
            className="btn-glow inline-flex items-center gap-1.5 rounded-full bg-rb-green-500 px-4 py-2 text-xs font-semibold text-black transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function SaveIndicator({ status }: { status: SaveStatus }) {
  if (status === "idle") return null;
  if (status === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted">
        <Loader2 className="h-3 w-3 animate-spin" /> Saving…
      </span>
    );
  }
  if (status === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-accent">
        <Check className="h-3 w-3" /> Saved
      </span>
    );
  }
  // unsaved
  return <span className="text-xs text-muted">Unsaved changes…</span>;
}
