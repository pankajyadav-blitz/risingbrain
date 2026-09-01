"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { Trophy } from "lucide-react";

/**
 * Four escalating completion celebrations, all pure-CSS (no deps), rendered in a
 * single fixed portal overlay so they never affect layout and never block clicks:
 *
 *  - "problem" (one problem ticked off) → a dozen green flecks, fired FROM the
 *                                         toggle the user clicked rather than the
 *                                         middle of the screen.
 *  - "pattern" (a subcategory cleared)  → a small confetti burst, centred.
 *  - "topic"  (a whole category done)  → a larger multicolour burst, centred.
 *  - "sheet"  (the entire sheet done)  → full-screen confetti rain + a trophy card.
 *
 * When one toggle completes several tiers at once (last problem finishes the
 * pattern AND the topic AND the sheet), the grandest tier wins — which is also
 * what keeps the per-problem fleck from firing alongside a real completion.
 */

type Variant = "problem" | "pattern" | "topic" | "sheet";

/** Viewport coordinates a burst radiates from. Omitted → centred on screen. */
export type CelebrationOrigin = { x: number; y: number };

const RANK: Record<Variant, number> = { problem: 0, pattern: 1, topic: 2, sheet: 3 };
// How long the overlay stays mounted (ms) — must cover the longest animation.
const DURATION: Record<Variant, number> = {
  problem: 900,
  pattern: 1500,
  topic: 2200,
  sheet: 3600,
};

const CelebrationContext = createContext<(variant: Variant, origin?: CelebrationOrigin) => void>(
  () => {}
);

export function useCelebrate() {
  return useContext(CelebrationContext);
}

/**
 * Fires `onComplete` only on a false→true transition of `isComplete` — never on
 * mount (so an already-finished item doesn't celebrate when it first renders).
 */
export function useCompletionEffect(isComplete: boolean, onComplete: () => void) {
  const prev = useRef(isComplete);
  const cb = useRef(onComplete);
  cb.current = onComplete;

  useEffect(() => {
    if (isComplete && !prev.current) cb.current();
    prev.current = isComplete;
  }, [isComplete]);
}

type Active = { variant: Variant; id: number; origin?: CelebrationOrigin };

export function CelebrationProvider({ children }: { children: React.ReactNode }) {
  const [active, setActive] = useState<Active | null>(null);
  const idRef = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const celebrate = useCallback((variant: Variant, origin?: CelebrationOrigin) => {
    setActive((cur) => {
      // Keep the grander celebration if one is already showing/queued this tick.
      // This is what makes the per-problem fleck yield when that same click also
      // finished the pattern: the fleck fires first, the tier burst replaces it.
      if (cur && RANK[cur.variant] > RANK[variant]) return cur;
      idRef.current += 1;
      return { variant, id: idRef.current, origin };
    });
  }, []);

  useEffect(() => {
    if (!active) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setActive(null), DURATION[active.variant]);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [active]);

  return (
    <CelebrationContext.Provider value={celebrate}>
      {children}
      <CelebrationOverlay active={active} />
    </CelebrationContext.Provider>
  );
}

function CelebrationOverlay({ active }: { active: Active | null }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || !active) return null;
  // `key` remounts the burst each time so its CSS animations replay.
  return createPortal(
    <Celebration key={active.id} variant={active.variant} origin={active.origin} />,
    document.body
  );
}

const PALETTE = ["#35a45c", "#7fcf9c", "#1b6240", "#5ad17f", "#f5c451", "#ffffff"];
// The per-problem fleck stays inside the brand greens — the multicolour palette is
// what marks an actual completion, so keeping it back preserves that escalation.
const GREENS = ["#35a45c", "#7fcf9c", "#5ad17f", "#1b6240"];

type Piece = {
  bg: string;
  size: number;
  delay: number;
  duration: number;
  rot: number;
  round: boolean;
  // burst
  tx?: number;
  ty?: number;
  // fall
  left?: number;
  drift?: number;
};

