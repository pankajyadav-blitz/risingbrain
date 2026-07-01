/**
 * A resilient JSON POST for optimistic client mutations (solve toggle, bookmark…).
 *
 * These writes happen behind an optimistic UI: the screen updates instantly and
 * the request lands in the background. On a slow or flaky connection a single
 * `fetch` can drop the write silently, so we:
 *   - retry transient failures (network error, 5xx, 429) with a short backoff;
 *   - set `keepalive: true` so an in-flight write still completes if the user
 *     navigates away or refreshes the page mid-request;
 *   - give up immediately on a genuine 4xx (bad payload / unknown id) since a
 *     retry can't fix it.
 *
 * Returns true only when the server confirmed the write (2xx). The caller keeps
 * its optimistic state on true and reverts on false.
 */
export async function persistJSON(
  url: string,
  body: unknown,
  { retries = 2, backoffMs = 400 }: { retries?: number; backoffMs?: number } = {},
): Promise<boolean> {
  const payload = JSON.stringify(body);

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      });
      if (res.ok) return true;
      // A 4xx (other than rate-limiting) is a permanent failure — retrying the
      // same payload will only fail again, so bail out now.
      if (res.status >= 400 && res.status < 500 && res.status !== 429) return false;
    } catch {
      // Network-level failure — fall through to the retry/backoff below.
    }

    if (attempt < retries) {
      await new Promise((r) => setTimeout(r, backoffMs * 2 ** attempt));
    }
  }

  return false;
}
