/**
 * One-off content extractor for the DBMS interview-questions .docx.
 *
 * Parses DBMS.docx into the unified Domain content shape and writes
 * packages/database/seed/domain-dbms.json. The source is a flat "Top 50 DBMS
 * Interview Questions" Q&A list, so each question becomes one topic (subject
 * "DBMS"), its answer becomes the `notes` markdown, and all topics share one
 * "Interview Questions" nav group. There are no images in this document.
 *
 * .docx is a zip of XML — we read `word/document.xml` directly (no extra deps):
 *  - paragraphs = <w:p>, text = concatenated <w:t>, bold = <w:b/> in the run
 *    props (→ a sub-heading), list item = <w:numPr> (→ a bullet).
 *
 * Run once (or whenever the doc changes):
 *   bun run packages/database/scripts/extract-dbms.ts
 */
import fs from "node:fs";
import path from "node:path";
import { unzipSync, strFromU8 } from "fflate";

const REPO_ROOT = path.resolve(import.meta.dir, "../../..");
const DOCX_PATH = path.join(REPO_ROOT, "DBMS.docx");
const JSON_OUT = path.join(import.meta.dir, "../seed/domain-dbms.json");

const GROUP_LABEL = "Interview Questions";

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

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

type Para = { text: string; bold: boolean; list: boolean };

/** Extract paragraphs (text + bold + list flags) from a docx document.xml. */
function readParagraphs(xml: string): Para[] {
  const paras: Para[] = [];
  const re = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const body = m[1]!;
    const text = decodeEntities(
      [...body.matchAll(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g)].map((t) => t[1]).join("")
    ).trim();
    const bold = /<w:b\/>|<w:b\s+[^>]*w:val="(?:true|1|on)"/.test(body);
    const list = /<w:numPr\b/.test(body);
    paras.push({ text, bold, list });
  }
  return paras;
}

function firstSentence(md: string): string {
  const lines = md
    .split("\n")
    .map((l) => l.replace(/^[-*#>\s]+/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);
  for (const l of lines) {
    const s = l.match(/^([A-Z][^\n]{24,180}?[.?!])(\s|$)/);
    if (s) return s[1]!.trim();
  }
  const f = (lines[0] ?? "").trim();
  return f.length > 170 ? f.slice(0, 167).trimEnd() + "…" : f;
}

// ── Parse ─────────────────────────────────────────────────────────────────────
const files = unzipSync(new Uint8Array(fs.readFileSync(DOCX_PATH)));
const documentXml = strFromU8(files["word/document.xml"]!);
const paras = readParagraphs(documentXml);

type TopicAcc = { num: number; title: string; parts: string[] };
const topics: TopicAcc[] = [];
let current: TopicAcc | null = null;

for (const p of paras) {
  if (!p.text) continue;

  // A new question starts a new topic.
  const q = p.text.match(/^Question\s+(\d+)\.?\s*(.*)$/i);
  if (q) {
    current = { num: Number(q[1]), title: q[2]!.trim(), parts: [] };
    topics.push(current);
    continue;
  }
  if (!current) continue; // skip the doc title / "Set" heading before Q1

  // Drop the redundant standalone "Answer" label.
  if (/^Answer:?$/i.test(p.text)) continue;

  if (p.list) {
    current.parts.push(`- ${p.text}`);
  } else if (p.bold && p.text.length < 80) {
    current.parts.push(`\n**${p.text}**\n`);
  } else {
    current.parts.push(p.text);
  }
}

// ── Assemble the seed JSON ─────────────────────────────────────────────────────
const usedSlugs = new Set<string>();
function uniqueSlug(title: string, num: number): string {
  let slug = slugify(title) || `question-${num}`;
  if (usedSlugs.has(slug)) slug = `${slug}-${num}`;
  usedSlugs.add(slug);
  return slug;
}

const records = topics.map((t) => {
  // Join, collapsing the blank-line padding around bold headings into real breaks.
  const notes = t.parts
    .map((x) => x.trim())
    .filter(Boolean)
    .join("\n\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return {
    subject: "DBMS",
    groupLabel: GROUP_LABEL,
    groupOrder: 1,
    order: t.num,
    slug: uniqueSlug(t.title, t.num),
    title: t.title,
    summary: firstSentence(notes),
    notes,
  };
});

fs.writeFileSync(JSON_OUT, JSON.stringify(records, null, 2) + "\n");
console.log(`✅ Wrote ${records.length} DBMS topics → ${path.relative(REPO_ROOT, JSON_OUT)}`);
for (const r of records) {
  if (!r.notes.trim()) console.warn(`   ⚠ empty notes: ${r.slug}`);
}
