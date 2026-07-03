# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

RisingBrain is a coding-interview prep platform (DSA sheets, SQL practice, aptitude/reasoning quizzes, courses, interview experiences, per-user progress & streak heatmaps). It's a **Bun + Turborepo monorepo**: Bun is both the package manager and the runtime — there is no Node/npm/pnpm. The only app is `apps/web` (Next.js 16 App Router, Turbopack, React 19, Tailwind v4). Data is PostgreSQL via Prisma 7 + Redis.

**Read `docs/ARCHITECTURE.md` before touching auth, RBAC, or the data model** — it explains the *why* behind every design decision and the Prisma schema. (Note: it predates the code in places — e.g. it describes an edge `middleware.ts` that does not exist; see "Gotchas" below.)

## Commands

All commands run from the repo root and go through Turbo unless noted.

```bash
bun install              # install everything
bun run db:up            # start Postgres + Redis via docker compose
bun run db:generate      # generate the Prisma client (required before dev/build)
bun run dev              # web app on http://localhost:3000
bun run build            # build all packages (runs ^db:generate first)
bun run lint             # eslint --max-warnings 0 everywhere
bun run check-types      # next typegen + tsc --noEmit everywhere
bun run format           # prettier --write

# Database (Prisma 7, schema in packages/database)
bun run db:push          # push schema to DB (no migration files)
bun run db:migrate       # create + run a dev migration
bun run db:seed          # reload all content + demo users (idempotent)
bun run db:studio        # Prisma Studio
bun run db:setup         # generate + push + seed in one shot
```

**First-time setup:** copy `.env.example` to `.env`, set `DATABASE_URL`/`AUTH_SECRET`, then `bun run db:up && bun run db:setup && bun run dev`.

There is **no test suite** in this repo. "Verifying a change" means `bun run check-types` + `bun run lint` and exercising the flow in the running app.

### Running a single thing
- One workspace: `bun --filter web <script>` or `bun --filter @risingbrain/database <script>`.
- The web app's own scripts: `dev`, `build`, `start`, `lint`, `check-types` (defined in `apps/web/package.json`).

## Layout

- `apps/web` — the Next.js app. `src/app` (routes), `src/components`, `src/lib` (all business logic: auth, db, cache, rbac, streak).
- `packages/database` — `@risingbrain/database`: Prisma schema, generated client, seed, seed JSON in `seed/`. **Owns all schema/migrations.**
- `packages/core` — `@risingbrain/core`: shared Zod schemas / types / utils.
- `packages/ui` — `@risingbrain/ui`: shared React + Tailwind v4 components (imported by subpath, e.g. `@risingbrain/ui/button`).
- `packages/config-{eslint,tailwind,typescript}` — shared flat configs / theme tokens / tsconfig bases.

All internal packages are scoped `@risingbrain/*`. The web app consumes the Prisma client through `transpilePackages` (generated TS, no build step).

## Architecture you must understand before editing

### Auth (built from scratch — no NextAuth)
Everything lives in `apps/web/src/lib/auth/`. The design is in ARCHITECTURE.md §1.

- **Access token** = short-lived (15 min) HS256 JWT in the `rb_at` HttpOnly cookie. Verified with `jose`, **pure crypto, zero I/O** (`jwt.ts`) — this is what lets authenticated reads scale.
- **Refresh token** = opaque 256-bit random in the `rb_rt` cookie, **rotated on every use** with reuse detection. Only its SHA-256 hash is ever stored (`crypto.ts`, `session.ts`).
- **Session state lives in Redis** (`session:{sid}`, `user:{id}:sid`, `rt:{hash}`), source of truth; the `Session` Postgres row is a durable audit record. **One active session per user** — a new login revokes the previous one (`createSession`).
- `current-user.ts` exposes `getCurrentUser()` (claims only, no DB) and `getCurrentUserProfile()` (DB row); both are wrapped in React `cache()` so a layout + page share one lookup per request.
- OAuth (Google PKCE / GitHub) via `arctic` in `oauth.ts` — only for the provider handshake; sessions are ours.
- OTP signup/reset lives in Redis with TTL + attempt caps (`otp.ts`); the User row is created **only after** email verification. Email via Gmail SMTP (`lib/mail/mailer.ts`).
- Passwords: argon2id via `@node-rs/argon2` (`password.ts`), OWASP cost params. Policy is shared pure code (`password-policy.ts`) so client form and server Zod use identical rules.

