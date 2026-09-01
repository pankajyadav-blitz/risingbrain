"""
Re-formats the Domain seed notes into real markdown.

The notes were extracted from PDFs, which left them structurally flat: every
section title is a `**bold paragraph**` rather than a heading, multi-column tables
were flattened into a vertical run of cells, ASCII diagrams lost their line breaks,
lists are "loose" (blank line between items), and each sentence sits in its own
paragraph. The renderer (react-markdown + remark-gfm, styled by `.notes-prose`)
supports h1-h4, GFM tables, blockquotes, tight lists and fenced code — this script
maps the flat text onto those.

What it produces:
  - `**Section**` paragraphs -> `##` / `###` headings, nested by context (a label inside
    a numbered part of the topic goes one level deeper than the same label at the top).
  - Flattened tables -> real GFM tables, from either shape the PDF left behind
    (one cell per block, or one row per block).
  - ASCII diagrams that lost their line breaks -> fenced blocks.
  - Loose lists -> tight lists; one-sentence-per-paragraph prose -> real paragraphs.
  - `Q:` / `A:` follow-ups and "Always ..." exam tips -> blockquote callouts.
  - snake_case / `Foo()` identifiers -> inline code.
  - SQL: drops `example`, which duplicated the query already shown in `notes`.

Run it once after (re-)extracting a PDF, then seed:

    python3 packages/database/scripts/format-domain-notes.py
    bun run db:seed-domain          # or db:seed-domain-sql for just SQL

Re-running is a deliberate no-op on files that are already formatted — see the guard
in main(). Guarantee: markup-only. The script asserts that the sequence of words is
identical before and after, so no prose can be lost or reordered; it exits non-zero if
that ever fails.
"""
import json, re, sys, os, collections

SEED = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "seed")

# ---------------------------------------------------------------- classification

# Sections that are always about the topic as a whole, never nested inside one of
# its numbered parts -> always "##", and they close any open numbered section.
ALWAYS_TOP = re.compile(
    r'^(Introduction|Definition|Overview|Syntax|Types?|Categories|Classification|'
    r'Advantages?|Benefits?|Disadvantages?|Drawbacks?|Limitations?|'
    r'Real[- ]World (?:Example|Problem|Analogy|Use Case)|Problem|Solution|'
    r'How It Works|Working|Process|Applications?|Use Cases?|Comparison|Differences?|'
    r'Key Points?|Quick Revision|Common Mistakes?|Why Interviewers Ask.*|'
    r'Interview Follow[- ]up|[\w\- ]*Diagram|Schema|Formula|Output|Summary|Conclusion|'
    r'Features?|Propert(?:y|ies)|Rules?|Structure|Components?|Source data.*|'
    r'Notes?|Tip|Dialect note|Illustration)'
    r'(?:\s+(?:of|in|for|and|to)\s+.+)?[:.]?$', re.I)

# Words that begin a sentence, not a section title. Without this, lead-ins like
# "**If Computer A sends data to Computer C**" get promoted to headings.
SENTENCE_START = re.compile(
    r'^(If|When|While|Suppose|Although|Though|Because|Since|This|That|These|Those|It|'
    r'Its|They|There|Here|Always|Never|Remember|Consider|Many|Most|Some|Each|Every|'
    r'Students|Candidates|Drawn|Which|Therefore|Hence|Thus|So|But|And|Also|As|In|On|'
    r'At|To|For|From|We|You|A|An|The|Both|Either|Neither|Now|Then|Once|After|Before)\b',
    re.I)

# Headings that introduce a set of named sub-items ("Components of the Relational
# Model" -> Relation / Tuple / Attribute). They stay "##" but open a part, so the
# items under them render one level deeper instead of as their siblings.
CONTAINER = re.compile(
    r'^(Components?|Types?|Categories|Classification|Structure|Features?|'
    r'Propert(?:y|ies)|Rules?|Kinds?|Forms?|Levels?|Layers?|Phases?|Stages?)'
    r'(?:\s+(?:of|in|for)\s+.+)?[:.]?$', re.I)

# Advice sentences worth pulling out as a callout blockquote.
ADVICE = re.compile(r'^(Always|Never|Remember|Note that|Make sure|Ensure|Avoid|Do not|Don\'t)\b', re.I)


