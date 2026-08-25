/**
 * Regenerates `src/lib/figure-dimensions.json` — the DISPLAY size of every figure
 * under `public/study-notes/`.
 *
 *   bun run gen:figures        (from apps/web, or via turbo)
 *
 * Why a manifest: the notes are markdown in the database, so `![alt](/study-notes/…)`
 * carries no dimensions, and `next/image` can't infer them for a runtime string path.
 * The manifest supplies them, which also gives the browser an aspect box up front and
 * removes layout shift.
 *
 * Why DISPLAY size and not intrinsic pixels: the figures come from several different
 * tools at several different export scales — Mermaid renders, Carbon code screenshots,
 * designed slides, PDF extractions — so intrinsic width says nothing about how big a
 * picture should LOOK. `oops/aggregation/fig-1.png` is 1827×1360 for four boxes and one
 * label; `os/…/fig-1.png` is 1408×880 carrying a dense timing diagram. Sized by
 * intrinsic width the first renders full-column with 52px lettering while the second
 * renders the same width with 6px lettering. Same box, wildly different apparent size.
 *
 * What IS comparable across all of them is the height of a line of text INSIDE the
 * picture. Normalise that to `TARGET_TEXT_PX` and every figure lands at the size its
 * own content asks for: content-sparse exports shrink, dense diagrams keep the column.
 *
 * Text is located by horizontal-edge density per row — glyphs make many strong
 * left/right transitions, flat fills and gradients make almost none. Two refinements
 * carry the measurement:
 *
 *   - Columns that are an edge down most of the image are card borders, table
 *     gridlines and flowchart box spines, not glyphs. Left in, they hold every row
 *     above threshold and the whole card merges into one "line" — which is how a
 *     212×192 result chip first measured a 133px line height. They are masked out
 *     before the row profile is taken.
 *   - A band counts as text only if it is dense: a couple of transitions per row is a
 *     rule or a box edge, not a word.
 *
 * The reading is calibrated ~1:1 against text rendered at a known size, so a figure
 * measuring 22 carries what reads as 22px lettering.
 *
 * Run it after adding or re-extracting figures. PNG is decoded here (8-bit RGB/RGBA,
 * non-interlaced — everything in the tree); JPEG keeps its intrinsic size, since
 * measuring it would mean pulling in a decoder.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { inflateSync } from "node:zlib";

const ROOT = new URL("..", import.meta.url).pathname;
const PUBLIC_DIR = join(ROOT, "public");
const FIGURE_DIR = join(PUBLIC_DIR, "study-notes");
const OUT = join(ROOT, "src", "lib", "figure-dimensions.json");

/**
 * Apparent text size every figure is normalised to, in CSS px. The notes body is 17px
 * (`--notes` size in globals.css), and figure lettering reads best a step under the
 * prose it sits in rather than competing with it.
 */
const TARGET_TEXT_PX = 15;
/**
 * A figure may be enlarged past its own pixels this far and no further. Beyond roughly
 * this the upscaling is visible, and a soft figure is worse than a slightly small one.
 * Only reached by small captures whose lettering is already below target.
 */
const MAX_UPSCALE = 1.5;

/** Intrinsic size from a PNG IHDR chunk. */
function pngSize(buf: Buffer): [number, number] | null {
  const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (buf.length < 24 || !buf.subarray(0, 8).equals(SIGNATURE)) return null;
  return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
}

