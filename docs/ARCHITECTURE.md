# RisingBrain — Architecture & Schema Design

> Design doc for the platform backbone: data model, auth (built from scratch),
> RBAC + route/tab access strategy, and the content domains (DSA sheets, SQL,
> aptitude/reasoning, courses, interview experiences, notes, progress, heatmap).
> Read this **before** the Prisma schema — it explains the *why*.
> Last updated: 2026-06-25

---

## 0. Goals & non-negotiables

- **Security first.** Auth is built from scratch (no copied auth code), following
  current best practices. Argon2id password hashing, short-lived signed access
  tokens, rotating opaque refresh tokens, strict cookies, rate limiting.
- **Scales without melting Postgres.** Redis is the hot path for sessions,
  refresh-token state, rate limiting, and content caching. The DB is the durable
  source of truth, hit only when Redis misses or for writes.
- **One active login per user.** A new login revokes the previous session.
- **Server-decided access.** The Next.js server (middleware + server components)
  decides which tabs/routes a user may see. The browser only ever receives data
  for tabs the user is authorized for — no client-side "hide the admin button".
- **Expandable content model.** Aptitude, DSA, SQL, and Courses are modeled so new
  sheets/topics/courses/sections drop in without migrations or schema churn.

---

## 1. Auth design (from scratch)

We do **not** use NextAuth's session handling. We use small, audited primitives:

| Concern | Choice | Why |
| --- | --- | --- |
| Password hashing | **argon2id** (`argon2`) | Memory-hard, current OWASP recommendation. |
| OAuth (Google, GitHub) | **arctic** | Tiny, audited Authorization-Code-Flow helper (PKCE + state). No heavyweight framework. |
| Access token | **JWT (EdDSA/HS256 via `jose`)**, 15 min TTL | Stateless, verified at the edge (middleware) with **zero** DB/Redis calls. |
| Refresh token | **opaque 256-bit random**, 30 day TTL, **rotated every use** | Long sessions without long-lived bearer secrets; reuse is detectable. |
| Session state | **Redis** (source of truth) + `Session` row (durable audit) | Hot validation in Redis; Postgres survives a Redis flush. |
| Email OTP / password reset | **Redis with TTL** | Ephemeral, high-churn — never touches Postgres. |
| Rate limiting | **`rate-limiter-flexible` on ioredis** | Distributed sliding window; protects login & write endpoints. |

### 1.1 Token model

```
Login / OAuth callback
  └─ verify credentials (argon2) or OAuth identity (arctic)
  └─ create sessionId (cuid)
  └─ revoke any existing session for this user   ← one-login-per-user
  └─ issue:
       access  = JWT { sub: userId, role, sid: sessionId, exp: +15m }   → cookie rb_at (httpOnly)
       refresh = random 32 bytes (base64url)                            → cookie rb_rt (httpOnly, path=/api/auth)
  └─ Redis:  session:{sessionId} = { userId, role, rtHash, exp }   (TTL 30d)
             user:{userId}:sid   = sessionId                        (enforces single session)
  └─ Postgres: Session row (durable record: ua, ip, createdAt, expiresAt, revokedAt)
```

**Access-token verification (every request, middleware):** verify JWT signature +
`exp` with `jose`. No I/O. If valid → request proceeds with `role`/`userId` from
claims. If expired → client silently calls `/api/auth/refresh`.

**Refresh (`/api/auth/refresh`):**
1. Read `rb_rt` cookie, hash it (sha256), look up `session:{sid}` in Redis.
2. If `rtHash` mismatches the stored hash → **token reuse** → revoke the whole
   session (delete Redis keys, set `Session.revokedAt`) and force re-login.
3. Else rotate: new refresh token, update `rtHash` in Redis, issue a new access
   token. Sliding expiry.

**Logout / force-logout:** delete `session:{sid}` and `user:{userId}:sid` in Redis,
set `Session.revokedAt`, clear cookies. Because access tokens are short-lived, a
revoked session can linger at most 15 min; for instant kill we also check a Redis
`denylist:{sid}` flag in middleware when present (cheap, optional).

### 1.2 Why this protects the DB at scale

- The **read-heavy** hot path (validating a logged-in request) is **pure crypto** —
  no DB, no Redis. Millions of authenticated requests cost nothing in I/O.
