# DB Migration Plan — demo DB → new-schema DB (preserve users + progress)

> **Purpose of this file:** self-contained handoff so a fresh session can execute the
> migration without re-deriving anything. Read this top to bottom before running commands.

## Goal

Move the **real user data + DSA progress** from the old "demo" database onto the
**current repo's schema**, without losing user accounts or their solve/bookmark/notes
progress. Content (sheets, problems, SQL, quizzes, courses) is *seeded fresh* — only
per-user data is carried over.

## Chosen approach (agreed with user) — copy into a fresh DB

**Do NOT run `prisma db push` / `migrate` directly against the old DB** — it would
auto-drop `password`, `phoneNumber`, `notes` and add a FK that fails on existing rows.

Instead, one-directional copy:

1. **Read-only** export from the old DB (old DB is never mutated → zero risk).
2. Stand up a **fresh** Postgres instance.
3. Apply the **current** schema to it (`db push`) and **seed content** (`db:seed`).
4. **Import** users → oauth accounts → progress/notes, transformed to the new schema.

This is safer than an in-place `ALTER` migration and is the plan of record.

## Locations

| Thing | Path |
|---|---|
| **Old (demo) schema** | `/home/virat/home/demo/risingbrain/prisma/schema.prisma` (Prisma 6-style, `prisma-client-js`) |
| Old demo migrations | `/home/virat/home/demo/risingbrain/prisma/migrations/` — **ignore/do not copy**, they rebuild the *demo* schema |
| **Current (new) schema** | `/home/virat/home/RisingBrain/packages/database/prisma/schema.prisma` (Prisma 7, `prisma-client` generator, output `../generated/prisma`) |
| Seed script | `/home/virat/home/RisingBrain/packages/database/prisma/seed.ts` |
| Seed data | `/home/virat/home/RisingBrain/packages/database/seed/*.json` |
| Password hashing | `apps/web/src/lib/auth/password.ts` → **argon2id** via `@node-rs/argon2` |
| Target DB URL | root `.env` `DATABASE_URL` (symlinked into `packages/database/.env`) |

DB package scripts (run from `packages/database`, uses **bun**):
`db:push` (`prisma db push`), `db:seed` (`bun run prisma/seed.ts`), `db:generate`, `db:studio`.

## Old-DB tables that hold data to migrate

`users`, `accounts` (NextAuth OAuth), `user_problem_progress`.
**Skip** (ephemeral): `sessions`, `verification_otps`, `verification_tokens`.
The old DB has **no content tables** — DSA/etc. lived in JSON files there.

## The one critical mechanic — remap `problemId` via slug

- Old `user_problem_progress.problemId` = a **JSON problem id** (free string, no FK).
- New `user_problem_progress.problemId` = **FK → `dsa_problems.id`** (a `cuid()`).
- The seed (`seed.ts:218`) stores the JSON id in **`dsa_problems.slug`** (`uniqueSlug(p.id)`),
  NOT in `id`. So the mapping is: **old `problemId` == new `dsa_problems.slug`.**

Remap (after content is seeded):
```sql
-- measure overlap FIRST (how much progress will survive):
SELECT
  count(*) FILTER (WHERE d.id IS NOT NULL) AS will_migrate,
  count(*) FILTER (WHERE d.id IS NULL)     AS orphaned
FROM old_progress p
LEFT JOIN dsa_problems d ON d.slug = p."problemId";
```
Progress only survives where the old `problemId`s overlap this repo's `seed/dsa.json` ids.
Orphaned rows (no matching slug) are **reported and skipped**, never fail the run.

⚠️ Slug caveat: seed suffixes duplicates (`<id>-1`, `<id>-2`) when the same JSON id appears
in multiple patterns. The **first** occurrence keeps the bare id, so a plain `slug = problemId`
join covers the common case; suffixed dupes won't match and fall into "orphaned".

## Field mapping

