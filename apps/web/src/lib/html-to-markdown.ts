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
 * The two callers of "is this HTML?" want OPPOSITE things, and answering both
 * with one predicate is what corrupted posts containing generics.
 *
 * The write path asks "is there any markup to sanitize?" and is safe erring
 * TOWARDS yes — the worst case is a markdown body getting escaped by turndown.
 * The read path asks "is this whole body legacy HTML?" and is safe erring
 * TOWARDS no — the worst case is a legacy post rendering with visible tags,
 * whereas a false yes runs the body through `sanitize-html`, which deletes
 * anything tag-shaped. `vector<int> v;` inside a fenced block became `vector v;`,
 * the fences rendered as literal backticks, and the paragraph breaks collapsed.
 *
 * They also disagree legitimately: the write path sees the composer's raw HTML,
 * the read path sees the markdown that was stored from it. One function applied
 * to two different strings could never have been consistent.
 */

/** Loose — "does this contain markup worth sanitizing?". Write path only. */
export function containsHtmlMarkup(body: string): boolean {
  return /<[a-z][\s\S]*>/i.test(body);
}

/** Fenced blocks and inline spans — code, where angle brackets are just text. */
const CODE_SPANS = /```[\s\S]*?```|~~~[\s\S]*?~~~|`[^`\n]*`/g;

/**
 * Tags we accept as evidence of a legacy HTML body, spelled strictly: a known
 * tag name followed by whitespace, `/` or `>`, so `Map<String, Integer>` and
 * `if (a<b) x>y` don't qualify (`String` isn't a tag name; `<b)` isn't a tag).
 */
const HTML_TAG =
  /<\/?(?:p|div|span|br|hr|ul|ol|li|h[1-6]|pre|code|strong|em|b|i|u|s|del|strike|a|img|blockquote|table|thead|tbody|tr|td|th|figure|figcaption)(?:\s[^<>]*)?\/?>/i;

/**
 * Strict — "was this row stored as HTML?". Read path only.
 *
 * Code is stripped before testing, so a markdown post whose snippets are full of
 * angle brackets can never be mistaken for markup no matter what it contains.
 */
export function isHtmlBody(body: string): boolean {
  return HTML_TAG.test(body.replace(CODE_SPANS, ""));
}