- Only **refresh** (every ~15 min per active user) touches Redis (one GET + one SET).
- Postgres is written only on login/refresh-rotate/logout, not per request.
- A Redis outage degrades gracefully: access tokens keep working until expiry;
  refresh fails closed (re-login) — Postgres is never stampeded.

### 1.3 Cookies

- `rb_at` — access JWT. `HttpOnly; Secure; SameSite=Lax; Path=/`.
- `rb_rt` — refresh token. `HttpOnly; Secure; SameSite=Strict; Path=/api/auth`.
- No tokens in `localStorage` (XSS-safe). CSRF mitigated by SameSite + a
  double-submit token on state-changing form posts.

---

## 2. Roles, subscriptions & access control

### 2.1 Roles (`Role` enum)

| Role | Who | Gets |
| --- | --- | --- |
| `NORMAL` | Signed-up free user | Free sheets, aptitude, SQL, interview stories (read+post), profile/heatmap, free courses. |
| `STUDENT` | Enrolled in a cohort/course program | NORMAL + cohort/course materials they're enrolled in. |
| `SUBSCRIBER` | Active paid subscription | STUDENT + all premium content (premium sheets/courses, contests). |
| `ADMIN` | Staff | Everything + the separate `/admin` content-management area. |

Roles are **hierarchical for content** but `ADMIN` is the only one that unlocks
`/admin`. Subscription state is tracked separately (a `SUBSCRIBER` whose
subscription lapses is downgraded by a job/route guard).

### 2.2 Server-driven access (the key rule)

> Access is decided on the server. The browser only receives authorized data.

Two enforcement layers:

1. **Edge middleware (`middleware.ts`)** — verifies the access token and applies a
   declarative route→requirement map. Unauthorized requests are redirected
   (`/login` for anon, `/upgrade` for under-privileged) before any page renders.

   ```ts
   const ROUTE_ACCESS = [
     { prefix: "/admin",     require: { role: "ADMIN" } },
     { prefix: "/contest",   require: { minRole: "SUBSCRIBER" } },
     { prefix: "/courses/learn", require: { auth: true } }, // enrollment checked in RSC
     { prefix: "/sheet",     require: { auth: true } },
     { prefix: "/profile",   require: { auth: true } },
     // public: "/", "/login", "/signup", "/sql", "/aptitude", "/interview"
   ]
   ```

2. **Server Components** — a single `getNavForRole(role, subscription)` returns the
   tab list to render. The layout maps over it; unauthorized tabs are never sent to
   the client. Premium page bodies are gated in the RSC: a non-subscriber hitting a
   premium course gets an upsell component, **never** the lesson data.

   No `{isAdmin && <AdminTab/>}` in client components — the privileged markup/data
   simply isn't in the payload.

3. **Admin is a separate surface.** `/admin/*` is its own route group and its own
   simple UI (content CRUD per section). No conditional-rendering spaghetti mixed
   into the user app.

---

## 3. Content domains

All content is **published** server-side and cached in Redis (`content:*`, TTL +
explicit bust on admin edit). User-specific overlays (progress, notes, bookmarks)
are fetched per user and merged on the server.

### 3.1 DSA sheets (mirrors the live `/sheet`)

```
DsaSheet            "Pattern Wise Sheet", "Last Minute 100" (slug, order)
  └─ DsaTopic       Array, Graph, DP …                       (per sheet, order)
       └─ DsaPattern  Two-Pointer, Sliding Window …          (strategy, identification, order)
            └─ DsaProblem  title, reference (LC 167), difficulty,
                           leetcodeUrl, gfgUrl, youtubeUrl, order
                 └─ Company (M:N via ProblemCompany)
```

- The tree is **per-sheet** (a problem row lives in exactly one pattern). The same
  LeetCode problem appearing in two sheets is two rows, linked by an optional
  `canonicalKey` (normalized reference) so we can aggregate "solved once" later
  without a migration.
- `Company` is shared and deduped; logos live on `Company.logoUrl`.

### 3.2 SQL (`/sql`)

```
SqlProblem  title, slug, difficulty, description, bestApproach, solutionQuery,
            tags[] , order   (optional SqlTopic grouping for the future)
```

Self-contained — each problem carries its description, approach, and clean query
(exactly the three-card live layout).

### 3.3 Aptitude / Logical Reasoning / Puzzles (`/aptitude`) — unified MCQ model

One model tree covers all three banks via a `kind` discriminator, so adding a new
quiz category is data, not schema:

