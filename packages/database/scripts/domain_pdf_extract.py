"""Rebuild the CN / DBMS / OS Domain content from the source course PDFs.

Run from packages/database, with pymupdf and pillow available:

    python3 scripts/domain_pdf_extract.py     # PDFs      → blocks/*.json
    python3 scripts/domain_pdf_build.py       # blocks    → out/domain-*.json + quizzes
    python3 scripts/domain_pdf_figures.py     # blocks    → apps/web/public/study-notes/

then copy out/domain-*.json into seed/, regenerate the figure sizing manifest
(`bun run gen:figures` in apps/web) and reseed the subject
(`bun run db:seed-domain-cn` / `-dbms` / `-os`).

The PDFs are expected under ./pdfs/<SUBJECT>/<file>.pdf — the layout of the
CN.zip / DBMS.zip / OS.zip drops.

The PDFs are Word exports whose embedded font subsets carry a broken cmap, so a
naive text extraction silently loses punctuation and all layout. Everything is
recovered here from glyph geometry instead:

  * The em-dash — the documents' main punctuation — maps to a blank. In the body
    face it survives as a run of 2+ space glyphs; in the bold heading face as one
    space roughly 1.5x normal width. Both are restored to ' — '.
  * '&' comes out as 's' or 'C' in the bold heading face, 'Q' as 'Ǫ', 'fl' as 'ff',
    and one '999' as 'SSS'.
  * Word's lists and borderless tables have no markup left, but their left offsets
    are exact and constant across all sixteen files:
        72   body paragraph
        90   list item (bullet glyph, or "N." on its own)
        108 / 126 / 144      list continuation and nesting
        74.3 + anything else table cells
    so a run of lines at those "other" offsets is a table, and its x-clusters are
    the columns.

Bold runs are preserved — they carry the lead-in terms and the definitions each
topic is built around — and emitted as markdown emphasis.
"""
import pymupdf, os, re, json

SUBJECTS = {
    "CN": ["Module1CN", "Module2CN", "Module3and4CN", "Module5and6", "Module 7", "Module8and9"],
    "DBMS": ["FinalDBMS1", "FinalDBMS2and3", "finalDBMS4and5", "FinalDBMS6and7",
             "FInalDBMS8and9", "FinalDBMS10"],
    "OS": ["M1nd2", "M3and4", "M5 6 and 7", "M8and9"],
}

TOPIC_RE = re.compile(r'^(?:★\s*)?(?:Topic\s*)?(\d{1,2})\.(\d{1,2})\s*[:.\—–-]*\s*(\D\S*.*)$')
SECTION_PATTERNS = [
    ("why", r'Why\s*\+?\s*What'),
    ("how", r'How\s*It\s*Works'),
    ("visual", r'Visuali[sz]e'),
    ("confusion", r'Common\s*Confusion'),
    ("interview", r'Interview\s*Angle'),
    ("quiz", r'Quiz'),
    ("answers", r'Answer\s*[Kk]ey'),
    ("recap", r'Recap'),
]
FIXES = {"ffat": "flat", "ffexibility": "flexibility", "Ǫ": "Q", "roll SSS": "roll 999"}
WIDE_SPACE = 0.38      # space width / font size above which one blank glyph is an em-dash
BODY_X, ITEM_X = 72.0, 90.0
CONT_X = (108.0, 125.7, 126.0, 129.4, 143.9, 144.0)   # list continuation / nesting offsets
CODE_LANG = re.compile(r'(sql|java|python|bash|json)', re.I)
# What a line inside a fenced block looks like, so the fence ends where prose resumes.
CODE_LINE = re.compile(
    r'^\s*(--|/\*|\)|;|SELECT|FROM|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|INSERT|UPDATE|DELETE'
    r'|CREATE|DROP|ALTER|INNER|LEFT|RIGHT|FULL|OUTER|JOIN|ON\b|AS\b|AND\b|OR\b|SET\b|VALUES'
    r'|BEGIN|COMMIT|ROLLBACK|WITH\b|UNION|EXCEPT|INTERSECT|CASE|END\b|LIMIT|OFFSET)'
    r'|[;{}]\s*$', re.I)
BULLET_GLYPHS = ("•", "o", "▪", "", "§", "", "-", "–")