/** Intrinsic size from the first JPEG SOFn frame header. */
function jpegSize(buf: Buffer): [number, number] | null {
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marker = buf[i + 1]!;
    // SOF0..SOF15, excluding the non-frame markers DHT/JPG/DAC.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}

/**
 * Decode a PNG to one luma byte per pixel. Returns null for anything outside the
 * 8-bit, non-interlaced RGB/RGBA shape every figure in the tree uses — the caller
 * then falls back to intrinsic size rather than guessing.
 */
function pngLuma(buf: Buffer): { gray: Uint8Array; w: number; h: number } | null {
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  const bitDepth = buf[24];
  const colorType = buf[25];
  const interlace = buf[28];
  if (bitDepth !== 8 || interlace !== 0 || (colorType !== 2 && colorType !== 6)) return null;

  const idat: Buffer[] = [];
  for (let i = 8; i + 8 <= buf.length; ) {
    const len = buf.readUInt32BE(i);
    const type = buf.subarray(i + 4, i + 8).toString("latin1");
    if (type === "IDAT") idat.push(buf.subarray(i + 8, i + 8 + len));
    i += 12 + len;
    if (type === "IEND") break;
  }
  if (idat.length === 0) return null;

  const raw = inflateSync(Buffer.concat(idat));
  const bpp = colorType === 6 ? 4 : 3;
  const stride = w * bpp;
  if (raw.length < (stride + 1) * h) return null;

  const gray = new Uint8Array(w * h);
  // Reconstructed previous scanline, for the Up/Average/Paeth filters.
  let prev = new Uint8Array(stride);
  let line = new Uint8Array(stride);

  for (let y = 0; y < h; y++) {
    const filter = raw[y * (stride + 1)]!;
    const off = y * (stride + 1) + 1;
    for (let x = 0; x < stride; x++) {
      const rawByte = raw[off + x]!;
      const a = x >= bpp ? line[x - bpp]! : 0; // left
      const b = prev[x]!; // up
      const c = x >= bpp ? prev[x - bpp]! : 0; // upper-left
      let val: number;
      switch (filter) {
        case 0:
          val = rawByte;
          break;
        case 1:
          val = rawByte + a;
          break;
        case 2:
          val = rawByte + b;
          break;
        case 3:
          val = rawByte + ((a + b) >> 1);
          break;
        case 4: {
          const p = a + b - c;
          const pa = Math.abs(p - a);
          const pb = Math.abs(p - b);
          const pc = Math.abs(p - c);
          val = rawByte + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c);
          break;
        }
        default:
          return null;
      }
      line[x] = val & 0xff;
    }
    // ITU-R 601-2 luma, matching the calibration the target was set against. Alpha is
    // ignored: these figures are opaque where they carry content.
    for (let x = 0; x < w; x++) {
      const i = x * bpp;
      gray[y * w + x] = Math.round(
        (line[i]! * 299 + line[i + 1]! * 587 + line[i + 2]! * 114) / 1000
      );
    }
    const swap = prev;
    prev = line;
    line = swap;
  }
  return { gray, w, h };
}

function median(xs: number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
}

/** Median of `values` where each carries `weights[i]` votes rather than one. */
function weightedMedian(values: number[], weights: number[]): number {
  const order = values.map((_, i) => i).sort((a, b) => values[a]! - values[b]!);
  const half = weights.reduce((sum, x) => sum + x, 0) / 2;
  let acc = 0;
  for (const i of order) {
    acc += weights[i]!;
    if (acc >= half) return values[i]!;
  }
  return values[order[order.length - 1]!]!;
}

/** A run of consecutive rows that look like text, and how much ink it carries. */
interface Band {
  top: number;
  height: number;
  ink: number;
}