```
QuizCategory  kind ∈ {APTITUDE, LOGICAL_REASONING, PUZZLE}   (slug, order)
  └─ QuizTopic   "Number System", "Blood Relation", "Seating" …  (theory?, formula?, order)
       └─ QuizQuestion  prompt, options (Json [{key,label}]), answerKey,
                        explanation?, difficulty?, order
```

Syllogism/“statements + conclusions” questions store their full prompt as
markdown in `prompt`; options stay the uniform `{key,label}` array.

### 3.4 Domain (`/domain`) — core-CS subjects with their own practice sets

```
DomainTopic  subject ∈ {SQL, DBMS, OS, CN, OOPS}, slug, title,
             groupLabel + groupOrder  (left-nav section, e.g. "Module 6 — Transactions & Concurrency"),
             summary?, notes (markdown), order, isPublished
  └─ DomainQuestion  prompt, options (Json [{key,label}]), answerKey,
                     explanation?, difficulty?, order
```

A topic is one markdown body: theory, extracted diagrams (`/study-notes/<subject>/<slug>/fig-N.png`)
and worked code examples all in `notes`. The topic view is a **Notes | Practice**
switch — the same shape as Screening's Notes | Practice paper.

`DomainQuestion` is deliberately a **separate instance** from `QuizQuestion`
rather than a `kind` on it: Screening drills topics that exist only to be
practised, while a domain question hangs off a study topic whose main content is
its notes, and a learner's aptitude score is not their domain score. Domain
questions also carry no `hint` (the source explains each answer after grading
instead), so a mark is simply a correct answer — where a screening mark is
forfeited by opening a hint.

Per-user state mirrors the screening pair, in its own tables:
`UserDomainQuizProgress` (one row per user+question, non-destructive
re-attempts via `isActive`) and `UserDomainTopicScore` (the stored mark per
user+topic). Both cascade with the topic, so a content reseed clears the answers
recorded against the questions it replaces.

### 3.5 Courses (`/courses`) — designed now, fillable later

The schema is ready so we can ship the Courses tab without a migration when the
content is authored.

```
Instructor   name, bio, image, links(Json)
Course       slug, title, blurb, descriptionLong, icon, level, tag,
             priceInPaise, currency, isFree, rating, learnersLabel,
             lessonCount, durationHours, isPublished, order, instructorId
  └─ CourseModule   title, order
       └─ CourseLesson  title, type ∈ {VIDEO, ARTICLE, QUIZ}, durationLabel,
                        videoUrl?, contentUrl?, isPreview, order
Enrollment   userId × courseId (unique), status, progressPercent, enrolledAt, completedAt
  └─ LessonProgress  enrollmentId × lessonId (unique), completedAt
```

A "course schema update" (new modules/lessons, new pricing, new course types) is
additive — new rows or a new `CourseTag`/`LessonType` enum value.

### 3.6 Interview experiences (`/interview`)

```
InterviewExperience  authorId, company, role, verdict ∈ {SELECTED,REJECTED,PENDING},
                     difficulty, roundsCount, title, excerpt, body(markdown),
                     tags[], likeCount(denorm),
                     status ∈ {DRAFT,PENDING_REVIEW,PUBLISHED,REJECTED,ARCHIVED},
                     reviewedById → User, reviewedAt, reviewNote
  ├─ InterviewLike     userId × experienceId (unique)  ← source of truth for likeCount
  └─ InterviewComment  authorId, body, createdAt
```

`likeCount` is denormalized for cheap list rendering; `InterviewLike` rows are the
truth and reconcile it.

#### Moderation gate

`/interview` takes a write-up from **anyone with an account**, so nothing posted
there is publicly readable until an admin approves it. `status` is the gate, and
the whole feature is arranged around one invariant: **every public read path
filters `status = PUBLISHED`** — feed, detail page, likes, comments, sitemap.

```
author submits ──▶ PENDING_REVIEW ──▶ (admin) ──▶ PUBLISHED   live on the feed
                        ▲                     └──▶ REJECTED    + reviewNote → author
                        │                     └──▶ ARCHIVED    removed, replies kept
                        └──── author edits ───────┘            (also: hard DELETE)
```

- **Submission** (`POST /api/interview`) writes `PENDING_REVIEW`. The composer
  shows a "sent for review" receipt rather than navigating to a post that is not
  public yet.
