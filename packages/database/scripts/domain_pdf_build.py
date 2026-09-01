"""Assemble the extracted PDF blocks (see extract.py) into the Domain seed.

Writes, per subject:
  out/domain-<subject>.json        topics + notes, in the loader's DomainTopicJson shape
  out/domain-<subject>-quiz.json   the in-PDF MCQs, keyed by topic slug
  out/figures/<subject>/<slug>/    that topic's figure

The source documents are already written to a fixed teaching shape — an opening
hook, then Why + What, How It Works, Visualize, Common Confusion, Interview Angle,
Quiz and Recap — so the mapping onto the site's note headings is one-to-one and
nothing is invented. Two deliberate moves:

  * "Visualize" emits no heading of its own; the figure IS the section.
  * Quiz and Answer-key content is lifted OUT of the notes into the quiz file, so
    it renders in the Practice tab the way every other subject's does, instead of
    as an un-gradeable list of options in the middle of the prose.
"""
import json, os, re, unicodedata
import domain_pdf_extract as extract

SECTION_TITLES = {
    "why": "Why & what",
    "how": "How it works",
    "confusion": "Common confusion",
    "interview": "Interview angle",
    "recap": "Recap",
}
MODULE_TITLES = {}      # filled from the PDFs' own module headings

OPTION_RE = re.compile(r'^\(?([a-dA-D])[).]\s*(.+)$')
QUESTION_RE = re.compile(r'^\*\*Q\s*(\d+)[^*]*?\.?\*\*\s*(.*)$', re.S)
INLINE_OPTS_RE = re.compile(r'\(([a-d])\)\s*')
INLINE_ANS_RE = re.compile(r'\*\*Answer:?\s*\(?([a-dA-D])\)?\*\*[.:]?\s*(?:—\s*)?(.*)$', re.S)
ANSWER_LINE_RE = re.compile(r'^(\d{1,2})\s*—?\s*\*?\*?([a-dA-D])\*?\*?[.)]?\s*(.*)$', re.S)
RECAP_RE = re.compile(r'^\*\*Recap:?\*\*[:.]?\s*(.*)$', re.S)


def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode()
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return re.sub(r'-{2,}', '-', s)[:80].strip('-')


def strip_md(s):
    return re.sub(r'\*\*(.*?)\*\*', r'\1', s).strip()


def load_blocks(subject):
    """All of a subject's blocks in course order, each tagged with the PDF it came
    from — the figures are pulled back out of that file by page later."""
    out = []
    for f in extract.SUBJECTS[subject]:
        for b in json.load(open(f"blocks/{subject}__{f.replace(' ', '_')}.json")):
            b["src"] = f
            out.append(b)
    return out


def split_topics(subject, blocks):
    """Blocks → topics, each carrying its module label. DBMS module 4 has no 4.1
    heading in the source — the module title doubles as it — so it is opened here."""
    topics, cur, module = [], None, {}
    for b in blocks:
        if b["type"] == "topic":
            cur = {"mod": b["mod"], "num": b["num"], "title": b["title"], "blocks": []}
            topics.append(cur)
            continue
        if b["type"] == "para":
            m = re.match(r'^Module\s+(\d{1,2})\s*[:—.-]*\s*(.*)$', b["text"])
            # Only a FORWARD module number opens a new module. The capstone topics
            # recap every earlier module by name, and those back-references are body
            # text, not headings — treating them as headings orphaned their figures.
            if m and len(b["text"]) < 80 and not b["text"].endswith((".", "?")) \
                    and (cur is None or int(m.group(1)) > cur["mod"]):
                mod, label = int(m.group(1)), m.group(2).strip(" :—-")
                if label and mod not in module:
                    module[mod] = label
                if subject == "DBMS" and mod == 4:
                    cur = {"mod": 4, "num": 1,
                           "title": "Functional Dependencies & Anomalies", "blocks": []}
                    topics.append(cur)
                else:
                    cur = None
                continue
        if cur is not None:
            cur["blocks"].append(b)
    MODULE_TITLES[subject] = module
    return topics


