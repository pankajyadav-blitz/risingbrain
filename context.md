# RisingBrain — Project Context

> Handoff doc to resume work later. Snapshot of the monorepo as initially scaffolded.
> Last updated: 2026-06-26 (session 3 — UI/UX pass: profile dashboard, aptitude
> workspace, sheet progress panel, navbar streak, design system)
>
> **Newest work is in "## Session 3" at the very bottom — read that first to resume.**
> This product lives or dies on UX — treat the "Design system & UX principles"
> notes in Session 3 as the source of truth for any new UI.

## TL;DR

A **Turborepo** monorepo run entirely with **Bun** (package manager **and** runtime — no Node/npm/pnpm).
Next.js 16 web app + shared Tailwind v4 UI library + Prisma (PostgreSQL) + shared Zod/config packages.
All internal packages are scoped `@risingbrain/*`. Status: builds, type-checks, lints, and dev server all pass.

## Stack & pinned versions

| Tool | Version | Notes |
| --- | --- | --- |
| Bun | 1.3.13 | `packageManager` + runtime; `engines.bun >=1.3.0` |
| Turborepo | ^2.10.0 | tasks in `turbo.json` |
| Next.js | 16.2.0 | App Router + Turbopack |
| React | ^19.2.0 | |
| Tailwind CSS | ^4.3.1 | **v4 CSS-first** — `@import "tailwindcss"`, `@theme`, `@tailwindcss/postcss`. No `tailwind.config.ts`. |
| Prisma | ^6.2.1 (client 6.19.x) | PostgreSQL provider |
| Zod | ^3.24.1 | in `packages/core` |
| TypeScript | 5.9.2 | |
| @types/node | ^26.0.1 | per request |
| ESLint | ^9.39.1 | flat config |

## Folder structure

```
risingbrain/                      # root — Bun workspaces (apps/*, packages/*)
├── apps/
│   └── web/                      # Next.js 16 app (name: "web")
│       ├── src/
│       │   ├── app/              # App Router: layout.tsx, page.tsx, globals.css, favicon
│       │   ├── components/       # web-only components (empty, .gitkeep)
│       │   └── lib/              # web-only utils (empty, .gitkeep)
│       ├── public/
│       ├── next.config.js        # transpilePackages: ui, core, database
│       ├── postcss.config.mjs    # @tailwindcss/postcss
│       ├── tsconfig.json         # extends config-typescript/nextjs.json; @/* -> ./src/*
│       └── eslint.config.js      # config-eslint/next-js
│
├── packages/
│   ├── ui/                       # @risingbrain/ui — React + Tailwind v4 components
│   │   ├── src/
│   │   │   ├── button.tsx        # Button (variant/size)
│   │   │   ├── card.tsx          # Card, CardTitle, CardDescription
│   │   │   ├── input.tsx         # Input (forwardRef)
│   │   │   ├── cn.ts             # clsx + tailwind-merge helper
│   │   │   └── styles.css        # standalone Tailwind entry (@import tailwindcss + theme)
│   │   └── package.json          # explicit exports: ./button ./card ./input ./cn ./styles.css
│   │
│   ├── database/                 # @risingbrain/database — Prisma
│   │   ├── prisma/schema.prisma  # ONLY User model (extend later)
│   │   ├── src/index.ts          # prisma client singleton + re-exports @prisma/client
│   │   ├── .env / .env.example   # DATABASE_URL (placeholder; .env gitignored)
│   │   └── package.json          # scripts: db:generate/push/migrate/studio
│   │
│   ├── core/                     # @risingbrain/core — shared logic
│   │   └── src/
│   │       ├── schemas/index.ts  # Zod: userSchema, create/updateUserSchema
│   │       ├── types/index.ts    # User, ApiResponse<T>, Nullable<T>
│   │       └── utils/index.ts    # formatDate, slugify, getErrorMessage
│   │
│   ├── config-tailwind/          # @risingbrain/config-tailwind — Tailwind v4
│   │   ├── theme.css             # @theme tokens (--color-brand etc.)
│   │   └── postcss.config.mjs    # @tailwindcss/postcss
│   │
│   ├── config-typescript/        # @risingbrain/config-typescript
│   │   ├── base.json             # module/moduleResolution: NodeNext
│   │   ├── nextjs.json           # extends base, for the app
│   │   └── react-library.json    # extends base, for ui
│   │
│   └── config-eslint/            # @risingbrain/config-eslint (flat config)
│       ├── base.js               # export const config
│       ├── next.js               # export const nextJsConfig (exported as ./next-js)
│       └── react-internal.js     # export const config (react/prop-types off)
│
├── turbo.json                    # tasks: build, dev, lint, check-types, db:generate, db:push
├── package.json                  # root scripts + Bun workspaces
├── .env.example
├── README.md
└── context.md                    # this file
```

