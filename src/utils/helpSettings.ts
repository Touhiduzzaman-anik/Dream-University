import type { HelpSettingsRecord } from '../types/domain';

export const DEFAULT_WHATSAPP_PHONE = '01753653351';
export const DEFAULT_WHATSAPP_SUBTITLE = 'WhatsApp Direct · 01753653351';
export const DEFAULT_WHATSAPP_MESSAGE =
  'Hello Dream University Team, I need admission guidance.';

export const DEFAULT_HELP_SETTINGS: HelpSettingsRecord = {
  id: 1,
  isEnabled: true,
  showWhatsapp: true,
  whatsappPhone: DEFAULT_WHATSAPP_PHONE,
  whatsappSubtitle: DEFAULT_WHATSAPP_SUBTITLE,
  whatsappMessage: DEFAULT_WHATSAPP_MESSAGE,
  showCareerFinder: true,
  requireLogin: true,
  updatedBy: null,
  updatedAt: new Date(0).toISOString(),
};

export const HELP_SETTINGS_UPDATED_EVENT = 'du:help-settings-updated';

export function dispatchHelpSettingsUpdated(settings: HelpSettingsRecord): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<HelpSettingsRecord>(HELP_SETTINGS_UPDATED_EVENT, {
      detail: settings,
    })
  );
}

/**
 * Normalizes a Bangladeshi or international phone string into clean wa.me digits.
 * Examples:
 * - "01753653351" -> "8801753653351"
 * - "+880 1753-653351" -> "8801753653351"
 * - "8801753653351" -> "8801753653351"
 */
export function normalizeWhatsAppDigits(rawPhone: string): string {
  const digits = String(rawPhone ?? '').replace(/\D/g, '');
  if (!digits) {
    return '8801753653351';
  }
  if (/^01\d{9}$/.test(digits)) {
    return `88${digits}`;
  }
  if (/^1\d{9}$/.test(digits)) {
    return `880${digits}`;
  }
  return digits;
}

export function isValidHelpPhoneNumber(rawPhone: string): boolean {
  const digits = String(rawPhone ?? '').replace(/\D/g, '');
  // Accept standard BD 11-digit mobile (01XXXXXXXXX), 8801XXXXXXXXX (13 digits), or 10-15 international digits
  return digits.length >= 10 && digits.length <= 15;
}

export function buildWhatsAppContactUrl(phone: string, message?: string | null): string {
  const digits = normalizeWhatsAppDigits(phone);
  const trimmedMsg = String(message ?? '').trim();
  if (!trimmedMsg) {
    return `https://wa.me/${digits}`;
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(trimmedMsg)}`;
}

export function sanitizeHelpSettingsPayload(raw: Record<string, unknown>):
  | {
      ok: true;
      data: {
        isEnabled: boolean;
        showWhatsapp: boolean;
        whatsappPhone: string;
        whatsappSubtitle: string;
        whatsappMessage: string;
        showCareerFinder: boolean;
        requireLogin: boolean;
      };
    }
  | { ok: false; error: string } {
  const isEnabled =
    raw.isEnabled !== undefined ? Boolean(raw.isEnabled) : DEFAULT_HELP_SETTINGS.isEnabled;
  const showWhatsapp =
    raw.showWhatsapp !== undefined ? Boolean(raw.showWhatsapp) : DEFAULT_HELP_SETTINGS.showWhatsapp;
  const showCareerFinder =
    raw.showCareerFinder !== undefined
      ? Boolean(raw.showCareerFinder)
      : DEFAULT_HELP_SETTINGS.showCareerFinder;
  const requireLogin =
    raw.requireLogin !== undefined ? Boolean(raw.requireLogin) : DEFAULT_HELP_SETTINGS.requireLogin;

  const rawPhone = String(raw.whatsappPhone ?? DEFAULT_WHATSAPP_PHONE).trim();
  const phone = rawPhone || DEFAULT_WHATSAPP_PHONE;
  if (!isValidHelpPhoneNumber(phone)) {
    return {
      ok: false,
      error: 'Please enter a valid WhatsApp phone number (e.g., 01753653351 or +8801753653351).',
    };
  }

  const rawSubtitle = String(raw.whatsappSubtitle ?? '').trim();
  const whatsappSubtitle = (rawSubtitle || `WhatsApp Direct · ${phone}`).slice(0, 120);

  const rawMessage = String(raw.whatsappMessage ?? '').trim();
  const whatsappMessage = (rawMessage || DEFAULT_WHATSAPP_MESSAGE).slice(0, 500);

  return {
    ok: true,
    data: {
      isEnabled,
      showWhatsapp,
      whatsappPhone: phone.slice(0, 30),
      whatsappSubtitle,
      whatsappMessage,
      showCareerFinder,
      requireLogin,
    },
  };
}

export function normalizeHelpSettingsRecord(
  row:
    | (Omit<Partial<HelpSettingsRecord>, 'updatedAt'> & {
        updatedAt?: string | Date | null;
      })
    | null
    | undefined
): HelpSettingsRecord {
  if (!row) {
    return { ...DEFAULT_HELP_SETTINGS };
  }
  const phone =
    typeof row.whatsappPhone === 'string' && row.whatsappPhone.trim()
      ? row.whatsappPhone.trim()
      : DEFAULT_HELP_SETTINGS.whatsappPhone;
  const subtitle =
    typeof row.whatsappSubtitle === 'string' && row.whatsappSubtitle.trim()
      ? row.whatsappSubtitle.trim()
      : `WhatsApp Direct · ${phone}`;
  const message =
    typeof row.whatsappMessage === 'string' && row.whatsappMessage.trim()
      ? row.whatsappMessage.trim()
      : DEFAULT_HELP_SETTINGS.whatsappMessage;

  return {
    id: typeof row.id === 'number' ? row.id : 1,
    isEnabled: row.isEnabled ?? true,
    showWhatsapp: row.showWhatsapp ?? true,
    whatsappPhone: phone,
    whatsappSubtitle: subtitle,
    whatsappMessage: message,
    showCareerFinder: row.showCareerFinder ?? true,
    requireLogin: row.requireLogin ?? true,
    updatedBy: typeof row.updatedBy === 'string' ? row.updatedBy : null,
    updatedAt:
      row.updatedAt instanceof Date
        ? row.updatedAt.toISOString()
        : typeof row.updatedAt === 'string'
        ? row.updatedAt
        : DEFAULT_HELP_SETTINGS.updatedAt,
  };
}
