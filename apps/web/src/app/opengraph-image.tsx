import { ImageResponse } from "next/og";
import { SITE_NAME } from "@/lib/seo";

/**
 * Default Open Graph / Twitter share image, generated on the fly (no static
 * asset). Applies to every page that doesn't define its own, so links shared to
 * social/chat render a branded card instead of a bare URL. Next.js also uses
 * this as the Twitter image fallback.
 */
export const alt = `${SITE_NAME} — Crack your dream product company from any college`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0a0a0a 0%, #0b1f14 60%, #06281a 100%)",
          padding: "80px",
          color: "#ffffff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: "#22c55e",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 34,
              fontWeight: 800,
              color: "#04140b",
            }}
          >
            R
          </div>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#e6ffe9" }}>{SITE_NAME}</div>
        </div>

        <div
          style={{
            marginTop: 40,
            fontSize: 68,
            fontWeight: 800,
            lineHeight: 1.05,
            maxWidth: 940,
            letterSpacing: "-0.02em",
          }}
        >
          Crack your dream product company
        </div>
        <div style={{ marginTop: 16, fontSize: 40, fontWeight: 700, color: "#22c55e" }}>
          from any college.
        </div>

        <div style={{ marginTop: 40, fontSize: 26, color: "#9ca3af", maxWidth: 900 }}>
          Pattern-first DSA sheets · SQL · Aptitude · Interview experiences · Courses
        </div>
      </div>
    ),
    { ...size }
  );
}