## How Tailwind v4 is wired (important — no config files)

- `packages/config-tailwind/theme.css` holds the full shared theme: brand palette, light + dark variants, `@theme inline` token mapping, and a glass utility layer. **No `tailwind.config.ts`** — everything is CSS-first.
- `apps/web/src/app/globals.css`:
  ```css
  @import "tailwindcss";
  @import "@risingbrain/config-tailwind/theme.css";
  @source "../../../../packages/ui/src/**/*.{ts,tsx}";   /* v4 ignores node_modules; register UI source */
  /* + body base styles and the ambient (var(--ambient)) background wash */
  ```
- PostCSS uses `@tailwindcss/postcss` (no autoprefixer needed in v4).

## Theme — charcoal + green, glassy, light & dark

Palette **ported from the standalone RisingBrain web app** (`../risingbrain/app/globals.css`):
a neutral charcoal base with a single restrained green accent. Defined once in
`packages/config-tailwind/theme.css` and shared by every package/app.

**Two variants, one accent family.** Toggle by adding/removing the `dark` class on `<html>`:
- **Dark** (default — `<html class="dark">`): `--background: #0f1216`, surfaces `#181b1f`/`#1d2126`, brand green `#35a45c`.
- **Light**: `--background: #f4f7f5`, white surfaces, deeper brand green `#1b6240` (kept legible on light).
- The green ramp (`--rb-green-300..900`, e.g. `#7fcf9c`→`#11201a`) is **theme-independent** — the same greens in both modes; only surfaces/foreground invert.

**Semantic tokens → Tailwind utilities** (via `@theme inline`, so they auto-switch with the class):
`bg-background` `text-foreground` `bg-surface` `bg-surface-2` `text-muted` `border-border`
`ring-ring` · accents: `text-brand` `bg-brand` `hover:bg-brand-muted` `text-accent` ·
raw greens: `bg-rb-green-500` etc. · glass: `bg-glass` `bg-glass-2` `border-glass-border`.

**Glass / frosted layer** (component classes in `theme.css`, theme-aware translucent fill + `backdrop-filter` blur):
- `.glass` — frosted card surface (translucent `--glass-bg` + blur + `--shadow-card`).
- `.glass-pill` — lighter frosted chip (nav items, badges, the theme toggle).
- `.glass-hover` — adds lift + green-tinted border on hover (pair with `.glass`).
- `.text-gradient` — single restrained accent-green emphasis text (no actual gradient).
- `.btn-glow` — solid-green accent button. Plus `.animate-in` (float-in) and a green scrollbar.

**Theme switching plumbing:**
- `apps/web/src/app/layout.tsx`: ships `<html class="dark">`, plus a **pre-paint inline script** that reads `localStorage.theme` (defaults to dark) and sets the class → no flash. Uses `suppressHydrationWarning`.
- `apps/web/src/components/theme-toggle.tsx`: `"use client"` button that flips the `dark` class and persists to `localStorage`.

**UI components consume tokens (no hard-coded grays):**
- `Card` is glassy by default (`.glass`); pass `interactive` for `.glass-hover` lift.
- `Button` variants use `bg-brand`/`bg-surface-2`/`border-border`; focus ring = `ring-ring`.
- `Input` is subtly frosted (`bg-glass backdrop-blur-md`).

> When adding new UI: reach for the semantic tokens / glass classes above — **don't hard-code colors or `gray-*`**, or the light/dark switch breaks.

## Key conventions / gotchas

- **Latest features only** — always use the current, non-deprecated APIs of every
  library (Next.js especially) and the latest stable versions. No deprecated
  conventions. Concretely for Next.js 16: use **`proxy.ts`** (not the deprecated
  `middleware.ts`), Turbopack (the default bundler), async `cookies()`/`headers()`/
  `params`/`searchParams`, the App Router + RSC. When something is deprecated,
  migrate to the replacement rather than silencing the warning.
