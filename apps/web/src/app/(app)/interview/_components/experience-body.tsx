import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sanitizeRichText } from "@/lib/sanitize";
import { isHtmlBody } from "@/lib/html-to-markdown";

/**
 * Renders an interview experience body, which arrives in one of two formats:
 *
 * - **Markdown** — every post in `seed/interview.json` is authored as markdown
 *   (`## Round-by-round`, `**bold**`, lists). Rendered with `react-markdown`.
 * - **HTML** — the composer is a contentEditable/WYSIWYG surface that submits
 *   `innerHTML`, so user-authored posts are HTML. Sanitized before it reaches
 *   `dangerouslySetInnerHTML`, so a crafted `<img onerror>` or `javascript:`
 *   link can't run in a viewer's session (rows stored before write-time
 *   sanitization existed are covered by this output-side pass too).
 *
 * Both branches share `.notes-prose`, the markdown reading surface defined in
 * `globals.css` — element rules there cover headings, lists, tables, code and
 * blockquotes in both themes, which the previous inline arbitrary-variant
 * classes did not (`##` headings in particular fell through to Tailwind's
 * preflight reset and rendered at body size).
 *
 * Server-only: `sanitizeRichText` wraps a Node module, and rendering markdown
 * here keeps it off the client bundle.
 */
export function ExperienceBody({ body }: { body: string }) {
  // Posts published before write-time markdown conversion existed are still
  // HTML, so they take the sanitized branch.
  if (isHtmlBody(body)) {
    return (
      <div
        className="notes-prose mt-8"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
      />
    );
  }

  return (
    <div className="notes-prose mt-8">
      {/* `remark-gfm` for tables/strikethrough/task-lists; raw HTML stays
          disabled (no `rehype-raw`), so react-markdown escapes any stray tag
          rather than executing it. */}
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}
