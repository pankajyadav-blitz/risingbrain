import "server-only";
import TurndownService from "turndown";

/**
 * Convert the composer's WYSIWYG output to markdown before it is stored.
 *
 * The interview composer is a contentEditable surface driven by `execCommand`,
 * so it hands us HTML — but `InterviewExperience.body` is markdown (every post
 * in `seed/interview.json` is authored that way, and the render path styles it
 * with `.notes-prose`). Converting on write keeps one format in the column
 * instead of two, so the body of a user's post is indistinguishable from a
 * seeded one.
 *
 * Run this AFTER `sanitizeRichText`, never instead of it: the sanitizer is what
 * strips scripts, event handlers and `javascript:` URLs, and markdown can still
 * carry a live link, so the untrusted input must be cleaned while it is still
 * HTML.
 *
 * Server-only: `turndown` parses HTML through a DOM shim that must not reach
 * the client bundle.
 */
const service = new TurndownService({
  // `## Heading`, matching how the seed bodies are written.
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
  emDelimiter: "*",
  strongDelimiter: "**",
});

// contentEditable marks an empty line as a lone `<br>` inside a block. Turndown
// gives every `<br>` a hard break by default, which would leave a literal "\"
// sitting in the post; only a break with text beside it is a real one.
service.addRule("lineBreak", {
  filter: ["br"],
  replacement: (_content, node) => {
    const isSpacer = (node.parentNode?.textContent ?? "").trim() === "";
    return isSpacer ? "" : "\\\n";
  },
});

// The composer's code-block tool is `formatBlock <pre>`, so it produces a bare
// `<pre>` — turndown only fences `<pre><code>`, and would otherwise flatten the
// snippet into an ordinary paragraph.
service.addRule("bareCodeBlock", {
  filter: (node) => node.nodeName === "PRE" && !node.querySelector("code"),
  replacement: (_content, node) => {
    const code = (node.textContent ?? "").replace(/\n+$/, "");
    return `\n\n\`\`\`\n${code}\n\`\`\`\n\n`;
  },
});

// `~~strikethrough~~` — rendered back by remark-gfm on the read side.
service.addRule("strikethrough", {
  filter: ["del", "s", "strike"] as TurndownService.Filter,
  replacement: (content) => `~~${content}~~`,
});

// Markdown has no underline, and the render path deliberately does not enable
// raw HTML — a passed-through `<u>` would be escaped and shown as literal text.
// Keeping the words and dropping the styling is the honest trade, so the
// composer's toolbar no longer offers underline.
service.addRule("underline", {
  filter: ["u"],
  replacement: (content) => content,
});

export function htmlToMarkdown(html: string): string {
  return service.turndown(html).trim();
}

/**
 * Does this body carry HTML? Markdown bodies contain no tags, so anything with
 * one came from the composer or from a row stored before write-time conversion
 * existed. Both the write path (what to convert) and the read path (how to
 * render) key off this, so they stay in agreement.
 */
export function looksLikeHtml(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}
