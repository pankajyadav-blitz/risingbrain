/**
 * One-off content extractor for the OOP Mastery Roadmap PDF.
 *
 * Parses the source PDF into the unified Domain content shape and writes:
 *   - packages/database/seed/domain.json   — the OOPS topics (notes markdown)
 *   - apps/web/public/study-notes/oops/<slug>/fig-N.png — every embedded figure
 *
 * The clean Java for each topic's "Example" tab is authored separately in
 * seed/domain-examples.json and merged at seed time (see domain-loader.ts), so this
 * script only owns the theory notes + the diagrams/code screenshots extracted
 * from the PDF (images are placed inline, per page, exactly where they appear).
 *
 * Run once (or whenever the PDF changes):
 *   bun run packages/database/scripts/extract-oops.ts
 *
 * mupdf is a dev-only dependency used solely by this script.
 */
import * as mupdf from "mupdf";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
const PDF_PATH = path.join(REPO_ROOT, "OOP Mastery Roadmap (0 → Hero).pdf");
const IMG_OUT_DIR = path.join(REPO_ROOT, "apps/web/public/study-notes/oops");
const JSON_OUT = path.join(import.meta.dir, "../seed/domain-oops.json");
const IMG_URL_BASE = "/study-notes/oops";

// The ordered topic map, keyed by the PDF page each topic's section begins on.
// (Derived from the document's heading structure; two topics whose "N." prefix
// was flattened by the PDF — Abstraction, Constructor Overloading — and the
// Design-Principles intro are inserted at their real start pages.)
type TopicDef = { num: number; title: string; startPage: number; phase: number };
// Left-nav section labels (the source's phase names, without the "Phase N —" prefix).
const PHASES: Record<number, string> = {
  1: "Why Do We Even Need OOP?",
  2: "Building Blocks of OOP",
  3: "The Four Pillars",
  4: "OOP Relationships",
  5: "Core Java OOP Features",
  6: "Advanced OOP",
  7: "SOLID Principles",
  8: "Design Principles",
};
const TOPICS: TopicDef[] = [
  { num: 1, title: "What is Programming?", startPage: 1, phase: 1 },
  { num: 2, title: "What is Procedural Programming?", startPage: 4, phase: 1 },
  { num: 3, title: "Problems with Procedural Programming", startPage: 7, phase: 1 },
  { num: 4, title: "Birth of Object Oriented Programming", startPage: 9, phase: 1 },
  { num: 5, title: "What is OOP?", startPage: 10, phase: 1 },
  { num: 6, title: "Why Companies Love OOP", startPage: 11, phase: 1 },
  { num: 7, title: "What is a Class?", startPage: 14, phase: 2 },
  { num: 8, title: "What is an Object?", startPage: 17, phase: 2 },
  { num: 9, title: "Class vs Object", startPage: 26, phase: 2 },
  { num: 10, title: "Attributes vs Methods", startPage: 27, phase: 2 },
  { num: 11, title: "Creating Multiple Objects", startPage: 30, phase: 2 },
  { num: 12, title: "Encapsulation", startPage: 31, phase: 3 },
  { num: 13, title: "Abstraction", startPage: 36, phase: 3 },
  { num: 14, title: "Inheritance", startPage: 39, phase: 3 },
  { num: 15, title: "Polymorphism", startPage: 44, phase: 3 },
  { num: 16, title: "Association", startPage: 51, phase: 4 },
  { num: 17, title: "Aggregation", startPage: 54, phase: 4 },
  { num: 18, title: "Composition", startPage: 57, phase: 4 },
  { num: 19, title: "Dependency", startPage: 60, phase: 4 },
  { num: 20, title: "Constructor", startPage: 62, phase: 5 },
  { num: 21, title: "Constructor Overloading & Chaining", startPage: 67, phase: 5 },
  { num: 22, title: "super Keyword", startPage: 73, phase: 5 },
  { num: 23, title: "static Keyword", startPage: 74, phase: 5 },
  { num: 24, title: "Access Modifiers", startPage: 76, phase: 5 },
  { num: 25, title: "final Keyword", startPage: 78, phase: 5 },
  { num: 26, title: "Object Class", startPage: 79, phase: 5 },
  { num: 27, title: "Abstract Class", startPage: 83, phase: 6 },
  { num: 28, title: "Interface", startPage: 90, phase: 6 },
  { num: 29, title: "Interface vs Abstract Class", startPage: 96, phase: 6 },
  { num: 30, title: "Nested Classes", startPage: 98, phase: 6 },
  { num: 31, title: "Anonymous Objects", startPage: 107, phase: 6 },
  { num: 32, title: "Immutable Objects", startPage: 110, phase: 6 },
  { num: 33, title: "Single Responsibility Principle (SRP)", startPage: 117, phase: 7 },
  { num: 34, title: "Open Closed Principle (OCP)", startPage: 122, phase: 7 },
  { num: 35, title: "Liskov Substitution Principle (LSP)", startPage: 128, phase: 7 },
  { num: 36, title: "Interface Segregation Principle (ISP)", startPage: 132, phase: 7 },
  { num: 37, title: "Dependency Inversion Principle (DIP)", startPage: 137, phase: 7 },
  { num: 38, title: "Introduction to Design Principles", startPage: 142, phase: 8 },
  { num: 39, title: "DRY (Don't Repeat Yourself)", startPage: 146, phase: 8 },
  { num: 40, title: "KISS (Keep It Simple, Stupid)", startPage: 151, phase: 8 },
  { num: 41, title: "YAGNI (You Aren't Gonna Need It)", startPage: 155, phase: 8 },
  { num: 42, title: "Composition over Inheritance", startPage: 160, phase: 8 },
  { num: 43, title: "Program to an Interface", startPage: 165, phase: 8 },
  { num: 44, title: "High Cohesion", startPage: 171, phase: 8 },
  { num: 45, title: "Low Coupling", startPage: 175, phase: 8 },
];
// Content ends before the near-empty Phase 9-11 title pages.
const LAST_CONTENT_PAGE = 179;

