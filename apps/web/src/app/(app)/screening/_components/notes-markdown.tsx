import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";

/**
 * Renders a topic's notes (stored as markdown in `QuizTopic.theory`, seeded from
 * the source PDFs) into the screening "Notes" tab.
 *
 * - `remark-gfm` → GitHub tables/strikethrough/task-lists (the notes are dense
 *   with reference tables: divisibility rules, letter codes, day codes…).
 * - `remark-math` + `rehype-katex` → real typeset math for the quant formulae
 *   ($…$ inline, $$…$$ block). KaTeX runs at render time, so this stays a
 *   Server Component — no client JS is shipped for the notes.
 * - Diagram `<img>`s point at `/study-notes/<topic-slug>/<file>.png` (static
 *   assets under `public/`, extracted from the PDFs). The DB holds only the
 *   markdown with those relative paths, so swapping to S3 later is a base-path
 *   change. (`/study-notes`, not `/notes` — the latter is reserved & auth-gated
 *   in `rbac.ts` for a future personal-notes feature.)
 *
 * Styling lives in `globals.css` under `.notes-prose` (no typography plugin).
 */

const components: Components = {
  // Wrap tables so wide reference grids scroll inside the card instead of
  // forcing the whole paper to overflow horizontally.
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
};

export function NotesMarkdown({ source }: { source: string }) {
  return (
    <div className="notes-prose">
      <Markdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}
      >
        {source}
      </Markdown>
    </div>
  );
}
