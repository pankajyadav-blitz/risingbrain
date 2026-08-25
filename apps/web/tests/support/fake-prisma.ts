/**
 * In-memory stand-in for the `session` table, shared by the refresh-race suites.
 *
 * It models the two things those tests turn on: the compare-and-swap semantics of
 * `updateMany` (a WHERE that includes `refreshHash` matches only while the row
 * still holds that hash) and the grace-window lookup on `prevRefreshHash`. Every
 * operation awaits a tick first, so concurrent `rotateSession` calls genuinely
 * interleave instead of running to completion one at a time.
 */

export type SessionRow = {
  id: string;
  userId: string;
  refreshHash: string;
  prevRefreshHash: string | null;
  prevRefreshExpiresAt: Date | null;
  expiresAt: Date;
  revokedAt: Date | null;
  lastUsedAt: Date;
  userAgent: string | null;
  ip: string | null;
  user: { role: string };
};

type Where = {
  id?: string;
  userId?: string;
  refreshHash?: string;
  prevRefreshHash?: string;
  prevRefreshExpiresAt?: { gt: Date };
  revokedAt?: null;
  expiresAt?: { gt: Date };
};

type CreateData = {
  userId: string;
  refreshHash: string;
  expiresAt: Date;
  userAgent?: string | null;
  ip?: string | null;
};

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

export function createFakePrisma() {
  const rows: SessionRow[] = [];
  let seq = 0;

  const matches = (row: SessionRow, where: Where): boolean => {
    if (where.id !== undefined && row.id !== where.id) return false;
    if (where.userId !== undefined && row.userId !== where.userId) return false;
    // The compare-and-swap predicate. Postgres locks the row so it is evaluated
    // against committed state; here the filter and the assignment below happen in
    // one synchronous turn, which gives the same all-or-nothing behaviour.
    if (where.refreshHash !== undefined && row.refreshHash !== where.refreshHash) return false;
    if (where.prevRefreshHash !== undefined && row.prevRefreshHash !== where.prevRefreshHash) {
      return false;
    }
    if (where.revokedAt === null && row.revokedAt !== null) return false;
    if (where.expiresAt?.gt !== undefined && !(row.expiresAt > where.expiresAt.gt)) return false;
    if (where.prevRefreshExpiresAt?.gt !== undefined) {
      if (row.prevRefreshExpiresAt === null) return false;
      if (!(row.prevRefreshExpiresAt > where.prevRefreshExpiresAt.gt)) return false;
    }
    return true;
  };

  const session = {
    async create({ data }: { data: CreateData }): Promise<SessionRow> {
      await tick();
      const row: SessionRow = {
        id: `sid-${++seq}`,
        userId: data.userId,
        refreshHash: data.refreshHash,
        prevRefreshHash: null,
        prevRefreshExpiresAt: null,
        expiresAt: data.expiresAt,
        revokedAt: null,
        lastUsedAt: new Date(),
        userAgent: data.userAgent ?? null,
        ip: data.ip ?? null,
        user: { role: "NORMAL" },
      };
      rows.push(row);
      return row;
    },

    async findUnique({ where }: { where: Where }): Promise<SessionRow | null> {
      await tick();
      return rows.find((r) => matches(r, where)) ?? null;
    },

    async findFirst({ where }: { where: Where }): Promise<SessionRow | null> {
      await tick();
      return rows.find((r) => matches(r, where)) ?? null;
    },

    async findMany({ where }: { where: Where }): Promise<SessionRow[]> {
      await tick();
      return rows.filter((r) => matches(r, where));
    },

    async updateMany({
      where,
      data,
    }: {
      where: Where;
      data: Partial<SessionRow>;
    }): Promise<{ count: number }> {
      await tick();
      const matched = rows.filter((r) => matches(r, where));
      for (const row of matched) Object.assign(row, data);
      return { count: matched.length };
    },

    async update({
      where,
      data,
    }: {
      where: { id: string };
      data: Partial<SessionRow>;
    }): Promise<SessionRow | null> {
      await tick();
      const row = rows.find((r) => r.id === where.id) ?? null;
      if (row) Object.assign(row, data);
      return row;
    },
  };

  return {
    prisma: { session },
    rows,
    reset() {
      rows.length = 0;
      seq = 0;
    },
  };
}
