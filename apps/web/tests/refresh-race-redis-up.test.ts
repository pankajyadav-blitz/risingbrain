/**
 * The same refresh scenarios with Redis HEALTHY — the production condition.
 *
 * The Redis-down suite (`refresh-race.test.ts`) proves the Postgres fallback
 * carries the session on its own; this one proves the fast path still behaves, so
 * the fix isn't "correct when degraded, broken when healthy".
 */
import { describe, expect, test, mock, beforeEach } from "bun:test";
import { createFakePrisma } from "./support/fake-prisma";

process.env.AUTH_SECRET = "test-secret-for-authflow-verification-only";

const db = createFakePrisma();
const store = new Map<string, string>();
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

/** Enough of ioredis for the session module: get/set/del/ttl and a multi chain. */
const fakeRedis = {
  async get(key: string): Promise<string | null> {
    await tick();
    return store.get(key) ?? null;
  },
  async set(key: string, value: string): Promise<string> {
    await tick();
    store.set(key, value);
    return "OK";
  },
  async del(key: string): Promise<number> {
    await tick();
    return store.delete(key) ? 1 : 0;
  },
  async ttl(): Promise<number> {
    await tick();
    return 60;
  },
  multi() {
    const ops: (() => void)[] = [];
    const chain = {
      set(key: string, value: string) {
        ops.push(() => store.set(key, value));
        return chain;
      },
      del(key: string) {
        ops.push(() => store.delete(key));
        return chain;
      },
      async exec(): Promise<unknown[]> {
        await tick();
        for (const op of ops) op();
        return [];
      },
    };
    return chain;
  },
};

const redisUp = {
  redis: fakeRedis,
  async redisTry<T>(op: () => Promise<T>): Promise<T | null> {
    try {
      return await op();
    } catch {
      return null;
    }
  },
  async redisAttempt<T>(op: () => Promise<T>) {
    try {
      return { ok: true as const, value: await op() };
    } catch (error) {
      return { ok: false as const, error };
    }
  },
};

mock.module("@/lib/db", () => ({ prisma: db.prisma }));
mock.module("./redis", () => redisUp);
mock.module(require.resolve("../src/lib/auth/redis.ts"), () => redisUp);

const { createSession, rotateSession } = await import("../src/lib/auth/session");

beforeEach(() => {
  db.reset();
  store.clear();
});

async function newSession(): Promise<string> {
  const tokens = await createSession({ userId: "user-1", role: "NORMAL" });
  return tokens.refreshToken as string;
}

describe("refresh with Redis healthy", () => {
  test("a single refresh rotates normally", async () => {
    const token = await newSession();
    const out = await rotateSession(token);
    expect(out).not.toBeNull();
    expect(typeof out!.refreshToken).toBe("string");
    expect(out!.refreshToken).not.toBe(token);
  });

  test("a burst of 10 converges on one token", async () => {
    const token = await newSession();
    const results = await Promise.all(Array.from({ length: 10 }, () => rotateSession(token)));

    expect(results.every((r) => r !== null)).toBe(true);
    expect(results.filter((r) => r!.refreshToken !== null)).toHaveLength(1);
  });

  test("chained bursts never strand the browser's token", async () => {
    // Ten navigations, each firing a 3-request burst — the shape a real session
    // produces once the access token starts lapsing on every page.
    let token = await newSession();
    for (let i = 0; i < 10; i++) {
      const results = await Promise.all([
        rotateSession(token),
        rotateSession(token),
        rotateSession(token),
      ]);
      expect(results.every((r) => r !== null)).toBe(true);
      const rotated = results.filter((r) => r!.refreshToken !== null);
      expect(rotated).toHaveLength(1);
      token = rotated[0]!.refreshToken as string;
    }
    expect(await rotateSession(token)).not.toBeNull();
  });

  test("an unknown token is still rejected", async () => {
    await newSession();
    expect(await rotateSession("not-a-real-token")).toBeNull();
  });

  test("a revoked session is rejected even with a warm cache", async () => {
    const token = await newSession();
    for (const row of db.rows) row.revokedAt = new Date();
    expect(await rotateSession(token)).toBeNull();
  });

  test("an inconsistent rt: pointer no longer kills the session", async () => {
    // A rotation whose `rt:` retire landed but whose session write didn't. The old
    // code read that as token reuse and revoked; Postgres is the authority and says
    // the token is fine.
    const token = await newSession();
    const live = (await rotateSession(token))!.refreshToken as string;

    for (const key of [...store.keys()]) if (key.startsWith("rt:")) store.delete(key);
    const sessionKey = [...store.keys()].find((k) => k.startsWith("session:"))!;
    store.set(`rt:${"0".repeat(64)}`, sessionKey.slice("session:".length));

    expect(await rotateSession(live)).not.toBeNull();
  });
});
