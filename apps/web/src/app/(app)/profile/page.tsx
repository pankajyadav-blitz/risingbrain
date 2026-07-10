import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { Flame, Trophy, CircleCheckBig } from "lucide-react";
import { getCurrentUserProfile } from "@/lib/auth/current-user";
import { Container } from "@/components/marketing/primitives";
import { CountUp } from "@/components/motion/count-up";
import { Reveal } from "@/components/motion/reveal";
import { getProfileData } from "./_data";
import { Heatmap } from "./_components/heatmap";
import { SectionStats } from "./_components/section-stats";

export const metadata: Metadata = {
  title: "Profile",
  robots: { index: false, follow: false }, // per-user page — keep out of search
};

function StatPill({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
}) {
  return (
    <div className="glass-pill flex items-center gap-3 rounded-2xl px-4 py-3">
      <span className="text-accent">{icon}</span>
      <div>
        <div className="text-xl font-bold leading-none tabular-nums text-foreground">
          {typeof value === "number" ? <CountUp value={value} /> : value}
        </div>
        <div className="mt-1 text-[11px] text-muted">{label}</div>
      </div>
    </div>
  );
}

export default async function ProfilePage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const user = await getCurrentUserProfile();
  // Middleware already gates /profile, but guard here too for safety.
  if (!user) redirect("/login?callbackUrl=/profile");

  const { year } = await searchParams;
  const parsedYear = year ? Number.parseInt(year, 10) : undefined;
  const data = await getProfileData(
    user.id,
    Number.isFinite(parsedYear) ? parsedYear : undefined,
  );

  const initials =
    user.name
      ?.split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "RB";

  return (
    <main className="flex-1 py-8 sm:py-10">
      <Container tight className="space-y-6">
        {/* Identity header */}
        <Reveal className="glass rounded-3xl p-6 sm:p-8">
          <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-gradient-to-br from-rb-green-400 to-rb-green-700 text-2xl font-bold text-rb-green-900 ring-2 ring-rb-green-500/30">
              {initials}
            </div>
            <div className="min-w-0 sm:flex-1">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                {user.name ?? "RisingBrain user"}
              </h1>
              <p className="truncate text-sm text-muted">{user.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatPill
              icon={<Flame className="h-5 w-5" />}
              value={data.heatmap.currentStreak}
              label="Current streak (days)"
            />
            <StatPill
              icon={<Trophy className="h-5 w-5" />}
              value={data.heatmap.longestStreak}
              label="Longest streak (days)"
            />
            <StatPill
              icon={<CircleCheckBig className="h-5 w-5" />}
              value={data.totalSolved}
              label="Problems solved"
            />
          </div>
        </Reveal>

        {/* Per-section dashboard */}
        <Reveal as="section">
          <div className="mb-4">
            <h2 className="text-lg font-semibold tracking-tight">
              Your progress
            </h2>
            <p className="text-xs text-muted">
              Solved problems across every section, broken down by difficulty.
            </p>
          </div>
          <SectionStats sections={data.sections} />
        </Reveal>

        {/* Activity heatmap */}
        <Reveal>
          <Heatmap
          months={data.heatmap.months}
          year={data.heatmap.year}
          rolling={data.heatmap.rolling}
          availableYears={data.heatmap.availableYears}
          totalContributions={data.heatmap.totalContributions}
          activeDays={data.heatmap.activeDays}
          />
        </Reveal>
      </Container>
    </main>
  );
}