def md_table(rows):
    if len(rows) > 2:                       # a table split across pages repeats its header
        rows = [rows[0]] + [r for r in rows[1:] if r != rows[0]]
    width = max(len(r) for r in rows)
    rows = [[c.replace("|", "\\|") for c in r] + [""] * (width - len(r)) for r in rows]
    head, body = rows[0], rows[1:]
    if not any(head):
        head, body = [""] * width, rows
    return "\n".join(["| " + " | ".join(head) + " |",
                      "|" + "|".join([" --- "] * width) + "|"]
                     + ["| " + " | ".join(r) + " |" for r in body])


def render(blocks, figure_path, figure_alt):
    """One topic's blocks → the notes markdown."""
    out, section, pending = [], "hook", []

    def flush():
        nonlocal pending
        if pending:
            out.append("\n".join(pending))
            pending = []

    def heading(name):
        flush()
        out.append(f"## {name}")

    heading("Hook")
    for b in blocks:
        if b["type"] == "section":
            section = b["name"]
            if section in SECTION_TITLES:
                heading(SECTION_TITLES[section])
            else:
                flush()             # visualize / quiz / answers carry no heading here
            continue
        if section in ("quiz", "answers"):
            # The MCQs move to the Practice tab; only a Recap parked in the quiz
            # section stays with the notes.
            m = b["type"] == "para" and RECAP_RE.match(b["text"])
            if m:
                heading("Recap")
                out.append(m.group(1).strip())
                section = "recap"
            continue
        if b["type"] == "figure":
            flush()
            out.append(f"![{figure_alt}]({figure_path})")
            continue
        if b["type"] == "table":
            flush()
            out.append(md_table(b["rows"]))
            continue
        if b["type"] == "code":
            flush()
            out.append(f"```{b['lang']}\n{b['text']}\n```")
            continue
        if b["type"] == "item":
            pending.append(f"{b['num']}. {b['text']}" if b["ordered"] else f"- {b['text']}")
            continue
        m = RECAP_RE.match(b["text"])
        if m and section != "recap":
            heading("Recap")
            out.append(m.group(1).strip())
            section = "recap"
            continue
        flush()
        out.append(b["text"])
    flush()

    kept = [p for i, p in enumerate(out)
            if not (p.startswith("## ") and (i + 1 >= len(out) or out[i + 1].startswith("## ")))]
    body = "\n\n".join(kept).strip() + "\n"
    # A bold phrase that straddled a page break was split into two paragraphs mid
    # sentence. Rejoin those — but not two paragraphs that merely both start bold,
    # which is why the first one has to end without sentence punctuation.
    body = re.sub(r'(?<![.!?:;)"\u201d])\*\*\n\n\*\*', ' ', body)
    return re.sub(r'\*\*\s*\*\*', ' ', body)


