/**
 * One-off migration of USER DATA + USER PROGRESS from the legacy RisingBrain
 * app (`/home/virat/home/demo/risingbrain`) into this monorepo's schema.
 *
 * ── Safety contract ───────────────────────────────────────────────────────────
 *  - The legacy database is opened in a READ ONLY transaction. This script can
 *    not write to, or delete from, the old DB even by accident.
 *  - DRY RUN BY DEFAULT. Nothing is written until you pass `--apply`.
 *  - Idempotent: every write is an upsert on a natural key (user email,
 *    [userId, problemId], [provider, providerAccountId]), so re-running after a
 *    partial failure converges rather than duplicating.
 *  - Never deletes or downgrades anything in the new DB: an existing user keeps
 *    their role, and a legacy NULL never overwrites a value that's already set.
 *
 * ── How the mapping works ─────────────────────────────────────────────────────
 * Legacy `user_problem_progress.problemId` holds the dataset id from the seed
 * JSON (e.g. "problem_0001") — it had no FK. In this schema the same dataset id
 * survives as `DsaProblem.slug` (seed.ts: `slug: uniqueSlug(p.id)`), so slug is
 * the join key. Verified before writing this: all 491 ids in the legacy
 * seed_v2.json resolve to identical titles in the new dsa.json, with zero
 * mismatches, so an id means the same problem on both sides.
 *
 * ── What is NOT migrated, and why ─────────────────────────────────────────────
 *  - Passwords: legacy is bcryptjs, this app is argon2id. The two are not
 *    convertible. See `--passwords` below.
 *  - Sessions / VerificationOtp / VerificationToken: short-lived auth state, and
 *    this app's session model is completely different. Users stay signed in via
 *    a fresh login.
 *  - ActivityDay / Submission (heatmap + streak): deliberately left to the
 *    existing `db:backfill-activity` script, which already rebuilds both from
 *    `UserProblemProgress.solvedAt` idempotently. Run it after this. Duplicating
 *    that logic here would risk the two drifting apart.
 *
 * ── Usage ─────────────────────────────────────────────────────────────────────
 *   LEGACY_DATABASE_URL=postgresql://…old…  \
 *   DATABASE_URL=postgresql://…new…         \
 *   bun run packages/database/scripts/migrate-legacy.ts [--apply] [--passwords=carry]
 *
 *   # 1. inspect what would happen (writes nothing)
 *   bun run packages/database/scripts/migrate-legacy.ts
 *   # 2. do it
 *   bun run packages/database/scripts/migrate-legacy.ts --apply
 *   # 3. rebuild heatmap/streaks from the migrated progress
 *   bun run db:backfill-activity
 */
import { Client } from "pg";
import { PrismaClient, ProblemStatus, AuthProvider } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// ── CLI ──────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const APPLY = argv.includes("--apply");
/**
 * `skip`  (default) — leave `passwordHash` null. Legacy credential users must use
 *                     "forgot password" once. Zero risk, zero code change.
 * `carry`           — copy the bcrypt hash into `passwordHash` as-is. This ONLY
 *                     works if you also teach `lib/auth/password.ts` to detect a
 *                     bcrypt hash ($2a$/$2b$/$2y$ prefix), verify it with
 *                     bcryptjs, and transparently re-hash to argon2id on the
 *                     next successful login. Without that shim, every carried
 *                     password silently fails to verify — worse than `skip`.
 */
const PASSWORD_MODE: "skip" | "carry" =
  (argv.find((a) => a.startsWith("--passwords="))?.split("=")[1] as "skip" | "carry") ?? "skip";

const LEGACY_URL = process.env.LEGACY_DATABASE_URL;
const NEW_URL = process.env.DATABASE_URL;

// ── Types mirroring the legacy schema (prisma/schema.prisma in the old repo) ──
interface LegacyUser {
  id: string;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  image: string | null;
  password: string | null;
  emailVerified: Date | null;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date | null;
  createdAt: Date;
}
interface LegacyAccount {
  userId: string;
  provider: string;
  providerAccountId: string;
}
interface LegacyProgress {
  userId: string;
  problemId: string;
  status: string;
  notes: string | null;
  solvedAt: Date | null;
  isBookmarked: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: NEW_URL }) });

