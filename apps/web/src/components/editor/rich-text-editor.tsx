"use client";

import { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Braces,
  Code2,
  Italic,
  Link2,
  Link2Off,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo2,
  X,
} from "lucide-react";

/**
 * The one rich-text surface in the app — used by the interview composer and the
 * sheet note modal.
 *
 * Both used to be hand-rolled `contentEditable` panes driven by
 * `document.execCommand`, duplicated between the two files. That API is
 * deprecated and, more practically, unreliable for exactly the things people
 * write here: nested lists collapse, there is no way to get *out* of a code
 * block once you are in one, and each browser produces different markup for the
 * same keystroke. It also had no link tool at all, even though the sanitizer
 * allows `<a>` and posts are full of URLs.
 *
 * TipTap (ProseMirror) replaces it with a real document model, so the output is
 * the same structured HTML in every browser — which matters downstream, since an
 * interview body is converted to markdown on save and a malformed nest turns
 * into malformed markdown.
 *
 * The writing surface is `.notes-prose`, the SAME stylesheet the published post
 * and the note reader use, so the editor is honestly WYSIWYG rather than merely
 * similar-looking.
 */

export interface RichTextEditorHandle {
  /** Current content as HTML — what gets persisted. */
  getHTML: () => string;
  /** Plain text, for "is this actually empty?" checks and word counts. */
  getText: () => string;
  isEmpty: () => boolean;
  focus: () => void;
}

interface RichTextEditorProps {
  ref?: React.Ref<RichTextEditorHandle>;
  /** Seed content. Applied once on mount; later changes are ignored. */
  initialHTML?: string;
  placeholder?: string;
  /** Fires on every content change (dirty tracking, autosave, word counts). */
  onUpdate?: () => void;
  /**
   * Underline is offered only where the content is STORED as HTML (notes).
   * Interview bodies become markdown, which has no underline — showing the
   * button there would silently drop the styling the moment the post is saved.
   */
  allowUnderline?: boolean;
  /** Tailwind height class for the writing area. */
  minHeightClass?: string;
  ariaLabel: string;
  autoFocus?: boolean;
}

/** Headings are capped at the levels `sanitizeRichText` allows through (h1–h4). */
const HEADING_LEVELS = [2, 3] as const;

export function RichTextEditor({
  ref,
  initialHTML = "",
  placeholder = "Start writing…",
  onUpdate,
  allowUnderline = false,
  minHeightClass = "min-h-[220px]",
  ariaLabel,
  autoFocus = false,
}: RichTextEditorProps) {
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkValue, setLinkValue] = useState("");

  const editor = useEditor({
    // Next renders this on the server first; rendering the editor immediately
    // would produce markup React then disagrees with on hydration.
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [...HEADING_LEVELS] },
        underline: allowUnderline ? {} : false,
        link: {
          openOnClick: false, // clicking a link in the EDITOR should place the caret
          autolink: true,
          defaultProtocol: "https",
          // Mirrors the sanitizer's transform, so what the author sees in the
          // editor is what survives to the page.
          HTMLAttributes: { rel: "noopener noreferrer nofollow", target: "_blank" },
        },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: initialHTML,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
        class: `notes-prose ${minHeightClass} w-full max-w-none px-4 py-3.5 outline-none`,
      },
    },
    onUpdate: () => onUpdate?.(),
  });

  // Expose an imperative handle rather than lifting content into React state:
  // re-rendering the parent on every keystroke is what makes editors feel laggy.
  useEffect(() => {
    if (!ref || !editor) return;
    const handle: RichTextEditorHandle = {
      getHTML: () => editor.getHTML(),
      getText: () => editor.getText(),
      isEmpty: () => editor.isEmpty,
      focus: () => editor.chain().focus().run(),
    };
    if (typeof ref === "function") ref(handle);
    else ref.current = handle;
  }, [ref, editor]);

  useEffect(() => {
    if (autoFocus && editor) {
      // Next paint, so the modal has finished its open transition first.
      const id = requestAnimationFrame(() => editor.chain().focus("end").run());
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus, editor]);

  const openLink = useCallback(() => {
    if (!editor) return;
    setLinkValue(editor.getAttributes("link").href ?? "");
    setLinkOpen(true);
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const href = linkValue.trim();
    if (!href) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
    }
    setLinkOpen(false);
    setLinkValue("");
  }, [editor, linkValue]);

  if (!editor) return <EditorSkeleton minHeightClass={minHeightClass} />;

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <Toolbar
        editor={editor}
        allowUnderline={allowUnderline}
        onLink={openLink}
        linkOpen={linkOpen}
      />

      {linkOpen && (
        <div className="flex items-center gap-2 border-b border-border bg-surface-2/40 px-2 py-2">
          <Link2 className="h-4 w-4 shrink-0 text-muted" />
          <input
            value={linkValue}
            onChange={(e) => setLinkValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                applyLink();
              }
              if (e.key === "Escape") {
                e.preventDefault();
                setLinkOpen(false);
              }
            }}
            placeholder="https://example.com"
            aria-label="Link URL"
            autoFocus
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface/60 px-2.5 py-1.5 text-sm text-foreground outline-none placeholder:text-muted focus:border-rb-green-500/50"
          />
          <button
            type="button"
            onClick={applyLink}
            className="rounded-lg bg-rb-green-500/15 px-3 py-1.5 text-xs font-semibold text-brand ring-1 ring-rb-green-500/30 transition-colors hover:bg-rb-green-500/25"
          >
            {linkValue.trim() ? "Apply" : "Remove"}
          </button>
          <button
            type="button"
            onClick={() => setLinkOpen(false)}
            aria-label="Cancel link"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <EditorContent editor={editor} className="overflow-y-auto" />
    </div>
  );
}

