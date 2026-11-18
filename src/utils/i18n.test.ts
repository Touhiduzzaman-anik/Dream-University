import test from 'node:test';
import assert from 'node:assert/strict';
import { translations, t } from './i18n';

test('every English translation key has a non-empty Bangla counterpart', () => {
  const enKeys = Object.keys(translations.en) as Array<keyof typeof translations.en>;
  const bnKeys = Object.keys(translations.bn);

  assert.equal(enKeys.length, bnKeys.length, 'EN and BN dictionaries should have identical key counts');

  for (const key of enKeys) {
    assert.ok(key in translations.bn, `Missing Bangla key: ${key}`);
    assert.ok(translations.en[key].trim().length > 0, `Empty EN value for key: ${key}`);
    assert.ok(translations.bn[key].trim().length > 0, `Empty BN value for key: ${key}`);
  }
});

test('t() returns localized copy for en and bn', () => {
  assert.equal(t('en', 'brandName'), 'Dream University');
  assert.equal(t('bn', 'brandName'), 'ড্রিম ইউনিভার্সিটি');
});