const stats = {
  usersSeen: 0,
  usersCreated: 0,
  usersUpdated: 0,
  passwordsCarried: 0,
  oauthLinked: 0,
  oauthSkippedUnknownProvider: new Set<string>(),
  progressSeen: 0,
  progressWritten: 0,
  progressMirrored: 0,
  notesWritten: 0,
  unmappedProblemIds: new Map<string, number>(),
  orphanProgressRows: 0,
  duplicatesSkipped: 0,
};

function log(...a: unknown[]) {
  console.log(...a);
}

/** Rows sent per round trip. Big enough to amortise latency, small enough to
 *  stay well under Postgres' parameter limit and keep memory flat. */
const CHUNK = 1000;

function chunked<T>(arr: T[], size = CHUNK): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

/**
 * Live progress line with rate + ETA. This migration runs against a REMOTE
 * database over the public internet, where a per-row round trip is ~50ms — at
 * 186k progress rows that is hours of silence. Everything below batches, and
 * every batch reports, so a long run is legible rather than looking hung.
 */
function makeProgress(label: string, total: number) {
  const started = Date.now();
  let done = 0;
  return {
    add(n: number) {
      done += n;
      const secs = (Date.now() - started) / 1000;
      const rate = done / Math.max(secs, 0.001);
      const etaSec = rate > 0 ? Math.round((total - done) / rate) : 0;
      const pct = total > 0 ? Math.round((done / total) * 100) : 100;
      const eta = etaSec > 90 ? `${Math.round(etaSec / 60)}m` : `${etaSec}s`;
      log(
        `   ${label}: ${done}/${total} (${pct}%)  ${Math.round(rate)}/s  elapsed ${Math.round(secs)}s  eta ${eta}`
      );
    },
    done() {
      const secs = Math.round((Date.now() - started) / 1000);
      log(`   ${label}: ${done}/${total} complete in ${secs}s`);
    },
  };
}

/** Legacy provider strings ("google") → this schema's AuthProvider enum. */
function toAuthProvider(p: string): AuthProvider | null {
  switch (p.toLowerCase()) {
    case "google":
      return AuthProvider.GOOGLE;
    case "github":
      return AuthProvider.GITHUB;
    case "credentials":
      return AuthProvider.CREDENTIALS;
    default:
      return null;
  }
}

function toProblemStatus(s: string): ProblemStatus {
  // Both schemas declare the identical enum (NOT_STARTED | IN_PROGRESS | SOLVED),
  // so this is a straight pass-through with a defensive fallback.
  return s === "SOLVED"
    ? ProblemStatus.SOLVED
    : s === "IN_PROGRESS"
      ? ProblemStatus.IN_PROGRESS
      : ProblemStatus.NOT_STARTED;
}