- **Bun only** — never use node/npm/pnpm. Run scripts with `bun run <x>`.
- Internal deps use `"*"` version with Bun workspaces (e.g. `"@risingbrain/ui": "*"`).
- Workspaces live in root `package.json` (not `pnpm-workspace.yaml`) because of Bun.
- `core` & `database` tsconfigs override `module/moduleResolution` to `ESNext`/`Bundler` (+ `noEmit`) so imports don't need `.js` extensions; `database` adds `"types": ["node"]`.
- Packages ship **raw TS/TSX**; the app transpiles them via `transpilePackages` in `next.config.js` — currently only `@risingbrain/ui` and `@risingbrain/core`.
- **Prisma + Turbopack gotcha**: `@risingbrain/database` is intentionally NOT in
  `transpilePackages`, and the web app talks to Prisma through an **app-local
  singleton** (`apps/web/src/lib/db.ts`) that imports `@prisma/client` directly.
  Importing the externalized `@prisma/client` through a transpiled workspace
  package makes Turbopack mint an unresolvable hashed module id
  (`Cannot find module @prisma/client-<hash>`). `@prisma/client` is also listed in
  `serverExternalPackages`. The `database` package still owns the schema + seed.
- `database` Prisma client generates into the hoisted Bun store — run `bun run db:generate` after install / schema changes.
- The landing page now reads the session cookie server-side (for the nav), so it is dynamically rendered.

## Commands

```bash
bun install
bun run db:generate     # prisma generate
bun run dev             # web on http://localhost:3000
bun run build
bun run check-types
bun run lint
bun run format
bun run db:push         # needs real DATABASE_URL
bun run db:migrate
bun run db:studio
```

## Verified working (initial scaffold)

- `bun run build` ✓
- `bun run check-types` ✓ (5/5 packages)
- `bun run lint` ✓
- Theme verified: green `#35a45c`, dark bg `#0f1216`, green-300 `#7fcf9c`, `--glass-bg`, and `backdrop-filter` all present in compiled CSS ✓ (build 2026-06-25)

## Content data (`data/`)

All site content/seed data is consolidated under a single top-level `data/` folder
(ported/curated from `../demo/risingbrain` and the standalone `../risingbrain` app):

```
data/
├── sheets/                     # DSA problem sheets (see sheets/README.md for the design)
│   ├── pattern-wise-sheet.md      # 17 topics · 69 subtopics · 390 problems
│   ├── last-minute-100.md         # 15 topics · 16 subtopics · 106 problems
│   └── README.md                  # index + "how a sheet is designed" notes
└── aptitude/                   # Aptitude & reasoning question banks (MCQ + answers)
    ├── aptitude.md                # Quant — ~70 MCQs across 8 sections
    ├── puzzles.md                 # 21 logic puzzles
    └── logical-reasoning.md       # ~55 MCQs across 8 sections
```

- Sheet design: `Sheet → Topic → Subtopic (strategy + identification) → Problems`
  (problem row: title, `LC` reference, difficulty, companies, LeetCode/GFG/YouTube links).
  Mirrors the live site at https://www.risingbrain.org/sheet (which shows the collapsed view).
- These `.md` files are a readable copy; upstream source of truth is `seed_v2.json` in the demo repo.
- Known cleanups still open in the aptitude data: one syllogism answer uses a unicode fraction
  (`⅗` vs option `3/5`), and the "25 horses" puzzle answer sits on its own line.

## Backbone built (2026-06-25) — schema, datastore, seed

The data/infra foundation is in place and verified against a real Postgres+Redis.

- **`docs/ARCHITECTURE.md`** — the design doc. Read it first. Covers the data model,
  the **from-scratch** auth design (argon2id + arctic OAuth + jose access tokens +
  Redis-backed rotating refresh tokens + one-login-per-user), RBAC + the
  **server-decided** route/tab access strategy, and the course model.
- **`packages/database/prisma/schema.prisma`** — full schema (cuid ids, snake_case
  tables). Domains: users/auth/sessions/oauth/subscriptions, DSA sheets→topics→
  patterns→problems + companies, SQL, unified quiz (aptitude/reasoning/puzzles),
  courses (instructor→course→module→lesson + enrollment/lessonProgress), interview
  experiences (+likes/comments), per-user progress/notes, and the heatmap
  (`Submission` log + pre-aggregated `ActivityDay`).
