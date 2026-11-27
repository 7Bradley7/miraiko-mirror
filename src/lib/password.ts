// Password hashing (MRK-50): argon2id with the OWASP recommended parameters.
// No "server-only" import: this module is also used by the seed script, outside Next.js.
// @node-rs/argon2 is a native module, so it can never end up in a browser bundle anyway.
import { hash, verify } from "@node-rs/argon2";
import { verifyPassword as verifyScrypt } from "better-auth/crypto";

// OWASP Password Storage Cheat Sheet: argon2id, 19 MiB of memory, 2 iterations, 1 thread.
// The algorithm is argon2id by default in @node-rs/argon2.
const ARGON2_OPTIONS = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export function hashPassword(password: string): Promise<string> {
  return hash(password, ARGON2_OPTIONS);
}

/**
 * Checks a password against a stored hash.
 * Hashes created before MRK-50 used Better Auth's default (scrypt): they are still accepted,
 * and are replaced by an argon2id hash the next time the password is reset or changed.
 */
export function verifyPassword({
  hash: storedHash,
  password,
}: {
  hash: string;
  password: string;
}): Promise<boolean> {
  if (storedHash.startsWith("$argon2")) {
    return verify(storedHash, password);
  }
  return verifyScrypt({ hash: storedHash, password });
}