def clean(s):
    """Repair the cmap damage and normalise whitespace. Runs of 2+ blanks between
    two words are the ghost of an em-dash and become one."""
    s = s.replace(" ", " ")
    # A run of blanks between two words is a dropped em-dash — but between two
    # digits it is just a spaced-out sequence (a page reference string, a Gantt row).
    s = re.sub(r'(?<=\S) {2,}(?=\S)',
               lambda m: ' ' if (s[m.start() - 1].isdigit() and s[m.end()].isdigit()) else ' — ', s)
    s = re.sub(r'[ \t]+', ' ', s)
    for bad, good in FIXES.items():
        s = s.replace(bad, good)
    # A bold run that wrapped across two lines closes and reopens at the join; and a
    # dash next to a lost dash doubles up. Both are joins, not content.
    s = re.sub(r'\*\*\s*\*\*', ' ', s)
    s = re.sub(r'—(\s*—)+', '—', s)
    return re.sub(r'[ \t]{2,}', ' ', s)


def fix_heading(s):
    """In the bold heading face '&' is mapped to a bare 's' or 'C'. Neither is a
    real one-letter English word, so a standalone one between two words is the
    lost ampersand."""
    return re.sub(r'(?<=\w) ([sC]) (?=[\w"(])', ' & ', s)


def section_of(text):
    # The label's own internal gap is sometimes wide enough to have been read as an
    # em-dash ("6. Interview — Angle"), so it is normalised away before matching.
    t = re.sub(r'\s*—\s*', ' ', text).strip().rstrip(':').strip()
    for key, pat in SECTION_PATTERNS:
        if re.fullmatch(r'(?:\d\s*\.\s*)?' + pat + r'\s*(?:\(.*?\))?\s*:?', t, re.I):
            return key
    return None


def flat_chars(spans):
    """One visual line → [(char, size, bold, x0, x1, span_index)] in reading order."""
    out = []
    for si, s in enumerate(spans):
        size = s["size"] or 11.0
        bold = bool(s["flags"] & 16)
        for c in s["chars"]:
            out.append((c["c"], size, bold, c["bbox"][0], c["bbox"][2], si))
    return out


def with_dashes(flat):
    """[(text, bold)] with the document's lost punctuation put back.

    The em-dash has no glyph in these font subsets, so it renders — and extracts —
    as blank. It leaves one of two traces, and both are unambiguous against the
    measured distribution of ordinary word spaces (which never exceed 0.34 em):

      * CN and OS keep a single space glyph whose neighbours sit 0.35-0.78 em apart;
      * DBMS keeps two or three space glyphs, caught later by `clean()`.

    Word also drops the space between two spans outright in a few headings, which
    shows up as a gap where no blank glyph exists at all.
    """
    runs = []

    def push(text, bold):
        if runs and runs[-1][1] == bold:
            runs[-1][0] += text
        else:
            runs.append([text, bold])

    for i, (ch, size, bold, x0, x1, si) in enumerate(flat):
        if ch == " " and 0 < i < len(flat) - 1:
            gap = (flat[i + 1][3] - flat[i - 1][4]) / size
            # A spaced-out numeric sequence (a page reference string, a Gantt row)
            # has the same wide gaps and no dashes in it.
            numeric = flat[i - 1][0].isdigit() and flat[i + 1][0].isdigit()
            push(" — " if 0.35 <= gap <= 0.78 and not numeric else ch, bold)
            continue
        if i > 0 and ch != " " and flat[i - 1][0] != " " and flat[i - 1][5] != si:
            gap = (x0 - flat[i - 1][4]) / size
            if gap > 0.35:
                push(" — ", bold)
            elif gap > 0.08:
                push(" ", bold)
        push(ch, bold)
    return runs


def line_runs(spans):
    return with_dashes(flat_chars(spans))


def md_of(runs):
    """Runs → markdown. A line that is bold end-to-end stays plain — that is a
    heading or a callout, and the caller decides; mixed weight becomes emphasis."""
    if all(b for _, b in runs) or not any(b for _, b in runs):
        return "".join(t for t, _ in runs)
    parts = []
    for t, b in runs:
        if not b or not t.strip():
            parts.append(t); continue
        lead, core, trail = t[:len(t) - len(t.lstrip())], t.strip(), t[len(t.rstrip()):]
        while core.endswith("—"):
            core, trail = core[:-1].rstrip(), " —" + trail
        while core.startswith("—"):
            core, lead = core[1:].lstrip(), lead + "— "
        parts.append(f"{lead}**{core}**{trail}" if core else lead + trail)
    return "".join(parts)