def is_label(t):
    """Is this bold text a section title, as opposed to a bolded sentence?"""
    if t.endswith(('.', '!', ':')):
        return False
    words_ = t.split()
    if t.endswith('?'):                     # "Why are Keys Important?" is a heading
        return len(t) <= 70 and len(words_) <= 10
    if len(t) > 60 or len(words_) > 9:
        return False
    # A leading digit means a numbered part ("3. Completely Non-Trivial ...").
    if re.match(r'^\d+[\.\)]\s', t):
        return True
    return not SENTENCE_START.match(t)

BOLD_ONLY = re.compile(r'^\*\*(.+?)\*\*[:]?$', re.S)
LIST_ITEM = re.compile(r'^\s*[-*+]\s')
HEADING = re.compile(r'^#{1,6}\s')
FENCE = re.compile(r'^```')
IMAGE = re.compile(r'^!\[')
TABLE_ROW = re.compile(r'^\s*\|')
HR = re.compile(r'^\s*(-{3,}|\*{3,}|_{3,})\s*$')   # thematic break, not a cell
QUOTE = re.compile(r'^\s*>')
# Markdown hard line breaks (two trailing spaces) mark a block this script already
# laid out as rows; re-parsing its lines as loose cells is what broke idempotency.
HARDBREAK = re.compile(r'  \n')
BOX = re.compile(r'[│─└┌┐┘├┤┬┴┼▼▲←→↓↑]')
# Unbolded section titles: "1. PAN (Personal Area Network)", "Layer 3 — Network Layer".
NUMBERED = re.compile(r'^(\d+)[\.\)]\s+(\S.*)$')
NAMED_SECTION = re.compile(r'^((?:Layer|Step|Phase|Level|Round|Stage)\s+\d+\b.*)$', re.I)


def blocks_of(text):
    """
    Split into blank-line-separated blocks, but treat a fenced code block as ONE
    atomic block even when it contains blank lines. SQL topics separate their dialect
    variants with a blank line inside the fence, so splitting naively tore the fence
    apart and the tail got reprocessed as prose.
    """
    blocks = []
    for idx, part in enumerate(re.split(r'(```[\s\S]*?```)', text)):
        if idx % 2 == 1:
            blocks.append(part.strip())
        else:
            blocks.extend(b.strip() for b in re.split(r'\n\s*\n', part) if b.strip())
    return blocks


def kind(b):
    if HR.match(b): return 'hr'
    if QUOTE.match(b): return 'quote'
    if HARDBREAK.search(b): return 'rows'
    if FENCE.match(b): return 'fence'
    if IMAGE.match(b): return 'image'
    if HEADING.match(b): return 'heading'
    if LIST_ITEM.match(b): return 'list'
    if TABLE_ROW.match(b): return 'pipe'
    if BOLD_ONLY.match(b) and '\n' not in b: return 'bold'
    return 'prose'


def bold_text(b):
    m = BOLD_ONLY.match(b)
    return m.group(1).strip() if m else None


def cell_lines(b):
    """
    The lines of a block if every one of them looks like a bare table cell, else None.
    A flattened table arrives either as one cell per block or as a block holding a
    whole row ("OSI Model\\nTCP/IP Model"), so both shapes have to count.
    """
    if kind(b) != 'prose' or BOX.search(b):
        return None
    lines = [l.strip() for l in b.split('\n') if l.strip()]
    if not lines or len(lines) > 4:
        return None
    for l in lines:
        if len(l) > 44 or l.endswith(('.', ':', '!', '?', ',')):
            return None
    return lines


def is_cell(b):
    """A short, punctuation-free fragment that could be a table cell."""
    return cell_lines(b) is not None


# ---------------------------------------------------------------- transformation

