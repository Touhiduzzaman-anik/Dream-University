import type { TranslationKey } from './i18n.ts';

export interface ValidationErrors {
  fullName?: TranslationKey;
  identifier?: string;
  email?: TranslationKey;
  phone?: TranslationKey;
  password?: TranslationKey;
  confirmPassword?: string;
  otp?: TranslationKey;
}

const STRICT_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const BD_MOBILE_REGEX = /^(?:\+88)?01[3-9]\d{8}$/;

const BLOCKED_DUMMY_AND_DISPOSABLE_DOMAINS = new Set([
  'test.com',
  'test.org',
  'test.net',
  'abc.com',
  '123.com',
  'example.com',
  'example.org',
  'example.net',
  'dummy.com',
  'fake.com',
  'invalid.com',
  'mailinator.com',
  'tempmail.com',
  '10minutemail.com',
  'guerrillamail.com',
  'yopmail.com',
  'trashmail.com',
  'throwawaymail.com',
  'getnada.com',
  'dispostable.com',
  'fakeinbox.com',
]);

const BLOCKED_EXACT_DUMMY_EMAILS = new Set([
  'test@test.com',
  'abc@abc.com',
  '123@123.com',
  'admin@admin.com',
  'user@user.com',
  'demo@demo.com',
  'fake@fake.com',
  'asdf@asdf.com',
  'qwerty@qwerty.com',
  'example@example.com',
]);

export function isDummyOrDisposableEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  if (!normalized.includes('@')) return true;
  if (BLOCKED_EXACT_DUMMY_EMAILS.has(normalized)) return true;

  const [localPart, domain] = normalized.split('@');
  if (!localPart || !domain) return true;
  if (BLOCKED_DUMMY_AND_DISPOSABLE_DOMAINS.has(domain)) return true;

  const domainParts = domain.split('.');
  const secondLevelLabel = domainParts[0] || '';
  if (localPart === secondLevelLabel && localPart.length <= 6) {
    return true;
  }

  // Block repeated single-character local parts like aaa@domain.com or 111@domain.com
  if (/^(.)\1{2,}$/.test(localPart)) {
    return true;
  }

  return false;
}

export function isValidEmail(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  if (!STRICT_EMAIL_REGEX.test(trimmed)) return false;
  if (trimmed.includes('..')) return false;
  if (isDummyOrDisposableEmail(trimmed)) return false;
  return true;
}

export function isValidBangladeshPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return BD_MOBILE_REGEX.test(cleaned);
}

export function normalizeBangladeshPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  return cleaned.replace(/^\+88/, '');
}

export function maskAuthIdentifier(
  identifier: string,
  identifierType: 'email' | 'phone'
): string {
  if (identifierType === 'phone') {
    const norm = normalizeBangladeshPhone(identifier);
    return `${norm.slice(0, 3)}****${norm.slice(-4)}`;
  }
  const [local, domain] = identifier.split('@');
  if (!local || !domain) return identifier;
  const visible = local.slice(0, Math.min(3, local.length));
  return `${visible}***@${domain}`;
}

export type ParsedAuthIdentifier =
  | {
      ok: true;
      identifierType: 'email' | 'phone';
      identifier: string;
      maskedDestination: string;
    }
  | {
      ok: false;
      error: string;
    };

export function parseAndValidateAuthIdentifier(rawInput: string): ParsedAuthIdentifier {
  const trimmed = String(rawInput ?? '').trim();
  if (!trimmed) {
    return {
      ok: false,
      error: 'Please enter your Email Address or 11-digit Bangladeshi Mobile Number.',
    };
  }

  if (trimmed.includes('@')) {
    const lower = trimmed.toLowerCase();
    if (!STRICT_EMAIL_REGEX.test(lower) || lower.includes('..')) {
      return {
        ok: false,
        error: 'Please enter a valid email address (e.g., name@gmail.com).',
      };
    }
    if (isDummyOrDisposableEmail(lower)) {
      return {
        ok: false,
        error: 'Dummy or disposable emails (e.g., test@test.com, abc@abc.com) are not allowed.',
      };
    }
    return {
      ok: true,
      identifierType: 'email',
      identifier: lower,
      maskedDestination: maskAuthIdentifier(lower, 'email'),
    };
  }

  if (isValidBangladeshPhone(trimmed)) {
    const normalizedPhone = normalizeBangladeshPhone(trimmed);
    return {
      ok: true,
      identifierType: 'phone',
      identifier: normalizedPhone,
      maskedDestination: maskAuthIdentifier(normalizedPhone, 'phone'),
    };
  }

  return {
    ok: false,
    error:
      'Enter a valid email or 11-digit Bangladeshi mobile number starting with 013–019 (e.g., 01712345678).',
  };
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

export function isValidFourDigitOtp(otp: string): boolean {
  return /^\d{4}$/.test(otp.trim());
}

export function isValidOtp(otp: string): boolean {
  return isValidFourDigitOtp(otp);
}

export function isValidGpa(gpa: number): boolean {
  return Number.isFinite(gpa) && gpa >= 1.0 && gpa <= 5.0;
}

export function isValidZeroToFiveGpa(gpa: number): boolean {
  return Number.isFinite(gpa) && gpa >= 0.0 && gpa <= 5.0;
}

export function validateStudentRegistration(input: {
  fullName: string;
  identifier: string;
  password: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  if (input.fullName.trim().length < 2) {
    errors.fullName = 'errNameRequired';
  }
  const parsed = parseAndValidateAuthIdentifier(input.identifier);
  if (parsed.ok === false) {
    errors.identifier = parsed.error;
  }
  if (!isValidPassword(input.password)) {
    errors.password = 'errPasswordShort';
  }
  return errors;
}

export function validateLoginCredentials(input: {
  identifier: string;
  password: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const trimmed = String(input.identifier ?? '').trim();
  if (!trimmed) {
    errors.identifier = 'Please enter your Email Address or 11-digit Bangladeshi Mobile Number.';
  } else if (trimmed.includes('@')) {
    const lower = trimmed.toLowerCase();
    if (!STRICT_EMAIL_REGEX.test(lower) || lower.includes('..')) {
      errors.identifier = 'Please enter a valid email address (e.g., name@gmail.com).';
    }
  } else if (!isValidBangladeshPhone(trimmed)) {
    errors.identifier =
      'Enter a valid email or 11-digit Bangladeshi mobile number starting with 013–019 (e.g., 01712345678).';
  }
  if (!input.password) {
    errors.password = 'errPasswordRequired';
  }
  return errors;
}

export function validateOtpReset(input: {
  identifier: string;
  otp: string;
  newPassword: string;
  confirmPassword: string;
}): ValidationErrors {
  const errors: ValidationErrors = {};
  const parsed = parseAndValidateAuthIdentifier(input.identifier);
  if (parsed.ok === false) {
    errors.identifier = parsed.error;
  }
  if (!isValidFourDigitOtp(input.otp)) {
    errors.otp = 'errOtpInvalid';
  }
  if (!isValidPassword(input.newPassword)) {
    errors.password = 'errPasswordShort';
  }
  if (input.newPassword !== input.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }
  return errors;
}
