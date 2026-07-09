/**
 * Themed SVG banners for the "Everything you need" feature cards — one motif per
 * section, replacing the old corner icon. Each is a full-bleed line-art scene
 * drawn in the brand accent via `currentColor` (the card sets the colour), so
 * they adapt to light/dark automatically. `preserveAspectRatio="xMidYMid slice"`
 * lets them cover the banner at any card width with the motif kept centred.
 */
type BannerProps = { className?: string };

const COMMON = {
  viewBox: "0 0 300 120",
  fill: "none" as const,
  preserveAspectRatio: "xMidYMid slice",
  xmlns: "http://www.w3.org/2000/svg",
};

/** Faint scattered dots shared as a subtle backdrop texture. */
function Dots() {
  const pts = [
    [24, 22],
    [270, 30],
    [40, 96],
    [255, 92],
    [150, 14],
    [285, 60],
  ];
  return (
    <g fill="currentColor" opacity="0.12">
      {pts.map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="2.5" />
      ))}
    </g>
  );
}

/** DSA Sheets — a checklist (pattern-first practice). */
export function SheetsArt({ className }: BannerProps) {
  const rows = [
    { y: 34, w: 150, checked: true },
    { y: 62, w: 128, checked: false },
    { y: 90, w: 104, checked: false },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Dots />
      {rows.map((r) => (
        <g key={r.y}>
          <circle
            cx="52"
            cy={r.y}
            r="11"
            stroke="currentColor"
            strokeWidth="3"
            fill="currentColor"
            fillOpacity={r.checked ? 0.2 : 0}
            opacity={r.checked ? 1 : 0.45}
          />
          {r.checked ? (
            <path
              d="M47 34l3.5 4 7-8"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
          <rect
            x="76"
            y={r.y - 6}
            width={r.w}
            height="12"
            rx="6"
            fill="currentColor"
            opacity={r.checked ? 0.28 : 0.13}
          />
        </g>
      ))}
    </svg>
  );
}

/** Domain — a database cylinder + a results table. */
export function DomainArt({ className }: BannerProps) {
  return (
    <svg {...COMMON} className={className}>
      <Dots />
      {/* Database cylinder */}
      <g stroke="currentColor" strokeWidth="3" strokeLinecap="round">
        <path d="M44 34c0-6.6 15.2-12 34-12s34 5.4 34 12v52c0 6.6-15.2 12-34 12s-34-5.4-34-12V34z" fill="currentColor" fillOpacity="0.08" />
        <path d="M44 34c0 6.6 15.2 12 34 12s34-5.4 34-12" fill="none" />
        <path d="M44 60c0 6.6 15.2 12 34 12s34-5.4 34-12" fill="none" opacity="0.6" />
      </g>
      {/* Results table */}
      <g stroke="currentColor" strokeWidth="2.5">
        <rect x="150" y="26" width="118" height="68" rx="9" fill="currentColor" fillOpacity="0.05" />
        <line x1="150" y1="46" x2="268" y2="46" opacity="0.7" />
        <line x1="188" y1="26" x2="188" y2="94" opacity="0.5" />
      </g>
      <rect x="150" y="26" width="118" height="20" rx="9" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

/** Screening — an MCQ card with one option selected. */
export function ScreeningArt({ className }: BannerProps) {
  const opts = [
    { y: 44, selected: true },
    { y: 70, selected: false },
    { y: 96, selected: false },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Dots />
      {/* Prompt lines */}
      <rect x="40" y="18" width="176" height="10" rx="5" fill="currentColor" opacity="0.26" />
      <rect x="40" y="32" width="104" height="8" rx="4" fill="currentColor" opacity="0.14" />
      {/* Options */}
      {opts.map((o) => (
        <g key={o.y}>
          <rect
            x="40"
            y={o.y - 10}
            width="220"
            height="20"
            rx="10"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity={o.selected ? 0.18 : 0}
            opacity={o.selected ? 1 : 0.4}
          />
          <circle
            cx="54"
            cy={o.y}
            r="5.5"
            stroke="currentColor"
            strokeWidth="2.5"
            fill="currentColor"
            fillOpacity={o.selected ? 1 : 0}
          />
        </g>
      ))}
    </svg>
  );
}

/** Interview Stories — overlapping chat bubbles with a quote glyph. */
export function InterviewArt({ className }: BannerProps) {
  return (
    <svg {...COMMON} className={className}>
      <Dots />
      {/* Back bubble */}
      <g stroke="currentColor" strokeWidth="2.5" opacity="0.5">
        <path d="M168 44h74a12 12 0 0 1 12 12v22a12 12 0 0 1-12 12h-40l-14 12v-12h-8a12 12 0 0 1-12-12V56a12 12 0 0 1 12-12z" fill="currentColor" fillOpacity="0.05" />
      </g>
      {/* Front bubble */}
      <g stroke="currentColor" strokeWidth="3">
        <path d="M56 20h96a14 14 0 0 1 14 14v30a14 14 0 0 1-14 14H92l-18 16V78h-6a14 14 0 0 1-14-14V34a14 14 0 0 1 14-14z" fill="currentColor" fillOpacity="0.09" />
      </g>
      {/* Quote glyph + text lines inside the front bubble */}
      <g fill="currentColor">
        <path d="M74 38c-5 0-9 4-9 9 0 4 3 7 7 7 1 0 2 0 2-1-2 0-4-2-4-5h4v-9h0zm14 0c-5 0-9 4-9 9 0 4 3 7 7 7 1 0 2 0 2-1-2 0-4-2-4-5h4v-9z" opacity="0.85" />
        <rect x="100" y="40" width="52" height="7" rx="3.5" opacity="0.28" />
        <rect x="100" y="53" width="36" height="7" rx="3.5" opacity="0.18" />
      </g>
    </svg>
  );
}

export type FeatureArtKey = "sheets" | "domain" | "screening" | "interview";

export const FEATURE_ART: Record<FeatureArtKey, (props: BannerProps) => React.ReactElement> = {
  sheets: SheetsArt,
  domain: DomainArt,
  screening: ScreeningArt,
  interview: InterviewArt,
};
