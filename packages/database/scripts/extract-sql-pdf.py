"""
One-shot content pipeline: turns "SQL Roadmap (85 Topics with Problem Statements).pdf"
into the SQL half of the Domain section. Kept for provenance — rerun it only when the
source PDF changes, then format and seed:

    python3 -m pip install --target /tmp/pylibs pymupdf     # not a repo dependency
    PYTHONPATH=/tmp/pylibs python3 packages/database/scripts/extract-sql-pdf.py
    python3 packages/database/scripts/format-domain-notes.py
    bun --filter web gen:figures      # re-measure the new screenshots
    bun run db:seed-domain-sql

Outputs (both overwritten wholesale):
  - apps/web/public/study-notes/sql/<slug>/fig-N.png   (113 result/source-table screenshots)
  - packages/database/seed/domain-sql.json             (85 DomainTopic rows, subject SQL)

How it reads the PDF: topics are bold 17pt "N. Title" headings, patterns bold 23pt
"Pattern N: Label" — that split yields exactly 14 patterns / 85 topics. Blocks are then
classified prose-vs-SQL by a label-first rule ("Theory:"/"Problem:"/"Tip:" are always
prose) plus CASE-SENSITIVE keyword matching, because the PDF writes SQL keywords
uppercase and prose contains the same words lowercase ("not the whole row", "join
condition"). Statements split across a page break are rejoined by looking for the
unterminated head, even when a screenshot sits between the halves.

`example` is deliberately NOT emitted: the query is already inline in `notes`, and a
duplicate made the topic view show a redundant "Example" tab.
"""
import fitz, re, json, os, shutil

PDF  = "/home/virat/temp/risingbrain/SQL Roadmap (85 Topics with Problem Statements).pdf"
REPO = "/home/virat/temp/risingbrain"
IMG_ROOT = os.path.join(REPO, "apps/web/public/study-notes/sql")
SEED_OUT = os.path.join(REPO, "packages/database/seed/domain-sql.json")

doc = fitz.open(PDF)
ZW = "​‌‍﻿"         # zero-width junk the source PDF is littered with

def clean(s):
    for c in ZW: s = s.replace(c, "")
    return s.replace("\xa0", " ")

LABELS = ["Theory:", "Problem:", "Dialect note:", "Tip:", "Note:", "Why it matters:",
          "Gotcha:", "Caveat:", "Warning:", "Setup:", "Schema:", "Result:", "Explanation:",
          "Performance note:", "Portability note:"]
# Redundant captions the PDF prints above code / images.
CAPTIONS = {"sql query", "query", "output", "result", "results", "sql", "expected output"}

def starts_with_label(text):
    flat = re.sub(r'\s+', ' ', clean(text)).strip()
    return next((l for l in LABELS if flat.startswith(l)), None)

# SQL keywords, matched CASE-SENSITIVELY: this PDF always writes them uppercase, so
# prose words ("not the whole row", "join condition") can't masquerade as code.
KW = re.compile(r'^\s*(--|/\*|\(|\)|SELECT|FROM|WHERE|GROUP\s+BY|ORDER\s+BY|HAVING|'
    r'(INNER|LEFT|RIGHT|FULL|CROSS|NATURAL)?\s*(OUTER\s+)?JOIN|ON|AND|OR|NOT|IN|WITH|'
    r'INSERT|UPDATE|DELETE|SET|VALUES|CREATE|ALTER|DROP|UNION|INTERSECT|EXCEPT|MINUS|'
    r'CASE|WHEN|THEN|ELSE|END|AS|LIMIT|OFFSET|FETCH|TOP|DISTINCT|PARTITION|OVER|'
    r'BEGIN|COMMIT|ROLLBACK|DECLARE|RETURNS?|EXEC|CALL|MERGE|USING|TRUNCATE|'
    r'COUNT|SUM|AVG|MIN|MAX|ROW_NUMBER|RANK|DENSE_RANK|NTILE|LEAD|LAG|FIRST_VALUE|'
    r'LAST_VALUE|COALESCE|NULLIF|CONCAT|LENGTH|CHAR_LENGTH|UPPER|LOWER|SUBSTRING|'
    r'TRIM|ROUND|ABS|IF|IFNULL|GO|DELIMITER|LANGUAGE|\$\$)\b')