- **`docker-compose.yml`** — Postgres 17 + Redis 7 (volumes, healthchecks, Redis
  password). Root `.env` / `.env.example` carry the matching `DATABASE_URL`,
  `REDIS_URL`, and auth vars.
- **Seed**: `packages/database/seed/*.json` (DSA from demo `seed_v2.json`, SQL,
  MCQs parsed from `data/aptitude/`, courses, interviews) + idempotent
  `prisma/seed.ts`. Seeded counts verified: **496 DSA problems, 30 companies,
  150 MCQs, 4 SQL, 8 courses, 4 interviews**, admin user `admin@risingbrain.dev`.

**One-command local bring-up:**
```bash
docker compose up -d     # or: bun run db:up   (postgres + redis)
bun run db:setup         # generate + db push + seed
bun run dev              # app on :3000
```

> Seed-data note: 2 of the 152 source MCQs were malformed in the markdown and
> skipped by the parser (150 seeded). Parser lives in scratch; re-runnable.

## Planned features (roadmap)

- Multi-section nav: DSA Sheets · Aptitude · Logical Reasoning · Puzzles · SQL ·
  Courses · Interview · Contests (subscriber) · `/admin` (separate surface).
- **Course tab** is schema-ready (modules/lessons/enrollment) — fill curriculum + UI.
- Access is **server-decided** (middleware + `getNavForRole`): the browser only ever
  receives data for tabs the user's role/subscription allows. No client-side hiding.

## Auth + landing built (2026-06-25)

- **Auth from scratch** (no copied code) under `apps/web/src/lib/auth/`:
  argon2id passwords (`@node-rs/argon2`), arctic OAuth (Google + GitHub), jose
  access JWTs (edge-verified, no DB on hot path), Redis-backed **rotating refresh
  tokens** with reuse detection + **one-login-per-user**, rate limiting
  (`rate-limiter-flexible`). Routes: `/api/auth/{register,login,logout,refresh,me}`
  and `/api/auth/oauth/[provider]{,/callback}`. Cookies are HttpOnly (`rb_at`/`rb_rt`).
- **RBAC** in `src/lib/rbac.ts` (pure/edge-safe): role ranks, `ROUTE_ACCESS` map,
  `checkRouteAccess`, `getNavForRole`. **`src/middleware.ts`** gates routes by JWT.
- **Server-decided nav**: pages resolve the user server-side and pass it down;
  no client-side hiding. Minimal client islands only — `ThemeToggle`,
  `LogoutButton`, `AuthForm`. Mobile menu + FAQ are pure-HTML `<details>` (no JS).
- **Landing page** (`/`) is dynamic (reads the session cookie for the nav) with
  static section components; founder/Anjali + student photos copied to
  `apps/web/public/`. **Auth pages** `/login` + `/signup` share the two-panel
  `AuthForm` (mirrors `../risingbrain`). **`/profile`** page (auth-gated).
- **Typography**: Plus Jakarta Sans (content) + JetBrains Mono (code) via
  `next/font`, wired to `--font-sans`/`--font-mono` theme tokens.

> Docker dev gotcha: an in-container `bun install` without `--frozen-lockfile`
> can desync the generated Prisma client from the cached `.next/dev` chunks
> ("Cannot find module @prisma/client-<hash>"). Fix: recreate the web container +
> the `next_cache` volume so it rebuilds clean (`docker compose rm -sf web &&
> docker volume rm risingbrain_next_cache && docker compose up -d web`).

## Session 2 (2026-06-25) — section pages, interview, auth refresh, polish

### Local dev model CHANGED — app runs on the HOST now (not in Docker)
- `docker-compose.yml` is **datastore-only**: just `postgres` (17) + `redis` (7). The
  `web` service + `Dockerfile.dev` + all the node_modules/next_cache volumes were
  **removed**. The Next app runs on the host with plain `node_modules` — this
  sidesteps the Prisma+Turbopack "Cannot find module `@prisma/client-<hash>`"
  desync entirely (that bug only happened running Next *inside* the container).
- Bring-up:
  ```bash
  docker compose up -d        # postgres + redis  (or: bun run db:up)
  bun install
  bun run db:setup            # generate + push + seed
  bun run dev                 # host, http://localhost:3000
  ```