// Special glyphs the PDF text stream uses, referenced via escapes so the source
// stays free of irregular whitespace / control characters.
const BULLET = "●"; // "●" list marker
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\uFEFF|\u00A0/g; // zero-width / non-breaking spaces

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Common inline sub-headings in the source — promoted to bold markdown lines. */
const SUBHEADINGS = new Set(
  [
    "Introduction",
    "Problem Statement",
    "Real-World Problem",
    "Real-World Example",
    "Real-World Examples",
    "Real-World Analogy",
    "Real-World Impact",
    "What is the problem?",
    "Solution",
    "Benefits",
    "Advantages",
    "Disadvantages",
    "Key Points",
    "Syntax",
    "Example",
    "Types",
    "Conclusion",
    "Summary",
    "Note",
    "Definition",
    "Why Does This Happen?",
  ].map((s) => s.toLowerCase())
);

/** Turn one page's raw extracted text into cleaner markdown. */
function cleanPageText(raw: string): string {
  const lines = raw.split("\n");
  const out: string[] = [];
  for (let line of lines) {
    line = line.replace(ZERO_WIDTH, " ");
    const isBullet = line.trimStart().startsWith(BULLET);
    line = line.split(BULLET).join(" ").trim(); // drop bullet glyphs
    if (!line) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }
    if (isBullet) {
      out.push("- " + line);
      continue;
    }
    // Re-insert the space the PDF drops after sentence-ending punctuation.
    line = line.replace(/([a-z0-9)])\.([A-Z])/g, "$1. $2");
    line = line.replace(/([a-z0-9)]),([A-Z])/g, "$1, $2");
    const bare = line.replace(/[:?]$/, "").trim().toLowerCase();
    if (SUBHEADINGS.has(bare) || SUBHEADINGS.has(line.toLowerCase())) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      out.push(`**${line}**`);
      out.push("");
      continue;
    }
    out.push(line);
  }
  return out.join("\n");
}