# Lowercase English function words — their presence marks a block as prose even when it
# opens with a SQL keyword (e.g. "COUNT(column_name) counts only the rows where …").
PROSE_WORDS = re.compile(r'\b(the|and|is|are|was|were|of|to|that|which|this|these|so|'
    r'but|it|its|it\'s|can|can\'t|only|other|than|because|when you|there|their|'
    r'each|both|every|instead|usually|means|returns the|rows where)\b')

def looks_prose(text):
    t = clean(text)
    return len(PROSE_WORDS.findall(t)) >= 2

TERM = re.compile(r';\s*(--[^\n]*)?$')     # ';' optionally followed by an inline comment

def complete_stmt(text):
    """A finished SQL statement: keyword-led lines and a terminating semicolon."""
    lines = [l for l in clean(text).split("\n") if l.strip()]
    if not lines: return False
    if not any(TERM.search(l.rstrip()) for l in lines): return False
    return sum(1 for l in lines if KW.match(l)) >= max(1, len(lines) * 0.4)

# A bare column/identifier continuation line ("d.department_name,") — no spaces, so a
# multi-word English sentence can never match it.
SQLISH = re.compile(r"""^\s*[\w"`.*()',]+\s*,?\s*$""")

def sqlish(line):
    return bool(KW.match(line) or SQLISH.match(line))

def stmt_head(text):
    """An unterminated keyword-led fragment — the head of a page-split statement."""
    lines = [l for l in clean(text).split("\n") if l.strip()]
    if not lines or looks_prose(text): return False
    if clean(text).rstrip().endswith("."): return False
    return any(KW.match(l) for l in lines) and all(sqlish(l) for l in lines)

def classify(blocks):
    """blocks: list of dicts {t:'text'|'img', raw, spans} -> tagged 'prose'|'code'|'img'."""
    kinds = []
    for b in blocks:
        if b["t"] == "img": kinds.append("img"); continue
        if starts_with_label(b["raw"]): kinds.append("prose"); continue
        kinds.append("code" if complete_stmt(b["raw"]) else "?")
    # Resolve fragments: a keyword-led fragment that runs into a statement is its head.
    for i, k in enumerate(kinds):
        if k != "?": continue
        j = i + 1
        while j < len(kinds) and kinds[j] == "img": j += 1
        if j < len(kinds) and kinds[j] == "code" and stmt_head(blocks[i]["raw"]):
            kinds[i] = "code"
        else:
            kinds[i] = "prose"
    return kinds

def spans_to_md(spans):
    """Join spans, wrapping monospace (inline-code) runs in backticks."""
    out, buf, in_code = [], [], False
    for s in spans:
        mono = "Mono" in s["font"] or "Courier" in s["font"]
        if mono != in_code:
            if buf: out.append(("`" + "".join(buf).strip() + "`") if in_code else "".join(buf))
            buf, in_code = [], mono
        buf.append(s["text"])
    if buf: out.append(("`" + "".join(buf).strip() + "`") if in_code else "".join(buf))
    txt = clean("".join(out))
    txt = txt.replace("``", "")
    return re.sub(r'[ \t]+', ' ', txt).strip()

def norm_code(text):
    lines = [clean(l).rstrip() for l in text.split("\n")]
    while lines and not lines[0].strip(): lines.pop(0)
    while lines and not lines[-1].strip(): lines.pop()
    # Drop the 1-space artificial indent the PDF adds to continuation lines,
    # but keep deliberate alignment (topic 5 aligns on 7 spaces).
    kept = []
    for i, l in enumerate(lines):
        if not l.strip():
            nxt = next((x for x in lines[i+1:] if x.strip()), "")
            if not nxt.lstrip().startswith("--"): continue
        kept.append(l)
    lines = kept
    # A lone leading space is a PDF artifact; 2+ spaces is deliberate alignment.
    lines = [(l[1:] if (l.startswith(" ") and not l.startswith(" ")) else l) for l in lines]
    rest = [l for l in lines[1:] if l.strip()]
    if rest and all(l.startswith(" ") and not l.startswith(" ") for l in rest):
        lines = lines[:1] + [(l[1:] if l.startswith(" ") else l) for l in lines[1:]]
    return "\n".join(lines).strip()

