/**
 * Feature-card banners — miniature replicas of each section's real UI.
 *
 * These deliberately are NOT abstract illustration. Every premium developer
 * product (Linear, Supabase, Raycast, Warp, ClickHouse) shows a cropped slice
 * of the actual interface rather than decorative line-art, because the UI is
 * the proof and an illustration of the UI is a downgrade of it.
 *
 * The set reads as one family via a small number of hard rules:
 *   · one substrate      — the same 16px dot grid at 6%, edge-masked, in every card
 *   · one surface ladder — depth comes from flat steps on the theme's surface
 *                          tokens (background → surface → surface-2), never a
 *                          blurred drop shadow
 *   · one hairline       — every panel edge is `var(--border)`, the same 1px the
 *                          real cards use, so linework and chrome are one material
 *   · one accent         — `var(--accent)`; neutrals do all structural work
 *   · one signature      — a three-dot window chrome cluster appears exactly once
 *                          per card, in a different position each time
 *
 * Everything is painted with CSS custom properties rather than hard-coded hex,
 * so the art re-themes with light/dark for free.
 *
 * Layers carry `.art-bg` / `.art-mid` / `.art-fg` so the card can parallax them
 * at different rates on hover (see globals.css).
 */
type BannerProps = { className?: string };

const COMMON = {
  viewBox: "0 0 320 160",
  fill: "none" as const,
  preserveAspectRatio: "xMidYMid slice" as const,
  xmlns: "http://www.w3.org/2000/svg",
};

/* Shared tokens so no illustration invents its own values. */
const S = {
  bg: "var(--surface)",
  panel: "var(--surface-2)",
  line: "var(--border)",
  accent: "var(--accent)",
  ink: "var(--foreground)",
  muted: "var(--muted)",
};

/**
 * The shared substrate: a 16px dot grid faded out toward the edges. Each card
 * needs its own pattern/mask ids, hence the `id` prefix.
 */
function Substrate({ id }: { id: string }) {
  return (
    <>
      <defs>
        <pattern id={`${id}-dots`} width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill={S.ink} />
        </pattern>
        <radialGradient id={`${id}-fade`} cx="50%" cy="45%" r="65%">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <mask id={`${id}-mask`}>
          <rect width="320" height="160" fill={`url(#${id}-fade)`} />
        </mask>
      </defs>
      <g className="art-bg">
        <rect
          width="320"
          height="160"
          fill={`url(#${id}-dots)`}
          opacity="0.06"
          mask={`url(#${id}-mask)`}
        />
      </g>
    </>
  );
}

/** The signature element — window chrome. Once per card, never the same spot. */
function Chrome({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle cx="0" cy="0" r="2.5" fill={S.muted} opacity="0.45" />
      <circle cx="8" cy="0" r="2.5" fill={S.muted} opacity="0.3" />
      <circle cx="16" cy="0" r="2.5" fill={S.muted} opacity="0.2" />
    </g>
  );
}

/** A difficulty pill, reused across cards so the vocabulary stays shared. */
function Pill({
  x,
  y,
  w,
  tone = "muted",
}: {
  x: number;
  y: number;
  w: number;
  tone?: "accent" | "muted";
}) {
  const fill = tone === "accent" ? S.accent : S.muted;
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height="10"
      rx="5"
      fill={fill}
      opacity={tone === "accent" ? 0.25 : 0.14}
    />
  );
}

