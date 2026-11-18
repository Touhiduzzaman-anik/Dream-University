export const ALLOWED_AVATAR_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

export type AvatarValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateAvatarFileMeta(file: {
  type?: string | null;
  size?: number | null;
}): AvatarValidationResult {
  const mime = String(file.type ?? '').trim().toLowerCase();
  if (!ALLOWED_AVATAR_MIME_TYPES.includes(mime as (typeof ALLOWED_AVATAR_MIME_TYPES)[number])) {
    return {
      ok: false,
      error: 'Please select a valid JPG, PNG, or WebP image file.',
    };
  }

  const size = Number(file.size ?? 0);
  if (!Number.isFinite(size) || size <= 0) {
    return {
      ok: false,
      error: 'Selected image file appears to be empty.',
    };
  }

  if (size > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: 'Profile picture must be 2MB or smaller.',
    };
  }

  return { ok: true };
}

const DATA_URL_REGEX = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/i;

export function estimateBase64ByteLength(base64Payload: string): number {
  const clean = base64Payload.replace(/\s+/g, '');
  if (clean.length === 0 || clean.length % 4 !== 0) {
    return -1;
  }
  const padding = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  return (clean.length * 3) / 4 - padding;
}

export function validateAvatarDataUrl(
  dataUrl: string
): { ok: true; mimeType: string; byteLength: number } | { ok: false; error: string } {
  const trimmed = String(dataUrl ?? '').trim();
  const match = DATA_URL_REGEX.exec(trimmed);
  if (!match) {
    return {
      ok: false,
      error: 'Invalid image format. Only JPG, PNG, and WebP base64 images are allowed.',
    };
  }

  const mimeType = match[1].toLowerCase();
  const payload = match[2];
  const byteLength = estimateBase64ByteLength(payload);
  if (byteLength <= 0) {
    return {
      ok: false,
      error: 'Image data is malformed or empty.',
    };
  }

  if (byteLength > MAX_AVATAR_BYTES) {
    return {
      ok: false,
      error: 'Profile picture exceeds the 2MB maximum size limit.',
    };
  }

  return { ok: true, mimeType, byteLength };
}