- **Env gotcha (fixed):** Next only auto-loads `.env` from the app dir, NOT the
  monorepo root. We symlinked **`apps/web/.env -> ../../.env`** (gitignored) so the
  Next runtime sees `AUTH_SECRET`/`REDIS_URL`/etc. Prisma had masked this because
  the Prisma CLI loads root `.env` itself. `AUTH_SECRET` is set to a real value.
- **Dev gotcha:** a stale `next-server` from a previous run can keep holding `:3000`
  (turbo "Tasks: N successful" in the log = the wrapper exited but a child lingers).
  Symptom: edits don't show up. Fix: `pkill -9 -f next-server` then `bun run dev`.
  Free the port with `kill $(ss -tlnp | grep ':3000' | grep -oP 'pid=\K[0-9]+')`.

### Practice surfaces built (the big TODO from session 1 — DONE)
All under `apps/web/src/app/<route>/**` with their API routes under `app/api/<route>/**`.
The page renders a light skeleton server-side; heavy content **lazy-loads on hover**
via route handlers (a deliberate pattern — keeps SSR small, fetches on demand).

- **`/sheet`** (auth-gated). SSR renders sheet→topic skeleton only. A **sheet selector**
  (tabs) picks one sheet; progress is tracked **per sheet** (not combined). Each topic
  is a client accordion that **prefetches its problems on hover** (`GET /api/sheet/topics/[topicId]`,
  module-level cache). Inside, patterns are **collapsible sub-sections** (a topic with a
  single pattern shows problems directly — no one-item accordion). Per problem row:
  two-way **mark-complete** toggle (`POST /api/sheet/progress`), **bookmark** toggle
  (`POST /api/sheet/bookmark`, reuses `UserProblemProgress.isBookmarked`), real
  **company logos** (white-tile `<img>` chip → monogram fallback), and a **note** button
  opening a **floating WYSIWYG modal** (`note-modal.tsx`: `contentEditable` +
  execCommand toolbar Bold/Italic/Underline/Heading/List/Quote/Code, **auto-saves 2s
  after typing**, never writes empty rows; `GET/PUT /api/sheet/notes/[problemId]`).
- **`/sql`** (public). Skeleton list; each card lazy-loads description/approach/solution
  on hover (`GET /api/sql/[id]`) and shows a styled SQL code block.
- **`/aptitude`** (public). **Answer-checking moved to the backend** — SSR ships NO
  answerKey/explanation. User submits → `POST /api/aptitude/check` returns
  `{correct, answerKey, explanation}`. **Per-question progress** (tick/blank dot) +
  **per-category progress bars** for signed-in users, persisted to the new
  `UserQuizProgress` model. Anonymous users see blank dots + a "sign in to track" hint.
- **`/courses`** — a polished **"coming soon"** screen (course listing removed from
  landing + nav offering per request; `/courses/learn` is still the auth-gated stub).
- **`/interview`** (public read; post/like/comment need auth). Full community section:
  listing with client search + verdict/difficulty filters + cards (verdict/difficulty
  badges, rounds, tags, like + comment counts), detail page `/interview/[id]` (body via
  `dangerouslySetInnerHTML`, like bar, comments thread), and a **Composer** modal
  (structured fields + WYSIWYG body) that `POST`s `/api/interview`. Likes toggle in a
  `$transaction` (keeps `likeCount` denormalized); comments via `/api/interview/[id]/comments`.

### Schema change
- Added **`UserQuizProgress`** model (`@@unique([userId, questionId])`, `selectedKey`,
  `isCorrect`, `answeredAt`) + relations on `User.quizProgress` and `QuizQuestion.progress`.
  Pushed with `bun run db:push` (no destructive reset).
- **Note:** schema changes need `bun run db:push` + a **dev server restart** (the running
  Next process holds a stale Prisma client).

### Auth — silent refresh (the "logged out after 15 min" fix)
- Tokens are **HttpOnly** cookies (confirmed): `rb_at` (access, 15m, SameSite=Lax) and
  `rb_rt` (refresh, 30d, SameSite=Strict, Secure in prod). No tokens in localStorage.
- **Refresh cookie path widened `/api/auth` → `/`** (`constants.ts`) so the edge proxy
  can see it. Still HttpOnly+Strict+Secure → CSRF-safe.