- **Edits re-enter the queue.** `PATCH /api/interview/[id]` forces the row back to
  `PENDING_REVIEW` and clears the review trail. An approval applies to the words a
  moderator actually read; without this, "post something innocuous, wait for the
  approval, then swap in the payload" walks straight past the review.
- **Rulings** are admin-only, at `POST /admin/interview` → `PATCH|DELETE
  /api/admin/interview`: publish · reject (with a note the author sees) ·
  unpublish · archive · **block author** (disables the account, revokes its live
  sessions and rejects everything they have queued) · hard delete (cascades the
  likes and replies — for content that must not merely leave the feed).
  `reviewedById`/`reviewedAt` attribute each decision to a person.
- **Visibility of a non-published post** is limited to its author and admins; to
  everyone else the detail page 404s (so a URL can't confirm a queued post exists)
  and its head is `noindex`. The author sees the status banner, the moderator's
  note, and their outstanding submissions listed on `/interview` itself — a queue
  that swallows posts without a trace reads as data loss.

Seeded interview content sets `status: PUBLISHED` explicitly: it is editorial, not
a user submission, and the column defaults to `PENDING_REVIEW`.

---

## 4. Per-user state: notes, progress, heatmap

### 4.1 Notes (per DSA problem, per user)

`UserProblemNote` — `(userId, problemId)` unique, `content` (markdown), updatedAt.
Kept separate from progress so notes can grow (rich text) and later extend to SQL/
quiz via an added column without touching progress.

### 4.2 Progress & bookmarks

`UserProblemProgress` — `(userId, problemId)` unique: `status`
(`NOT_STARTED|IN_PROGRESS|SOLVED`), `isBookmarked`, `solvedAt`. Indexed by
`userId`, `status`, `isBookmarked` for fast profile/sheet stats.

### 4.3 Heatmap (LeetCode-style) & streak

Two layers:

- **`Submission`** (append-only log): every task the user "submits/completes" —
  `type ∈ {DSA_PROBLEM, MCQ, COURSE_LESSON}`, `referenceId`, `createdAt`. The
  audit trail. Reading a domain topic's notes has no completion state and
  produces nothing; submitting its practice set logs each newly-answered
  question as an `MCQ`, the same kind a screening answer produces.
- **`ActivityDay`** (aggregate for the heatmap): `(userId, day)` unique, `count`
  plus one column per kind (`dsaCount`, `mcqCount`, `courseCount`) — explicit
  columns rather than a Json blob so each can be incremented atomically. The
  profile heatmap is a single indexed range scan over `ActivityDay`, never an
  aggregation over the raw log.

`User.currentStreak / longestStreak / lastActiveOn` are updated alongside
`ActivityDay` (IST day boundaries), so the streak badge needs no computation at
read time.

---

## 5. Redis key map

| Pattern | Purpose | TTL |
| --- | --- | --- |
| `session:{sid}` | active session `{userId, role, rtHash, exp}` | 30d |
| `user:{userId}:sid` | enforce single active session | 30d |
| `denylist:{sid}` | optional instant force-logout flag | until exp |
| `otp:{email}` / `pwreset:{token}` | email verification / reset | 10m |
| `rl:{scope}:{id}` | rate-limiter-flexible buckets | window |
| `content:sheets` / `content:course:{slug}` … | cached published content | until edit |

---

## 6. Local dev topology

`docker-compose.yml` runs **Postgres + Redis** (volumes + healthchecks) so the
whole datastore comes up with one command. The Next app runs on the host
(`bun dev`). One-time setup applies the schema and seeds content:

```
docker compose up -d        # postgres + redis
bun run db:setup            # generate + db push + seed (sheets, MCQs, SQL, courses)
bun run dev                 # app on :3000
```

Seeding is idempotent (upserts by stable slug/key) so re-running is safe.

---

## 7. Open decisions / next phases

1. **This doc + Prisma schema + docker-compose + env** — the backbone (done first).
2. **Seed**: structured JSON (DSA from `seed_v2.json`, MCQs parsed from `data/`,
   SQL/courses authored) + idempotent `prisma/seed.ts`.
3. **Auth implementation**: argon2 + arctic + jose + Redis session lib, the
   `/api/auth/*` routes, `middleware.ts`, and `getNavForRole`.
4. **UI**: static-first landing page (founder/co-founder intro, courses, reviews —
   content captured from the live site), the Courses tab, and the separate `/admin`.