# ---------- 1. Reading-order element stream ----------
elements = []
for pno, page in enumerate(doc, start=1):
    items = []
    for b in page.get_text("dict")["blocks"]:
        if b.get("type") == 1: continue
        spans = [s for l in b.get("lines", []) for s in l["spans"] if s["text"].strip()]
        if not spans: continue
        raw = "\n".join("".join(s["text"] for s in l["spans"]).rstrip() for l in b["lines"]).strip()
        if not clean(raw).strip(): continue
        items.append((round(b["bbox"][1], 1), "text", (raw, spans, pno)))
    for info in page.get_image_info(xrefs=True):
        if info["xref"]:
            items.append((round(info["bbox"][1], 1), "image", (info["xref"], pno)))
    items.sort(key=lambda t: t[0])
    elements.extend((k, v) for _, k, v in items)

# ---------- 2. Segment into patterns / topics ----------
PAT_RE = re.compile(r'^Pattern\s+(\d+)\s*:\s*(.+?)\s*$')
TOP_RE = re.compile(r'^(\d+)\.\s+(.+?)\s*$')

patterns, cur_pat, cur_top, expect = [], None, None, 1
for kind, val in elements:
    if kind == "text":
        raw, spans, pno = val
        bold = spans[0]["font"].startswith("Arial-Bold")
        flat = re.sub(r'\s+', ' ', clean(raw)).strip()
        m = PAT_RE.match(flat)
        if m and bold:
            cur_pat = {"num": int(m.group(1)), "label": m.group(2).strip(), "intro": [], "topics": []}
            patterns.append(cur_pat); cur_top = None
            continue
        m = TOP_RE.match(flat)
        if m and bold and int(m.group(1)) == expect:
            cur_top = {"num": int(m.group(1)), "title": m.group(2).strip(), "body": []}
            cur_pat["topics"].append(cur_top); expect += 1
            continue
        tgt = cur_top["body"] if cur_top else (cur_pat["intro"] if cur_pat else None)
        if tgt is None: continue
        if flat.lower().rstrip(":") in CAPTIONS:      # drop "SQL Query" style captions
            continue
        tgt.append({"t": "text", "raw": raw, "spans": spans})
    else:
        xref, pno = val
        tgt = cur_top["body"] if cur_top else (cur_pat["intro"] if cur_pat else None)
        if tgt is None: continue
        tgt.append({"t": "img", "xref": xref})

assert len(patterns) == 14, len(patterns)
assert sum(len(p["topics"]) for p in patterns) == 85

# ---------- 2b. Classify each block as prose / code ----------
def finalize(blocks):
    out = []
    for b, k in zip(blocks, classify(blocks)):
        if k == "img":
            out.append({"t": "img", "xref": b["xref"]})
        elif k == "code":
            out.append({"t": "code", "v": norm_code(b["raw"])})
        else:
            md = spans_to_md(b["spans"])
            if not md: continue
            out.append({"t": "prose", "v": md,
                        "label": next((l for l in LABELS if md.startswith(l)), None)})
    return out

for p_ in patterns:
    p_["intro"] = finalize(p_["intro"])
    for t in p_["topics"]: t["body"] = finalize(t["body"])

# ---------- 3. Merge page-split continuations ----------
def merge(body):
    out = []
    for e in body:
        if e["t"] == "code":
            k = len(out) - 1
            while k >= 0 and out[k]["t"] == "img": k -= 1      # skip interleaved figures
            if k >= 0 and out[k]["t"] == "code" and not TERM.search(out[k]["v"].rstrip()):
                out[k]["v"] = norm_code(out[k]["v"] + "\n" + e["v"]); continue
        if out and e["t"] == "prose" and not e["label"] \
           and out[-1]["t"] == "prose":
            out[-1]["v"] = (out[-1]["v"].rstrip() + " " + e["v"].lstrip()).strip(); continue
        out.append(e)
    return out

for p in patterns:
    p["intro"] = merge(p["intro"])
    for t in p["topics"]: t["body"] = merge(t["body"])

# ---------- 4. Slugs ----------
def slugify(title, limit=80):
    s = clean(title).lower().replace("_", " ").replace("/", " ")
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    if len(s) > limit:
        s = s[:limit].rsplit('-', 1)[0] if '-' in s[:limit] else s[:limit]
    return s.strip('-')

used = {}
for p in patterns:
    for t in p["topics"]:
        s = slugify(t["title"]) or f"topic-{t['num']}"
        if s in used:
            s = f"{s}-{t['num']}"
        used[s] = t["num"]; t["slug"] = s