- **`proxy.ts`**: on an auth-gated route with an expired/absent access token but a present
  `rb_rt`, it now **redirects to `GET /api/auth/refresh?redirect=<path>`** instead of
  `/login`. That GET handler (Node runtime + Redis) rotates the session, sets fresh
  cookies, and 302s back to the page. Invalid/reused refresh → clears cookies → `/login`
  (reuse-detection intact). No loop.
- **`session-keep-alive.tsx`** client island (mounted in `layout.tsx` only when a session
  cookie exists) `POST`s `/api/auth/refresh` every ~12 min + on tab re-focus, so in-page
  API calls never hit expiry. `layout.tsx` is now `async` (reads cookies).

### Landing / theme polish
- **Theme toggle** rewritten (`theme-toggle.tsx`, Sun/Moon, reads live DOM state, sets
  `color-scheme`). The CSS was already correct — earlier "not working" was a stale cached
  bundle; a hard refresh fixes it.
- **Light theme softened** — pure-white surfaces → a gentle **sage off-white** (`--background
  #e8ebe6`, `--surface #f1f3ee`) in `packages/config-tailwind/theme.css` (less glare).
- **FeatureGrid** ("Everything you need") redesigned (eyebrow, gradient, hover glow) and
  **trimmed to 4** offerings (removed DSA Practice + Contests); dead `/practice` `/contest`
  footer/stat refs cleaned.
- **Reviews** → two-row **auto-marquee** (slow, pause-on-hover, edge fades, reduced-motion
  safe), 12 demo testimonials. Pure-CSS marquee via scoped `<style>` (no JS).
- **AlumniWall** ("hired here") → real **company logos from the DB** in a slow **logo
  marquee** (120s). `company-logo.tsx` client component with a fallback chain
  **Clearbit → Google favicon → monogram** so a logo always shows.
- **All company logos switched to Clearbit** (`logo.clearbit.com/<domain>`) — the seed's
  source URLs used hotlink-blocking hosts (gstatic/figma/freepik). Updated the **live DB**
  AND `seed.ts` (a `COMPANY_DOMAINS` map + `logoFor()` helper) so re-seeds stay reliable.
- `<html data-scroll-behavior="smooth">` added to silence the Next 16 smooth-scroll warning.

### Verified working (session 2)
- `bun run dev` on host; `/`, `/sheet` (authed), `/sql`, `/aptitude`, `/courses`,
  `/interview` all 200. `bunx tsc --noEmit -p apps/web/tsconfig.json` clean.
- Auth: register/login set both cookies; `POST /api/auth/refresh` → 200; `GET
  /api/auth/refresh?redirect=/sheet` with a fresh cookie → 307 → `/sheet`; reused token → `/login`.
- Lazy-load proof: `/sheet` SSR HTML has `leetcode.com` count = 0. Aptitude SSR has
  `answerKey` count = 0.
- Headless browser testing is NOT available here (chrome-headless-shell missing
  `libnspr4.so`, needs sudo) — UI was verified via curl/HTML grep + tsc, not pixels.
  Visual QA is on the user.

## TODO / next steps (tomorrow)

- [ ] **Visual QA pass** in a real browser: theme toggle, light-mode glare, alumni logo
  marquee (confirm logos load — Clearbit vs the Google-favicon fallback), sheet practice
  UX (hover lazy-load, collapsible patterns, notes autosave, bookmarks).
- [ ] **`/admin`** content-management surface (ADMIN-gated) — still not started.
- [ ] Wire the **heatmap** (`Submission` + `ActivityDay`) + streaks into a profile/dashboard;
  `/aptitude` and `/interview` already create `Submission`s, `/sheet` progress does not yet.
- [ ] **Offerings auto-slider** "when we have more entries" (user asked to defer) — the
  reusable CSS marquee pattern from Reviews/AlumniWall is ready to reuse.
- [ ] Real **Google/GitHub OAuth** credentials in `.env` to exercise the social flow.
- [ ] Migrate Prisma `package.json#prisma` seed config to **`prisma.config.ts`** before Prisma 7.
- [ ] Consider a "Bookmarked only" filter on `/sheet` and a notes/bookmarks review view.
- [ ] A few DB logos may still render imperfectly via Clearbit — swap specific brands to
  Wikimedia SVGs if the user flags them.

