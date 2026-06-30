/**
 * Singleton ioredis client (Node runtime only — never import from middleware).
 * Reused across hot reloads to avoid exhausting connections.
 */
import Redis from "ioredis";
import { env } from "../env";

const globalForRedis = globalThis as unknown as { redis?: Redis };

export const redis =
  globalForRedis.redis ??
  new Redis(env.REDIS_URL, {
    // Don't crash the process on a transient Redis hiccup; auth fails closed.
    maxRetriesPerRequest: 2,
    // Connect on first command, NOT at import. Importing this module must not
    // open a socket — otherwise `next build` (and serverless cold-start) would
    // try to reach Redis just from bundling an auth route. Runtime behaviour is
    // unchanged: the first auth operation establishes the connection.
    lazyConnect: true,
  });

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
