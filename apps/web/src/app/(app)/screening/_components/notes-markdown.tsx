import { isValidElement, type ReactNode } from "react";
import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { NotesFigure } from "@/components/notes-figure";
import { createHeadingIds } from "@/lib/markdown-toc";

/**
 * Renders a topic's notes (stored as markdown in `QuizTopic.theory`, seeded from
 * the source PDFs) into the screening "Notes" tab.
 *
 * - `remark-gfm` → GitHub tables/strikethrough/task-lists (the notes are dense
 *   with reference tables: divisibility rules, letter codes, day codes…).
 * - `remark-math` + `rehype-katex` → real typeset math for the quant formulae
 *   ($…$ inline, $$…$$ block). KaTeX runs at render time, so this stays a
 *   Server Component — no client JS is shipped for the notes.
 * - `##`/`###` headings get ids, so the "On this page" rail can link into them.
 *   The ids come from `createHeadingIds()`, the SAME generator `extractToc()`
 *   uses, walked in the same order — that is what keeps the rail's links and the
 *   document's anchors in agreement when a title repeats.
 * - Diagram `<img>`s point at `/study-notes/<topic-slug>/<file>.png` (static
 *   assets under `public/`, extracted from the PDFs). The DB holds only the
 *   markdown with those relative paths, so swapping to S3 later is a base-path
 *   change. (`/study-notes`, not `/notes` — the latter is reserved & auth-gated
 *   in `rbac.ts` for a future personal-notes feature.)
 *
 * Styling lives in `globals.css` under `.notes-prose` (no typography plugin).
 */

/** The visible text of a rendered heading, for slugging. */
function textOf(node: ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return textOf(node.props.children);
  return "";
}

function buildComponents(): Components {
  // One generator per render, consumed in document order by the heading
  // renderers below — react-markdown walks the tree depth-first, so the call
  // order here matches the line order `extractToc` reads.
  const nextId = createHeadingIds();

  return {
    // Wrap tables so wide reference grids scroll inside the card instead of
    // forcing the whole paper to overflow horizontally.
    table: ({ children }) => (
      <div className="table-wrap">
        <table>{children}</table>
      </div>
    ),
    // Size each diagram from its own intrinsic dimensions rather than letting one
    // rule cover figures that range from 212px to 2048px wide.
    img: NotesFigure,
    h2: ({ children }) => <h2 id={nextId(textOf(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={nextId(textOf(children))}>{children}</h3>,
  };
}

export function NotesMarkdown({ source }: { source: string }) {
  return (
    <div className="notes-prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={buildComponents()}
      >
        {source}
      </Markdown>
    </div>
  );
}
