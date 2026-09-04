"use client";

/**
 * Feature-card banners — one animated <canvas> per track, replacing the earlier
 * static SVG replicas. Each canvas is a self-contained island:
 *   · theme-aware   — colors are read from the app's CSS variables via a probe
 *                     span (so they resolve to rgb() and re-read on theme change)
 *   · crisp         — sized to its box × devicePixelRatio (capped at 2)
 *   · cheap         — the rAF loop pauses when the card scrolls out of view
 *                     (IntersectionObserver) or the tab is hidden
 *   · accessible    — `prefers-reduced-motion` renders a single still frame
 *
 * Motion per track:
 *   sheets    → a graph being traversed (BFS front lighting nodes/edges)
 *   domain    → packets traveling a small router mesh
 *   screening → a pen filling MCQ bubbles on ruled paper
 *   puzzles   → a jigsaw piece dropping into the gap it completes
 *   interview → a video-call tile with a breathing avatar + audio waveform
 */
import { useEffect, useRef } from "react";
import { cn } from "@risingbrain/ui/cn";

type Colors = Record<"accent" | "ink" | "muted" | "line" | "surface" | "surface2" | "bg" | "brand", string>;
type Draw = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) => void;

const VARS: Record<keyof Colors, string> = {
  accent: "--accent",
  ink: "--foreground",
  muted: "--muted",
  line: "--border",
  surface: "--surface",
  surface2: "--surface-2",
  bg: "--background",
  brand: "--brand",
};

/** Convert an `rgb()/rgba()` string (what the probe returns) to rgba with alpha. */
function withAlpha(rgb: string, a: number): string {
  const m = rgb.match(/rgba?\(([^)]+)\)/);
  if (!m) return rgb;
  const [r, g, b] = m[1]!.split(",").map((s) => parseFloat(s));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Rounded-rect path via arcTo (portable — no ctx.roundRect dependency). */
function rr(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rad = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rad, y);
  ctx.arcTo(x + w, y, x + w, y + h, rad);
  ctx.arcTo(x + w, y + h, x, y + h, rad);
  ctx.arcTo(x, y + h, x, y, rad);
  ctx.arcTo(x, y, x + w, y, rad);
  ctx.closePath();
}

