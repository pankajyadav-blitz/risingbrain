import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AdminNav } from "./_components/admin-nav";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false }, // management surface — keep out of search
};

/**
 * ADMIN-only content-management shell. The edge proxy already gates `/admin`
 * (`ROUTE_ACCESS` + `proxy.ts`), but we re-check here as defense-in-depth: a
 * Server Component must never trust that an upstream layer ran. `getCurrentUser`
 * is pure crypto (no DB), so this is cheap. Non-admins get a 404 (don't reveal
 * the surface exists).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (user?.role !== "ADMIN") notFound();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <div className="shrink-0 border-b border-border px-4 pb-3 pt-4 sm:px-6">
        <span className="text-[11px] font-medium uppercase tracking-wide text-accent">
          Content management
        </span>
        <h1 className="text-lg font-semibold tracking-tight text-foreground">Admin</h1>
        <div className="mt-3">
          <AdminNav />
        </div>
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