function makePieces(variant: Variant): Piece[] {
  if (variant === "sheet") {
    return Array.from({ length: 80 }, (_, i) => ({
      bg: PALETTE[i % PALETTE.length]!,
      size: 7 + Math.random() * 7,
      delay: Math.random() * 0.6,
      duration: 2 + Math.random() * 1.1,
      rot: Math.random() * 720 - 360,
      round: i % 3 === 0,
      left: Math.random() * 100,
      drift: Math.random() * 80 - 40,
    }));
  }

  if (variant === "problem") {
    // Deliberately the quietest tier: a dozen small flecks over a tight radius,
    // gone in under a second. It has to read as acknowledgement while the user is
    // still looking at the row, not as an interruption they have to wait out.
    return Array.from({ length: 12 }, (_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 62 * (0.35 + Math.random() * 0.65);
      return {
        bg: GREENS[i % GREENS.length]!,
        size: 4 + Math.random() * 3,
        delay: Math.random() * 0.05,
        duration: 0.5 + Math.random() * 0.25,
        rot: Math.random() * 360 - 180,
        round: i % 2 === 0,
        tx: Math.cos(angle) * dist,
        ty: Math.sin(angle) * dist - 16, // slight upward bias, as the larger tiers have
      };
    });
  }

  const count = variant === "topic" ? 32 : 18;
  const spread = variant === "topic" ? 340 : 190;
  return Array.from({ length: count }, (_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = spread * (0.3 + Math.random() * 0.7);
    return {
      bg: PALETTE[i % PALETTE.length]!,
      size: 7 + Math.random() * 6,
      delay: Math.random() * 0.08,
      duration: 0.9 + Math.random() * 0.5,
      rot: Math.random() * 540 - 270,
      round: i % 3 === 0,
      tx: Math.cos(angle) * dist,
      ty: Math.sin(angle) * dist - 50, // bias the spray upward
    };
  });
}

function Celebration({ variant, origin }: { variant: Variant; origin?: CelebrationOrigin }) {
  const pieces = useMemo(() => makePieces(variant), [variant]);
  // An anchored burst fires from the control the user actually clicked. The overlay
  // is `fixed inset-0`, so the viewport coordinates the caller measured drop straight
  // in as `left`/`top` with no scroll maths. Unanchored tiers stay centred.
  const burstLeft = origin ? `${origin.x}px` : "50%";
  const burstTop = origin ? `${origin.y}px` : variant === "topic" ? "50%" : "56%";

  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      <style>{`
        @keyframes rb-burst {
          0%   { transform: translate(-50%, -50%) translate(0, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate(-50%, -50%) translate(var(--tx), var(--ty)) rotate(var(--rot)); opacity: 0; }
        }
        @keyframes rb-fall {
          0%   { transform: translateY(-12vh) translateX(0) rotate(0deg); opacity: 0; }
          8%   { opacity: 1; }
          100% { transform: translateY(112vh) translateX(var(--drift)) rotate(var(--rot)); opacity: 0.9; }
        }
        @keyframes rb-pop {
          0%   { transform: translate(-50%, -50%) scale(0.6); opacity: 0; }
          14%  { transform: translate(-50%, -50%) scale(1.08); opacity: 1; }
          82%  { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          100% { transform: translate(-50%, -50%) scale(0.98); opacity: 0; }
        }
        @keyframes rb-glow {
          0%   { opacity: 0; transform: translate(-50%, -50%) scale(0.7); }
          25%  { opacity: 1; }
          100% { opacity: 0; transform: translate(-50%, -50%) scale(1.4); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rb-celebrate [data-confetti] { display: none; }
        }
      `}</style>

      <div className="rb-celebrate absolute inset-0">
        {variant === "sheet" && (
          <div
            aria-hidden
            className="absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] rounded-full bg-rb-green-500/25 blur-3xl"
            style={{ animation: "rb-glow 3.4s ease-out forwards" }}
          />
        )}

        {pieces.map((p, i) => {
          const isFall = variant === "sheet";
          const style = isFall
            ? ({
                position: "absolute",
                top: 0,
                left: `${p.left}%`,
                width: p.size,
                height: p.round ? p.size : p.size * 0.55,
                background: p.bg,
                borderRadius: p.round ? "9999px" : "2px",
                "--drift": `${p.drift}px`,
                "--rot": `${p.rot}deg`,
                animation: `rb-fall ${p.duration}s linear ${p.delay}s forwards`,
              } as React.CSSProperties)
            : ({
                position: "absolute",
                left: burstLeft,
                top: burstTop,
                width: p.size,
                height: p.round ? p.size : p.size * 0.55,
                background: p.bg,
                borderRadius: p.round ? "9999px" : "2px",
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                "--rot": `${p.rot}deg`,
                animation: `rb-burst ${p.duration}s cubic-bezier(.15,.6,.4,1) ${p.delay}s forwards`,
              } as React.CSSProperties);
          return <span key={i} data-confetti style={style} />;
        })}

        {variant === "sheet" && (
          <span
            className="absolute left-1/2 top-1/2 text-amber-400 drop-shadow-2xl"
            style={{ animation: "rb-pop 3.4s ease-out forwards" }}
          >
            <Trophy className="h-20 w-20 sm:h-28 sm:w-28" strokeWidth={1.5} />
          </span>
        )}
      </div>
    </div>
  );
}
