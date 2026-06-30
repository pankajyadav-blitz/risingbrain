/**
 * Password hashing with argon2id (@node-rs/argon2 — prebuilt native binaries,
 * no node-gyp, works under Bun). OWASP-recommended memory-hard parameters.
 */
import { hash, verify } from "@node-rs/argon2";

// @node-rs/argon2 defaults to Argon2id; we set OWASP-recommended cost params.
const OPTIONS = {
  memoryCost: 19456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain, OPTIONS);
  } catch {
    return false;
  }
}