/** Shared canvas host: sizing, color reading, rAF loop, visibility pausing. */
function AnimatedCanvas({ draw, className }: { draw: Draw; className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const probe = probeRef.current;
    if (!canvas || !probe) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let colors: Colors = {} as Colors;
    const readColors = () => {
      const next = {} as Colors;
      for (const key of Object.keys(VARS) as (keyof Colors)[]) {
        probe.style.color = `var(${VARS[key]})`;
        next[key] = getComputedStyle(probe).color || "rgb(136,136,136)";
      }
      colors = next;
    };

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    readColors();
    resize();

    const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    let raf = 0;
    let startTs = 0;
    let visible = true;

    const renderStill = () => {
      ctx.clearRect(0, 0, w, h);
      draw(ctx, 1.6, w, h, colors);
    };

    const frame = (ts: number) => {
      if (!startTs) startTs = ts;
      const t = (ts - startTs) / 1000;
      ctx.clearRect(0, 0, w, h);
      draw(ctx, t, w, h, colors);
      raf = requestAnimationFrame(frame);
    };

    const start = () => {
      if (reduce) return renderStill();
      if (raf || !visible || document.hidden) return;
      startTs = 0;
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    start();

    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) renderStill();
    });
    ro.observe(canvas);

    const io = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
        if (visible) start();
        else stop();
      },
      { threshold: 0.05 },
    );
    io.observe(canvas);

    const onVis = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVis);

    const mo = new MutationObserver(() => {
      readColors();
      if (reduce) renderStill();
    });
    mo.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme", "style"],
    });

    return () => {
      stop();
      ro.disconnect();
      io.disconnect();
      mo.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [draw]);

  return (
    <div className={cn("absolute inset-0", className)}>
      <span ref={probeRef} aria-hidden className="pointer-events-none absolute h-0 w-0 opacity-0" />
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Shared backdrop — the faint edge-faded dot grid, the one substrate.     */
/* ---------------------------------------------------------------------- */
function backdrop(ctx: CanvasRenderingContext2D, w: number, h: number, c: Colors) {
  const gap = 18;
  for (let y = gap / 2; y < h; y += gap) {
    for (let x = gap / 2; x < w; x += gap) {
      const dx = (x - w / 2) / (w / 2);
      const dy = (y - h / 2) / (h / 2);
      const a = 0.07 * (1 - Math.min(1, Math.hypot(dx, dy)));
      if (a <= 0.006) continue;
      ctx.fillStyle = withAlpha(c.ink, a);
      ctx.beginPath();
      ctx.arc(x, y, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function glowDot(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.5);
  g.addColorStop(0, withAlpha(color, 0.5));
  g.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r * 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------------------------------------------------------------- */
/* DSA Sheets — a rotating showcase of core patterns: graph traversal,        */
/* sorting, binary search and the sliding window, crossfading between each.    */
/* ---------------------------------------------------------------------- */
const G_NODES: [number, number][] = [
  [0.12, 0.5], [0.34, 0.26], [0.34, 0.74], [0.56, 0.16],
  [0.56, 0.5], [0.56, 0.84], [0.8, 0.33], [0.8, 0.67],
];
const G_PARENT = [-1, 0, 0, 1, 1, 2, 4, 5];

function drawSheets(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  backdrop(ctx, w, h, c);
  const scenes: [Scene, string][] = [
    [graphScene, "Graph"],
    [sortScene, "Sort"],
    [searchScene, "Search"],
    [windowScene, "Window"],
  ];
  const phase = 3.6;
  const trans = 0.75;
  const tt = t % (scenes.length * phase);
  const i = Math.floor(tt / phase);
  const local = tt - i * phase;
  const p = local > phase - trans ? (local - (phase - trans)) / trans : 0;
  paintScene(ctx, scenes[i]!, 1 - p, t, w, h, c);
  if (p > 0) paintScene(ctx, scenes[(i + 1) % scenes.length]!, p, t, w, h, c);
}

/* Graph — a BFS front lighting nodes and edges, with a traveling token. */
function graphScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const px = w * 0.09;
  const py = h * 0.1;
  const vspan = h * 0.66;
  const pos = G_NODES.map(([nx, ny]) => [px + nx * (w - 2 * px), py + ny * vspan] as const);
  const N = G_NODES.length;
  const r = Math.max(5, h * 0.046);
  const CYCLE = 3.0;
  const step = CYCLE / (N + 1.2);
  const f = (t % CYCLE) / step;
  const activeIdx = Math.floor(f);

  ctx.lineCap = "round";
  for (let i = 1; i < N; i++) {
    const a = pos[G_PARENT[i]!]!;
    const b = pos[i]!;
    ctx.strokeStyle = withAlpha(c.ink, 0.14);
    ctx.lineWidth = Math.max(1.5, h * 0.014);
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.stroke();
    if (i <= activeIdx) {
      ctx.strokeStyle = withAlpha(c.accent, 0.55);
      ctx.beginPath();
      ctx.moveTo(a[0], a[1]);
      ctx.lineTo(b[0], b[1]);
      ctx.stroke();
    }
  }
  if (activeIdx >= 1 && activeIdx < N) {
    const a = pos[G_PARENT[activeIdx]!]!;
    const b = pos[activeIdx]!;
    const l = easeInOut(clamp01(f - activeIdx));
    glowDot(ctx, lerp(a[0], b[0], l), lerp(a[1], b[1], l), Math.max(2.5, h * 0.02), c.accent);
  }
  for (let i = 0; i < N; i++) {
    const [x, y] = pos[i]!;
    const visited = i <= activeIdx;
    const active = i === activeIdx;
    if (active) {
      const pulse = 1 + 0.5 * (1 - clamp01(f - activeIdx));
      ctx.strokeStyle = withAlpha(c.accent, 0.4);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r * pulse * 1.5, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = visited ? withAlpha(c.accent, active ? 0.95 : 0.5) : c.surface2;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = visited ? withAlpha(c.accent, 0.9) : withAlpha(c.ink, 0.25);
    ctx.stroke();
  }
}

/* Sort — bars bubble-sorting: the compared pair lights up and swaps. */
const SORT_VALUES = [5, 8, 3, 7, 2, 9, 4, 6];
function bubbleSteps(vals: number[]): [number, number, boolean][] {
  const a = [...vals];
  const steps: [number, number, boolean][] = [];
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < a.length - 1 - i; j++) {
      const swap = a[j]! > a[j + 1]!;
      steps.push([j, j + 1, swap]);
      if (swap) {
        const tmp = a[j]!;
        a[j] = a[j + 1]!;
        a[j + 1] = tmp;
      }
    }
  }
  return steps;
}
const SORT_STEPS = bubbleSteps(SORT_VALUES);
const SORT_MAX = Math.max(...SORT_VALUES);

function sortScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = SORT_VALUES.length;
  const areaX = w * 0.14;
  const areaW = w * 0.72;
  const baseY = h * 0.72;
  const maxH = h * 0.48;
  const slot = areaW / n;
  const bw = slot * 0.6;
  const CYCLE = 3.2;
  const hold = 0.5;
  const steps = SORT_STEPS.length;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const done = prog >= 1;
  const fstep = prog * steps;
  const stepIndex = Math.min(steps - 1, Math.floor(fstep));
  const localSwap = clamp01(fstep - stepIndex);
  const heights = [...SORT_VALUES];
  for (let s = 0; s < stepIndex; s++) {
    const st = SORT_STEPS[s]!;
    if (st[2]) {
      const tmp = heights[st[0]]!;
      heights[st[0]] = heights[st[1]]!;
      heights[st[1]] = tmp;
    }
  }
  if (done) heights.sort((a, b) => a - b);
  const [ja, jb, sw] = SORT_STEPS[stepIndex]!;
  const slotX = (k: number) => areaX + slot * k + (slot - bw) / 2;
  for (let k = 0; k < n; k++) {
    let x = slotX(k);
    if (!done && sw) {
      if (k === ja) x = lerp(slotX(ja), slotX(jb), easeInOut(localSwap));
      else if (k === jb) x = lerp(slotX(jb), slotX(ja), easeInOut(localSwap));
    }
    const hgt = (heights[k]! / SORT_MAX) * maxH;
    const active = !done && (k === ja || k === jb);
    ctx.fillStyle = done
      ? withAlpha(c.accent, 0.6)
      : active
        ? withAlpha(c.accent, 0.85)
        : withAlpha(c.ink, 0.28);
    rr(ctx, x, baseY - hgt, bw, hgt, 3);
    ctx.fill();
  }
  ctx.strokeStyle = withAlpha(c.ink, 0.14);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(areaX, baseY + 2);
  ctx.lineTo(areaX + areaW, baseY + 2);
  ctx.stroke();
}

/* Search — binary search over sorted cells: the window narrows, mid probes. */
const BS_N = 9;
const BS_TARGET = 6;
function bsSteps(n: number, target: number): [number, number, number][] {
  let lo = 0;
  let hi = n - 1;
  const steps: [number, number, number][] = [];
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    steps.push([lo, hi, mid]);
    if (mid === target) break;
    if (mid < target) lo = mid + 1;
    else hi = mid - 1;
  }
  return steps;
}
const BS_STEPS = bsSteps(BS_N, BS_TARGET);

function searchScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = BS_N;
  const areaX = w * 0.1;
  const areaW = w * 0.8;
  const gap = areaW / n;
  const cw = gap * 0.74;
  const cy = h * 0.42;
  const chh = h * 0.3;
  const CYCLE = 3.4;
  const hold = 0.7;
  const steps = BS_STEPS.length;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const idx = Math.min(steps - 1, Math.floor(prog * steps));
  const [lo, hi, mid] = BS_STEPS[idx]!;
  const found = idx === steps - 1 && mid === BS_TARGET;
  const cellX = (k: number) => areaX + gap * k + (gap - cw) / 2;
  for (let k = 0; k < n; k++) {
    const inRange = k >= lo && k <= hi;
    const isMid = k === mid;
    rr(ctx, cellX(k), cy - chh / 2, cw, chh, 4);
    ctx.fillStyle = isMid
      ? withAlpha(c.accent, found ? 0.9 : 0.7)
      : inRange
        ? c.surface2
        : withAlpha(c.ink, 0.04);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = isMid
      ? withAlpha(c.accent, 0.9)
      : inRange
        ? withAlpha(c.ink, 0.22)
        : withAlpha(c.ink, 0.1);
    ctx.stroke();
    ctx.fillStyle = withAlpha(isMid ? c.brand : c.ink, isMid ? 0.85 : inRange ? 0.35 : 0.14);
    rr(ctx, cellX(k) + cw * 0.3, cy - 3, cw * 0.4, 6, 2);
    ctx.fill();
  }
  const bx0 = cellX(lo);
  const bx1 = cellX(hi) + cw;
  const by = cy + chh / 2 + 8;
  ctx.strokeStyle = withAlpha(c.accent, 0.7);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx0, by);
  ctx.lineTo(bx1, by);
  ctx.moveTo(bx0, by - 3);
  ctx.lineTo(bx0, by + 3);
  ctx.moveTo(bx1, by - 3);
  ctx.lineTo(bx1, by + 3);
  ctx.stroke();
  const mx = cellX(mid) + cw / 2;
  const my = cy - chh / 2 - 5;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(mx, my + 5);
  ctx.lineTo(mx - 4, my - 2);
  ctx.lineTo(mx + 4, my - 2);
  ctx.closePath();
  ctx.fill();
}

