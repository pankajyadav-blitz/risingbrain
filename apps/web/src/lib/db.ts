/**
 * App-local Prisma singleton.
 *
 * Prisma 7 is "Rust-free": there's no query-engine binary, and the client is
 * generated TypeScript (in `@risingbrain/database`'s `generated/` dir, exported
 * as `@risingbrain/database/client` and transpiled via `transpilePackages`).
 * The connection no longer comes from the schema — we pass a `@prisma/adapter-pg`
 * (node-postgres) driver adapter built from `DATABASE_URL`. The database package
 * still owns the schema, migrations and seed.
 *
 * `server-only` guard: the pg driver pulls in Node built-ins (`dns`, etc.), so
 * this module must never reach a client bundle. Client components that need a
 * Prisma enum import it from the pure `@risingbrain/database/enums` instead.
 */
import "server-only";
import { PrismaClient } from "@risingbrain/database/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaAdapter?: PrismaPg;
};

// Pool options tuned for Neon's serverless Postgres, which suspends on idle and
// silently drops connections. `idleTimeoutMillis` recycles connections before
// Neon kills them (so we don't hand out a dead socket → ETIMEDOUT/"Invalid
// invocation"); `keepAlive` + a short connect timeout keep the hot path healthy.
const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 15_000,
    keepAlive: true,
  });

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}

// Re-export the Prisma enums the app uses (runtime const objects in Prisma 7).
export {
  Difficulty,
  InterviewVerdict,
  ProblemStatus,
  QuizKind,
  SubmissionType,
} from "@risingbrain/database/client";

// Types are erased at build time, so this adds no runtime cost.
export type { Prisma, User } from "@risingbrain/database/client";
