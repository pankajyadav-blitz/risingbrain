"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "dark" | "light";

function currentTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Keep native form controls / scrollbars in sync with the palette.
  root.style.colorScheme = theme;
  try {
    localStorage.setItem("theme", theme);
  } catch {
    /* ignore storage failures (private mode, etc.) */
  }
}

/**
 * Toggles the `dark` class on <html> and persists the choice to localStorage.
 * The initial class is set before paint by the inline script in layout.tsx;
 * here we mirror that on mount, then flip it on click.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const [theme, setTheme] = React.useState<Theme>("dark");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setTheme(currentTheme());
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} theme`}
      title={`Switch to ${isDark ? "light" : "dark"} theme`}
      // suppressHydrationWarning: the icon depends on the real (pre-paint) theme,
      // which the server can't know — avoid a spurious mismatch warning.
      suppressHydrationWarning
      className={
        "glass-pill glass-hover inline-grid h-9 w-9 place-items-center rounded-full text-foreground transition-colors " +
        className
      }
    >
      <span aria-hidden suppressHydrationWarning>
        {mounted && !isDark ? (
          <Sun className="h-[1.05rem] w-[1.05rem]" />
        ) : (
          <Moon className="h-[1.05rem] w-[1.05rem]" />
        )}
      </span>
    </button>
  );
}
