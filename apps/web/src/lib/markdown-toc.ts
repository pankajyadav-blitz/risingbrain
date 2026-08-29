/**
 * Section index for a body of notes — shared by Domain topics and Screening
 * papers, which are the same kind of document.
 *
 * Domain notes follow a fixed teaching shape — Hook, Why & what, How it works,
 * Common confusion, Interview angle, Recap — so a topic is not one essay but six
 * named parts a learner navigates between. Someone revising the night before an
 * interview wants "Interview angle" and "Recap"; someone meeting the topic for
 * the first time reads top to bottom. Only one of those is served by scrolling.
 *
 * Headings are read from the markdown SOURCE rather than the rendered output, so
 * the rail can be server-rendered alongside the notes with no second pass and no
 * client-side DOM walk.
 */

export interface TocItem {
  id: string;
  text: string;
  /** 2 = `##` section, 3 = `###` subsection (rendered as a sub-item). */
  level: 2 | 3;
}

/** GitHub-style heading slug: lowercase, punctuation dropped, spaces to dashes. */
function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      // Strip the inline markdown that can appear in a heading (`code`, **bold**)
      // so the id reflects the words, not the markup.
      .replace(/[`*_~]/g, "")
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "section"
  );
}

/**
 * Stable, collision-free ids for a run of headings.
 *
 * Shared by the extractor here and by `NotesMarkdown`'s heading renderer, which
 * is the whole point: both walk the same headings in the same order, so a
 * repeated title ("Notes" twice in one topic) gets the same `-2` suffix on both
 * sides and the rail's links never dangle. Keep them calling this, not their own
 * copies of it.
 */
export function createHeadingIds() {
  const seen = new Map<string, number>();
  return (text: string): string => {
    const base = slugify(text);
    const n = (seen.get(base) ?? 0) + 1;
    seen.set(base, n);
    return n === 1 ? base : `${base}-${n}`;
  };
}

/** Fenced code blocks — a `#` comment inside one is not a heading. */
const FENCE = /^\s*(```|~~~)/;

export function extractToc(markdown: string): TocItem[] {
  const nextId = createHeadingIds();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    if (FENCE.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const m = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!m) continue;
    const text = m[2]!.replace(/[`*_~]/g, "").trim();
    if (!text) continue;
    items.push({ id: nextId(text), text, level: m[1]!.length as 2 | 3 });
  }

  // A single section is the document itself, so a rail listing it says nothing.
  // Two is worth showing: on a 1,800-character page — a Screening topic like
  // "Direction Sense", which is one method and its traps — jumping straight to
  // the second half is exactly what someone revising wants, and the threshold
  // was the only reason those pages had no rail at all.
  return items.length >= 2 ? items : [];
}