/* Window — a fixed-width window sliding across the array (ping-pong). */
function windowScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = 8;
  const k = 3;
  const areaX = w * 0.1;
  const areaW = w * 0.8;
  const gap = areaW / n;
  const cw = gap * 0.74;
  const cy = h * 0.42;
  const chh = h * 0.3;
  const positions = n - k;
  const CYCLE = 4.0;
  const winLeft = (1 - Math.abs(((t / CYCLE) % 1) * 2 - 1)) * positions;
  const startInt = Math.round(winLeft);
  const cellX = (idx: number) => areaX + gap * idx + (gap - cw) / 2;
  for (let i = 0; i < n; i++) {
    const inWin = i >= startInt && i < startInt + k;
    rr(ctx, cellX(i), cy - chh / 2, cw, chh, 4);
    ctx.fillStyle = inWin ? withAlpha(c.accent, 0.16) : c.surface2;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = withAlpha(c.ink, 0.2);
    ctx.stroke();
    ctx.fillStyle = withAlpha(inWin ? c.accent : c.ink, inWin ? 0.55 : 0.28);
    rr(ctx, cellX(i) + cw * 0.3, cy - 3, cw * 0.4, 6, 2);
    ctx.fill();
  }
  const wx0 = areaX + gap * winLeft + (gap - cw) / 2 - 4;
  const wx1 = areaX + gap * (winLeft + k - 1) + (gap - cw) / 2 + cw + 4;
  rr(ctx, wx0, cy - chh / 2 - 5, wx1 - wx0, chh + 10, 7);
  ctx.strokeStyle = withAlpha(c.accent, 0.9);
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* ---------------------------------------------------------------------- */
/* Domain — a rotating showcase of the core-CS tracks (SQL · DBMS · OS · CN),  */
/* each with its own signature micro-animation, crossfading one to the next.   */
/* ---------------------------------------------------------------------- */
type Scene = (ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) => void;

