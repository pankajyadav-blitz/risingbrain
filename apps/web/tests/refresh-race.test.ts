/**
 * Refresh-flow verification with the session store DEGRADED (Redis unreachable),
 * which is the condition every one of these scenarios used to fail under.
 *
 * Postgres is stubbed in-memory so the test exercises the real `rotateSession`
 * control flow without touching the production database.
 */
import { describe, expect, test, mock, beforeEach } from "bun:test";
import { createFakePrisma } from "./support/fake-prisma";

process.env.AUTH_SECRET = "test-secret-for-authflow-verification-only";

const db = createFakePrisma();

/** Every Redis call fails, exactly as it does with the server unreachable. */
const redisDown = {
  redis: new Proxy({}, { get: () => () => Promise.reject(new Error("redis down")) }),
  redisTry: async () => null,
  redisAttempt: async () => ({ ok: false as const, error: new Error("redis down") }),
};

mock.module("@/lib/db", () => ({ prisma: db.prisma }));
mock.module("./redis", () => redisDown);
mock.module(require.resolve("../src/lib/auth/redis.ts"), () => redisDown);

const { createSession, rotateSession } = await import("../src/lib/auth/session");

beforeEach(() => db.reset());

async function newSession(): Promise<string> {
  const tokens = await createSession({ userId: "user-1", role: "NORMAL" });
  return tokens.refreshToken as string;
}

describe("refresh with Redis down", () => {
  test("a burst of 3 concurrent refreshes logs nobody out", async () => {
    const token = await newSession();

    const results = await Promise.all([
      rotateSession(token),
      rotateSession(token),
      rotateSession(token),
    ]);

    // None may be null — null is what the route turns into 401 + clearAuthCookies.
    expect(results.every((r) => r !== null)).toBe(true);

    // Exactly one rotates; the rest leave the refresh cookie alone. This is what
    // makes the outcome independent of Set-Cookie ordering.
    expect(results.filter((r) => r!.refreshToken !== null)).toHaveLength(1);

    // Everyone still gets a usable access token.
    expect(results.every((r) => typeof r!.accessToken === "string" && r!.accessToken.length > 0))
      .toBe(true);
  });

  test("the token the browser keeps after a burst still works", async () => {
    const token = await newSession();
    const results = await Promise.all([rotateSession(token), rotateSession(token)]);
    const surviving = results.find((r) => r!.refreshToken !== null)!.refreshToken as string;

    const next = await rotateSession(surviving);
    expect(next).not.toBeNull();
    expect(next!.refreshToken).not.toBeNull();
  });

  test("ten concurrent refreshes still converge on one token", async () => {
    const token = await newSession();
    const results = await Promise.all(Array.from({ length: 10 }, () => rotateSession(token)));

    expect(results.every((r) => r !== null)).toBe(true);
    expect(results.filter((r) => r!.refreshToken !== null)).toHaveLength(1);
  });

  test("an unknown token is still rejected", async () => {
    await newSession();
    expect(await rotateSession("not-a-real-token")).toBeNull();
  });

  test("a rotated-away token is rejected once its grace window lapses", async () => {
    const token = await newSession();
    expect(await rotateSession(token)).not.toBeNull();

    // Still inside the window: served, without minting a competing token.
    const inGrace = await rotateSession(token);
    expect(inGrace).not.toBeNull();
    expect(inGrace!.refreshToken).toBeNull();

    for (const row of db.rows) row.prevRefreshExpiresAt = new Date(Date.now() - 1000);
    expect(await rotateSession(token)).toBeNull();
  });

  test("a revoked session is rejected even inside the grace window", async () => {
    const token = await newSession();
    await rotateSession(token);
    for (const row of db.rows) row.revokedAt = new Date();
    expect(await rotateSession(token)).toBeNull();
  });

  test("an expired session is rejected", async () => {
    const token = await newSession();
    for (const row of db.rows) row.expiresAt = new Date(Date.now() - 1000);
    expect(await rotateSession(token)).toBeNull();
  });
});

describe("database unreachable (the rotated-password outage)", () => {
  test("a failed lookup is 'unavailable', never 'session gone'", async () => {
    const token = await newSession();

    // Every read now fails, exactly as it does when the container can't
    // authenticate to Postgres.
    const boom = () => Promise.reject(new Error("password authentication failed"));
    const findUnique = db.prisma.session.findUnique;
    const findFirst = db.prisma.session.findFirst;
    db.prisma.session.findUnique = boom as typeof findUnique;
    db.prisma.session.findFirst = boom as typeof findFirst;

    try {
      // Must THROW SessionUnavailableError (route -> 503, cookies kept), not
      // return null (route -> 401 + clearAuthCookies -> logged out).
      let threw: unknown;
      try {
        await rotateSession(token);
      } catch (err) {
        threw = err;
      }
      expect(threw).toBeInstanceOf(Error);
      expect((threw as Error).name).toBe("SessionUnavailableError");
    } finally {
      db.prisma.session.findUnique = findUnique;
      db.prisma.session.findFirst = findFirst;
    }
  });
});