/** Median height of a line of text in the figure, in image pixels. Null if none found. */
function textLineHeight(gray: Uint8Array, w: number, h: number): number | null {
  if (w < 8 || h < 8) return null;
  const EDGE = 25; // luma step that counts as an edge
  const cols = w - 1;

  // Pass 1 — how often each column is an edge. Borders and gridlines run the height.
  const colCount = new Uint32Array(cols);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < cols; x++) {
      if (Math.abs(gray[row + x + 1]! - gray[row + x]!) > EDGE) colCount[x]! += 1;
    }
  }
  const keep = new Uint8Array(cols);
  let kept = 0;
  for (let x = 0; x < cols; x++) {
    if (colCount[x]! / h < 0.5) {
      keep[x] = 1;
      kept += 1;
    }
  }
  if (kept < 8) return null;

  // Pass 2 — transitions per row across glyph-bearing columns only.
  const trans = new Uint32Array(h);
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let n = 0;
    for (let x = 0; x < cols; x++) {
      if (keep[x] && Math.abs(gray[row + x + 1]! - gray[row + x]!) > EDGE) n += 1;
    }
    trans[y] = n;
  }

  // A glyph row carries many transitions — require both an absolute floor and a clear
  // margin over the image's own baseline chatter.
  const base = median(Array.from(trans));
  const threshold = Math.max(4, base + 3, 0.012 * kept);

  const bands: Band[] = [];
  let start: number | null = null;
  let ink = 0;
  for (let y = 0; y < h; y++) {
    if (trans[y]! >= threshold) {
      if (start === null) {
        start = y;
        ink = 0;
      }
      ink += trans[y]!;
    } else if (start !== null) {
      bands.push({ top: start, height: y - start, ink });
      start = null;
    }
  }
  if (start !== null) bands.push({ top: start, height: h - start, ink });

  // Drop hairlines FIRST — rules, card edges, and the soft halo around a glowing panel
  // all leave 1–3px runs. Merging before this pass would string a column of halo
  // slivers into one tall phantom "line".
  const solid = bands.filter((b) => b.height >= 5);

  // A glyph's own waist can dip under the threshold and split one line in two — the
  // digit "8" does it reliably, leaving two ~11px halves where the lettering is nearer
  // 40px, which is what sized the COUNT result card at 461px instead of 334px. Rejoin
  // runs that all but touch. The gap stays absolute and tight (a waist split is 1–2px):
  // scaling it to band height would swallow the 6px leading of a compact result card
  // and read its four 15px rows as one 32px line.
  const MERGE_GAP = 2;
  const merged: Band[] = [];
  for (const b of solid) {
    const prev = merged[merged.length - 1];
    if (prev && b.top - (prev.top + prev.height) <= MERGE_GAP) {
      prev.height = b.top + b.height - prev.top;
      prev.ink += b.ink;
    } else {
      merged.push({ ...b });
    }
  }

  // Shorter than a whole panel.
  const glyphs = merged.filter((b) => b.height <= 120);
  if (glyphs.length === 0) return null;

  // Weighted by ink, so a full line of text counts for more than a lone digit or a
  // stray sliver. A card mixing one large heading with several smaller rows is then
  // sized by the rows that carry most of its reading, not by whichever run is tallest.
  return weightedMedian(
    glyphs.map((b) => b.height),
    glyphs.map((b) => b.ink)
  );
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const dimensions: Record<string, [number, number]> = {};
let skipped = 0;
let unmeasured = 0;
let shrunk = 0;

for (const file of walk(FIGURE_DIR).sort()) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const buf = readFileSync(file);
  const isPng = /\.png$/i.test(file);
  const size = isPng ? pngSize(buf) : jpegSize(buf);
  // Always a URL path with forward slashes — this is the key the markdown uses.
  const key = "/" + relative(PUBLIC_DIR, file).split(sep).join("/");
  if (!size) {
    skipped += 1;
    console.warn(`  ! could not read dimensions: ${key}`);
    continue;
  }

  const [w, h] = size;
  const decoded = isPng ? pngLuma(buf) : null;
  const line = decoded ? textLineHeight(decoded.gray, decoded.w, decoded.h) : null;
  if (!line) {
    // No text to normalise against — keep the figure at its own pixels.
    unmeasured += 1;
    dimensions[key] = [w, h];
    continue;
  }

  const scale = Math.min(TARGET_TEXT_PX / line, MAX_UPSCALE);
  if (scale < 1) shrunk += 1;
  dimensions[key] = [Math.max(1, Math.round(w * scale)), Math.max(1, Math.round(h * scale))];
}

// Written one `"path": [w, h]` per line rather than via JSON.stringify's indenting,
// which would put every number on its own line — same data, half the file, and it
// matches what Prettier would produce so the generated file stays check-clean.
const body = Object.entries(dimensions)
  .map(([key, [w, h]]) => `  ${JSON.stringify(key)}: [${w}, ${h}]`)
  .join(",\n");
writeFileSync(OUT, `{\n${body}\n}\n`);

const widths = Object.values(dimensions).map(([w]) => w);
console.log(
  `✅ ${Object.keys(dimensions).length} figures measured` +
    (skipped ? ` (${skipped} skipped)` : "") +
    ` → src/lib/figure-dimensions.json`
);
console.log(
  `   normalised to ${TARGET_TEXT_PX}px text — ${shrunk} shrunk` +
    (unmeasured ? `, ${unmeasured} left at intrinsic size (no text found)` : "")
);
console.log(`   display widths ${Math.min(...widths)}–${Math.max(...widths)}px`);