function drawDomain(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  backdrop(ctx, w, h, c);
  const scenes: [Scene, string][] = [
    [sqlScene, "SQL"],
    [dbmsScene, "DBMS"],
    [osScene, "OS"],
    [cnScene, "CN"],
  ];
  const phase = 3.4;
  const trans = 0.75;
  const tt = t % (scenes.length * phase);
  const i = Math.floor(tt / phase);
  const local = tt - i * phase;
  const p = local > phase - trans ? (local - (phase - trans)) / trans : 0;
  paintScene(ctx, scenes[i]!, 1 - p, t, w, h, c);
  if (p > 0) paintScene(ctx, scenes[(i + 1) % scenes.length]!, p, t, w, h, c);
}

function paintScene(
  ctx: CanvasRenderingContext2D,
  [fn, label]: [Scene, string],
  alpha: number,
  t: number,
  w: number,
  h: number,
  c: Colors,
) {
  ctx.save();
  ctx.globalAlpha = alpha;
  fn(ctx, t, w, h, c);
  ctx.font = `700 ${Math.round(h * 0.1)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = withAlpha(c.muted, 0.85);
  ctx.fillText(label, w / 2, h * 0.9);
  ctx.restore();
}

/* SQL — a SELECT scan sweeping a table; matching rows light up. */
function sqlScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const tw = w * 0.62;
  const th = h * 0.5;
  const tx = (w - tw) / 2;
  const ty = h * 0.12;
  rr(ctx, tx, ty, tw, th, 8);
  ctx.fillStyle = c.surface2;
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.ink, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();

  const headerH = th * 0.24;
  rr(ctx, tx, ty, tw, headerH, 8);
  ctx.fillStyle = withAlpha(c.accent, 0.13);
  ctx.fill();
  const colX = (k: number) => tx + tw * (0.09 + k * 0.31);
  for (let k = 0; k < 3; k++) {
    ctx.fillStyle = withAlpha(c.accent, 0.55);
    rr(ctx, colX(k), ty + headerH * 0.34, tw * 0.16, headerH * 0.32, 2);
    ctx.fill();
  }

  const rows = 4;
  const rowsH = th - headerH;
  const rowH = rowsH / rows;
  const scanY = ty + headerH + ((t % 2.8) / 2.8) * rowsH;
  const match = [false, true, false, true];
  for (let r = 0; r < rows; r++) {
    const ry = ty + headerH + r * rowH;
    const hot = match[r] && scanY >= ry + rowH * 0.6;
    if (hot) {
      ctx.fillStyle = withAlpha(c.accent, 0.16);
      rr(ctx, tx + 2, ry, tw - 4, rowH, 3);
      ctx.fill();
    }
    for (let k = 0; k < 3; k++) {
      ctx.fillStyle = withAlpha(hot ? c.accent : c.ink, hot ? 0.6 : 0.22);
      rr(ctx, colX(k), ry + rowH * 0.36, tw * (k === 1 ? 0.2 : 0.13), rowH * 0.26, 2);
      ctx.fill();
    }
  }
  ctx.strokeStyle = withAlpha(c.accent, 0.85);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(tx, scanY);
  ctx.lineTo(tx + tw, scanY);
  ctx.stroke();
  glowDot(ctx, tx + tw, scanY, Math.max(2, h * 0.016), c.accent);
}

/* DBMS — a database cylinder taking writes, beside a highlighted index tree. */
function dbmsScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const cx = w * 0.33;
  const cy = h * 0.42;
  const dp = (t % 1.7) / 1.7;
  if (dp < 0.55) {
    glowDot(ctx, cx, lerp(cy - h * 0.36, cy - h * 0.16, dp / 0.55), Math.max(2, h * 0.016), c.accent);
  }
  drawCylinder(ctx, cx, cy, w * 0.2, h * 0.4, c, dp < 0.6 ? 1 - dp / 0.6 : 0);

  const rx = w * 0.68;
  const ry = h * 0.22;
  const nodes: [number, number][] = [
    [rx, ry],
    [rx - w * 0.1, ry + h * 0.32],
    [rx + w * 0.1, ry + h * 0.32],
  ];
  const sel = Math.floor(t / 1.3) % 2 === 0 ? 1 : 2;
  ctx.lineCap = "round";
  ctx.lineWidth = 1.6;
  for (const ci of [1, 2]) {
    ctx.strokeStyle = ci === sel ? withAlpha(c.accent, 0.75) : withAlpha(c.ink, 0.2);
    ctx.beginPath();
    ctx.moveTo(nodes[0]![0], nodes[0]![1]);
    ctx.lineTo(nodes[ci]![0], nodes[ci]![1]);
    ctx.stroke();
  }
  nodes.forEach((n, idx) => {
    const on = idx === 0 || idx === sel;
    ctx.beginPath();
    ctx.arc(n[0], n[1], Math.max(5, h * 0.045), 0, Math.PI * 2);
    ctx.fillStyle = on ? withAlpha(c.accent, 0.45) : c.surface2;
    ctx.fill();
    ctx.strokeStyle = on ? withAlpha(c.accent, 0.9) : withAlpha(c.ink, 0.25);
    ctx.lineWidth = 1.5;
    ctx.stroke();
  });
}

function drawCylinder(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  cw: number,
  ch: number,
  c: Colors,
  glow: number,
) {
  const rx = cw / 2;
  const ry = cw * 0.18;
  const top = cy - ch / 2;
  const bot = cy + ch / 2;
  ctx.fillStyle = withAlpha(c.accent, 0.13 + 0.12 * glow);
  ctx.beginPath();
  ctx.moveTo(cx - rx, top);
  ctx.lineTo(cx - rx, bot);
  ctx.ellipse(cx, bot, rx, ry, 0, Math.PI, 0, true);
  ctx.lineTo(cx + rx, top);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.accent, 0.28);
  ctx.lineWidth = 1;
  for (let i = 1; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(cx, top + ch * (i / 3), rx, ry, 0, 0, Math.PI);
    ctx.stroke();
  }
  ctx.strokeStyle = withAlpha(c.accent, 0.55);
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(cx - rx, top);
  ctx.lineTo(cx - rx, bot);
  ctx.moveTo(cx + rx, top);
  ctx.lineTo(cx + rx, bot);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(cx, top, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(c.accent, 0.28 + 0.25 * glow);
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.accent, 0.65);
  ctx.lineWidth = 1.4;
  ctx.stroke();
}

/* OS — a CPU scheduling processes: a spinning core, tasks in then done out. */
function osScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const cx = w * 0.5;
  const cy = h * 0.4;
  const s = h * 0.3;
  ctx.strokeStyle = withAlpha(c.ink, 0.3);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  for (let i = 0; i < 4; i++) {
    const off = -s / 2 + (s * (i + 0.5)) / 4;
    ctx.beginPath();
    ctx.moveTo(cx + off, cy - s / 2);
    ctx.lineTo(cx + off, cy - s / 2 - 5);
    ctx.moveTo(cx + off, cy + s / 2);
    ctx.lineTo(cx + off, cy + s / 2 + 5);
    ctx.moveTo(cx - s / 2, cy + off);
    ctx.lineTo(cx - s / 2 - 5, cy + off);
    ctx.moveTo(cx + s / 2, cy + off);
    ctx.lineTo(cx + s / 2 + 5, cy + off);
    ctx.stroke();
  }
  rr(ctx, cx - s / 2, cy - s / 2, s, s, 6);
  ctx.fillStyle = c.surface2;
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.accent, 0.5);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(t * 1.4);
  ctx.strokeStyle = withAlpha(c.accent, 0.85);
  ctx.lineWidth = 2.2;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * s * 0.15, Math.sin(a) * s * 0.15);
    ctx.lineTo(Math.cos(a) * s * 0.3, Math.sin(a) * s * 0.3);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const blocks = 5;
  for (let i = 0; i < blocks; i++) {
    const ph = (t / 1.6 + i / blocks) % 1;
    const bx = lerp(w * 0.06, w * 0.94, ph);
    if (Math.abs(bx - cx) < s * 0.62) continue;
    const done = ph > 0.5;
    ctx.fillStyle = withAlpha(done ? c.accent : c.muted, done ? 0.72 : 0.32);
    rr(ctx, bx - 6, cy - 5, 12, 10, 2);
    ctx.fill();
  }
}

/* CN — packets traveling a small router mesh. */
const CN_NODES: [number, number][] = [
  [0.18, 0.28], [0.18, 0.66], [0.5, 0.46], [0.82, 0.28], [0.82, 0.66],
];
const CN_EDGES: [number, number][] = [[0, 2], [1, 2], [2, 3], [2, 4], [3, 4]];
const CN_ROUTES: number[][] = [[0, 2, 3, 4, 2], [1, 2, 4, 3, 2]];
const CN_SPEED = [42, 34];
const CN_OFFSET = [0, 26];

function cnScene(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const px = w * 0.09;
  const py = h * 0.12;
  const ph = h * 0.6;
  const pos = CN_NODES.map(([nx, ny]) => [px + nx * (w - 2 * px), py + ny * ph] as const);
  ctx.lineCap = "round";
  ctx.lineWidth = Math.max(1.2, h * 0.011);
  ctx.strokeStyle = withAlpha(c.ink, 0.16);
  for (const [a, b] of CN_EDGES) {
    ctx.beginPath();
    ctx.moveTo(pos[a]![0], pos[a]![1]);
    ctx.lineTo(pos[b]![0], pos[b]![1]);
    ctx.stroke();
  }
  const arrivals: number[] = new Array(pos.length).fill(0);
  CN_ROUTES.forEach((route, ri) => {
    const pts = route.map((n) => pos[n]!);
    const segs: number[] = [];
    let total = 0;
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i]!;
      const b = pts[(i + 1) % pts.length]!;
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      segs.push(len);
      total += len;
    }
    let d = (t * CN_SPEED[ri]! + CN_OFFSET[ri]!) % total;
    let si = 0;
    while (d > segs[si]!) {
      d -= segs[si]!;
      si++;
    }
    const a = pts[si]!;
    const b = pts[(si + 1) % pts.length]!;
    const lt = d / segs[si]!;
    for (let k = 1; k <= 4; k++) {
      const tl = Math.max(0, d - k * 6) / segs[si]!;
      ctx.fillStyle = withAlpha(c.accent, 0.14 - k * 0.03);
      ctx.beginPath();
      ctx.arc(lerp(a[0], b[0], tl), lerp(a[1], b[1], tl), Math.max(1.5, h * 0.012), 0, Math.PI * 2);
      ctx.fill();
    }
    glowDot(ctx, lerp(a[0], b[0], lt), lerp(a[1], b[1], lt), Math.max(2, h * 0.016), c.accent);
    const nn = route[(si + 1) % route.length]!;
    arrivals[nn] = Math.max(arrivals[nn]!, lt);
  });
  pos.forEach(([x, y], i) => {
    const pulse = arrivals[i]! > 0.82 ? (arrivals[i]! - 0.82) / 0.18 : 0;
    const r = Math.max(4, h * 0.03);
    if (pulse > 0) {
      ctx.strokeStyle = withAlpha(c.accent, 0.35 * pulse);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, r + 6 * pulse, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = c.surface2;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = withAlpha(c.ink, 0.3);
    ctx.stroke();
    ctx.fillStyle = withAlpha(c.accent, 0.6);
    ctx.beginPath();
    ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  });
}

/* ---------------------------------------------------------------------- */
/* Screening — a pen filling MCQ bubbles on ruled paper.                   */
/* ---------------------------------------------------------------------- */
function drawScreening(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  backdrop(ctx, w, h, c);
  const pw = w * 0.72;
  const ph = h * 0.78;
  const px = (w - pw) / 2;
  const py = h * 0.11;

  // Paper.
  rr(ctx, px, py, pw, ph, 10);
  ctx.fillStyle = c.surface2;
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.ink, 0.18);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Header line.
  ctx.fillStyle = withAlpha(c.ink, 0.3);
  rr(ctx, px + pw * 0.12, py + ph * 0.13, pw * 0.5, Math.max(5, h * 0.04), 3);
  ctx.fill();

  const rows = 3;
  const rowDur = 1.5;
  const CYCLE = rows * rowDur + 1.3;
  const phase = t % CYCLE;
  const idx = Math.floor(phase / rowDur);
  const local = clamp01(phase / rowDur - idx);

  const bx = px + pw * 0.16;
  const topY = py + ph * 0.34;
  const rowGap = ph * 0.2;
  const br = Math.max(5, h * 0.045);

  for (let i = 0; i < rows; i++) {
    const cy = topY + i * rowGap;
    const filled = i < idx ? 1 : i === idx ? local : 0;

    // Bubble.
    ctx.beginPath();
    ctx.arc(bx, cy, br, 0, Math.PI * 2);
    ctx.fillStyle = filled > 0 ? withAlpha(c.accent, 0.16 * Math.min(1, filled * 2)) : "transparent";
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = filled > 0 ? withAlpha(c.accent, 0.9) : withAlpha(c.ink, 0.35);
    ctx.stroke();

    // Check mark, drawn progressively.
    if (filled > 0) {
      const p = clamp01(filled);
      ctx.strokeStyle = c.accent;
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      const p1 = [bx - br * 0.45, cy + br * 0.05];
      const p2 = [bx - br * 0.1, cy + br * 0.4];
      const p3 = [bx + br * 0.5, cy - br * 0.45];
      ctx.beginPath();
      ctx.moveTo(p1[0]!, p1[1]!);
      if (p < 0.5) {
        const s = p / 0.5;
        ctx.lineTo(lerp(p1[0]!, p2[0]!, s), lerp(p1[1]!, p2[1]!, s));
      } else {
        ctx.lineTo(p2[0]!, p2[1]!);
        const s = (p - 0.5) / 0.5;
        ctx.lineTo(lerp(p2[0]!, p3[0]!, s), lerp(p2[1]!, p3[1]!, s));
      }
      ctx.stroke();
    }

    // Answer text line.
    ctx.fillStyle = withAlpha(c.ink, i <= idx ? 0.32 : 0.18);
    rr(ctx, bx + br + 10, cy - 4, pw * (i === 1 ? 0.42 : 0.3), Math.max(5, h * 0.038), 3);
    ctx.fill();
  }

  // Pen — moves to the active bubble and writes.
  const penVisible = idx < rows;
  if (penVisible) {
    const targetY = topY + idx * rowGap;
    const prevY = idx === 0 ? targetY - rowGap : topY + (idx - 1) * rowGap;
    const moving = local < 0.28;
    const py2 = moving ? lerp(prevY, targetY, easeInOut(local / 0.28)) : targetY;
    const wobble = moving ? 0 : Math.sin(t * 26) * 1.4;
    drawPen(ctx, bx + br * 0.55 + wobble, py2 + br * 0.55, h, c);
  }
}

function drawPen(ctx: CanvasRenderingContext2D, tipX: number, tipY: number, h: number, c: Colors) {
  const L = h * 0.36;
  ctx.save();
  ctx.translate(tipX, tipY);
  ctx.rotate(-Math.PI / 4);
  // Nib.
  ctx.fillStyle = c.ink;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-2.6, -7);
  ctx.lineTo(2.6, -7);
  ctx.closePath();
  ctx.fill();
  // Body.
  ctx.fillStyle = withAlpha(c.accent, 0.92);
  rr(ctx, -3, -7 - L, 6, L, 3);
  ctx.fill();
  // Cap.
  ctx.fillStyle = withAlpha(c.ink, 0.5);
  rr(ctx, -3, -7 - L, 6, L * 0.24, 3);
  ctx.fill();
  ctx.restore();
}

/* ---------------------------------------------------------------------- */
/* Interview Stories — a panel video call: four avatar tiles, the active     */
/* speaker highlighted with sound rings + a live waveform.                    */
/* ---------------------------------------------------------------------- */
function drawScreen(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  backdrop(ctx, w, h, c);
  const gx = w * 0.13;
  const gy = h * 0.12;
  const gw = w * 0.74;
  const gh = h * 0.74;
  const gap = w * 0.03;
  const tw = (gw - gap) / 2;
  const th = (gh - gap) / 2;
  const active = Math.floor(t / 2.0) % 4;

  for (let idx = 0; idx < 4; idx++) {
    const col = idx % 2;
    const row = Math.floor(idx / 2);
    const x = gx + col * (tw + gap);
    const y = gy + row * (th + gap);
    const isActive = idx === active;
    const cx = x + tw / 2;
    const cyA = y + th * 0.46;

    // Tile.
    rr(ctx, x, y, tw, th, 9);
    ctx.fillStyle = c.surface2;
    ctx.fill();
    ctx.lineWidth = isActive ? 2 : 1;
    ctx.strokeStyle = isActive ? withAlpha(c.accent, 0.85) : withAlpha(c.ink, 0.16);
    ctx.stroke();

    // Sound rings emanating from the active speaker.
    if (isActive) {
      const rp = (t % 1.4) / 1.4;
      for (let k = 0; k < 2; k++) {
        const rf = (rp + k * 0.5) % 1;
        ctx.strokeStyle = withAlpha(c.accent, 0.3 * (1 - rf));
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(cx, cyA, th * 0.2 + rf * th * 0.34, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Avatar — breathing head + shoulders, staggered blink.
    const breathe = 1 + 0.02 * Math.sin(t * 1.6 + idx);
    const hr = th * 0.2 * breathe;
    const hy = cyA - th * 0.02;
    ctx.fillStyle = withAlpha(c.accent, isActive ? 0.32 : 0.2);
    ctx.beginPath();
    ctx.arc(cx, cyA + th * 0.32, tw * 0.24, Math.PI, 0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, hy, hr, 0, Math.PI * 2);
    ctx.fillStyle = withAlpha(c.accent, isActive ? 0.4 : 0.26);
    ctx.fill();
    ctx.strokeStyle = withAlpha(c.accent, isActive ? 0.7 : 0.4);
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Eyes.
    const blink = (t + idx * 0.9) % 3.6 < 0.12;
    ctx.fillStyle = withAlpha(c.ink, 0.6);
    ctx.strokeStyle = withAlpha(c.ink, 0.6);
    ctx.lineWidth = 1.6;
    for (const sgn of [-1, 1]) {
      const ex = cx + sgn * hr * 0.36;
      const ey = hy - hr * 0.05;
      if (blink) {
        ctx.beginPath();
        ctx.moveTo(ex - 2, ey);
        ctx.lineTo(ex + 2, ey);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (isActive) {
      // Live waveform under the speaking avatar.
      const bars = 5;
      const bw = 2.5;
      const sp = (tw * 0.32) / bars;
      const sx = cx - (bars * sp) / 2 + sp / 2;
      const wy = y + th - th * 0.12;
      for (let i = 0; i < bars; i++) {
        const amp = Math.abs(Math.sin(t * 6 + i)) * th * 0.12 + th * 0.03;
        ctx.fillStyle = withAlpha(c.accent, 0.85);
        rr(ctx, sx + i * sp - bw / 2, wy - amp / 2, bw, amp, 1.5);
        ctx.fill();
      }
    } else {
      // Name bar for the muted tiles.
      ctx.fillStyle = withAlpha(c.ink, 0.24);
      rr(ctx, x + 8, y + th - 12, tw * 0.44, 5, 2.5);
      ctx.fill();
    }
  }

  // Live REC dot, top-left of the panel.
  const lp = 0.5 + 0.5 * Math.sin(t * 3.2);
  ctx.fillStyle = withAlpha(c.accent, 0.25 + 0.25 * lp);
  ctx.beginPath();
  ctx.arc(gx + 10, gy + 10, 5 + 2 * lp, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(gx + 10, gy + 10, 2.6, 0, Math.PI * 2);
  ctx.fill();
}

/* ---------------------------------------------------------------------- */

/* ---------------------------------------------------------------------- */
/* Puzzles — a jigsaw piece dropping into the gap it completes.            */
/* ---------------------------------------------------------------------- */
function drawPuzzles(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  backdrop(ctx, w, h, c);

  // 2x2 board, centred. Three tiles are already placed; the fourth flies in.
  const size = Math.min(w, h) * 0.5;
  const gap = size * 0.06;
  const tile = (size - gap) / 2;
  const ox = (w - size) / 2;
  const oy = (h - size) / 2;

  const CYCLE = 3.4;
  const phase = (t % CYCLE) / CYCLE;
  // Ease the piece in over the first 55%, then hold it seated.
  const p = phase < 0.55 ? clamp01(phase / 0.55) : 1;
  const ease = 1 - Math.pow(1 - p, 3);

  const seated: [number, number][] = [
    [ox, oy],
    [ox + tile + gap, oy],
    [ox, oy + tile + gap],
  ];
  for (const [x, y] of seated) {
    rr(ctx, x, y, tile, tile, tile * 0.22);
    ctx.fillStyle = withAlpha(c.ink, 0.1);
    ctx.fill();
    ctx.strokeStyle = withAlpha(c.ink, 0.22);
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // The empty slot, so the gap reads as a gap before the piece lands.
  const sx = ox + tile + gap;
  const sy = oy + tile + gap;
  rr(ctx, sx, sy, tile, tile, tile * 0.22);
  ctx.strokeStyle = withAlpha(c.ink, 0.18);
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.setLineDash([]);

  // The travelling piece: comes from lower-right, fades up as it seats.
  const fx = lerp(sx + tile * 0.9, sx, ease);
  const fy = lerp(sy + tile * 0.8, sy, ease);
  rr(ctx, fx, fy, tile, tile, tile * 0.22);
  ctx.fillStyle = withAlpha(c.accent, 0.18);
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.accent, 0.55 + 0.45 * ease);
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // Knob on the seated edge — the detail that makes it read as jigsaw.
  const kr = tile * 0.13;
  ctx.beginPath();
  ctx.arc(fx, fy + tile / 2, kr, 0, Math.PI * 2);
  ctx.fillStyle = withAlpha(c.accent, 0.18);
  ctx.fill();
  ctx.strokeStyle = withAlpha(c.accent, 0.55 + 0.45 * ease);
  ctx.stroke();
}

export type FeatureArtKey = "sheets" | "domain" | "screening" | "puzzles" | "interview";

const DRAWS: Record<FeatureArtKey, Draw> = {
  sheets: drawSheets,
  domain: drawDomain,
  screening: drawScreening,
  puzzles: drawPuzzles,
  interview: drawScreen,
};

/**
 * Single client component the server FeatureGrid renders directly as JSX. It
 * MUST be one exported component (not an object of components) — a server
 * component can render a client component reference but can't index an object of
 * them across the RSC boundary (that yields `undefined`). The per-track draw is
 * selected here, on the client.
 */
export function FeatureArt({ artKey, className }: { artKey: FeatureArtKey; className?: string }) {
  return <AnimatedCanvas draw={DRAWS[artKey]} className={className} />;
}

// Shared canvas host + primitives, reused by the hero's pattern demo.
export type { Colors, Draw };
export { AnimatedCanvas, withAlpha, rr, lerp, clamp01, easeInOut, glowDot };
