import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * node-postgres defaults to `max: 10` connections PER POOL. On a long-lived
 * server that is one pool, so 10 total — fine. On Vercel it is one pool per
 * concurrent function instance, so 20 concurrent invocations can demand 200
 * connections and exhaust Postgres (or the pooler's client limit) under a spike.
 * Keep it small there and leave the roomier default for the container deploy.
 * Override explicitly with DATABASE_POOL_MAX if a deploy needs something else.
 */
const poolMax = Number(process.env.DATABASE_POOL_MAX ?? (process.env.VERCEL ? 3 : 10));

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
  max: poolMax,
});

/**
 * Singleton Prisma client. Prisma 7 connects through a driver adapter
 * (`@prisma/adapter-pg`) built from `DATABASE_URL` rather than a schema `url`.
 * Reused across hot reloads in development to avoid exhausting connections.
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
