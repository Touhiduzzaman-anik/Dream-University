import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildWhatsAppContactUrl,
  DEFAULT_HELP_SETTINGS,
  isValidHelpPhoneNumber,
  normalizeHelpSettingsRecord,
  normalizeWhatsAppDigits,
  sanitizeHelpSettingsPayload,
} from './helpSettings';

test('normalizeWhatsAppDigits formats Bangladeshi and international numbers for wa.me links', () => {
  assert.equal(normalizeWhatsAppDigits('01753653351'), '8801753653351');
  assert.equal(normalizeWhatsAppDigits('+880 1753-653351'), '8801753653351');
  assert.equal(normalizeWhatsAppDigits('8801753653351'), '8801753653351');
  assert.equal(normalizeWhatsAppDigits('1753653351'), '8801753653351');
});

test('buildWhatsAppContactUrl encodes custom greeting messages cleanly', () => {
  const url = buildWhatsAppContactUrl(
    '01811223344',
    'Hi Dream University, help me check DU eligibility!'
  );
  assert.equal(
    url,
    'https://wa.me/8801811223344?text=Hi%20Dream%20University%2C%20help%20me%20check%20DU%20eligibility!'
  );

  assert.equal(buildWhatsAppContactUrl('01753653351', '   '), 'https://wa.me/8801753653351');
});

test('isValidHelpPhoneNumber validates digit length bounds', () => {
  assert.equal(isValidHelpPhoneNumber('01753653351'), true);
  assert.equal(isValidHelpPhoneNumber('+8801753653351'), true);
  assert.equal(isValidHelpPhoneNumber('12345'), false);
});

test('sanitizeHelpSettingsPayload normalizes valid admin updates and rejects invalid numbers', () => {
  const invalid = sanitizeHelpSettingsPayload({
    isEnabled: true,
    whatsappPhone: '123',
  });
  assert.equal(invalid.ok, false);

  const valid = sanitizeHelpSettingsPayload({
    isEnabled: false,
    showWhatsapp: true,
    whatsappPhone: '01811223344',
    whatsappSubtitle: 'Admissions Desk · 9am-6pm',
    whatsappMessage: 'Hello Admissions Desk!',
    showCareerFinder: false,
    requireLogin: false,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.deepEqual(valid.data, {
      isEnabled: false,
      showWhatsapp: true,
      whatsappPhone: '01811223344',
      whatsappSubtitle: 'Admissions Desk · 9am-6pm',
      whatsappMessage: 'Hello Admissions Desk!',
      showCareerFinder: false,
      requireLogin: false,
    });
  }

  const fallbackSubtitle = sanitizeHelpSettingsPayload({
    whatsappPhone: '01911223344',
    whatsappSubtitle: '   ',
    whatsappMessage: '',
  });
  assert.equal(fallbackSubtitle.ok, true);
  if (fallbackSubtitle.ok) {
    assert.equal(fallbackSubtitle.data.whatsappSubtitle, 'WhatsApp Direct · 01911223344');
    assert.equal(fallbackSubtitle.data.whatsappMessage, DEFAULT_HELP_SETTINGS.whatsappMessage);
  }
});

test('normalizeHelpSettingsRecord safely hydrates defaults when fields are absent', () => {
  const defaults = normalizeHelpSettingsRecord(null);
  assert.equal(defaults.isEnabled, true);
  assert.equal(defaults.whatsappPhone, '01753653351');
  assert.equal(defaults.requireLogin, true);
});
