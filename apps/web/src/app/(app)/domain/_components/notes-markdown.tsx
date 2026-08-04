import Markdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { NotesFigure } from "@/components/notes-figure";

/**
 * Renders a Domain topic's markdown — the `notes` (theory + diagrams / code
 * screenshots) and `example` (clean, copy-ready code) fields — into the topic
 * view. Server Component: no client JS is shipped for the content.
 *
 * - `remark-gfm` → GitHub tables / strikethrough / task-lists.
 * - Diagram `<img>`s point at `/study-notes/<subject>/<topic-slug>/fig-N.png`
 *   (static assets under `public/`, extracted from the source PDFs by
 *   packages/database/scripts/extract-sql-pdf.py and friends). The DB holds only
 *   markdown with those relative paths, so swapping to a CDN later is a base-path
 *   change. `NotesFigure` sizes each one from its own intrinsic dimensions.
 *
 * Styling lives in `globals.css` under `.notes-prose` (shared with Screening).
 */

const components: Components = {
  // Wrap tables so wide reference grids scroll inside the card instead of forcing
  // the whole view to overflow horizontally.
  table: ({ children }) => (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  ),
  img: NotesFigure,
};

export function NotesMarkdown({ source }: { source: string }) {
  return (
    <div className="notes-prose">
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {source}
      </Markdown>
    </div>
  );
}