def parse_quiz(subject, topics):
    """The MCQs for one module's topics.

    Three layouts across the three courses, handled by one pass:

      * DBMS packs prompt, options and answer into a single paragraph;
      * CN gives each topic its own answer key, numbered from 1;
      * OS numbers its questions continuously through a module and prints one
        answer key at the module's end.

    The last two are the same rule: an answer key resolves the questions banked
    since the previous answer key, matched on the question number.
    """
    banked, out = [], []
    def resolve(answers):
        for q in banked:
            key, why = answers.get(q["n"], (q["answer"], q["why"]))
            if not key or len(q["options"]) < 2:
                continue        # open-ended "scenario" prompts have nothing to grade
            if not any(o["key"] == key for o in q["options"]):
                continue
            out.append({
                "subject": subject,
                "topicSlug": q["slug"],
                "order": 0,
                "prompt": strip_md(q["prompt"]).rstrip(" :"),
                "options": q["options"],
                "answerKey": key,
                "explanation": (why[0].upper() + why[1:]) if why else None,
            })
        banked.clear()

    section, answers = None, {}
    cur = None
    key_rows = []

    def handle_quiz_para(text, slug=None):
        """One paragraph of a Quiz section. DBMS carries the whole question here —
        prompt, lettered options and the answer; CN and OS carry only the prompt and
        follow it with list items."""
        nonlocal cur
        m = QUESTION_RE.match(text.strip())
        if not m:
            # A stray paragraph inside a Quiz section continues the answer it
            # follows, which is how a DBMS explanation that wrapped gets completed.
            if cur is not None and cur["why"] and not RECAP_RE.match(text.strip()):
                cur["why"] = (cur["why"] + " " + strip_md(text)).strip()
            return
        body = m.group(2).strip()
        cur = {"n": int(m.group(1)), "slug": slug, "prompt": body,
               "options": [], "answer": None, "why": None}
        inline = INLINE_ANS_RE.search(body)
        if inline:
            head = body[:inline.start()].strip()
            cur["answer"] = inline.group(1).lower()
            cur["why"] = strip_md(inline.group(2)).strip(" —")
            opts = list(INLINE_OPTS_RE.finditer(head))
            if opts:
                cur["prompt"] = strip_md(head[:opts[0].start()]).strip(" :—")
                for k, mm in enumerate(opts):
                    end = opts[k + 1].start() if k + 1 < len(opts) else len(head)
                    cur["options"].append({"key": mm.group(1),
                                           "label": strip_md(head[mm.end():end])})
        banked.append(cur)

    def drain_key_rows():
        """Resolve one answer-key block. Each row is a number and a letter plus a
        reason; when the reason wraps to two lines the number's own cell is typeset
        between them, so rows are rebuilt by proximity rather than by order."""
        rows = [(i, ANSWER_LINE_RE.match(b["text"])) for i, b in enumerate(key_rows)]
        marks = [(i, m) for i, m in rows if m and not m.group(3).strip()
                 or (m and len(m.group(3)) < 200 and re.fullmatch(r'\d{1,2}', m.group(1)))]
        marks = [(i, m) for i, m in marks if m]
        for k, (i, m) in enumerate(marks):
            n = int(m.group(1))
            parts = [m.group(3).strip()]
            lo = marks[k - 1][0] + 1 if k else 0
            hi = marks[k + 1][0] if k + 1 < len(marks) else len(key_rows)
            here = key_rows[i]
            for j in range(lo, hi):
                if j == i or j == 0 and re.match(r'^Q\s', key_rows[j]["text"]):
                    continue
                b = key_rows[j]
                near = min(marks, key=lambda mm: abs(key_rows[mm[0]].get("y", 0) - b.get("y", 0))
                           + 1000 * (key_rows[mm[0]].get("page", 0) != b.get("page", 0)))
                if near[0] == i:
                    parts.append(b["text"])
            answers[n] = (m.group(2).lower(), strip_md(" ".join(p for p in parts if p)).strip())
        key_rows.clear()
    for t in topics:
        # A topic's sections do not carry into the next one; without this reset a
        # Quiz that ends a topic swallows the next topic's opening prose.
        section, cur = None, None
        for blk in t["blocks"]:
            if blk["type"] == "section":
                if key_rows:
                    drain_key_rows()
                if blk["name"] == "quiz" and answers:
                    resolve(answers); answers = {}
                section = blk["name"]
                continue

            if section == "quiz":
                if blk["type"] == "para":
                    # Two questions can share one paragraph when nothing separated
                    # them on the page; split before each "**Qn.**".
                    chunks = [c for c in re.split(r'(?=\*\*Q\s*\d+[^*]{0,12}\*\*)', blk["text"]) if c.strip()]
                    if len(chunks) > 1:
                        for c in chunks:
                            handle_quiz_para(c, t["slug"])
                        continue
                    handle_quiz_para(blk["text"], t["slug"])
                    continue
                if False:
                    m = None

                if blk["type"] == "item" and cur is not None:
                    m = OPTION_RE.match(strip_md(blk["text"]))
                    # A prompt the extractor could not see would otherwise pile the
                    # next question's options onto this one; a repeated letter is
                    # that, not a fifth choice.
                    if m and not any(o["key"] == m.group(1).lower() for o in cur["options"]):
                        cur["options"].append({"key": m.group(1).lower(),
                                               "label": m.group(2).strip()})
                continue

            if section == "answers":
                if blk["type"] == "table":
                    for row in blk["rows"]:
                        cells = [strip_md(c).strip() for c in row if c.strip()]
                        if not cells:
                            continue
                        # The number and its letter may share a cell ("1b") or not.
                        m = re.fullmatch(r'(\d{1,2})\s*[—-]?\s*([a-dA-D])', cells[0])
                        rest = cells[1:]
                        if not m and len(cells) >= 2 and re.fullmatch(r'\d{1,2}', cells[0]) \
                                and re.fullmatch(r'[a-dA-D]', cells[1]):
                            m, rest = re.fullmatch(r'(\d{1,2})()', cells[0]), cells[2:]
                            key = cells[1].lower()
                        elif m:
                            key = m.group(2).lower()
                        if not m:
                            continue
                        why = strip_md(" ".join(rest)).strip()
                        why = re.sub(r'^Why\b[\s—:-]*', '', why).strip()
                        answers[int(m.group(1))] = (key, why)
                    continue
                if blk["type"] == "para":
                    key_rows.append(blk)
    if key_rows:
        drain_key_rows()
    resolve(answers)

    per_topic = {}
    for q in out:
        per_topic.setdefault(q["topicSlug"], []).append(q)
        q["order"] = len(per_topic[q["topicSlug"]])
    return out