def page_items(page, pageno):
    items = []
    for b in page.get_text("rawdict")["blocks"]:
        if b["type"] != 0:
            items.append({"kind": "image", "y": b["bbox"][1], "x0": b["bbox"][0], "page": pageno})
            continue
        for line in b["lines"]:
            spans = [s for s in line["spans"] if any(c["c"].strip() for c in s["chars"])]
            if not spans:
                continue
            flat = flat_chars(spans)
            runs = with_dashes(flat)
            raw = "".join(t for t, _ in runs)
            if not raw.strip():
                continue
            x0 = round(line["bbox"][0], 1)
            items.append({
                "kind": "line", "page": pageno, "raw": raw, "md": md_of(runs),
                "text": clean(raw).strip(),
                "bold": all(s["flags"] & 16 for s in spans),
                "size": round(max(s["size"] for s in spans), 1),
                "x0": x0, "x1": round(line["bbox"][2], 1), "y": round(line["bbox"][1], 1),
                "col": ("body" if abs(x0 - BODY_X) < 2 or abs(x0 - 70.8) < 1.5
                        else "item" if abs(x0 - ITEM_X) < 2
                        else "cont" if any(abs(x0 - c) < 2 for c in CONT_X)
                        else "cell"),
                "flat": flat,
            })
    # Reading order. A bullet glyph is typeset ~1pt BELOW the text it introduces, so
    # a plain sort by y puts it after its own line; lines within 4pt are one row and
    # are ordered left to right instead.
    items.sort(key=lambda i: i["y"])
    ordered, k = [], 0
    while k < len(items):
        j = k + 1
        while j < len(items) and items[j]["y"] - items[k]["y"] < 4:
            j += 1
        ordered += sorted(items[k:j], key=lambda i: i["x0"])
        k = j

    # A line at a deep indent is a list continuation only while a list is open. The
    # answer-key tables put their wide "Why" column at the same offsets, so once a
    # table cell has been seen the deep indents belong to the table, not to a bullet.
    open_list = False
    for it in ordered:
        if it["kind"] != "line":
            continue
        if it["col"] in ("item", "body"):
            open_list = it["col"] == "item"
        elif it["col"] == "cell":
            open_list = False
        elif it["col"] == "cont" and not open_list and it["x0"] >= 120:
            it["col"] = "cell"

    return ordered


def cut_row(item, cols):
    """Split a table row that Word laid out as a single line into its cells.

    Two signals, because neither alone is enough. A gutter — whitespace far wider
    than a word space — marks most boundaries; but a cell whose text fills its
    column right up to the next one leaves an ordinary-looking space there. So each
    column that no gutter accounted for is resolved to the word break nearest its
    own x offset instead.
    """
    flat = item["flat"]
    if not flat:
        return [""] * len(cols)
    spaces = [i for i in range(1, len(flat) - 1) if flat[i][0] == " "]
    cuts = set()
    for i in spaces:
        lo, hi = flat[i - 1][4], flat[i + 1][3]
        if (hi - lo) / flat[i][1] > 0.95 or any(lo < c - 2 < hi for c in cols[1:]):
            cuts.add(i)
    for c in cols[1:]:
        if any(abs(flat[i][3] - c) < 30 for i in cuts):
            continue
        near = [i for i in spaces if abs(flat[i][3] - c) < 35]
        if near:
            cuts.add(min(near, key=lambda i: abs(flat[i][3] - c)))

    segs, cur, seg_x = [], [], flat[0][3]
    for i, (ch, size, bold, x0, x1, si) in enumerate(flat):
        if i in cuts:
            if "".join(cur).strip():
                segs.append((seg_x, "".join(cur)))
            cur, seg_x = [], flat[i + 1][3]
            continue
        if ch == " " and 0 < i < len(flat) - 1:
            gap = (flat[i + 1][3] - flat[i - 1][4]) / size
            if 0.35 <= gap <= 0.78:
                cur.append(" — "); continue
        cur.append(ch)
    if "".join(cur).strip():
        segs.append((seg_x, "".join(cur)))

    cells = [""] * len(cols)
    for x, text in segs:
        ci = min(range(len(cols)), key=lambda c: abs(cols[c] - x))
        cells[ci] = (cells[ci] + " " + text).strip() if cells[ci] else text
    return [clean(c).strip() for c in cells]


