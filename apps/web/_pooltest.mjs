import { Pool } from "pg";
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 15_000, keepAlive: true,
});
let ok = 0, fail = 0; const msgs = new Set();
// Burst of 5 concurrent queries => pool must open 5 fresh connections (like a page load)
async function burst(tag) {
  const rs = await Promise.allSettled(
    Array.from({ length: 5 }, () => pool.query("select 1"))
  );
  for (const r of rs) {
    if (r.status === "fulfilled") ok++;
    else { fail++; msgs.add((r.reason.code || "") + " " + r.reason.message); }
  }
  console.log(tag, "ok", ok, "fail", fail);
}
await burst("burst1");
await new Promise((r) => setTimeout(r, 12_000)); // let idleTimeoutMillis recycle them
await burst("burst2 (after idle recycle)");
console.log("RESULT ok", ok, "fail", fail, [...msgs].join(" | "));
await pool.end().catch(() => {});
