import test from 'node:test';
import assert from 'node:assert/strict';
import {
  MAX_AVATAR_BYTES,
  estimateBase64ByteLength,
  validateAvatarDataUrl,
  validateAvatarFileMeta,
} from './avatarValidation.ts';

test('validateAvatarFileMeta accepts JPG, PNG, and WebP up to 2MB', () => {
  assert.deepEqual(validateAvatarFileMeta({ type: 'image/jpeg', size: 120_000 }), { ok: true });
  assert.deepEqual(validateAvatarFileMeta({ type: 'image/png', size: MAX_AVATAR_BYTES }), { ok: true });
  assert.deepEqual(validateAvatarFileMeta({ type: 'image/webp', size: 512 }), { ok: true });
});

test('validateAvatarFileMeta rejects unsupported MIME types and >2MB files', () => {
  const badType = validateAvatarFileMeta({ type: 'image/gif', size: 1024 });
  assert.equal(badType.ok, false);

  const svgType = validateAvatarFileMeta({ type: 'image/svg+xml', size: 1024 });
  assert.equal(svgType.ok, false);

  const tooLarge = validateAvatarFileMeta({ type: 'image/png', size: MAX_AVATAR_BYTES + 1 });
  assert.equal(tooLarge.ok, false);

  const emptyFile = validateAvatarFileMeta({ type: 'image/jpeg', size: 0 });
  assert.equal(emptyFile.ok, false);
});

test('validateAvatarDataUrl accepts valid PNG/JPEG/WebP data URLs and rejects invalid or oversized payloads', () => {
  const oneByOnePng =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const valid = validateAvatarDataUrl(oneByOnePng);
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.mimeType, 'image/png');
    assert.ok(valid.byteLength > 0 && valid.byteLength < 200);
  }

  const badFormat = validateAvatarDataUrl('https://example.com/avatar.png');
  assert.equal(badFormat.ok, false);

  const badMime = validateAvatarDataUrl('data:image/svg+xml;base64,PHN2Zz4=');
  assert.equal(badMime.ok, false);

  // Create a base64 string whose decoded length is > 2MB (approx 2.1MB)
  const oversizedBytes = Buffer.alloc(MAX_AVATAR_BYTES + 100, 1).toString('base64');
  assert.ok(estimateBase64ByteLength(oversizedBytes) > MAX_AVATAR_BYTES);
  const oversized = validateAvatarDataUrl(`data:image/jpeg;base64,${oversizedBytes}`);
  assert.equal(oversized.ok, false);
});
