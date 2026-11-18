import test from 'node:test';
import assert from 'node:assert/strict';
import { BANGLADESH_INSTITUTIONS_CATALOG } from './bangladeshInstitutions.ts';

test('BANGLADESH_INSTITUTIONS_CATALOG contains 100+ unique verified Bangladeshi institutions across all 6 categories', () => {
  assert.ok(BANGLADESH_INSTITUTIONS_CATALOG.length >= 100, 'Expected at least 100 institutions');

  const codes = new Set(BANGLADESH_INSTITUTIONS_CATALOG.map((i) => i.code));
  assert.equal(codes.size, BANGLADESH_INSTITUTIONS_CATALOG.length, 'Every institution code must be unique');

  const categories = new Set(BANGLADESH_INSTITUTIONS_CATALOG.map((i) => i.category));
  for (const required of ['public', 'private', 'medical', 'gst', 'engineering', 'national'] as const) {
    assert.ok(categories.has(required), `Missing category: ${required}`);
  }

  const dmc = BANGLADESH_INSTITUTIONS_CATALOG.find((i) => i.code === 'DMC');
  assert.ok(dmc, 'DMC must exist');
  assert.equal(dmc.institutionType, 'Medical College');
  assert.equal(dmc.establishedYear, 1946);

  const du = BANGLADESH_INSTITUTIONS_CATALOG.find((i) => i.code === 'DU');
  assert.ok(du, 'DU must exist');
  assert.equal(du.establishedYear, 1921);

  const seenImages = new Set<string>();
  const seenFilenames = new Set<string>();

  for (const inst of BANGLADESH_INSTITUTIONS_CATALOG) {
    assert.ok(inst.officialWebsite.startsWith('http'), `Invalid URL for ${inst.code}`);
    if (inst.imageUrl !== null) {
      assert.ok(
        inst.imageUrl.startsWith('https://'),
        `Expected verified HTTPS URL or null for ${inst.code}, got: ${inst.imageUrl}`
      );
      assert.ok(
        !inst.imageUrl.includes('/images/universities/'),
        `Shared local fallback path forbidden for ${inst.code}: ${inst.imageUrl}`
      );
      assert.ok(!seenImages.has(inst.imageUrl), `Duplicate imageUrl reused on ${inst.code}: ${inst.imageUrl}`);
      seenImages.add(inst.imageUrl);
      const fname = decodeURIComponent(inst.imageUrl.split('/').pop() || '').toLowerCase();
      assert.ok(!seenFilenames.has(fname), `Duplicate image filename reused on ${inst.code}: ${fname}`);
      seenFilenames.add(fname);
    }
    assert.ok(inst.programsEn.length > 0, `Missing programsEn for ${inst.code}`);
    assert.ok(!/[\{\}\[\]\|]|cite /i.test(inst.nameEn), `Wikitext artifact in nameEn for ${inst.code}: ${inst.nameEn}`);
    assert.ok(!/[\{\}\[\]\|]|cite /i.test(inst.code) && inst.code.length <= 16, `Invalid code: ${inst.code}`);
    assert.ok(
      typeof inst.establishedYear === 'number' && inst.establishedYear >= 1800 && inst.establishedYear <= 2026,
      `Invalid establishedYear for ${inst.code}: ${inst.establishedYear}`
    );
    assert.ok(!/^\d+$/.test(inst.city), `Invalid numeric city for ${inst.code}: ${inst.city}`);
  }
});
