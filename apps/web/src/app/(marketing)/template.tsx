/**
 * Page-enter transition for marketing routes (re-runs on every navigation).
 * See `.animate-page` in theme.css — uses `backwards` fill so it leaves no
 * lingering transform behind.
 */
export default function MarketingTemplate({ children }: { children: React.ReactNode }) {
  return <div className="animate-page">{children}</div>;
}
