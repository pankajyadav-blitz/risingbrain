import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Sanitize user-authored rich text (interview experience bodies, problem notes)
 * before it is stored AND before it is rendered with `dangerouslySetInnerHTML`.
 *
 * These bodies come from a contentEditable/WYSIWYG editor, so they are raw HTML
 * the user fully controls. Without sanitization that is a stored-XSS sink: a
 * crafted `<img onerror>`, `<svg onload>`, inline handler or `javascript:` URL
 * would run in every viewer's session. We allow only the formatting tags the
 * editors actually produce and strip everything else (scripts, event handlers,
 * unknown protocols, style/attribute injection).
 *
 * Server-only: `sanitize-html` is a Node module and must never reach the client
 * bundle. Sanitize on OUTPUT (render) as the primary defense so already-stored
 * rows are safe too, and on INPUT (write) as defense in depth.
 */
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "b", "strong", "i", "em", "u", "s", "strike",
    "h1", "h2", "h3", "h4",
    "ul", "ol", "li",
    "blockquote", "pre", "code",
    "a", "span", "hr",
  ],
  allowedAttributes: {
    a: ["href", "target", "rel"],
  },
  // Only safe link protocols; anything else (javascript:, data:) is dropped.
  allowedSchemes: ["http", "https", "mailto"],
  allowProtocolRelative: false,
  // Force external links to be safe from tab-nabbing.
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer nofollow", target: "_blank" }),
  },
  disallowedTagsMode: "discard",
};

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}
