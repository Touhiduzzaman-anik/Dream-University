import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import type { AdminRole } from '../types/domain.ts';

export interface SessionTokenPayload {
  userId: number;
  uid: string;
  email: string | null;
  accountType: 'student' | 'admin';
  adminRole: AdminRole | null;
  exp: number;
}

const DEFAULT_FALLBACK_SECRET = 'dream-university-dev-session-key-2026';

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET || process.env.GEMINI_API_KEY || DEFAULT_FALLBACK_SECRET;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function verifyPassword(password: string, storedHash: string | null | undefined): boolean {
  if (!storedHash) {
    return false;
  }

  // Standard bcrypt hashes ($2a$, $2b$, $2y$)
  if (/^\$2[aby]\$/.test(storedHash)) {
    try {
      return bcrypt.compareSync(password, storedHash);
    } catch {
      return false;
    }
  }

  // Backwards-compatible verification for legacy scrypt hashes (salt:hex)
  if (!storedHash.includes(':')) {
    return false;
  }
  const [salt, keyHex] = storedHash.split(':');
  if (!salt || !keyHex) return false;
  const expected = Buffer.from(keyHex, 'hex');
  const actual = crypto.scryptSync(password, salt, 64);
  if (expected.length !== actual.length) return false;
  return crypto.timingSafeEqual(expected, actual);
}

export function signSessionToken(
  payload: Omit<SessionTokenPayload, 'exp'>,
  secret = getSessionSecret(),
  ttlMs = 7 * 24 * 60 * 60 * 1000
): string {
  const fullPayload: SessionTokenPayload = {
    ...payload,
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${sig}`;
}

export function verifySessionToken(
  token: string,
  secret = getSessionSecret()
): SessionTokenPayload | null {
  if (!token || !token.includes('.')) return null;
  const [encoded, sig] = token.split('.');
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', secret).update(encoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length) return null;
  if (!crypto.timingSafeEqual(sigBuf, expectedBuf)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionTokenPayload;
    if (!parsed || typeof parsed.exp !== 'number' || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