# ---------- 5. Images -> public/study-notes/sql/<slug>/fig-N.png ----------
if os.path.isdir(IMG_ROOT): shutil.rmtree(IMG_ROOT)
os.makedirs(IMG_ROOT, exist_ok=True)
written = 0
def save_figs(slug, xrefs, start=1):
    global written
    paths = []
    if not xrefs: return paths
    d = os.path.join(IMG_ROOT, slug); os.makedirs(d, exist_ok=True)
    for i, x in enumerate(xrefs, start=start):
        info = doc.extract_image(x)
        assert info["ext"] == "png", info["ext"]
        open(os.path.join(d, f"fig-{i}.png"), "wb").write(info["image"])   # lossless passthrough
        paths.append(f"/study-notes/sql/{slug}/fig-{i}.png")
        written += 1
    return paths

# ---------- 6. Render markdown ----------
def label_header(lab):
    return "**" + lab.rstrip(":") + "**"

def render(topic, pattern, is_first):
    """notes markdown for one topic; the pattern's shared setup rides on its first topic."""
    fig_i = [0]
    parts, summary, queries = [], None, []

    def fig_md(xrefs, caption):
        paths = save_figs(topic["slug"], xrefs, start=fig_i[0] + 1)
        fig_i[0] += len(paths)
        return [f"![{topic['title']} — {caption} {fig_i[0]-len(paths)+j+1}]({p})"
                for j, p in enumerate(paths)]

    if is_first:
        # Pattern setup: the shared source tables + any dataset tweaks this pattern needs.
        intro_imgs = [e["xref"] for e in pattern["intro"] if e["t"] == "img"]
        intro_txt  = [e for e in pattern["intro"] if e["t"] != "img"]
        if intro_imgs or intro_txt:
            parts.append(f"**Source data — Pattern {pattern['num']}: {pattern['label']}**")
            for e in intro_txt:
                if e["t"] == "code": parts.append("```sql\n" + e["v"] + "\n```")
                else:
                    v = e["v"]
                    for l in LABELS:
                        if v.startswith(l):
                            parts.append(label_header(l)); v = v[len(l):].strip(); break
                    if v: parts.append(v)
            parts.extend(fig_md(intro_imgs, "source table"))
            parts.append("---")

    pending_img_caption = "result"
    for e in topic["body"]:
        if e["t"] == "code":
            parts.append("```sql\n" + e["v"] + "\n```"); queries.append(e["v"])
        elif e["t"] == "img":
            parts.extend(fig_md([e["xref"]], pending_img_caption))
        else:
            v, lab = e["v"], e["label"]
            if lab:
                v = v[len(lab):].strip()
                if lab == "Theory:":
                    if summary is None:
                        m = re.match(r'^(.*?[.!?])(\s|$)', v)
                        summary = (m.group(1) if m else v).strip()
                    if v: parts.append(v)          # theory reads as the opening prose
                else:
                    parts.append(label_header(lab))
                    if v: parts.append(v[0].upper() + v[1:])
            elif v:
                parts.append(v)
    notes = "\n\n".join(x for x in parts if x and x.strip())
    return notes, summary, queries, fig_i[0]

rows = []
for p in patterns:
    group = f"Pattern {p['num']} — {p['label']}"
    for idx, t in enumerate(p["topics"]):
        notes, summary, queries, nfigs = render(t, p, idx == 0)
        problem = next((e["v"][len("Problem:"):].strip() for e in t["body"]
                        if e["t"] == "prose" and e["label"] == "Problem:"), None)
        # No `example`: the query is already in `notes`, so a second copy just
        # produced an "Example" tab identical to what the reader is already looking at.
        rows.append({
            "subject": "SQL",
            "groupLabel": group,
            "groupOrder": p["num"],
            "order": t["num"],
            "slug": t["slug"],
            "title": clean(t["title"]),
            "summary": summary,
            "notes": notes,
            "example": None,
            "figures": nfigs,
        })

with open(SEED_OUT, "w") as fh:
    json.dump(rows, fh, indent=2, ensure_ascii=False)
    fh.write("\n")
print(f"topics={len(rows)} images_written={written} -> {SEED_OUT}")
print("no-code topics :", [r["order"] for r in rows if not r["example"]])
print("no-summary     :", [r["order"] for r in rows if not r["summary"]])
print("no-figure      :", [r["order"] for r in rows if not r["figures"]])
print("dupe slugs     :", len(rows) - len({r["slug"] for r in rows}))
print("total fig count:", sum(r["figures"] for r in rows))
