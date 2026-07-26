/**
 * Shared extractor for the "interview Q&A + diagrams" Domain PDFs (Operating
 * Systems, Computer Networks — the `*WithDiagram.pdf` sources). Both share one
 * layout, so the parsing lives here and each subject is a thin wrapper
 * (scripts/extract-os.ts, scripts/extract-cn.ts) passing a config.
 *
 * Source layout (identical for OS & CN):
 *   - `Chapter N — Title (Qx–Qy)` banners open a left-nav section (→ groupLabel,
 *     groupOrder = N). "Chapter N Summary" pages append to the current topic.
 *   - Each question is `N. <title>` (N sequential from 1) followed by a standalone
 *     `Answer` line; everything up to `Answer` is the title, everything after
 *     (until the next question) is the `notes` markdown.
 *   - Diagrams/code screenshots are embedded raster images, placed inline per page
 *     exactly where they appear (like scripts/extract-oops.ts).
 *
 * Emits:
 *   - seed/domain-<key>.json                              — the topics
 *   - apps/web/public/study-notes/<key>/<slug>/fig-N.png  — every figure
 *
 * mupdf is a dev-only dependency used solely by these extractors.
 */
import * as mupdf from "mupdf";
import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");

export type QaPdfConfig = {
  /** DomainSubject enum value, e.g. "OS" / "CN". */
  subject: string;
  /** Source PDF filename at the repo root. */
  pdfFile: string;
  /** Slug used for the image folder + URL base + seed filename, e.g. "os". */
  key: string;
  /** How many questions the source contains — a sanity check on the parse. */
  expectedTopics: number;
};

// ── Text cleaning ──────────────────────────────────────────────────────────────
const BULLETS = /^[●•▪◦‣·]/; // list-marker glyphs the source uses
const CONNECTORS = new Set(["↓", "↑", "→", "←", "⟶", "⟵"]); // flow-chart arrows
const ZERO_WIDTH = /\u200B|\u200C|\u200D|\uFEFF|\u00A0/g; // zero-width / non-breaking
// A line that is ONLY box-drawing / diagram scaffolding (no letters or digits).
const BOX_NOISE = /^[+\-|=_\s^v<>()[\].·•*/\\]+$/;
// A short label boxed in pipes ("| New |") — an ASCII-diagram node; the real
// diagram is extracted as an image, so the text duplicate is just noise.
const PIPE_NODE = /^\|[^|]{1,24}\|$/;

/** Sub-headings promoted to bold markdown lines (leading label of a section). */
const SUBHEADINGS = new Set(
  [
    "Introduction",
    "Definition",
    "Example",
    "Examples",
    "Key Points",
    "Characteristics",
    "Working",
    "How it Works",
    "How to Prevent It",
    "Advantages",
    "Disadvantages",
    "Benefits",
    "Types",
    "Rules",
    "Steps",
    "Formula",
    "Applications",
    "Comparison",
    "Structure",
    "Problem",
    "Problem Statement",
    "Solution",
    "Note",
    "Effects of Deadlock",
    "Real-World Example",
    "Real-World Analogy",
    "Interview Follow-up",
    "Follow-up",
    "Conclusion",
    "Summary",
    "Use Cases",
    "Illustration",
    "Removal",
  ].map((s) => s.toLowerCase())
);

/** Turn one page's raw extracted text into cleaner markdown lines. */
function cleanPageLines(raw: string): string[] {
  const src = raw.split("\n");
  const out: string[] = [];
  let joinArrow = false; // previous line was a flow-chart connector → chain them
  let pendingBullet = false; // a lone bullet glyph → the next content line is the item

  const pushHeading = (label: string) => {
    if (out.length && out[out.length - 1] !== "") out.push("");
    out.push(`**${label}**`);
    out.push("");
  };

  for (let line of src) {
    line = line.replace(ZERO_WIDTH, " ").replace(/\s+/g, " ").trim();
    if (!line) {
      if (out.length && out[out.length - 1] !== "") out.push("");
      continue;
    }

    // Flow-chart connectors ("A ↓ B ↓ C"): fold into an arrow chain on one line.
    if (CONNECTORS.has(line)) {
      joinArrow = out.length > 0;
      continue;
    }

    const bulletOnly = BULLETS.test(line) && line.replace(BULLETS, "").trim() === "";
    if (bulletOnly) {
      // The source puts the "•" glyph on its own line; the item text follows.
      pendingBullet = true;
      continue;
    }
    const inlineBullet = BULLETS.test(line);
    const isBullet = inlineBullet || pendingBullet;
    if (inlineBullet) line = line.replace(BULLETS, "").trim();

    // Drop pure box-drawing scaffolding from ASCII diagrams (keep the real image).
    if (!isBullet && (BOX_NOISE.test(line) || PIPE_NODE.test(line))) {
      joinArrow = false;
      continue;
    }

    // Re-insert the space the PDF drops after sentence punctuation.
    line = line
      .replace(/([a-z0-9)\]])\.([A-Z])/g, "$1. $2")
      .replace(/([a-z0-9)\]]),([A-Z])/g, "$1, $2");

    if (isBullet) {
      pendingBullet = false;
      joinArrow = false;
      out.push(`- ${line}`);
      continue;
    }

    if (joinArrow && out.length) {
      // Attach to the previous non-empty content line as "prev → line".
      let i = out.length - 1;
      while (i >= 0 && out[i] === "") i--;
      if (i >= 0) out[i] = `${out[i]} → ${line}`;
      else out.push(line);
      joinArrow = false;
      continue;
    }
    joinArrow = false;

    // Known section labels, or any short "Label:" lead-in → bold sub-heading.
    const bare = line.replace(/[:?.]+$/, "").trim().toLowerCase();
    const colonLabel =
      /:$/.test(line) && line.split(":").length === 2 && line.length <= 40 && !/^-/.test(line);
    if (SUBHEADINGS.has(bare) || colonLabel) {
      pushHeading(line.replace(/:+$/, "").trim());
      continue;
    }
    out.push(line);
  }
  return out;
}