function firstSentence(md: string): string {
  const lines = md
    .split("\n")
    .map((l) => l.replace(/^[-*#>\s]+/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l && !l.startsWith("!["));
  // Prefer the first line that reads like a prose sentence.
  for (const l of lines) {
    const m = l.match(/^([A-Z][^\n]{24,180}?[.?!])(\s|$)/);
    if (m) return m[1]!.trim();
  }
  const f = (lines[0] ?? "").trim();
  return f.length > 170 ? f.slice(0, 167).trimEnd() + "…" : f;
}

/**
 * Drop lead-in paragraphs already represented in the record's structured fields:
 * the "Phase N — …" banner + its "Goal:" blurb (→ groupLabel) and the topic's own
 * "N. Title" heading (→ title). Everything else is real body content.
 */
function stripLeadIns(notes: string, num: number, titleLen: number): string {
  const paras = notes.split(/\n{2,}/).filter((p) => {
    const s = p.trim();
    if (/^\*{0,2}Phase \d+ [—-]/.test(s)) return false;
    if (/^Goal:/i.test(s)) return false;
    if (new RegExp(`^${num}\\.\\s+`).test(s) && s.length < titleLen + 10) return false;
    return true;
  });
  return paras.join("\n\n").replace(/\n{3,}/g, "\n\n").trim();
}

// ── Extract ──────────────────────────────────────────────────────────────────
const doc = mupdf.Document.openDocument(
  new Uint8Array(fs.readFileSync(PDF_PATH)),
  "application/pdf"
);
const pageCount = doc.countPages();

// Which topic owns each page (1-indexed page → topic index).
const topicForPage: number[] = [];
for (let p = 1; p <= pageCount; p++) {
  let idx = -1;
  for (let t = 0; t < TOPICS.length; t++) {
    if (p >= TOPICS[t]!.startPage) idx = t;
  }
  topicForPage[p] = p <= LAST_CONTENT_PAGE ? idx : -1;
}

type Acc = { parts: string[]; figCount: number };
const accs: Acc[] = TOPICS.map(() => ({ parts: [], figCount: 0 }));

// Reset the image output tree so re-runs are clean.
fs.rmSync(IMG_OUT_DIR, { recursive: true, force: true });
fs.mkdirSync(IMG_OUT_DIR, { recursive: true });

let totalImages = 0;
for (let p = 1; p <= pageCount; p++) {
  const tIdx = topicForPage[p]!;
  if (tIdx < 0) continue;
  const topic = TOPICS[tIdx]!;
  const slug = slugify(topic.title);
  const acc = accs[tIdx]!;
  const page = doc.loadPage(p - 1);

  // Text of this page.
  const text = cleanPageText(page.toStructuredText("preserve-whitespace").asText());

  // Images of this page, in reading order.
  const pageImages: mupdf.Image[] = [];
  page.toStructuredText("preserve-images").walk({
    onImageBlock(_bbox: unknown, _transform: unknown, image: mupdf.Image) {
      pageImages.push(image);
    },
  });

  if (text.trim()) acc.parts.push(text.trim());

  for (const image of pageImages) {
    const pix = image.toPixmap();
    const w = pix.getWidth();
    const h = pix.getHeight();
    // Skip decorative slivers (rules, spacer dots); keep diagrams & code shots.
    if (w < 60 || h < 40) continue;
    const png = pix.asPNG();
    const dir = path.join(IMG_OUT_DIR, slug);
    fs.mkdirSync(dir, { recursive: true });
    acc.figCount += 1;
    const file = `fig-${acc.figCount}.png`;
    fs.writeFileSync(path.join(dir, file), png);
    acc.parts.push(`![${topic.title} — figure ${acc.figCount}](${IMG_URL_BASE}/${slug}/${file})`);
    totalImages += 1;
  }
}

// ── Assemble the seed JSON ─────────────────────────────────────────────────────
const records = TOPICS.map((t, i) => {
  const notes = stripLeadIns(accs[i]!.parts.join("\n\n"), t.num, t.title.length);
  return {
    subject: "OOPS",
    phase: t.phase,
    groupLabel: PHASES[t.phase]!,
    order: t.num,
    slug: slugify(t.title),
    title: t.title,
    summary: firstSentence(notes),
    notes,
    figures: accs[i]!.figCount,
  };
});

fs.writeFileSync(JSON_OUT, JSON.stringify(records, null, 2) + "\n");
console.log(`✅ Wrote ${records.length} topics, ${totalImages} figures.`);
console.log(`   JSON → ${path.relative(REPO_ROOT, JSON_OUT)}`);
console.log(`   IMG  → ${path.relative(REPO_ROOT, IMG_OUT_DIR)}/<slug>/fig-N.png`);
for (const r of records) {
  if (!r.notes.trim()) console.warn(`   ⚠ empty notes: ${r.slug}`);
}
