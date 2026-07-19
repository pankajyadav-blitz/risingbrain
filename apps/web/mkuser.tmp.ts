import { PrismaClient } from "@risingbrain/database/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "@node-rs/argon2";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const passwordHash = await hash("RedisFallback!2026", { memoryCost: 19456, timeCost: 2, parallelism: 1 });
const u = await prisma.user.upsert({
  where: { email: "redis-fallback-test@risingbrain.dev" },
  update: { passwordHash },
  create: { email: "redis-fallback-test@risingbrain.dev", name: "Auth Test", passwordHash, emailVerified: new Date() },
});
console.log("user:", u.id);
await prisma.$disconnect();
