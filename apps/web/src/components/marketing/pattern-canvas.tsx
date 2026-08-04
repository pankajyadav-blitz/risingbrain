"use client";

/**
 * Hero pattern demo — a small animated <canvas> that visualises the currently
 * selected DSA pattern (sliding window, monotonic stack, binary search, Kadane,
 * prefix sum, two-pointer). Reuses the shared canvas host + primitives from
 * `feature-banners.tsx`; the draw switches when the active pattern changes.
 */
import { AnimatedCanvas, withAlpha, rr, clamp01, type Draw, type Colors } from "./feature-banners";

export type PatternKey =
  | "sliding-window"
  | "monotonic-stack"
  | "binary-search"
  | "kadane"
  | "prefix-sum"
  | "two-pointer";

/** A row of `n` array cells centred in the canvas. */
function row(w: number, n: number) {
  const areaX = w * 0.07;
  const areaW = w * 0.86;
  const gap = areaW / n;
  const cw = gap * 0.78;
  return { areaX, areaW, gap, cw, cellX: (k: number) => areaX + gap * k + (gap - cw) / 2 };
}

function valueTick(ctx: CanvasRenderingContext2D, x: number, cw: number, y: number, color: string, a: number) {
  ctx.fillStyle = withAlpha(color, a);
  rr(ctx, x + cw * 0.28, y - 3.5, cw * 0.44, 7, 2);
  ctx.fill();
}

/* -------------------------------- Sliding window -------------------------- */
function slidingWindow(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = 8;
  const k = 3;
  const { areaX, gap, cw, cellX } = row(w, n);
  const cy = h * 0.5;
  const chh = h * 0.5;
  const positions = n - k;
  const CYCLE = 3.4;
  const winLeft = (1 - Math.abs(((t / CYCLE) % 1) * 2 - 1)) * positions;
  const startInt = Math.round(winLeft);
  for (let i = 0; i < n; i++) {
    const inWin = i >= startInt && i < startInt + k;
    rr(ctx, cellX(i), cy - chh / 2, cw, chh, 5);
    ctx.fillStyle = inWin ? withAlpha(c.accent, 0.18) : c.surface2;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = withAlpha(c.ink, 0.2);
    ctx.stroke();
    valueTick(ctx, cellX(i), cw, cy, inWin ? c.accent : c.ink, inWin ? 0.6 : 0.3);
  }
  const wx0 = areaX + gap * winLeft + (gap - cw) / 2 - 4;
  const wx1 = areaX + gap * (winLeft + k - 1) + (gap - cw) / 2 + cw + 4;
  rr(ctx, wx0, cy - chh / 2 - 5, wx1 - wx0, chh + 10, 8);
  ctx.strokeStyle = withAlpha(c.accent, 0.9);
  ctx.lineWidth = 2;
  ctx.stroke();
}

/* -------------------------------- Two-pointer ----------------------------- */
function twoPointer(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = 8;
  const { cw, cellX } = row(w, n);
  const cy = h * 0.56;
  const chh = h * 0.42;
  const CYCLE = 3.6;
  const steps = Math.floor(n / 2);
  const s = Math.min(steps - 1, Math.floor(((t % CYCLE) / CYCLE) * steps));
  const lo = s;
  const hi = n - 1 - s;
  for (let i = 0; i < n; i++) {
    const on = i === lo || i === hi;
    rr(ctx, cellX(i), cy - chh / 2, cw, chh, 5);
    ctx.fillStyle = on ? withAlpha(c.accent, 0.2) : c.surface2;
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = on ? withAlpha(c.accent, 0.8) : withAlpha(c.ink, 0.2);
    ctx.stroke();
    valueTick(ctx, cellX(i), cw, cy, on ? c.accent : c.ink, on ? 0.6 : 0.3);
  }
  const lx = cellX(lo) + cw / 2;
  const hx = cellX(hi) + cw / 2;
  const ay = cy - chh / 2 - 6;
  ctx.strokeStyle = withAlpha(c.accent, 0.5);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(lx, ay);
  ctx.quadraticCurveTo((lx + hx) / 2, ay - h * 0.22, hx, ay);
  ctx.stroke();
  const py = cy + chh / 2 + 8;
  arrow(ctx, lx, py, 1, c.accent);
  arrow(ctx, hx, py, -1, c.accent);
}

