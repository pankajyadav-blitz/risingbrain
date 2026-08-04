/**
 * Regenerates `src/lib/figure-dimensions.json` — the intrinsic pixel size of every
 * figure under `public/study-notes/`.
 *
 *   bun run gen:figures        (from apps/web, or via turbo)
 *
 * Why a manifest: the notes are markdown in the database, so `![alt](/study-notes/…)`
 * carries no dimensions, and `next/image` can't infer them for a runtime string path.
 * Without the real numbers every figure has to share one hardcoded size, which is
 * wrong here — these are PDF-extracted screenshots ranging from 212px to 2048px wide,
 * so a single rule makes small ones look lost and portrait ones a page tall. With the
 * manifest each figure is sized from its OWN dimensions (see `lib/figure-size.ts`) and
 * the browser also gets width/height up front, which removes layout shift.
 *
 * Run it after adding or re-extracting figures. Reads the PNG/JPEG header only — no
 * image library needed.
 */
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative, sep } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const PUBLIC_DIR = join(ROOT, "public");
const FIGURE_DIR = join(PUBLIC_DIR, "study-notes");
const OUT = join(ROOT, "src", "lib", "figure-dimensions.json");

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

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}

const dimensions: Record<string, [number, number]> = {};
let skipped = 0;

for (const file of walk(FIGURE_DIR).sort()) {
  if (!/\.(png|jpe?g)$/i.test(file)) continue;
  const buf = readFileSync(file);
  const size = /\.png$/i.test(file) ? pngSize(buf) : jpegSize(buf);
  // Always a URL path with forward slashes — this is the key the markdown uses.
  const key = "/" + relative(PUBLIC_DIR, file).split(sep).join("/");
  if (!size) {
    skipped += 1;
    console.warn(`  ! could not read dimensions: ${key}`);
    continue;
  }
  dimensions[key] = size;
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
console.log(`   widths ${Math.min(...widths)}–${Math.max(...widths)}px`);
