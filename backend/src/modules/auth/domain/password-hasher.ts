import argon2 from 'argon2';
import bcrypt from 'bcryptjs';

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, { type: argon2.argon2id });
}

/**
 * Verificación dual compatible con Argon2id y hashes bcrypt ($2y$/$2b$/$2a$) generados por sva_online (PHP).
 */
export async function verifyPassword(storedHash: string, plain: string): Promise<boolean> {
  if (!storedHash || !plain) return false;

  try {
    if (storedHash.startsWith('$argon2')) {
      return await argon2.verify(storedHash, plain);
    }

    if (
      storedHash.startsWith('$2y$') ||
      storedHash.startsWith('$2b$') ||
      storedHash.startsWith('$2a$')
    ) {
      const normalized = storedHash.startsWith('$2y$')
        ? `$2a$${storedHash.slice(4)}`
        : storedHash;
      return await bcrypt.compare(plain, normalized);
    }
  } catch {
    return false;
  }

  return false;
}
