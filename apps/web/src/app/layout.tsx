import type { Metadata } from "next";
import Script from "next/script";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { COOKIES } from "@/lib/auth/constants";
import { SessionKeepAlive } from "@/components/session-keep-alive";
import "./globals.css";

// Site-wide typography. Plus Jakarta Sans for content, JetBrains Mono for code.
const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-app-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-app-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RisingBrain",
  description: "Turborepo + Next.js + Tailwind + Prisma, powered by Bun.",
};

// Runs before paint to apply the saved/system theme and avoid a flash of the
// wrong palette. Defaults to dark (matching the RisingBrain web app).
const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = stored ? stored === "dark" : true;
    document.documentElement.classList.toggle("dark", isDark);
  } catch (e) {
    document.documentElement.classList.add("dark");
  }
})();`;

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A session cookie present? Keep the access token fresh in the background.
  const jar = await cookies();
  const hasSession = jar.has(COOKIES.REFRESH) || jar.has(COOKIES.ACCESS);

  return (
    <html
      lang="en"
      className={`dark ${sans.variable} ${mono.variable}`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* Pre-paint theme apply (no flash). next/script `beforeInteractive` is
            injected into the initial HTML and runs before hydration. */}
        <Script id="theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        {hasSession && <SessionKeepAlive />}
        {children}
      </body>
    </html>
  );
}