def take_table(items, i):
    j = i
    while j < len(items) and items[j]["kind"] == "line" and items[j]["col"] == "cell":
        j += 1
    if j - i < 3:
        return None
    xs = [items[k]["x0"] for k in range(i, j)]
    cols = []
    for x in sorted(set(round(x, 1) for x in xs)):
        if not cols or x - cols[-1] >= 8:
            cols.append(x)
    if len(cols) < 2:
        return None

    def col_of(x):
        return max((c for c in range(len(cols)) if cols[c] <= x + 2), default=0)

    # Rows are anchored on the column-0 lines. A cell that wraps to two lines is
    # taller than the one beside it, and Word centres the short cell vertically —
    # so the first line of a tall cell can sit ABOVE its own row's anchor. Lines are
    # therefore assigned to the anchor they are nearest to, not to the one they
    # happen to follow.
    anchors = [k for k in range(i, j) if col_of(items[k]["x0"]) == 0]
    if not anchors:
        return None
    rows = [cut_row(items[k], cols) for k in anchors]
    # A header row often leaves its first cell empty ("| | TCP | UDP |"), so it has
    # no column-0 line to anchor on. Anything sitting a clear row above the first
    # anchor is that header, not part of the first data row.
    head_y = items[anchors[0]]["y"] - 12
    header = [""] * len(cols)
    for k in range(i, j):
        if k in anchors:
            continue
        parts = cut_row(items[k], cols)
        if items[k]["page"] == items[anchors[0]]["page"] and items[k]["y"] < head_y:
            target = header
        else:
            a = min(range(len(anchors)),
                    key=lambda ai: abs(items[anchors[ai]]["y"] - items[k]["y"])
                    + 1000 * (items[anchors[ai]]["page"] != items[k]["page"]))
            target = rows[a]
        for ci, part in enumerate(parts):
            if part:
                target[ci] = (target[ci] + " " + part).strip() if target[ci] else part
    if any(header):
        rows.insert(0, header)
    width = max(len(r) for r in rows)
    rows = [r + [""] * (width - len(r)) for r in rows]
    if len(rows) < 2 or sum(1 for r in rows if sum(1 for c in r if c) >= 2) < 2:
        return None
    return rows, j


def take_list(items, i):
    """A bullet or numbered item at x=90 plus its continuation lines at 108+."""
    it = items[i]
    head = it["md"]
    marker = it["text"] in BULLET_GLYPHS
    if marker:
        parts, j = [], i + 1
    else:
        m = re.match(r'^\s*(\d{1,2})\s*[.)]\s*(?:—\s*)?', head)
        if not m:
            return None
        head = head[m.end():]
        parts, j = [head], i + 1
    ordered = not marker
    num = int(m.group(1)) if not marker else None
    while j < len(items) and items[j]["kind"] == "line" and items[j]["col"] == "cont":
        if section_of(items[j]["text"]):
            break
        parts.append(items[j]["md"]); j += 1
    if marker and not parts:
        return None
    return {"type": "item", "ordered": ordered, "num": num,
            "text": clean("".join(parts)).strip(), "page": it["page"]}, j


def ends_paragraph(line, nxt, right_edge):
    """Was this the last line of its paragraph?

    A wrapped line stops short of the right margin by however much the next word
    needed, so the gap is only evidence of a paragraph break when it is bigger than
    that — otherwise the line simply could not fit "manufacturer". Where the gap is
    ambiguous, sentence-ending punctuation decides.
    """
    slack = right_edge - line["x1"]
    if slack < 12:
        return False
    word = (nxt["text"].split() or [""])[0]
    needed = len(word) * line["size"] * 0.52 + line["size"] * 0.3
    if slack > needed + 15:
        return True
    return bool(re.search(r'[.!?:;"\u201d)]$', line["text"]))


