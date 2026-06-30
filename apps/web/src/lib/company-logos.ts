/**
 * Company logo source resolution.
 *
 * The seed stores `https://logo.clearbit.com/<domain>` URLs, but Clearbit's free
 * Logo API has been shut down, so those URLs no longer resolve. Rather than
 * migrate the data, we treat the stored URL purely as a carrier for the brand
 * DOMAIN and derive reliable favicon URLs from it (Google, then DuckDuckGo).
 * Components walk this list on <img> error and fall back to a monogram last.
 */

/** Extract the brand domain (e.g. "amazon.com") from a stored logo URL. */
export function logoDomain(src: string | null): string | null {
  if (!src) return null;
  // Clearbit: https://logo.clearbit.com/amazon.com
  const clearbit = src.match(/logo\.clearbit\.com\/([^/?#]+)/);
  if (clearbit?.[1]) return clearbit[1];
  // Already a favicon URL carrying ?domain=...
  const param = src.match(/[?&]domain=([^&]+)/);
  if (param?.[1]) return decodeURIComponent(param[1]);
  // DuckDuckGo: https://icons.duckduckgo.com/ip3/amazon.com.ico
  const ddg = src.match(/ip3\/([^/?#]+)\.ico/);
  if (ddg?.[1]) return ddg[1];
  // A bare domain string ("amazon.com").
  if (/^[\w-]+(\.[\w-]+)+$/.test(src)) return src;
  return null;
}

/**
 * Ordered list of logo image URLs to try for a company, walked on <img> error.
 *
 * 1. The per-company URL stored in the DB is honored FIRST (so a real logo URL
 *    added to the schema is used as-is) — unless it's a dead Clearbit Logo API
 *    URL, which we skip straight to favicons.
 * 2. Then domain-derived favicons (Google, DuckDuckGo) as reliable fallbacks.
 *
 * Empty when nothing is resolvable — the caller then shows a monogram.
 */
export function logoSources(src: string | null): string[] {
  const out: string[] = [];
  const isDeadClearbit = src ? /logo\.clearbit\.com/.test(src) : false;

  if (src && /^https?:\/\//.test(src) && !isDeadClearbit) out.push(src);

  const domain = logoDomain(src);
  if (domain) {
    out.push(`https://www.google.com/s2/favicons?domain=${domain}&sz=128`);
    out.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }

  return [...new Set(out)];
}
