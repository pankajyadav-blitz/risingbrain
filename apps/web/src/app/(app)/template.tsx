/**
 * A `template.tsx` re-mounts on every navigation (unlike `layout.tsx`, which
 * persists), so this is the idiomatic place for a page-enter transition. Each
 * route fades and lifts gently into view; the navbar/footer in the layout stay
 * put. The animation uses `backwards` fill (see `.animate-page` in theme.css)
 * so it leaves no lingering transform behind.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