## Session 3 (2026-06-26) — UI/UX pass (the product is UX-first)

Big push on look & feel across the landing, sheet, aptitude and profile surfaces.
Everything below `bunx tsc --noEmit -p apps/web/tsconfig.json` clean; routes 200
(`/sheet` & `/profile` are auth-gated → 307 to /login for anonymous cur/SSR).
Visual QA still on the user (no headless browser here).

### Design system & UX principles (READ FIRST for any new UI)
- **UX is the product.** Prefer clarity, generous tap targets, live feedback, and
  layouts that don't force scrolling to navigate. When in doubt, optimize the
  flow, not the pixel count.
- **Glass + green theme tokens only** — never hard-code grays/hex. Use
  `bg-surface` `bg-surface-2` `text-foreground` `text-muted` `border-border`
  `text-accent` `text-brand` `bg-rb-green-500` + the `.glass*` classes. Difficulty
  accents are the one sanctioned literal palette: **Easy = emerald, Medium =
  amber, Hard = rose** (used on sheet + profile + aptitude).
- **SVG icons ONLY — no emoji anywhere.** lucide for generic icons; inline
  single-path brand SVGs (fill/stroke `currentColor`) for LeetCode / GfG /
  YouTube; lucide `Trophy` for the sheet-complete celebration. (`grep` the repo
  for emoji before shipping — there should be zero.)
- **Minimal client islands.** Default to server components + pure-HTML `<details>`.
  Native `<details name="...">` gives exclusive accordions; animate open/close
  with `::details-content` + `interpolate-size: allow-keywords` (see FAQ). Add the
  `<DetailsAutoClose/>` island (`components/details-auto-close.tsx`) + a
  `data-autoclose` attr to make any `<details>` dropdown close on outside-click/Esc.
- **Pre-paint / no-flash scripts** go through `next/script` `strategy="beforeInteractive"`
  (not a raw `<script>` — React 19 warns). See `layout.tsx` theme init.
- **Progress is shown as rings/bars and updates live & optimistically.** Reusable
  circular-ring pattern (SVG, `-rotate-90`, `stroke-dashoffset`, % in center) now
  appears in: sheet subcategory headers, the sheet hero progress panel, and the
  profile section cards. Copy that pattern; don't reinvent.
- **Celebrations** (`sheet/_components/celebration.tsx`): a portal overlay with 3
  escalating tiers — pattern (small confetti burst) → topic (bigger burst) → sheet
  (full confetti rain + animated Trophy). Animation-only, no text; grandest tier
  wins when several complete at once; respects reduced-motion.

### Navbar (`components/marketing/navbar.tsx`) — now `async`
- Logout removed from the bar. The **Profile button is a `<details>` dropdown**
  with **Dashboard** (→ `/profile`) + **Logout**; closes on outside-click via
  `DetailsAutoClose`. Mobile menu mirrors it.
- **Animated streak flame** (`components/streak-badge.tsx`): dull/grey when streak
  is 0, warms (amber→orange→red) + glows + flickers faster as it grows. **Only
  rendered for signed-in users** — anonymous/landing visitors trigger NO backend
  call (SEO-safe). Streak comes from `lib/streak.ts#getCurrentStreak` (consecutive
  IST days with DSA `solvedAt` or quiz `answeredAt`).

### Landing (`app/page.tsx`)
- Removed **AlumniWall** ("alumni network") and **UniversityTestimonials**
  ("trusted by universities") sections (+ deleted their files + the now-unused
  `CompanyLogo`). Flow: Hero → Stats → FeatureGrid → Reviews → Founder → Community
  → CtaBanner → Faq.
- FAQ is an **exclusive accordion** (`name="faq"`) with animated open/close.

### DSA Sheet (`app/sheet/**`)
- **Hero is two-ended**: big two-line title ("Master DSA" / "pattern by pattern",
  `text-gradient`, up to `lg:text-6xl`) on the left, a **progress panel on the
  right** (`justify-between`). Hero is passed into the client `SheetSelector` as a
  `header` prop so the panel can live beside it and stay live.
