# DSA Sheets

Two problem sheets ported from the RisingBrain content set
(`../demo/risingbrain/data/seed_v2.json`). Both follow the same design.

| Sheet | File | Topics | Subtopics | Problems | Focus |
|-------|------|:------:|:---------:|:--------:|-------|
| **Pattern Wise Sheet** | [`pattern-wise-sheet.md`](./pattern-wise-sheet.md) | 17 | 69 | 390 | Deep, pattern-based learning topic by topic |
| **Last Minute 100** | [`last-minute-100.md`](./last-minute-100.md) | 15 | 16 | 106 | High-frequency questions for quick revision |

## How a sheet is designed

```
Sheet                       # name + description
└── Topic                   # e.g. Array, Graph, Dynamic Programming (+ description)
    └── Subtopic            # the pattern, e.g. Two-Pointer, Sliding Window
        ├── Strategy        # how the pattern works
        ├── Identify when   # the cue that signals this pattern
        └── Problems        # table: # | Problem | Ref | Difficulty | Companies | Links
```

- **Pattern Wise Sheet** splits each topic into multiple pattern subtopics — the
  pattern (strategy) and its identification cue are the teaching unit.
- **Last Minute 100** keeps one subtopic per topic (a flat, high-frequency list)
  but uses the identical structure, so both render the same way.

Each problem row carries its LeetCode reference (`LC ###`), difficulty,
the companies that ask it, and direct LeetCode / GFG / YouTube links.

> Source of truth is the upstream JSON; these `.md` files are a readable copy.
> Regenerate with the converter in scratch if the JSON changes.
