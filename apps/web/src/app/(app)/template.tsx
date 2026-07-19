/**
 * A `template.tsx` re-mounts on every navigation (unlike `layout.tsx`, which
 * persists), so this is the idiomatic place for a page-enter transition. Each
 * route fades and lifts gently into view; the navbar/footer in the layout stay
 * put. The animation uses `backwards` fill (see `.animate-page` in theme.css)
 * so it leaves no lingering transform behind.
 *
 * LAYOUT: `.animate-page` sets only the animation, so this wrapper defaulted to
 * a plain block with `flex: 0 1 auto`. Sitting between the shell's flex column
 * and each page's `<main className="flex-1">`, it broke the height chain — it
 * didn't grow, and being block it gave `main` nothing to fill against, so every
 * page's main collapsed to content height instead of filling the shell. Most
 * pages don't show it, but any full-bleed page does: /courses' ambient
 * background is `absolute inset-0` of main, so it stopped at the content edge.
 * `flex flex-col` re-establishes the chain; `grow` (basis auto, NOT `flex-1`'s
 * basis-0) means height = max(content, available), so tall pages still overflow
 * into the shell's scrollport rather than being squashed.
 */
export default function AppTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="animate-page flex grow flex-col">{children}</div>;
}