- **ProgressPanel** (`_components/progress-panel.tsx`): combined across ALL sheets.
  A big **total ring** + **Easy/Medium/Hard rings** in a horizontal row (wide, not
  tall). Updates live: each `ProblemRow` reports its difficulty delta through
  `SheetProgressContext` (`_components/sheet-progress.tsx`). Server seeds it from
  `dsaProblem.difficulty` counts (added `difficulty` to the SSR `problemMeta` query).
- **Bigger, taller hierarchy** for accessibility: sheet selector tabs, topic
  accordion rows, pattern (subcategory) rows, and problem rows all enlarged.
  Subcategory header shows a small **circular** `solved/total` ring (not text).
- **Problem row icons** are real brand SVGs now: LeetCode, GeeksforGeeks, YouTube,
  + custom bookmark (filled when saved) and note (doc) icons, with `hover:scale-105`.
- **Company logos**: Clearbit's API is DEAD. `lib/company-logos.ts#logoSources`
  resolves a fallback chain — stored URL (if not Clearbit) → Google favicon
  (`s2/favicons?domain=…&sz=128`) → DuckDuckGo `ip3` → monogram. `CompanyChip`
  walks it on `<img>` error, so logos always render.

### Aptitude (`app/aptitude/**`) — single focused two-pane WORKSPACE
- Decision: **kept ONLY the two-pane workspace** (`_components/aptitude-workspace.tsx`).
  The earlier tabs/subcategory-container variant and the `/aptitude/practice` route
  were removed.
- **Layout = full-height flex chain** (page→main→Container→wrapper→workspace) so the
  workspace fills the space between navbar & footer: **left index always pinned in
  the viewport** (`lg:h-full overflow-y-auto`), **main question paper scrolls
  independently**, footer flush (NO magic `100vh-…` height → no blank space). On
  mobile it's normal flow with a grouped `<select>` topic picker.
- Hierarchy: **Category tabs are the left index groups → subcategory (topic) rows →
  exam-paper questions** (continuous numbering, lettered A/B/C/D options in a
  2-col grid, theory/formula note boxes on top — NOT dropdowns).
- Live progress map across all categories (`category-progress.tsx` provides the
  context; `AptitudeWorkspace` owns the answered state). Shared loader
  `app/aptitude/_data.ts#getAptitudeData` (security: questions ship WITHOUT
  answerKey/explanation; `/api/aptitude/check` validates server-side).

### Profile dashboard (`app/profile/**`) — NEW
- Full page: Navbar + Footer, full landing width, **"Back home" removed** (nav is
  the navbar now). Order: identity header (streak/longest/solved pills) →
  **progress cards** → **activity heatmap**.
- **Heatmap** (`_components/heatmap.tsx`): GitHub/LeetCode-style, **divided into
  month blocks** (equal-width, flex-filled, small square cells), tooltips per day,
  theme-green intensity levels. Driven by REAL signals (DSA `solvedAt` + quiz
  `answeredAt`) bucketed by **IST calendar day** — no submission backfill needed.
  - **Default = rolling trailing 12 months** (today at the end, no future days).
  - **Year switcher** (`<details>` dropdown) shows "Last 12 months" + every year
    from `APP_LAUNCH_YEAR` (2025) to the current year (auto-extends); selecting a
    year shows that full calendar year (Jan–Dec). See `app/profile/_data.ts`.
- **Section cards** (`_components/section-stats.tsx`): DSA / SQL / Aptitude, each a
  % ring + Easy/Medium/Hard bars. Streaks computed from the active-day set (the
  denormalized `User.currentStreak/longestStreak` columns are still NOT maintained).

### Known data gaps surfaced this session (carry forward)
- **SQL has no per-user solve tracking** → SQL "solved" is always 0 on the profile
  dashboard (totals are real). Needs a "mark solved" action on `/sql` + a model.
- **All `QuizQuestion.difficulty` are NULL** → aptitude shows an overall bar, no
  Easy/Med/Hard split. Backfill difficulties to enable it.
- `/sheet` solves still don't write `Submission`/`ActivityDay` rows; the heatmap
  reads `solvedAt` directly instead, which is fine — but the `Submission` log stays
  incomplete for DSA.

### TODO (tomorrow)
- [ ] Browser visual QA of all the above (can't pixel-test here).
- [ ] Add SQL solve tracking; backfill aptitude difficulties (unlocks profile splits).
- [ ] `/admin` surface still not started.
- [ ] Optional: make the navbar streak link to `/profile`; persist `User` streak cols.