def reflow(text, inline_code):
    blocks = blocks_of(text)
    out = []
    i = 0
    n = len(blocks)
    # True once we're inside a numbered/named part of the topic ("2. Conceptual
    # Level", "Layer 3 — Network Layer"). Labels like "Examples" / "Range" /
    # "Protocol" belong to that part, so they nest one level deeper; the same label
    # at the topic's top level is a section in its own right. An ALWAYS_TOP heading
    # closes the part.
    in_part = False

    def emit_label(t):
        nonlocal in_part
        if CONTAINER.match(t):
            in_part = True
            out.append('## ' + t.rstrip(':'))
        elif ALWAYS_TOP.match(t):
            in_part = False
            out.append('## ' + t.rstrip(':'))
        else:
            out.append(('### ' if in_part else '## ') + t.rstrip(':'))

    def emit_part(title):
        nonlocal in_part
        in_part = True
        out.append('## ' + title)

    while i < n:
        b = blocks[i]
        k = kind(b)

        # ---- 1. Rebuild a flattened table: >=2 bold header cells, then a whole
        # number of rows of plain cells. The PDF dumped these one cell per line.
        if k == 'bold':
            hdr, j = [], i
            while j < n and kind(blocks[j]) == 'bold':
                t = bold_text(blocks[j])
                if not t or not is_label(t) or len(t) > 30: break
                hdr.append(t); j += 1
            if len(hdr) >= 2:
                cells, m = [], j
                while m < n and is_cell(blocks[m]):
                    cells.append(blocks[m]); m += 1
                ncol = len(hdr)
                if cells and len(cells) % ncol == 0:
                    rows = [cells[x:x + ncol] for x in range(0, len(cells), ncol)]
                    # One block: GFM needs the rows on CONSECUTIVE lines, and blocks
                    # are joined with a blank line later on.
                    tbl = ['| ' + ' | '.join(hdr) + ' |',
                           '| ' + ' | '.join('---' for _ in hdr) + ' |']
                    tbl += ['| ' + ' | '.join(r) + ' |' for r in rows]
                    out.append('\n'.join(tbl))
                    i = m
                    continue

        # ---- 2. Bold-only line -> heading (or keep bold if it's a sentence).
        if k == 'bold':
            t = bold_text(b)
            if t and is_label(t):
                mnum = NUMBERED.match(t)
                if mnum:                      # "**2. Conceptual Level**" is a part
                    emit_part(f'{mnum.group(1)}. {mnum.group(2)}')
                else:
                    emit_label(t)
            elif t and ADVICE.match(t):
                # "Always mention that ..." — an exam tip, not a section. Render it
                # as a callout; the theme gives blockquotes an accent left border.
                out.append('> **' + t + '**')
            elif (t and not t.endswith(('.', '?', '!'))
                  and i + 1 < n and kind(blocks[i + 1]) == 'prose'
                  and len(blocks[i + 1]) <= 60 and '\n' not in blocks[i + 1]):
                # A bolded lead-in with its value on the next line ("**Suppose you
                # visit**" / "www.google.com"). One sentence reads far better than
                # two stacked paragraphs, the second of which looks orphaned.
                out.append(f'**{t}** {blocks[i + 1].strip()}')
                i += 2
                continue
            else:
                out.append(b)  # a bolded sentence stays a bolded sentence
            i += 1
            continue

        # ---- 3. Fence a run of ASCII-diagram fragments so it stops rendering as
        # mangled prose. Lines split on box characters recover the vertical layout.
        if (BOX.search(b) or (k == 'pipe' and not _looks_like_table(blocks, i))):
            run, j = [], i
            while j < n:
                bj = blocks[j]
                kj = kind(bj)
                if kj in ('bold', 'heading', 'list', 'image', 'fence'): break
                if not (BOX.search(bj) or kj == 'pipe' or is_cell(bj)): break
                run.append(bj); j += 1
            if len(run) == 1 and not BOX.search(run[0]) and kind(run[0]) == 'pipe':
                out.append('`' + run[0].strip() + '`')
                i = j
                continue
            if run and (len(run) > 1 or BOX.search(run[0])):
                lines = []
                for r in run:
                    parts = [p.strip() for p in re.split(r'[│]', r)]
                    lines.extend(p for p in parts if p)
                out.append('```\n' + '\n'.join(lines) + '\n```')
                i = j
                continue

        # ---- 4. Unbolded section title -> heading. Only when it actually heads
        # something (a numbered line followed by another numbered line is a list).
        if k == 'prose' and '\n' not in b:
            mnum = NUMBERED.match(b)
            mnamed = NAMED_SECTION.match(b)
            # "1. PAN (Personal Area Network)" is a section title; "1. Deduct 5,000"
            # is a list item. The tell is adjacency: list items sit next to each other
            # with nothing between, whereas a section title is separated from its
            # siblings by the content it introduces. (Testing the *next* block's
            # bold-ness instead made the result depend on whether this script had
            # already run, so re-running it kept changing the output.)
            prev_num = i > 0 and bool(NUMBERED.match(blocks[i - 1]))
            next_num = i + 1 < n and bool(NUMBERED.match(blocks[i + 1]))
            heads_content = i + 1 < n and not prev_num and not next_num
            if mnum and len(b) <= 70 and not b.endswith('.') and heads_content:
                emit_part(f'{mnum.group(1)}. {mnum.group(2)}'); i += 1; continue
            if mnamed and len(b) <= 70 and not b.endswith('.'):
                emit_part(mnamed.group(1)); i += 1; continue

        # ---- 5. Q:/A: follow-ups -> blockquote (accent left border in the theme).
        if k == 'prose' and re.match(r'^Q[:.]\s', b):
            qa = ['> **Q:** ' + re.sub(r'^Q[:.]\s*', '', b).replace('\n', ' ')]
            i += 1
            if i < n and re.match(r'^A[:.]\s', blocks[i]):
                qa.append('>')
                qa.append('> **A:** ' + re.sub(r'^A[:.]\s*', '', blocks[i]).replace('\n', ' '))
                i += 1
            out.append('\n'.join(qa))
            continue

        # ---- 6. Tighten a loose list: the PDF put a blank line between items.
        if k == 'list':
            items, j = [], i
            while j < n and kind(blocks[j]) == 'list':
                # A block may hold ONE item wrapped over several lines (fresh from the
                # PDF) or a whole tight list (a previous run of this script). Split on
                # the bullets, then unwrap each item individually — flattening every
                # newline would glue the items into a single line.
                for line in blocks[j].split('\n'):
                    if LIST_ITEM.match(line):
                        items.append(line.strip())
                    elif line.strip() and items:
                        items[-1] += ' ' + line.strip()
                    elif line.strip():
                        items.append(line.strip())
                j += 1
            out.append('\n'.join(items))
            i = j
            continue

        # ---- 6b. A run of bare cells is a table the PDF flattened one cell per
        # line ("Device / OSI Layer / Hub / Layer 1 / Repeater Layer 1 / …"). The
        # column split isn't always recoverable — "Repeater Layer 1" is one line with
        # a single space — so rather than guess a table (or let the paragraph merger
        # below smear it into one sentence) keep the rows as hard-broken lines. Same
        # information, compact, and honest about what we know.
        if k == 'prose' and is_cell(b):
            units, j = [], i
            while j < n and is_cell(blocks[j]):
                units.append(cell_lines(blocks[j]))
                j += 1
            flat = [x for u in units for x in u]
            if len(flat) >= 3:
                # A run often opens with its own caption ("Key Differences",
                # "Summary Table") — promote that to a heading so the rows below it
                # read as a unit instead of as one more anonymous cell.
                if len(units[0]) == 1 and re.search(
                        r'(Comparison|Differences?|Summary|Table|Layout|Mapping)\s*$', units[0][0], re.I):
                    emit_label(units[0][0].strip())
                    units, flat = units[1:], [x for u in units[1:] for x in u]

                # If most blocks hold a full row, the column count is recoverable and
                # we can rebuild a real table. Rows the PDF space-joined into one line
                # ("Mainly used for learning Used on the Internet") can't be split
                # safely, so they go in the first column and the rest stay blank —
                # nothing invented, nothing dropped.
                widths = [len(u) for u in units]
                ncol = max(widths, default=0)
                if ncol >= 2 and sum(1 for w in widths if w == ncol) * 2 >= len(units):
                    hdr, body = units[0], units[1:]
                    if len(hdr) == ncol and body:
                        tbl = ['| ' + ' | '.join(hdr) + ' |',
                               '| ' + ' | '.join('---' for _ in hdr) + ' |']
                        for u in body:
                            tbl.append('| ' + ' | '.join(u + [''] * (ncol - len(u))) + ' |')
                        out.append('\n'.join(tbl))
                        i = j
                        continue
                if flat:
                    out.append('  \n'.join(flat))
                i = j
                continue

        # ---- 7. Merge one-sentence-per-paragraph prose back into paragraphs.
        if k == 'prose':
            para, j = [b], i + 1
            while j < n and kind(blocks[j]) == 'prose':
                nxt = blocks[j]
                joined = ' '.join(para)
                # A colon introduces what follows; a heading-ish line starts a section.
                if joined.rstrip().endswith(':'): break
                if NUMBERED.match(nxt) or NAMED_SECTION.match(nxt): break
                if re.match(r'^[QA][:.]\s', nxt) or BOX.search(nxt): break
                # Never swallow a flattened table's cells into a sentence — a short
                # unpunctuated fragment is a cell, not prose. Rule 6b handles it.
                if is_cell(nxt): break
                if len(joined) + len(nxt) > 340: break
                para.append(nxt); j += 1
            out.append(' '.join(re.sub(r'\s*\n\s*', ' ', p) for p in para))
            i = j
            continue

        out.append(b)
        i += 1

    md = '\n\n'.join(out)
    return inline_code_pass(md) if inline_code else md


