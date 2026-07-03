/**
 * The signature RisingBrain ambient backdrop — soft green glows + a faded dot
 * grid, masked toward the edges. Purely presentational (no hooks/server APIs) so
 * it can be dropped into both server and client components (404 + error pages).
 */
export function AmbientBackground() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
      <div className="absolute left-1/2 top-0 h-[40rem] w-[60rem] max-w-none -translate-x-1/2 rounded-full bg-rb-green-500/10 blur-3xl" />
      <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-rb-green-600/10 blur-3xl" />
      <div className="absolute -bottom-24 -right-24 h-[26rem] w-[26rem] rounded-full bg-rb-green-400/10 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
        style={{
          backgroundImage:
            "radial-gradient(circle, color-mix(in oklab, var(--rb-green-500) 22%, transparent) 1px, transparent 1.5px)",
          backgroundSize: "26px 26px",
        }}
      />
    </div>
  );
}
