import { IconRail } from "@/components/shell/icon-rail";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { getCurrentStreak } from "@/lib/streak";
import { getNavForRole, type AppRole } from "@/lib/rbac";

/**
 * Signed-in app shell. A slim icon rail on the far left switches between
 * top-level sections; the page renders in the center. Each section supplies its
 * own contextual panel / progress rail inside its own content (see `AppShell`).
 *
 * Nav items are decided server-side by role (`getNavForRole`), so the browser
 * never receives links a user can't access. The public marketing landing lives
 * in the sibling `(marketing)` group and keeps the top navbar instead.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getCurrentUserProfile();
  const role = (profile?.role ?? null) as AppRole | null;
  const items = getNavForRole(role);

  // Streak flame — fetched only for signed-in users (null hides the badge), so
  // the rail matches the marketing navbar. Live-updates via the shared
  // `rb:streak-updated` event after a solve.
  const streak = profile ? await getCurrentStreak(profile.id) : null;

  return (
    // Dashboard scroll model: on desktop the shell fills the viewport and does
    // NOT scroll — only the center column does (`lg:overflow-y-auto`). That keeps
    // the icon rail physically outside the scroll area (so it can't drift) and
    // lets a section's right rail stick cleanly against the center's own
    // scrollport. On mobile it falls back to normal page scroll.
    <div className="lg:fixed lg:inset-0 lg:flex lg:gap-3 lg:overflow-hidden lg:p-3">
      <IconRail
        items={items}
        user={profile ? { name: profile.name, role: profile.role } : null}
        streak={streak}
      />
      {/* Content is its own rounded card, separated from the rail by the gap so
          the ambient background shows through — the floating-glass-panels look.
          It scrolls internally; the rail card stays put beside it.

          `app-scrollport` is the hook a page uses to opt OUT of that scroll and
          manage its own scrollports instead (see `[data-fills-scrollport]` in
          globals.css) — /domain's two-pane reader needs that. */}
      <div className="app-scrollport flex min-w-0 flex-1 flex-col lg:min-h-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border lg:bg-surface/20">
        {children}
      </div>
    </div>
  );
}
