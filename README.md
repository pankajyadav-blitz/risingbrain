# RisingBrain

A [Turborepo](https://turborepo.dev) monorepo powered entirely by **[Bun](https://bun.sh)** (package manager **and** runtime — no Node/npm/pnpm), with a Next.js app, a shared Tailwind v4 UI library, Prisma, and shared config packages.

## Stack

- **Bun** 1.3+ — install, scripts, and runtime
- **Turborepo** — task orchestration & caching
- **Next.js 16** (App Router, Turbopack) in `apps/web`
- **Tailwind CSS v4** (CSS-first `@import "tailwindcss"` + `@theme`)
- **Prisma 6** (PostgreSQL) in `packages/database`
- **Zod** schemas + shared types in `packages/core`

## Structure

```
risingbrain/
├── apps/
│   └── web/                  # Next.js app (src/app, src/components, src/lib)
├── packages/
│   ├── ui/                   # Shared React + Tailwind component library
│   ├── database/             # Prisma schema (User) + client singleton
│   ├── core/                 # Zod schemas, shared types, utils
│   ├── config-tailwind/      # Shared Tailwind v4 theme (@theme tokens)
│   ├── config-typescript/    # Shared tsconfig bases
│   └── config-eslint/        # Shared ESLint flat configs
├── turbo.json
└── package.json              # Bun workspaces: apps/*, packages/*
```

All internal packages are scoped `@risingbrain/*`.

## Getting started

```bash
bun install            # install everything
bun run db:generate    # generate the Prisma client
bun run dev            # start the web app on http://localhost:3000
```

Copy `.env.example` to `.env` and set `DATABASE_URL` before using the database.

## Commands

| Command | Description |
| --- | --- |
| `bun run dev` | Run all apps in dev mode |
| `bun run build` | Build all apps & packages |
| `bun run lint` | Lint everything |
| `bun run check-types` | Type-check everything |
| `bun run format` | Prettier write |
| `bun run db:generate` | `prisma generate` |
| `bun run db:push` | Push schema to the database |
| `bun run db:migrate` | Create & run a dev migration |
| `bun run db:studio` | Open Prisma Studio |

## Database

Only the `User` model is defined in `packages/database/prisma/schema.prisma` — extend it as needed, then run `bun run db:generate` (and `bun run db:push` / `bun run db:migrate`).
