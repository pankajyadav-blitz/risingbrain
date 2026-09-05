import type { Element, ElementContent, Root, RootContent } from "hast";

/**
 * Wraps a puzzle's answer — the `**Solution**` block and the `**Reasoning**`
 * that follows it — in a single `.puzzle-answer` container, so the notes can
 * tint it and set it apart from the puzzle statement above.
 *
 * The puzzle bank is content-only (no `QuizQuestion` rows): the statement,
 * rules, hints, solution and reasoning all live in one markdown blob in
 * `QuizTopic.theory`, one `## N. Title` section per puzzle. Every section ends
 * with the same two labelled blocks:
 *
 *     **Solution**
 *     1. …
 *     **Reasoning**
 *     …prose to the end of the section…
 *
 * So the answer is exactly "the `**Solution**` paragraph through to the next
 * heading", which is what this walks. It runs on the hast tree (after
 * markdown → HTML) rather than rewriting the markdown source, because that
 * keeps the seed data untouched and needs no `rehype-raw` — the notes never
 * allow raw HTML through, and this must not be the change that starts.
 *
 * Opt-in: only `NotesMarkdown`'s `highlightAnswers` callers get this, which is
 * the PUZZLE kind alone. Aptitude and reasoning notes render byte-identically.
 */

const isHeading = (node: RootContent): boolean =>
  node.type === "element" && /^h[1-6]$/.test(node.tagName);

/** The visible text of a hast node. */
function textOf(node: RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if (node.type === "element") return node.children.map(textOf).join("");
  return "";
}

/**
 * True for a paragraph whose leading run is a bold label, e.g. `**Solution**`.
 * Matching the label (not the position) is what keeps this from firing on the
 * `**Rules**` / `**Hint 1**` blocks that share the same shape earlier in the
 * section.
 */
function isBoldLabel(node: RootContent, label: string): boolean {
  if (node.type !== "element" || node.tagName !== "p") return false;
  const first = node.children.find(
    (child) => !(child.type === "text" && child.value.trim() === "")
  );
  if (!first || first.type !== "element" || first.tagName !== "strong") return false;
  return textOf(first).trim().toLowerCase() === label;
}

export function rehypePuzzleAnswer() {
  return (tree: Root): void => {
    const out: RootContent[] = [];

    for (let i = 0; i < tree.children.length; i++) {
      const node = tree.children[i]!;
      if (!isBoldLabel(node, "solution")) {
        out.push(node);
        continue;
      }

      // Absorb everything up to (not including) the heading that opens the next
      // puzzle; a final section simply runs to the end of the document.
      const block: ElementContent[] = [];
      let end = i;
      while (end < tree.children.length) {
        const next = tree.children[end]!;
        if (end > i && isHeading(next)) break;
        block.push(next as ElementContent);
        end++;
      }

      const wrapper: Element = {
        type: "element",
        tagName: "div",
        properties: { className: ["puzzle-answer"] },
        children: block,
      };
      out.push(wrapper);
      i = end - 1;
    }

    tree.children = out;
  };
}