def _looks_like_table(blocks, i):
    """True when this block is a real GFM table (its second line is the delimiter)."""
    own = blocks[i].split('\n')
    if len(own) > 1 and re.match(r'^\s*\|[\s\-:|]+\|?\s*$', own[1]):
        return True
    return i + 1 < len(blocks) and re.match(r'^\s*\|[\s\-:|]+\|?\s*$', blocks[i + 1] or '')


# Identifier-shaped tokens only — deliberately conservative so ordinary prose is
# never turned into code. snake_case, Foo(), and pipe-delimited pseudo rows.
SNAKE = re.compile(r'(?<![`\w])([a-z][a-z0-9]*(?:_[a-z0-9]+)+)(?![`\w])')
CALL = re.compile(r'(?<![`\w])([A-Za-z][A-Za-z0-9_]*\(\))(?![`\w])')
PIPEROW = re.compile(r'(?<!`)(\|[A-Za-z0-9][^|\n]*(?:\|[^|\n]*)+\|)(?!`)')


def inline_code_pass(md):
    out = []
    in_fence = False
    for line in md.split('\n'):
        if line.startswith('```'):
            in_fence = not in_fence
            out.append(line); continue
        if in_fence or line.startswith('|'):
            out.append(line); continue
        # Protect existing inline code and image/link targets.
        held = []
        def hold(m):
            held.append(m.group(0)); return f'\x00{len(held)-1}\x00'
        line = re.sub(r'`[^`]*`|!\[[^\]]*\]\([^)]*\)', hold, line)
        line = PIPEROW.sub(lambda m: f'`{m.group(1)}`', line)
        line = SNAKE.sub(lambda m: f'`{m.group(1)}`', line)
        line = CALL.sub(lambda m: f'`{m.group(1)}`', line)
        line = re.sub(r'\x00(\d+)\x00', lambda m: held[int(m.group(1))], line)
        out.append(line)
    return '\n'.join(out)