### users → users
| old | new | note |
|---|---|---|
| id | id | preserve (keeps progress FK stable) |
| email | email | preserve (also the upsert key) |
| name (NOT NULL) | name (nullable) | direct |
| password | **passwordHash** | ⚠️ only valid if old hash is argon2id (see open Qs) |
| phoneNumber | **phoneNumber** | ✅ KEPT — `phoneNumber String?` added to `User` (for course launch) |
| image | image | direct |
| emailVerified | emailVerified | direct |
| currentStreak, longestStreak | same | direct |
| lastActivityDate | **lastActiveOn** | rename |
| createdAt, updatedAt | same | preserve createdAt |
| — | role | set `NORMAL` |
| — | username | leave null |

### accounts → oauth_accounts
| old | new | note |
|---|---|---|
| userId | userId | direct |
| provider (String `"google"`) | provider (enum `GOOGLE`/`GITHUB`) | **transform** (uppercase → enum) |
| providerAccountId | providerAccountId | direct |
| refresh_token/access_token/… | *(dropped)* | new app doesn't store OAuth tokens |

### user_problem_progress → user_problem_progress (+ user_problem_notes)
| old | new | note |
|---|---|---|
| userId | userId | direct |
| problemId (JSON id) | problemId (FK) | **remap via slug** (above); skip orphans |
| status | status | enum values identical (`NOT_STARTED/IN_PROGRESS/SOLVED`) |
| isBookmarked | isBookmarked | direct |
| solvedAt | solvedAt | direct |
| notes (String?) | *(moved)* | if non-null → insert into **`user_problem_notes.content`** |
| createdAt, updatedAt | same | direct |

## Step-by-step process

```bash
# 0. BACK UP both ends. Old DB read-only from here on.
pg_dump "$OLD_DB_URL" > backup_old_$(date +%F).sql       # user runs (network)
pg_dump "$NEW_DB_URL" > backup_new_$(date +%F).sql       # if target not empty

# 1. Fresh target DB → apply current schema
cd packages/database
DATABASE_URL="$NEW_DB_URL" bun run db:push
DATABASE_URL="$NEW_DB_URL" bun run db:generate

# 2. Seed CONTENT first (creates dsa_problems w/ slug = JSON id). Non-destructive to users.
DATABASE_URL="$NEW_DB_URL" bun run db:seed

# 3. DRY RUN the importer — connects, prints counts + progress-overlap, writes NOTHING
OLD_DB_URL=... NEW_DB_URL=... bun run scripts/migrate-users.ts --dry-run

# 4. Real import (after reviewing dry-run numbers)
OLD_DB_URL=... NEW_DB_URL=... bun run scripts/migrate-users.ts
```

## Importer script design (`packages/database/scripts/migrate-users.ts`, NOT yet written)

- **Source:** raw `pg` `Client` (old schema ≠ current Prisma client, so read with SQL).
- **Target:** current Prisma client (`../generated/prisma`) via `PrismaPg` adapter.
- Idempotent: upsert users by `email`, oauth by `(provider, providerAccountId)`,
  progress by `(userId, problemId)`, notes by `(userId, problemId)`.
- `--dry-run` flag: do all reads + the overlap join, log a summary table, commit nothing.
- Order: users → oauth_accounts → (build slug→id map from dsa_problems) → progress + notes.
- Log orphaned progress count + a sample of unmatched `problemId`s.

## OPEN QUESTIONS — confirm before the real write

1. 🔑 **Is the old DB's `password` argon2id?** If it's bcrypt/NextAuth/other, copied hashes
   won't verify → those users need a password reset. (New app: `@node-rs/argon2`, argon2id.)
2. ~~Keep `phoneNumber`?~~ ✅ RESOLVED — kept; `phoneNumber String?` added to `User`.
3. **problemId overlap** — run the overlap query in step 3; decide if the survivable % is
   acceptable, or whether `seed/dsa.json` needs aligning with the demo's dataset.
4. **Network egress:** this sandbox may not reach a remote Postgres. If blocked, hand the
   user the script to run via `! bun run scripts/migrate-users.ts` from their machine.

## Status

- [x] Both schemas compared; conflicts + mapping documented (this file).
- [x] Confirmed seed clears only content tables; app uses argon2id.
- [ ] Get OLD_DB_URL (read-only pref) + NEW_DB_URL.
- [ ] Answer open questions 1–2.
- [ ] Write `scripts/migrate-users.ts` (dry-run first).
- [ ] Run dry-run → review overlap → real import → verify counts.
