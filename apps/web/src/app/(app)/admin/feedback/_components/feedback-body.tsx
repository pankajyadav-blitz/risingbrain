import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { sanitizeRichText } from "@/lib/sanitize";
import { isHtmlBody } from "@/lib/html-to-markdown";

/**
 * Renders one feedback note. `POST /api/feedback` stores markdown, so that is
 * the normal branch; the HTML branch exists because the body is user-authored
 * rich text and an output-side sanitize is the defense that also covers whatever
 * is already in the column.
 *
 * Server-only (like `ExperienceBody`, which it mirrors): `sanitizeRichText`
 * wraps a Node module, and rendering markdown here keeps it off the client
 * bundle. It renders onto `.notes-prose` — the same reading surface the rest of
 * the app's user-authored bodies use — but without the full page sheet, since
 * this sits inside a card in a list.
 */
export function FeedbackBody({ body }: { body: string }) {
  if (isHtmlBody(body)) {
    return (
      <div
        className="notes-prose"
        dangerouslySetInnerHTML={{ __html: sanitizeRichText(body) }}
      />
    );
  }

  return (
    <div className="notes-prose">
      {/* `remark-gfm` for tables/strikethrough/task-lists; raw HTML stays
          disabled (no `rehype-raw`), so react-markdown escapes any stray tag
          rather than executing it. */}
      <Markdown remarkPlugins={[remarkGfm]}>{body}</Markdown>
    </div>
  );
}