/* ------------------------------------------------------------------ */
/* DSA Sheets — the sheet itself: checked rows, difficulty pills.       */
/* ------------------------------------------------------------------ */
export function SheetsArt({ className }: BannerProps) {
  const rows = [
    { y: 46, w: 96, done: true },
    { y: 74, w: 118, done: true },
    { y: 102, w: 82, done: false },
    { y: 130, w: 106, done: false },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Substrate id="sheets" />

      {/* Panel */}
      <g className="art-mid">
        <rect
          x="26"
          y="18"
          width="268"
          height="150"
          rx="12"
          fill={S.panel}
          stroke={S.line}
          strokeWidth="1"
        />
        {/* Header */}
        <rect x="26" y="18" width="268" height="22" rx="12" fill={S.bg} opacity="0.6" />
        <Chrome x={42} y={29} />
        <rect x="70" y="25" width="54" height="8" rx="4" fill={S.muted} opacity="0.35" />

        {rows.map((r) => (
          <g key={r.y}>
            {/* Checkbox */}
            <rect
              x="42"
              y={r.y - 7}
              width="14"
              height="14"
              rx="4"
              fill={r.done ? S.accent : "none"}
              fillOpacity={r.done ? 0.9 : 0}
              stroke={r.done ? S.accent : S.line}
              strokeWidth="1.5"
            />
            {r.done ? (
              <path
                d={`M45.5 ${r.y} l3 3 5.5-6`}
                stroke="var(--brand-foreground)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            {/* Problem title */}
            <rect
              x="66"
              y={r.y - 4}
              width={r.w}
              height="8"
              rx="4"
              fill={r.done ? S.ink : S.muted}
              opacity={r.done ? 0.34 : 0.2}
            />
            {/* Difficulty */}
            <Pill x={244} y={r.y - 5} w={34} tone={r.done ? "accent" : "muted"} />
          </g>
        ))}
      </g>

      {/* Foreground: progress chip breaking the panel edge. */}
      <g className="art-fg">
        <rect
          x="196"
          y="4"
          width="86"
          height="26"
          rx="13"
          fill={S.bg}
          stroke={S.line}
          strokeWidth="1"
        />
        <circle cx="212" cy="17" r="7" fill="none" stroke={S.muted} strokeWidth="2.5" opacity="0.3" />
        <path
          d="M212 10a7 7 0 0 1 5.5 11.3"
          fill="none"
          stroke={S.accent}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <rect x="226" y="13" width="42" height="8" rx="4" fill={S.ink} opacity="0.32" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Domain — a SQL editor with the query above its result table.        */
/* ------------------------------------------------------------------ */
export function DomainArt({ className }: BannerProps) {
  // Token widths that read as `SELECT ... FROM ... WHERE ...`
  const q1 = [
    { w: 30, a: true },
    { w: 44, a: false },
    { w: 18, a: false },
    { w: 26, a: true },
  ];
  const q2 = [
    { w: 24, a: true },
    { w: 52, a: false },
    { w: 34, a: false },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Substrate id="domain" />

      <g className="art-mid">
        {/* Editor well — deliberately a step darker than the card, the way a
            code surface reads as recessed rather than raised. */}
        <rect
          x="22"
          y="14"
          width="276"
          height="62"
          rx="10"
          fill={S.bg}
          stroke={S.line}
          strokeWidth="1"
        />
        <Chrome x={36} y={27} />

        {/* Query tokens */}
        {q1.reduce<{ x: number; els: React.ReactElement[] }>(
          (acc, t, i) => {
            acc.els.push(
              <rect
                key={`a${i}`}
                x={acc.x}
                y="40"
                width={t.w}
                height="8"
                rx="4"
                fill={t.a ? S.accent : S.ink}
                opacity={t.a ? 0.75 : 0.28}
              />
            );
            return { x: acc.x + t.w + 8, els: acc.els };
          },
          { x: 36, els: [] }
        ).els}
        {q2.reduce<{ x: number; els: React.ReactElement[] }>(
          (acc, t, i) => {
            acc.els.push(
              <rect
                key={`b${i}`}
                x={acc.x}
                y="56"
                width={t.w}
                height="8"
                rx="4"
                fill={t.a ? S.accent : S.ink}
                opacity={t.a ? 0.75 : 0.28}
              />
            );
            return { x: acc.x + t.w + 8, els: acc.els };
          },
          { x: 36, els: [] }
        ).els}
      </g>

      {/* Result grid — bleeds off the bottom edge so the card reads as a crop
          of something larger rather than a self-contained clip-art scene. */}
      <g className="art-fg">
        <rect
          x="40"
          y="88"
          width="276"
          height="86"
          rx="10"
          fill={S.panel}
          stroke={S.line}
          strokeWidth="1"
        />
        <path d="M40 98a10 10 0 0 1 10-10h256a10 10 0 0 1 10 10v10H40z" fill={S.accent} opacity="0.12" />
        {[0, 1, 2].map((c) => (
          <rect
            key={c}
            x={54 + c * 88}
            y="94"
            width="40"
            height="7"
            rx="3.5"
            fill={S.accent}
            opacity="0.5"
          />
        ))}
        {[118, 142, 166].map((y) => (
          <g key={y}>
            {[0, 1, 2].map((c) => (
              <rect
                key={c}
                x={54 + c * 88}
                y={y}
                width={c === 1 ? 56 : 34}
                height="7"
                rx="3.5"
                fill={S.ink}
                opacity="0.2"
              />
            ))}
          </g>
        ))}
        <line x1="40" y1="108" x2="316" y2="108" stroke={S.line} strokeWidth="1" />
        <line x1="40" y1="132" x2="316" y2="132" stroke={S.line} strokeWidth="1" />
        <line x1="40" y1="156" x2="316" y2="156" stroke={S.line} strokeWidth="1" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Screening — an MCQ mid-answer, with a timer.                        */
/* ------------------------------------------------------------------ */
export function ScreeningArt({ className }: BannerProps) {
  const opts = [
    { y: 62, w: 104, state: "idle" as const },
    { y: 92, w: 128, state: "picked" as const },
    { y: 122, w: 88, state: "idle" as const },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Substrate id="screening" />

      <g className="art-mid">
        <rect
          x="24"
          y="14"
          width="272"
          height="158"
          rx="12"
          fill={S.panel}
          stroke={S.line}
          strokeWidth="1"
        />
        <Chrome x={40} y={30} />

        {/* Question */}
        <rect x="40" y="42" width="176" height="9" rx="4.5" fill={S.ink} opacity="0.38" />
        <rect x="40" y="56" width="96" height="7" rx="3.5" fill={S.muted} opacity="0.22" />

        {opts.map((o) => {
          const picked = o.state === "picked";
          return (
            <g key={o.y} transform="translate(0 12)">
              <rect
                x="40"
                y={o.y - 13}
                width="240"
                height="26"
                rx="8"
                fill={picked ? S.accent : "none"}
                fillOpacity={picked ? 0.14 : 0}
                stroke={picked ? S.accent : S.line}
                strokeWidth={picked ? 1.5 : 1}
                strokeOpacity={picked ? 0.7 : 1}
              />
              <circle
                cx="56"
                cy={o.y}
                r="6"
                fill="none"
                stroke={picked ? S.accent : S.muted}
                strokeOpacity={picked ? 1 : 0.4}
                strokeWidth="1.8"
              />
              {picked ? <circle cx="56" cy={o.y} r="3" fill={S.accent} /> : null}
              <rect
                x="72"
                y={o.y - 4}
                width={o.w}
                height="8"
                rx="4"
                fill={picked ? S.ink : S.muted}
                opacity={picked ? 0.34 : 0.2}
              />
            </g>
          );
        })}
      </g>

      {/* Timer ring, overlapping the panel's top-right corner. */}
      <g className="art-fg">
        <circle cx="272" cy="34" r="19" fill={S.bg} stroke={S.line} strokeWidth="1" />
        <circle cx="272" cy="34" r="13" fill="none" stroke={S.muted} strokeWidth="3" opacity="0.22" />
        <path
          d="M272 21a13 13 0 0 1 11.3 19.5"
          fill="none"
          stroke={S.accent}
          strokeWidth="3"
          strokeLinecap="round"
        />
        <rect x="265" y="30" width="14" height="7" rx="3.5" fill={S.ink} opacity="0.4" />
      </g>
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Interview Stories — a story card with its round-by-round timeline.  */
/* ------------------------------------------------------------------ */
export function InterviewArt({ className }: BannerProps) {
  const rounds = [
    { y: 74, done: true, w: 92 },
    { y: 104, done: true, w: 74 },
    { y: 134, done: false, w: 108 },
  ];
  return (
    <svg {...COMMON} className={className}>
      <Substrate id="interview" />

      <g className="art-mid">
        <rect
          x="26"
          y="14"
          width="268"
          height="158"
          rx="12"
          fill={S.panel}
          stroke={S.line}
          strokeWidth="1"
        />
        <Chrome x={42} y={30} />

        {/* Author row */}
        <circle cx="52" cy="52" r="14" fill={S.accent} opacity="0.22" />
        <circle cx="52" cy="47" r="5" fill={S.accent} opacity="0.55" />
        <path d="M42 62a10 10 0 0 1 20 0z" fill={S.accent} opacity="0.55" />
        <rect x="76" y="43" width="82" height="8" rx="4" fill={S.ink} opacity="0.36" />
        <rect x="76" y="56" width="56" height="7" rx="3.5" fill={S.accent} opacity="0.5" />

        {/* Round timeline — the connector is the subject here. */}
        <line
          x1="52"
          y1="74"
          x2="52"
          y2="134"
          stroke={S.line}
          strokeWidth="2"
        />
        <line
          x1="52"
          y1="74"
          x2="52"
          y2="104"
          stroke={S.accent}
          strokeWidth="2"
          opacity="0.6"
        />
        {rounds.map((r) => (
          <g key={r.y}>
            <circle
              cx="52"
              cy={r.y}
              r="5.5"
              fill={r.done ? S.accent : S.panel}
              stroke={r.done ? S.accent : S.muted}
              strokeOpacity={r.done ? 1 : 0.45}
              strokeWidth="2"
            />
            <rect
              x="70"
              y={r.y - 4}
              width={r.w}
              height="8"
              rx="4"
              fill={r.done ? S.ink : S.muted}
              opacity={r.done ? 0.32 : 0.2}
            />
          </g>
        ))}
      </g>

      {/* Offer badge, bleeding past the right edge. */}
      <g className="art-fg">
        <rect
          x="214"
          y="92"
          width="96"
          height="30"
          rx="10"
          fill={S.bg}
          stroke={S.line}
          strokeWidth="1"
        />
        <circle cx="232" cy="107" r="8" fill={S.accent} opacity="0.2" />
        <path
          d="M228.5 107l2.5 2.5 4.5-5"
          stroke={S.accent}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <rect x="246" y="103" width="48" height="8" rx="4" fill={S.ink} opacity="0.32" />
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