function EditorSkeleton({ minHeightClass }: { minHeightClass: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface/40">
      <div className="h-[41px] border-b border-border bg-surface-2/50" />
      <div className={`${minHeightClass} space-y-3 px-4 py-4`} aria-hidden>
        <div className="h-3.5 w-2/3 animate-pulse rounded-full bg-surface-2" />
        <div className="h-3.5 w-full animate-pulse rounded-full bg-surface-2" />
        <div className="h-3.5 w-5/6 animate-pulse rounded-full bg-surface-2" />
      </div>
    </div>
  );
}

function Toolbar({
  editor,
  allowUnderline,
  onLink,
  linkOpen,
}: {
  editor: Editor;
  allowUnderline: boolean;
  onLink: () => void;
  linkOpen: boolean;
}) {
  // Subscribe to just the flags the buttons render, so a keystroke doesn't
  // re-render the toolbar unless something it displays actually changed.
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      underline: e.isActive("underline"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bullet: e.isActive("bulletList"),
      ordered: e.isActive("orderedList"),
      quote: e.isActive("blockquote"),
      code: e.isActive("code"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
      canUndo: e.can().undo(),
      canRedo: e.can().redo(),
    }),
  });

  const chain = () => editor.chain().focus();

  return (
    <div className="flex items-center gap-0.5 overflow-x-auto border-b border-border bg-surface-2/50 px-2 py-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Tool icon={Bold} label="Bold" hint="Ctrl+B" active={state.bold} onClick={() => chain().toggleBold().run()} />
      <Tool icon={Italic} label="Italic" hint="Ctrl+I" active={state.italic} onClick={() => chain().toggleItalic().run()} />
      <Tool icon={Strikethrough} label="Strikethrough" active={state.strike} onClick={() => chain().toggleStrike().run()} />
      {allowUnderline && (
        <Tool
          icon={UnderlineIcon}
          label="Underline"
          hint="Ctrl+U"
          active={state.underline}
          onClick={() => chain().toggleUnderline().run()}
        />
      )}

      <Divider />

      <TextTool label="Heading" text="H2" active={state.h2} onClick={() => chain().toggleHeading({ level: 2 }).run()} />
      <TextTool label="Subheading" text="H3" active={state.h3} onClick={() => chain().toggleHeading({ level: 3 }).run()} />

      <Divider />

      <Tool icon={List} label="Bulleted list" active={state.bullet} onClick={() => chain().toggleBulletList().run()} />
      <Tool icon={ListOrdered} label="Numbered list" active={state.ordered} onClick={() => chain().toggleOrderedList().run()} />
      <Tool icon={Quote} label="Quote" active={state.quote} onClick={() => chain().toggleBlockquote().run()} />

      <Divider />

      <Tool icon={Code2} label="Inline code" active={state.code} onClick={() => chain().toggleCode().run()} />
      <Tool icon={Braces} label="Code block" active={state.codeBlock} onClick={() => chain().toggleCodeBlock().run()} />
      <Tool
        icon={state.link ? Link2Off : Link2}
        label={state.link ? "Edit or remove link" : "Add link"}
        hint="Ctrl+K"
        active={state.link || linkOpen}
        onClick={onLink}
      />

      <Divider />

      <Tool icon={Undo2} label="Undo" hint="Ctrl+Z" disabled={!state.canUndo} onClick={() => chain().undo().run()} />
      <Tool icon={Redo2} label="Redo" hint="Ctrl+Shift+Z" disabled={!state.canRedo} onClick={() => chain().redo().run()} />
    </div>
  );
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />;
}

const toolCls = (active?: boolean, disabled?: boolean) =>
  `grid h-8 w-8 shrink-0 place-items-center rounded-lg text-sm transition-colors ${
    disabled
      ? "cursor-not-allowed text-muted/40"
      : active
        ? "bg-rb-green-500/15 text-accent ring-1 ring-rb-green-500/30"
        : "text-muted hover:bg-rb-green-500/15 hover:text-accent"
  }`;

function Tool({
  icon: Icon,
  label,
  hint,
  active,
  disabled,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  hint?: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      // Keeps the selection intact — without this, focusing the button first
      // collapses the range the command is meant to act on.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      title={hint ? `${label} (${hint})` : label}
      className={toolCls(active, disabled)}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function TextTool({
  text,
  label,
  active,
  onClick,
}: {
  text: string;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      className={`${toolCls(active)} font-semibold`}
    >
      {text}
    </button>
  );
}