def group(items, topic_prefix=None):
    # A wrapped line runs to the right margin; one that stops well short of it ended
    # its paragraph. The margin is measured rather than assumed — it differs per file.
    widths = sorted(i["x1"] for i in items if i["kind"] == "line" and i["col"] == "body")
    right_edge = widths[int(len(widths) * 0.92)] if widths else 520.0
    blocks, i = [], 0
    while i < len(items):
        it = items[i]
        if it["kind"] == "image":
            blocks.append({"type": "figure", "page": it["page"]}); i += 1; continue

        text = it["text"]
        m = TOPIC_RE.match(text)
        # A heading is bold, sits on the body margin, and — outside DBMS, whose
        # headings are bare numbers — is labelled "Topic". Without the margin test a
        # table cell like "2.4 GHz 5 GHz" reads as topic 2.4.
        if m and it["bold"] and it["x0"] < 100 and len(text) < 140 \
                and not section_of(text) and (topic_prefix is None or text.startswith(topic_prefix)):
            blocks.append({"type": "topic", "mod": int(m.group(1)), "num": int(m.group(2)),
                           "title": fix_heading(m.group(3)).strip(" —:."), "page": it["page"]})
            i += 1; continue

        sec = section_of(text)
        if sec:
            blocks.append({"type": "section", "name": sec, "page": it["page"]}); i += 1; continue

        if it["col"] == "body" and CODE_LANG.fullmatch(text):
            j, lines = i + 1, []
            while j < len(items) and items[j]["kind"] == "line" \
                    and items[j]["col"] == "body" and not section_of(items[j]["text"]) \
                    and not TOPIC_RE.match(items[j]["text"]) \
                    and (items[j]["bold"] == it["bold"] or CODE_LINE.match(items[j]["text"])) \
                    and CODE_LINE.match(items[j]["text"]):
                lines.append(items[j]["text"]); j += 1
            if lines:
                # Wide gaps inside a code block are indentation, not punctuation.
                blocks.append({"type": "code", "lang": text.lower(),
                               "text": "\n".join(l.replace(" — ", " ") for l in lines),
                               "page": it["page"]})
                i = j; continue

        if it["col"] == "cell":
            got = take_table(items, i)
            if got:
                rows, j = got
                blocks.append({"type": "table", "rows": rows, "page": it["page"]}); i = j; continue

        if it["col"] == "item":
            got = take_list(items, i)
            if got:
                blk, j = got
                blocks.append(blk); i = j; continue

        # ordinary paragraph — join the wrapped lines that share this left edge
        j, parts = i, []
        while j < len(items) and items[j]["kind"] == "line":
            nxt = items[j]
            if j > i:
                if nxt["col"] != it["col"] or abs(nxt["x0"] - it["x0"]) > 4: break
                if section_of(nxt["text"]) or nxt["text"] in BULLET_GLYPHS: break
                if TOPIC_RE.match(nxt["text"]) and nxt["bold"]: break
                if nxt["y"] - items[j - 1]["y"] > nxt["size"] * 2.4: break
                crossed_page = nxt["page"] != items[j - 1]["page"]
                # A paragraph broken by a page break resumes overleaf; only an
                # unfinished sentence is treated as continuing, so two paragraphs
                # that merely straddle the break are not welded together.
                if crossed_page:
                    if re.search(r'[.!?:"\u201d)]\s*$', items[j - 1]["text"]): break
                elif ends_paragraph(items[j - 1], nxt, right_edge):
                    break
            parts.append(nxt["md"]); j += 1
        blocks.append({"type": "para", "text": clean("".join(parts)).strip(),
                       "bold": it["bold"], "page": it["page"],
                       "y": it["y"], "x0": it["x0"]})
        i = max(j, i + 1)
    return [b for b in blocks if b["type"] != "para" or b["text"]]


def run():
    os.makedirs("blocks", exist_ok=True)
    for subj, files in SUBJECTS.items():
        for f in files:
            doc = pymupdf.open(f"pdfs/{subj}/{f}.pdf")
            items = []
            for pi, page in enumerate(doc):
                items += page_items(page, pi + 1)
            blocks = group(items, None if subj == "DBMS" else "Topic")
            json.dump(blocks, open(f"blocks/{subj}__{f.replace(' ', '_')}.json", "w"), indent=1)
            n = lambda t: sum(1 for b in blocks if b["type"] == t)
            print(f"{subj:5} {f:16} n={len(blocks):4} topic={n('topic'):3} sec={n('section'):3} "
                  f"table={n('table'):3} fig={n('figure'):3} item={n('item'):4} para={n('para'):4}")


if __name__ == "__main__":
    run()
