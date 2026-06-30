"use client";

import * as React from "react";
import { Loader2 } from "lucide-react";
import { LoadingOverlay } from "@/components/loading/loading-overlay";

/** Revokes the session server-side, then returns to the landing page. */
export function LogoutButton({
  className = "",
  children = "Log out",
}: {
  className?: string;
  children?: React.ReactNode;
}) {
  const [loading, setLoading] = React.useState(false);

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      window.location.href = "/";
    } catch {
      setLoading(false);
    }
  }

  return (
    <>
      <button type="button" onClick={logout} disabled={loading} className={className}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Signing out…
          </>
        ) : (
          children
        )}
      </button>

      {/* Overlay covers the request + redirect so the page reads as "working". */}
      <LoadingOverlay show={loading} label="Signing out" />
    </>
  );
}