function slugify(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80)
    .replace(/-$/, "");
}

function firstSentence(md: string): string {
  const lines = md
    .split("\n")
    .map((l) => l.replace(/^[-*#>\s]+/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l && !l.startsWith("!["));
  for (const l of lines) {
    const m = l.match(/^([A-Z][^\n]{24,180}?[.?!])(\s|$)/);
    if (m) return m[1]!.trim();
  }
  const f = (lines[0] ?? "").trim();
  return f.length > 170 ? f.slice(0, 167).trimEnd() + "…" : f;
}

// ── Parse model ────────────────────────────────────────────────────────────────
type Part = { text: string } | { img: mupdf.Image };
type Topic = {
  num: number;
  title: string;
  groupLabel: string;
  groupOrder: number;
  parts: Part[];
  buf: string[]; // pending text lines, flushed to a text Part on image/boundary
};

/** Flush a topic's buffered text lines into a single text Part (paragraph-aware). */
function flushBuf(t: Topic): void {
  if (!t.buf.length) return;
  const text = t.buf.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  if (text) t.parts.push({ text });
  t.buf = [];
}

type FlatLine = { page: number; text: string };

export function extractQaPdf(cfg: QaPdfConfig): void {
  const PDF_PATH = path.join(REPO_ROOT, cfg.pdfFile);
  const IMG_OUT_DIR = path.join(REPO_ROOT, "apps/web/public/study-notes", cfg.key);
  const IMG_URL_BASE = `/study-notes/${cfg.key}`;
  const JSON_OUT = path.join(import.meta.dir, `../seed/domain-${cfg.key}.json`);

  const doc = mupdf.Document.openDocument(
    new Uint8Array(fs.readFileSync(PDF_PATH)),
    "application/pdf"
  );
  const pageCount = doc.countPages();

  // Flatten every page's cleaned text into one stream (with page tags for image
  // interleaving), and collect this page's images separately.
  const flat: FlatLine[] = [];
  const imagesByPage: mupdf.Image[][] = [];
  for (let p = 1; p <= pageCount; p++) {
    const page = doc.loadPage(p - 1);
    for (const text of cleanPageLines(page.toStructuredText("preserve-whitespace").asText())) {
      flat.push({ page: p, text });
    }
    const imgs: mupdf.Image[] = [];
    page.toStructuredText("preserve-images").walk({
      onImageBlock(_b: unknown, _t: unknown, image: mupdf.Image) {
        if (image.getWidth() >= 60 && image.getHeight() >= 40) imgs.push(image);
      },
    });
    imagesByPage[p] = imgs;
  }

  // A standalone "Answer" line within the next few non-empty lines confirms a
  // real question heading (vs. a numbered list item that happens to match nextQ).
  const isAnswer = (s: string) => /^answer\s*:?$/i.test(s.trim());
  function answerSoon(from: number): boolean {
    let seen = 0;
    for (let i = from + 1; i < flat.length && seen < 6; i++) {
      const t = flat[i]!.text;
      if (!t) continue;
      seen++;
      if (isAnswer(t)) return true;
    }
    return false;
  }

  // ── Walk the stream → topics ──────────────────────────────────────────────────
  const chapterRe = /^Chapter\s+(\d+)\s*[—–-]\s*(.+?)\s*\(Q?\d+/i;
  const questionRe = /^(\d{1,3})[.)]\s+(.+)$/;

  const topics: Topic[] = [];
  let current: Topic | null = null;
  let group = { label: "General", order: 0 };
  let nextQ = 1;
  let inTitle = false; // between the question line and its "Answer" marker

  let lastPageFlushed = 0;
  const flushImages = (upToPage: number) => {
    let pushed = false;
    for (let p = lastPageFlushed + 1; p <= upToPage; p++) {
      const imgs = imagesByPage[p];
      if (current && imgs && imgs.length) {
        if (!pushed) flushBuf(current); // text before the figures, in order
        for (const img of imgs) current.parts.push({ img });
        pushed = true;
      }
    }
    lastPageFlushed = Math.max(lastPageFlushed, upToPage);
  };

  for (let i = 0; i < flat.length; i++) {
    const { page, text } = flat[i]!;

    if (!text) {
      // Preserve paragraph breaks inside a topic body.
      if (current && !inTitle && current.buf.length) current.buf.push("");
      continue;
    }

    // Chapter banner → open a new nav group (ignore "Chapter N Summary" pages).
    const ch = text.match(chapterRe);
    if (ch) {
      flushImages(page - 1);
      group = { label: ch[2]!.trim(), order: Number(ch[1]) };
      inTitle = false;
      continue;
    }

    // New question heading.
    const q = text.match(questionRe);
    if (q && Number(q[1]) === nextQ && q[2]!.length > 8 && answerSoon(i)) {
      flushImages(page - 1);
      current = {
        num: nextQ,
        title: q[2]!.trim(),
        groupLabel: group.label,
        groupOrder: group.order,
        parts: [],
        buf: [],
      };
      topics.push(current);
      nextQ++;
      inTitle = true;
      continue;
    }

    if (!current) continue;

    // Multi-line question title: keep appending until the "Answer" marker.
    if (inTitle) {
      if (isAnswer(text)) {
        inTitle = false;
      } else {
        current.title = `${current.title} ${text}`.replace(/\s+/g, " ").trim();
      }
      continue;
    }

    // Drop a stray "Answer" label inside the body.
    if (isAnswer(text)) continue;

    // Once we've moved onto a new page, attach the previous pages' images first.
    if (page - 1 > lastPageFlushed) flushImages(page - 1);
    current.buf.push(text);
  }
  flushImages(pageCount);
  for (const t of topics) flushBuf(t);

  // ── Write figures + assemble JSON ─────────────────────────────────────────────
  fs.rmSync(IMG_OUT_DIR, { recursive: true, force: true });
  fs.mkdirSync(IMG_OUT_DIR, { recursive: true });

  const usedSlugs = new Set<string>();
  let totalImages = 0;

  const records = topics.map((t) => {
    let slug = slugify(t.title) || `question-${t.num}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${t.num}`;
    usedSlugs.add(slug);

    let figCount = 0;
    const chunks: string[] = [];
    for (const part of t.parts) {
      if ("text" in part) {
        chunks.push(part.text);
        continue;
      }
      const pix = part.img.toPixmap();
      if (pix.getWidth() < 60 || pix.getHeight() < 40) continue;
      const dir = path.join(IMG_OUT_DIR, slug);
      fs.mkdirSync(dir, { recursive: true });
      figCount++;
      const file = `fig-${figCount}.png`;
      fs.writeFileSync(path.join(dir, file), pix.asPNG());
      chunks.push(`![${t.title} — figure ${figCount}](${IMG_URL_BASE}/${slug}/${file})`);
      totalImages++;
    }

    const notes = chunks
      .map((c) => c.trim())
      .filter(Boolean)
      .join("\n\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    return {
      subject: cfg.subject,
      groupLabel: t.groupLabel,
      groupOrder: t.groupOrder,
      order: t.num,
      slug,
      title: t.title,
      summary: firstSentence(notes),
      notes,
      figures: figCount,
    };
  });

  fs.writeFileSync(JSON_OUT, JSON.stringify(records, null, 2) + "\n");

  // ── Report + sanity checks ────────────────────────────────────────────────────
  console.log(`✅ ${cfg.subject}: ${records.length} topics, ${totalImages} figures.`);
  console.log(`   JSON → ${path.relative(REPO_ROOT, JSON_OUT)}`);
  console.log(`   IMG  → ${path.relative(REPO_ROOT, IMG_OUT_DIR)}/<slug>/fig-N.png`);
  if (records.length !== cfg.expectedTopics) {
    console.warn(
      `   ⚠ expected ${cfg.expectedTopics} questions but parsed ${records.length} — check the source.`
    );
  }
  for (const r of records) {
    if (!r.notes.trim()) console.warn(`   ⚠ empty notes: ${r.order}. ${r.slug}`);
  }
}