function arrow(ctx: CanvasRenderingContext2D, x: number, y: number, dir: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + dir * 5, y);
  ctx.lineTo(x - dir * 3, y - 4);
  ctx.lineTo(x - dir * 3, y + 4);
  ctx.closePath();
  ctx.fill();
}

/* -------------------------------- Binary search --------------------------- */
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
const P_BS = bsSteps(9, 6);

function binarySearch(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = 9;
  const { cw, cellX } = row(w, n);
  const cy = h * 0.5;
  const chh = h * 0.44;
  const CYCLE = 3.4;
  const hold = 0.7;
  const steps = P_BS.length;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const idx = Math.min(steps - 1, Math.floor(prog * steps));
  const [lo, hi, mid] = P_BS[idx]!;
  const found = idx === steps - 1;
  for (let k = 0; k < n; k++) {
    const inR = k >= lo && k <= hi;
    const isMid = k === mid;
    rr(ctx, cellX(k), cy - chh / 2, cw, chh, 5);
    ctx.fillStyle = isMid
      ? withAlpha(c.accent, found ? 0.9 : 0.7)
      : inR
        ? c.surface2
        : withAlpha(c.ink, 0.05);
    ctx.fill();
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = isMid
      ? withAlpha(c.accent, 0.9)
      : inR
        ? withAlpha(c.ink, 0.22)
        : withAlpha(c.ink, 0.1);
    ctx.stroke();
    valueTick(ctx, cellX(k), cw, cy, isMid ? c.brand : c.ink, isMid ? 0.85 : inR ? 0.35 : 0.14);
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
  const my = cy - chh / 2 - 6;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.moveTo(mx, my + 5);
  ctx.lineTo(mx - 4, my - 2);
  ctx.lineTo(mx + 4, my - 2);
  ctx.closePath();
  ctx.fill();
}

/* -------------------------------- Monotonic stack ------------------------- */
const MS_VALS = [3, 6, 2, 5, 4, 7, 1, 8];
const MS_STATES: number[][] = (() => {
  const st: number[] = [];
  const out: number[][] = [];
  for (let i = 0; i < MS_VALS.length; i++) {
    while (st.length && MS_VALS[st[st.length - 1]!]! < MS_VALS[i]!) st.pop();
    st.push(i);
    out.push([...st]);
  }
  return out;
})();
const MS_MAX = Math.max(...MS_VALS);

function monotonicStack(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = MS_VALS.length;
  const { cw, cellX } = row(w, n);
  const baseY = h * 0.82;
  const maxH = h * 0.6;
  const CYCLE = 3.8;
  const hold = 0.5;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const si = Math.min(n - 1, Math.floor(prog * n));
  const inStack = new Set(MS_STATES[si]!);
  for (let i = 0; i < n; i++) {
    const hgt = (MS_VALS[i]! / MS_MAX) * maxH;
    const isTop = i === si;
    const onStack = inStack.has(i);
    const scanned = i <= si;
    ctx.fillStyle = isTop
      ? withAlpha(c.accent, 0.85)
      : onStack
        ? withAlpha(c.accent, 0.32)
        : withAlpha(c.ink, scanned ? 0.14 : 0.24);
    rr(ctx, cellX(i), baseY - hgt, cw, hgt, 3);
    ctx.fill();
    if (onStack && !isTop) {
      ctx.strokeStyle = withAlpha(c.accent, 0.65);
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }
  }
  const sx = cellX(si) + cw / 2;
  ctx.strokeStyle = withAlpha(c.accent, 0.4);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(sx, h * 0.12);
  ctx.lineTo(sx, baseY);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* -------------------------------- Kadane ---------------------------------- */
const KD_VALS = [2, -3, 4, -1, 2, 1, -5, 4];
const KD_STATES: { cs: number; ce: number; bs: number; be: number }[] = (() => {
  let cur = 0;
  let cs = 0;
  let best = -Infinity;
  let bs = 0;
  let be = 0;
  const out: { cs: number; ce: number; bs: number; be: number }[] = [];
  for (let i = 0; i < KD_VALS.length; i++) {
    if (cur <= 0) {
      cur = KD_VALS[i]!;
      cs = i;
    } else {
      cur += KD_VALS[i]!;
    }
    if (cur > best) {
      best = cur;
      bs = cs;
      be = i;
    }
    out.push({ cs, ce: i, bs, be });
  }
  return out;
})();
const KD_MAXABS = Math.max(...KD_VALS.map((v) => Math.abs(v)));

function kadane(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = KD_VALS.length;
  const { cw, cellX } = row(w, n);
  const mid = h * 0.5;
  const barMax = h * 0.32;
  const CYCLE = 4.0;
  const hold = 0.6;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const si = Math.min(n - 1, Math.floor(prog * n));
  const st = KD_STATES[si]!;

  ctx.strokeStyle = withAlpha(c.ink, 0.12);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cellX(0), mid);
  ctx.lineTo(cellX(n - 1) + cw, mid);
  ctx.stroke();

  for (let i = 0; i < n; i++) {
    const v = KD_VALS[i]!;
    const hgt = (Math.abs(v) / KD_MAXABS) * barMax;
    const inBest = i >= st.bs && i <= st.be;
    const inCur = i >= st.cs && i <= st.ce;
    const scanned = i <= si;
    const y = v >= 0 ? mid - hgt : mid;
    ctx.fillStyle = inBest
      ? withAlpha(c.accent, 0.8)
      : inCur && scanned
        ? withAlpha(c.accent, 0.32)
        : withAlpha(c.ink, scanned ? 0.24 : 0.13);
    rr(ctx, cellX(i), y, cw, Math.max(2, hgt), 2);
    ctx.fill();
  }
  const bx0 = cellX(st.bs);
  const bx1 = cellX(st.be) + cw;
  ctx.strokeStyle = withAlpha(c.accent, 0.7);
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(bx0, h * 0.9);
  ctx.lineTo(bx1, h * 0.9);
  ctx.stroke();
}

/* -------------------------------- Prefix sum ------------------------------ */
const PS_VALS = [2, 1, 3, 1, 2, 4, 1, 3];
const PS_TOTAL = PS_VALS.reduce((a, b) => a + b, 0);

function prefixSum(ctx: CanvasRenderingContext2D, t: number, w: number, h: number, c: Colors) {
  const n = PS_VALS.length;
  const { cw, cellX } = row(w, n);
  const topY = h * 0.14;
  const topH = h * 0.24;
  const botBase = h * 0.88;
  const botMax = h * 0.46;
  const CYCLE = 4.0;
  const hold = 0.6;
  const prog = clamp01((t % CYCLE) / CYCLE / ((CYCLE - hold) / CYCLE));
  const sf = prog * n;
  const si = Math.floor(sf);

  let run = 0;
  for (let i = 0; i < n; i++) {
    run += PS_VALS[i]!;
    // Value cell.
    rr(ctx, cellX(i), topY, cw, topH, 4);
    ctx.fillStyle = c.surface2;
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = withAlpha(c.ink, 0.2);
    ctx.stroke();
    valueTick(ctx, cellX(i), cw, topY + topH / 2, c.ink, 0.4);

    // Prefix bar (cumulative), revealed left→right.
    const fullH = (run / PS_TOTAL) * botMax;
    ctx.strokeStyle = withAlpha(c.ink, 0.12);
    ctx.lineWidth = 1;
    rr(ctx, cellX(i), botBase - fullH, cw, fullH, 3);
    ctx.stroke();
    const frac = i < si ? 1 : i === si ? clamp01(sf - si) : 0;
    if (frac > 0) {
      ctx.fillStyle = withAlpha(c.accent, 0.6);
      rr(ctx, cellX(i), botBase - fullH * frac, cw, fullH * frac, 3);
      ctx.fill();
    }
  }
  const sx = cellX(Math.min(n - 1, si)) + cw / 2;
  ctx.strokeStyle = withAlpha(c.accent, 0.35);
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(sx, topY);
  ctx.lineTo(sx, botBase);
  ctx.stroke();
  ctx.setLineDash([]);
}

/* -------------------------------------------------------------------------- */
const DRAWS: Record<PatternKey, Draw> = {
  "sliding-window": slidingWindow,
  "monotonic-stack": monotonicStack,
  "binary-search": binarySearch,
  kadane,
  "prefix-sum": prefixSum,
  "two-pointer": twoPointer,
};

export function PatternCanvas({ pattern, className }: { pattern: PatternKey; className?: string }) {
  return <AnimatedCanvas draw={DRAWS[pattern]} className={className} />;
}