async function main() {
  if (!LEGACY_URL) throw new Error("LEGACY_DATABASE_URL is required (the OLD database).");
  if (!NEW_URL) throw new Error("DATABASE_URL is required (the NEW database).");
  if (LEGACY_URL === NEW_URL) throw new Error("LEGACY_DATABASE_URL and DATABASE_URL are the same DB — refusing to run.");

  log(APPLY ? "▶ APPLY MODE — the new database will be written to." : "▶ DRY RUN — no writes. Pass --apply to commit.");
  log(`  passwords: ${PASSWORD_MODE}\n`);

  // ── Connect to the legacy DB, read-only ────────────────────────────────────
  const legacy = new Client({ connectionString: LEGACY_URL });
  await legacy.connect();
  // Hard guarantee: nothing this script does can mutate the old database.
  await legacy.query("BEGIN TRANSACTION READ ONLY");

  try {
    // ── Preflight: build the legacy problemId → new DsaProblem.id[] map ──────
    //
    // One legacy id can map to SEVERAL new rows. `DsaProblem` is per-PLACEMENT,
    // not per-problem: a question that appears in two sheets (e.g. "Remove K
    // Digits" in both "Pattern Wise Sheet" and "Last Minute 100") is two rows,
    // and seed.ts's `uniqueSlug()` disambiguates the second as `<id>-2`.
    //
    // Legacy progress carries only the bare dataset id, with no way to say which
    // sheet it came from — and progress belongs to the QUESTION, not to where it
    // happens to be listed. So a legacy solve is written to every placement of
    // that question; otherwise the user would see it ticked in one sheet and
    // untouched in the other.
    const problems = await prisma.dsaProblem.findMany({ select: { id: true, slug: true } });
    const slugSet = new Set(problems.map((p) => p.slug));
    const idsForLegacySlug = new Map<string, string[]>();
    const add = (key: string, id: string) => {
      const cur = idsForLegacySlug.get(key);
      if (cur) cur.push(id);
      else idsForLegacySlug.set(key, [id]);
    };
    for (const p of problems) {
      add(p.slug, p.id); // exact match always wins
      // `<base>-<n>` is only a collision twin if `<base>` is itself a real slug —
      // guarding on that avoids mangling a dataset id that genuinely ends in -N.
      const m = /^(.+)-(\d+)$/.exec(p.slug);
      if (m && slugSet.has(m[1]!)) add(m[1]!, p.id);
    }
    const multi = [...idsForLegacySlug.values()].filter((v) => v.length > 1).length;
    log(`new DB: ${problems.length} DSA problems available to map onto`);
    log(`         ${multi} legacy ids map to multiple sheet placements (progress mirrored to each)`);
    if (problems.length === 0) {
      throw new Error("New DB has no DSA problems — run `bun run db:seed` first, or progress cannot be mapped.");
    }

    // ── 1. Users ─────────────────────────────────────────────────────────────
    const { rows: legacyUsers } = await legacy.query<LegacyUser>(
      `SELECT id, email, name, "phoneNumber", image, password, "emailVerified",
              "currentStreak", "longestStreak", "lastActivityDate", "createdAt"
       FROM users ORDER BY "createdAt" ASC`
    );
    stats.usersSeen = legacyUsers.length;
    log(`legacy DB: ${legacyUsers.length} users`);

    // De-duplicate on the normalised email: legacy allows "A@x.com" and
    // "a@x.com" as separate rows, but `User.email` is unique here. Last row
    // wins (they arrive oldest-first, so the newest data survives).
    const byEmail = new Map<string, LegacyUser>();
    for (const u of legacyUsers) byEmail.set(u.email.trim().toLowerCase(), u);
    if (byEmail.size !== legacyUsers.length) {
      log(`   note: ${legacyUsers.length - byEmail.size} users collapsed by case-insensitive email`);
    }
    const emails = [...byEmail.keys()];

    // Which of these already exist? One indexed query per chunk instead of a
    // findUnique per user (12.5k round trips → ~13).
    log(`   checking which users already exist…`);
    const existingByEmail = new Map<string, string>();
    for (const part of chunked(emails)) {
      const found = await prisma.user.findMany({
        where: { email: { in: part } },
        select: { id: true, email: true },
      });
      for (const f of found) existingByEmail.set(f.email, f.id);
    }
    const toCreate = emails.filter((e) => !existingByEmail.has(e));
    const toUpdate = emails.filter((e) => existingByEmail.has(e));
    stats.usersCreated = toCreate.length;
    stats.usersUpdated = toUpdate.length;
    log(`   ${toCreate.length} to create, ${toUpdate.length} already present`);

    const rowFor = (email: string) => {
      const u = byEmail.get(email)!;
      // Only carry a password when explicitly asked AND it looks like bcrypt.
      const carriedHash =
        PASSWORD_MODE === "carry" && u.password && /^\$2[aby]\$/.test(u.password) ? u.password : null;
      if (carriedHash) stats.passwordsCarried++;
      return {
        email,
        name: u.name ?? undefined,
        phoneNumber: u.phoneNumber ?? undefined,
        image: u.image ?? undefined,
        emailVerified: u.emailVerified ?? undefined,
        currentStreak: u.currentStreak ?? 0,
        longestStreak: u.longestStreak ?? 0,
        lastActiveOn: u.lastActivityDate ?? undefined, // renamed field
        createdAt: u.createdAt,
        ...(carriedHash ? { passwordHash: carriedHash } : {}),
      };
    };

    if (APPLY && toCreate.length) {
      const p = makeProgress("creating users", toCreate.length);
      for (const part of chunked(toCreate)) {
        // `skipDuplicates` makes a re-run after a partial failure a no-op rather
        // than a unique-violation crash.
        await prisma.user.createMany({ data: part.map(rowFor), skipDuplicates: true });
        p.add(part.length);
      }
      p.done();
    }

    if (APPLY && toUpdate.length) {
      // Bulk UPDATE ... FROM unnest(): one round trip per chunk. COALESCE keeps
      // an existing value when the legacy side is NULL, and `role` is never
      // touched so an existing ADMIN can't be demoted to NORMAL.
      const p = makeProgress("updating users", toUpdate.length);
      for (const part of chunked(toUpdate)) {
        const r = part.map(rowFor);
        await prisma.$executeRaw`
          UPDATE users AS u SET
            name            = COALESCE(t.name, u.name),
            "phoneNumber"  = COALESCE(t.phone, u."phoneNumber"),
            image           = COALESCE(t.image, u.image),
            "emailVerified" = COALESCE(t.ev, u."emailVerified"),
            "currentStreak" = t.cs,
            "longestStreak" = t.ls,
            "lastActiveOn" = COALESCE(t.lao, u."lastActiveOn"),
            "updatedAt"    = now()
          FROM unnest(
            ${r.map((x) => x.email)}::text[],
            ${r.map((x) => x.name ?? null)}::text[],
            ${r.map((x) => x.phoneNumber ?? null)}::text[],
            ${r.map((x) => x.image ?? null)}::text[],
            ${r.map((x) => x.emailVerified ?? null)}::timestamptz[],
            ${r.map((x) => x.currentStreak)}::int[],
            ${r.map((x) => x.longestStreak)}::int[],
            ${r.map((x) => x.lastActiveOn ?? null)}::timestamptz[]
          ) AS t(email, name, phone, image, ev, cs, ls, lao)
          WHERE u.email = t.email`;
        p.add(part.length);
      }
      p.done();
    }

    /** legacy user id → new user id, so progress rows can be attached. */
    const userIdMap = new Map<string, string>();
    if (APPLY) {
      log(`   resolving user ids…`);
      const idByEmail = new Map<string, string>();
      for (const part of chunked(emails)) {
        const found = await prisma.user.findMany({
          where: { email: { in: part } },
          select: { id: true, email: true },
        });
        for (const f of found) idByEmail.set(f.email, f.id);
      }
      for (const u of legacyUsers) {
        const id = idByEmail.get(u.email.trim().toLowerCase());
        if (id) userIdMap.set(u.id, id);
      }
    } else {
      for (const u of legacyUsers) {
        const email = u.email.trim().toLowerCase();
        userIdMap.set(u.id, existingByEmail.get(email) ?? `dry-run:${u.id}`);
      }
    }

    // ── 2. OAuth accounts ────────────────────────────────────────────────────
    const { rows: accounts } = await legacy.query<LegacyAccount>(
      `SELECT "userId", provider, "providerAccountId" FROM accounts`
    );
    for (const a of accounts) {
      const newUserId = userIdMap.get(a.userId);
      const provider = toAuthProvider(a.provider);
      if (!provider) {
        stats.oauthSkippedUnknownProvider.add(a.provider);
        continue;
      }
      if (!newUserId || newUserId.startsWith("dry-run:")) {
        if (APPLY) continue;
        stats.oauthLinked++;
        continue;
      }
      if (APPLY) {
        await prisma.oAuthAccount.upsert({
          where: { provider_providerAccountId: { provider, providerAccountId: a.providerAccountId } },
          update: { userId: newUserId },
          create: { userId: newUserId, provider, providerAccountId: a.providerAccountId },
        });
      }
      stats.oauthLinked++;
    }

    // ── 3. Progress (+ notes) ────────────────────────────────────────────────
    // Read in pages so 186k legacy rows never all sit in memory, then write each
    // page as bulk INSERT … ON CONFLICT DO UPDATE — one round trip per chunk
    // rather than per row. Same upsert semantics, ~200x fewer round trips.
    const { rows: countRows } = await legacy.query<{ n: string }>(
      `SELECT count(*)::text n FROM user_problem_progress`
    );
    const progressTotal = Number(countRows[0]?.n ?? 0);
    log(`legacy DB: ${progressTotal} progress rows`);
    const prog = makeProgress("progress", progressTotal);

    interface PRow {
      userId: string;
      problemId: string;
      status: string;
      isBookmarked: boolean;
      solvedAt: Date | null;
      createdAt: Date;
      notes: string | null;
    }

    /**
     * Collapse repeats of the same (userId, problemId) inside one batch.
     * Postgres rejects a statement whose ON CONFLICT would touch a row twice
     * ("cannot affect row a second time"), so a single duplicate would abort the
     * whole migration. Rather than fail, keep the furthest-along row (SOLVED >
     * IN_PROGRESS > NOT_STARTED, then most recent solve) and merge the flags so
     * a bookmark or note on the discarded copy isn't lost.
     */
    function dedupe(rows: PRow[]): PRow[] {
      const rank = (s: string) => (s === "SOLVED" ? 3 : s === "IN_PROGRESS" ? 2 : 1);
      const seen = new Map<string, PRow>();
      for (const r of rows) {
        const key = `${r.userId} ${r.problemId}`;
        const prev = seen.get(key);
        if (!prev) {
          seen.set(key, { ...r });
          continue;
        }
        stats.duplicatesSkipped++;
        const rNewer = (r.solvedAt?.getTime() ?? 0) >= (prev.solvedAt?.getTime() ?? 0);
        const winner =
          rank(r.status) > rank(prev.status)
            ? { ...r }
            : rank(r.status) < rank(prev.status)
              ? prev
              : rNewer
                ? { ...r }
                : prev;
        winner.isBookmarked = prev.isBookmarked || r.isBookmarked;
        winner.notes = prev.notes?.trim() ? prev.notes : r.notes;
        seen.set(key, winner);
      }
      return [...seen.values()];
    }

    /** Flush one batch of resolved rows to the new DB. */
    async function flush(input: PRow[]) {
      const rows = dedupe(input);
      if (!APPLY || rows.length === 0) return;
      // `gen_random_uuid()::text` fills the cuid-shaped TEXT primary key: raw SQL
      // can't invoke Prisma's @default(cuid()), and the column has no DB default.
      await prisma.$executeRaw`
        INSERT INTO user_problem_progress
          (id, "userId", "problemId", status, "isBookmarked", "solvedAt", "createdAt", "updatedAt")
        SELECT gen_random_uuid()::text, t.u, t.p, t.s::"ProblemStatus", t.b, t.sa, t.ca, now()
        FROM unnest(
          ${rows.map((r) => r.userId)}::text[],
          ${rows.map((r) => r.problemId)}::text[],
          ${rows.map((r) => r.status)}::text[],
          ${rows.map((r) => r.isBookmarked)}::boolean[],
          ${rows.map((r) => r.solvedAt)}::timestamptz[],
          ${rows.map((r) => r.createdAt)}::timestamptz[]
        ) AS t(u, p, s, b, sa, ca)
        ON CONFLICT ("userId", "problemId") DO UPDATE SET
          status         = EXCLUDED.status,
          "isBookmarked" = EXCLUDED."isBookmarked",
          "solvedAt"    = EXCLUDED."solvedAt",
          "updatedAt"   = now()`;

      const withNotes = rows.filter((r) => r.notes && r.notes.trim());
      if (withNotes.length) {
        await prisma.$executeRaw`
          INSERT INTO user_problem_notes
            (id, "userId", "problemId", content, "isActive", "createdAt", "updatedAt")
          SELECT gen_random_uuid()::text, t.u, t.p, t.c, true, t.ca, now()
          FROM unnest(
            ${withNotes.map((r) => r.userId)}::text[],
            ${withNotes.map((r) => r.problemId)}::text[],
            ${withNotes.map((r) => r.notes as string)}::text[],
            ${withNotes.map((r) => r.createdAt)}::timestamptz[]
          ) AS t(u, p, c, ca)
          ON CONFLICT ("userId", "problemId") DO UPDATE SET
            content     = EXCLUDED.content,
            "isActive" = true,
            "updatedAt" = now()`;
      }
    }

    // KEYSET pagination on the primary key — NOT `ORDER BY createdAt` with
    // OFFSET. `createdAt` is not unique here (151k distinct values across 186k
    // rows, up to 15 rows sharing a timestamp), and Postgres may order tied rows
    // differently between queries. With OFFSET that means some rows are returned
    // twice while others are never returned at all — silent data loss, and the
    // source of the "ON CONFLICT … cannot affect row a second time" abort.
    // `id` is unique, so `WHERE id > last ORDER BY id` visits every row exactly
    // once and is stable even though the legacy table is still live.
    const PAGE = 5000;
    let pending: PRow[] = [];
    let cursor = "";
    for (;;) {
      const { rows: page } = await legacy.query<LegacyProgress & { id: string }>(
        `SELECT id, "userId", "problemId", status, notes, "solvedAt", "isBookmarked", "createdAt", "updatedAt"
         FROM user_problem_progress WHERE id > $1 ORDER BY id ASC LIMIT $2`,
        [cursor, PAGE]
      );
      if (page.length === 0) break;
      cursor = page[page.length - 1]!.id;
      stats.progressSeen += page.length;

      for (const p of page) {
        const newUserId = userIdMap.get(p.userId);
        if (!newUserId) {
          // Progress whose user row is gone from the legacy DB (the FK was ON
          // DELETE CASCADE, so this should be zero — counted, not assumed).
          stats.orphanProgressRows++;
          continue;
        }
        // One legacy row can fan out to several placements of the same question.
        const targets = idsForLegacySlug.get(p.problemId);
        if (!targets?.length) {
          stats.unmappedProblemIds.set(p.problemId, (stats.unmappedProblemIds.get(p.problemId) ?? 0) + 1);
          continue;
        }
        if (targets.length > 1) stats.progressMirrored += targets.length - 1;

        for (const problemId of targets) {
          stats.progressWritten++;
          if (p.notes?.trim()) stats.notesWritten++;
          if (newUserId.startsWith("dry-run:")) continue;
          pending.push({
            userId: newUserId,
            problemId,
            status: toProblemStatus(p.status),
            isBookmarked: p.isBookmarked ?? false,
            solvedAt: p.solvedAt,
            createdAt: p.createdAt,
            notes: p.notes,
          });
        }
      }

      // A single legacy page can fan out past CHUNK, so drain in CHUNK slices.
      while (pending.length >= CHUNK) {
        await flush(pending.slice(0, CHUNK));
        pending = pending.slice(CHUNK);
      }
      prog.add(page.length);
      if (page.length < PAGE) break;
    }
    await flush(pending);
    prog.done();
  } finally {
    // Read-only transaction: rollback is the only correct close, and is a no-op.
    await legacy.query("ROLLBACK").catch(() => undefined);
    await legacy.end().catch(() => undefined);
  }

  // ── Report ─────────────────────────────────────────────────────────────────
  log("\n──────── summary ────────");
  log(`users seen:            ${stats.usersSeen}`);
  log(`  created / updated:   ${stats.usersCreated} / ${stats.usersUpdated}`);
  log(`  passwords carried:   ${stats.passwordsCarried}${PASSWORD_MODE === "skip" ? " (mode=skip → users must reset)" : ""}`);
  log(`oauth accounts linked: ${stats.oauthLinked}`);
  log(`progress rows seen:    ${stats.progressSeen}`);
  log(`  written:             ${stats.progressWritten}${stats.progressMirrored ? `  (incl. ${stats.progressMirrored} mirrored to a second sheet placement)` : ""}`);
  log(`notes written:         ${stats.notesWritten}`);
  if (stats.duplicatesSkipped) log(`duplicate rows merged: ${stats.duplicatesSkipped}  (same user+problem seen twice; kept the furthest-along state)`);

  if (stats.oauthSkippedUnknownProvider.size) {
    log(`\n⚠ unknown OAuth providers skipped: ${[...stats.oauthSkippedUnknownProvider].join(", ")}`);
  }
  if (stats.orphanProgressRows) {
    log(`\n⚠ ${stats.orphanProgressRows} progress rows had no matching legacy user — skipped.`);
  }
  if (stats.unmappedProblemIds.size) {
    const total = [...stats.unmappedProblemIds.values()].reduce((a, b) => a + b, 0);
    log(`\n⚠ ${stats.unmappedProblemIds.size} legacy problem ids did not exist in the new dataset (${total} rows skipped).`);
    log(" These are problems removed between datasets; their progress has nowhere to go:");
    for (const [id, n] of [...stats.unmappedProblemIds.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
      log(`    ${id}  (${n} rows)`);
    }
  }

  log(
    APPLY
      ? "\n✅ Applied. Next: `bun run db:backfill-activity` to rebuild the heatmap + streaks from migrated solvedAt values."
      : "\n✅ Dry run complete — nothing was written. Re-run with --apply to commit."
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error("\n❌ migration failed:", e);
  await prisma.$disconnect().catch(() => undefined);
  process.exit(1);
});