def summary_of(notes):
    """The one-line summary shown beside the topic in the index.

    Preference order: the topic's own Recap if it wrote one, then the definition it
    sets in bold under "Why & what" — these documents bold the sentence that defines
    the term — then that section's first real paragraph. The opening hook is the last
    resort: it is a narrative teaser, so it describes a scene rather than the topic.
    """
    def paragraphs(section=None):
        cur, out = None, []
        for para in notes.split("\n\n"):
            p = para.strip()
            if p.startswith("## "):
                cur = p[3:].strip()
                continue
            if section and cur != section:
                continue
            if p.startswith(("!", "|", "-", "```", "#")) or re.match(r'^\d+\.\s', p):
                continue
            out.append(p)
        return out

    recap = paragraphs("Recap")
    pool = recap or [p for p in paragraphs("Why & what") if "**" in p and len(p) > 70] \
        or [p for p in paragraphs("Why & what") if len(p) > 70] or paragraphs()
    text = " ".join((pool[0] if pool else "").split())
    # These documents open a paragraph with a short bold label ("Why packets exist.",
    # "What it is."). It introduces the sentence rather than being part of it.
    text = re.sub(r'^\*\*(.{0,45}?)[.:]?\*\*[.:]?\s+(?=[A-Z0-9])', '', text)
    text = strip_md(text)
    if len(text) > 240:
        cut = text[:240].rsplit(". ", 1)[0]
        text = (cut + ".") if len(cut) > 90 else text[:237].rstrip() + "…"
    return text or None


def main():
    os.makedirs("out", exist_ok=True)
    for subject in ("CN", "DBMS", "OS"):
        blocks = load_blocks(subject)
        topics = split_topics(subject, blocks)
        seed, quiz, figures = [], [], []
        seen = set()
        for order, t in enumerate(topics, 1):
            slug = slugify(t["title"])
            base = slug
            n = 2
            while slug in seen:
                slug = f"{base}-{n}"; n += 1
            seen.add(slug)
            t["slug"] = slug

            label = extract.fix_heading(MODULE_TITLES[subject].get(t["mod"], ""))
            group = f"Module {t['mod']}" + (f" — {label}" if label else "")
            path = f"/study-notes/{subject.lower()}/{slug}/fig-1.png"
            nfig = sum(1 for b in t["blocks"] if b["type"] == "figure")
            notes = render(t["blocks"], path, f"{t['title']} — figure 1")
            seed.append({
                "subject": subject,
                "groupLabel": group,
                "groupOrder": t["mod"],
                "order": order,
                "slug": slug,
                "title": t["title"],
                "summary": summary_of(notes),
                "notes": notes,
                "figures": nfig,
            })

            figs = [b for b in t["blocks"] if b["type"] == "figure"]
            figures.append({"slug": slug, "mod": t["mod"], "num": t["num"],
                            "count": nfig,
                            "src": figs[0]["src"] if figs else None,
                            "page": figs[0]["page"] if figs else None})

        by_module = {}
        for t in topics:
            by_module.setdefault(t["mod"], []).append(t)
        for mod in sorted(by_module):
            quiz += parse_quiz(subject, by_module[mod])

        json.dump(seed, open(f"out/domain-{subject.lower()}.json", "w"), indent=1, ensure_ascii=False)
        json.dump(quiz, open(f"out/domain-{subject.lower()}-quiz.json", "w"), indent=1, ensure_ascii=False)
        json.dump(figures, open(f"out/figures-{subject.lower()}.json", "w"), indent=1)
        print(f"{subject}: {len(seed)} topics, {len(quiz)} questions, "
              f"{sum(f['count'] for f in figures)} figures, "
              f"groups={sorted(set(s['groupLabel'] for s in seed))}")


if __name__ == "__main__":
    main()