**Edge-safety split matters:** `constants.ts`, `jwt.ts`, `rbac.ts`, `password-policy.ts` are pure (no Node/DB/env imports) so they *could* run at the edge. `redis.ts`, `session.ts`, `otp.ts`, `db.ts` are Node-only — never import them from a would-be edge context. `lib/db.ts` is marked `server-only`.

### Access control (server-decided, no client-side hiding)
`apps/web/src/lib/rbac.ts` is the single source of truth. Roles are hierarchical (`NORMAL < STUDENT < SUBSCRIBER < ADMIN`); `ADMIN` alone unlocks `/admin`.
- **There is no `middleware.ts`** despite ARCHITECTURE.md §2 describing one. Route gating is currently enforced **in Server Components / route handlers** via `getCurrentUser()` + `checkRouteAccess()`, and navigation is server-driven: the `(app)` layout renders only the tabs `getNavForRole(role)` returns, so unauthorized links/data never reach the client. `ROUTE_ACCESS` and `checkRouteAccess()` exist and are ready if a middleware is added.
- When adding a gated route, update `ROUTE_ACCESS` and `getNavForRole` in `rbac.ts` — don't hide things with `{isAdmin && ...}` in client components.

### Data model & content caching
Schema: `packages/database/prisma/schema.prisma` (heavily commented). Key rule from ARCHITECTURE.md §3:
- **Shared seeded content** (DSA/SQL/quiz catalogs) is identical for all users → cached cross-request with Next.js `"use cache"` + `cacheTag` (tags in `lib/cache.ts`), busted on demand by `/api/admin/revalidate`. See `app/(app)/sheet/_data.ts` for the canonical `getDsaCatalog()` pattern.
- **Per-user state** (progress, notes, bookmarks, streaks, profile) is **never cached** — read dynamically per request and merged on the server.
- Content trees are per-sheet (DSA: `DsaSheet → DsaTopic → DsaPattern → DsaProblem`); quizzes are one unified MCQ model discriminated by `QuizKind`, so new categories are data, not migrations. `Submission` + `ActivityDay` (pre-aggregated per IST-day) power the heatmap; streaks are computed from real signals in `lib/streak.ts`.

### Conventions to follow
- **Prisma:** `cuid()` ids, `@@map` snake_case tables, camelCase fields. Client components that need a Prisma enum import the pure `@risingbrain/database/enums`, never `lib/db.ts` (which pulls Node built-ins).
- **API write routes** (`app/api/.../route.ts`): check `getCurrentUser()` → 401; rate-limit via the shared guards (`checkWriteLimit`, `isUnknownReference` in `app/api/sheet/_guards.ts` — rate limiting fails *open* if Redis is down); validate payload manually or with Zod; map Prisma P2003 FK violations to 400 not 500. Follow `api/sheet/progress/route.ts` as the template.
- **Optimistic client mutations** use `lib/persist.ts` (`persistJSON`) — retries transient failures, `keepalive: true`, gives up on real 4xx.
- **Route groups:** `(app)` carries the shared navbar/footer chrome; `/login` and `/signup` sit outside it so they render bare. Route-private code goes in `_components/`, `_lib/`, `_data.ts` (underscore-prefixed, not routable).
- **Times/streaks are IST** (UTC+05:30) — day bucketing helpers are duplicated where needed (`lib/streak.ts`, `sheet/_data.ts`); keep the offset consistent.
- **Env access** goes through `lib/env.ts` (validated, fails loud on missing required vars) — don't read `process.env` directly except in the edge-safe pure modules that deliberately avoid `env.ts` (`jwt.ts`, the singletons).
- Prisma singletons (`lib/db.ts`, `auth/redis.ts`) are stashed on `globalThis` to survive hot reload; `redis` uses `lazyConnect` so importing an auth route during `next build` never opens a socket.
