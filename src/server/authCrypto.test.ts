import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from './authCrypto';

test('hashPassword produces bcrypt hash and verifyPassword validates matching/wrong passwords', () => {
  const hash = hashPassword('Admission2026!');
  assert.match(hash, /^\$2[aby]\$/);
  assert.equal(verifyPassword('Admission2026!', hash), true);
  assert.equal(verifyPassword('WrongPass99', hash), false);
  assert.equal(verifyPassword('Admission2026!', null), false);
});

test('verifyPassword maintains backwards compatibility for legacy scrypt hashes', () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync('LegacyStudent@2026', salt, 64).toString('hex');
  const legacyHash = `${salt}:${derived}`;
  assert.equal(verifyPassword('LegacyStudent@2026', legacyHash), true);
  assert.equal(verifyPassword('WrongPass', legacyHash), false);
});

test('signSessionToken and verifySessionToken round-trip payload for two-tier admins and reject tampering or expiry', () => {
  const secret = 'test-secret-key';
  const token = signSessionToken(
    {
      userId: 42,
      uid: 'admin-42',
      email: 'owner@dreamuniversity.edu.bd',
      accountType: 'admin',
      adminRole: 'super_admin',
    },
    secret,
    60_000
  );

  const verified = verifySessionToken(token, secret);
  assert.ok(verified);
  assert.equal(verified?.userId, 42);
  assert.equal(verified?.accountType, 'admin');
  assert.equal(verified?.adminRole, 'super_admin');

  assert.equal(verifySessionToken(`${token}tamper`, secret), null);

  const expired = signSessionToken(
    {
      userId: 42,
      uid: 'local-42',
      email: 'student@example.com',
      accountType: 'student',
      adminRole: null,
    },
    secret,
    -1000
  );
  assert.equal(verifySessionToken(expired, secret), null);
});