# ---------------------------------------------------------------- verification

def words(s):
    """Word sequence, ignoring all markdown punctuation we may add or remove."""
    s = re.sub(r'!\[[^\]]*\]\([^)]*\)', ' IMG ', s)   # image alt text is rewritten below
    return re.findall(r'[0-9A-Za-z\u00c0-\u024f]+', s)


def main():
    files = ['domain-cn.json', 'domain-dbms.json', 'domain-oops.json',
             'domain-os.json', 'domain-sql.json']
    stats = collections.Counter()
    for f in files:
        path = os.path.join(SEED, f)
        rows = json.load(open(path))
        # Already migrated? Re-running is deliberately a NO-OP: every pass turns
        # markup back into prose (a bold lead-in merged with its value is just a
        # paragraph next time round), so a second pass would keep gluing paragraphs
        # together and slowly degrade the layout. The check is per FILE, not per
        # topic, because a handful of topics legitimately produce no headings at all.
        # Re-extract the PDF if you want to reformat from scratch.
        if any(re.search(r'(?m)^#{2,3} ', r['notes']) for r in rows):
            stats[f + ' (already formatted, skipped)'] += len(rows)
            continue
        for r in rows:
            before = r['notes']
            after = reflow(before, inline_code=(f != 'domain-sql.json'))
            wb, wa = words(before), words(after)
            if wb != wa:
                # Pinpoint the divergence for debugging.
                for x, (p, q) in enumerate(zip(wb, wa)):
                    if p != q:
                        print(f"WORD DRIFT in {f} :: {r['slug']} at #{x}: {wb[x-4:x+4]} -> {wa[x-4:x+4]}")
                        break
                else:
                    print(f"WORD DRIFT (length {len(wb)} -> {len(wa)}) in {f} :: {r['slug']}")
                    print("  tail before:", wb[len(wa):len(wa)+8], "| tail after:", wa[len(wb):len(wb)+8])
                sys.exit(1)
            r['notes'] = after
            stats[f] += 1
            # SQL notes already contain the query verbatim; the Example tab was a
            # duplicate of it, so drop it and let ContentTabs hide the switch.
            if f == 'domain-sql.json' and r.get('example'):
                r['example'] = None
                stats['sql examples dropped'] += 1
        with open(path, 'w') as fh:
            json.dump(rows, fh, indent=2, ensure_ascii=False)
            fh.write('\n')
    for k, v in stats.items():
        print(f" {k}: {v}")


if __name__ == '__main__':
    main()
