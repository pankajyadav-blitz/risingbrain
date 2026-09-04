import { defineConfig, env } from "prisma/config";

/**
 * Prisma config. In Prisma 7 the datasource connection URL is no longer allowed
 * in `schema.prisma`; the CLI (migrate / db push / studio) reads it from here.
 * The runtime PrismaClient gets its connection via the `@prisma/adapter-pg`
 * driver adapter instead (see src/index.ts).
 *
 * With a config file present, Prisma no longer auto-loads `.env`, so we load it
 * ourselves before `env("DATABASE_URL")` is resolved. Uses the built-in
 * `process.loadEnvFile()` (Node 20.12+/Bun) — no dotenv dependency.
 */
try {
  process.loadEnvFile();
} catch {
  // No local .env (e.g. CI with real env vars already set) — that's fine.
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    /**
     * Migrations need a DIRECT connection, never a transaction pooler.
     * PgBouncer/Neon-pooler style poolers break DDL and the advisory lock Prisma
     * takes to serialise migrations, so `migrate deploy` can hang or half-apply.
     * The app itself still uses the POOLED `DATABASE_URL` (see src/index.ts).
     *
     * Set DIRECT_DATABASE_URL to the unpooled endpoint:
     *   Railway -> DATABASE_UNPOOLED_URL   Neon -> the non `-pooler` host
     * Falls back to DATABASE_URL when no pooler is in play (e.g. local dev).
     */
    url: process.env.DIRECT_DATABASE_URL ?? env("DATABASE_URL"),
  },
  migrations: {
    seed: "bun run prisma/seed.ts",
  },
});
