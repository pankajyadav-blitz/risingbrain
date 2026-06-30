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
    url: env("DATABASE_URL"),
  },
  migrations: {
    seed: "bun run prisma/seed.ts",
  },
});
