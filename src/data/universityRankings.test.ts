import test from 'node:test';
import assert from 'node:assert/strict';
import { BANGLADESH_INSTITUTIONS_CATALOG } from './bangladeshInstitutions.ts';
import { VERIFIED_BANGLADESH_RANKINGS } from './universityRankings.ts';

test('university rankings dataset includes 100% of catalog institutions, verified 2026 citations, and keeps DMC as Medical College', () => {
  assert.equal(
    VERIFIED_BANGLADESH_RANKINGS.length,
    BANGLADESH_INSTITUTIONS_CATALOG.length,
    'Every institution in catalog must appear in rankings'
  );

  // Verify top global ordering (DU #584 -> BUET 761–770 -> NSU 951–1000 -> DIU 1001–1200)
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[0].code, 'DU');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[0].qsGlobal2026, '#584');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[1].code, 'BUET');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[1].qsGlobal2026, '761–770');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[2].code, 'NSU');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[2].qsGlobal2026, '951–1000');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[3].code, 'DIU');
  assert.equal(VERIFIED_BANGLADESH_RANKINGS[3].qsGlobal2026, '1001–1200');

  const dmc = VERIFIED_BANGLADESH_RANKINGS.find((r) => r.code === 'DMC');
  assert.ok(dmc);
  assert.match(dmc.institutionTypeEn, /Medical College/);

  // Verify every category is covered without omissions
  const categoryOrder = ['public', 'engineering', 'gst', 'private', 'medical', 'national'] as const;
  for (const cat of categoryOrder) {
    const expectedCount = BANGLADESH_INSTITUTIONS_CATALOG.filter((i) => i.category === cat).length;
    const actualCount = VERIFIED_BANGLADESH_RANKINGS.filter((r) => r.category === cat).length;
    assert.equal(actualCount, expectedCount, `Category ${cat} should match catalog count`);
  }

  // Verify unranked institutions (— / —) are grouped in confirmed category-tier order
  const unrankedTierSeq = VERIFIED_BANGLADESH_RANKINGS.filter(
    (r) => r.qsGlobal2026 === '—' && r.theGlobal2026 === '—'
  ).map((r) => categoryOrder.indexOf(r.category));
  for (let i = 1; i < unrankedTierSeq.length; i++) {
    assert.ok(
      unrankedTierSeq[i] >= unrankedTierSeq[i - 1],
      'Unranked institutions must stay ordered by Public -> Engineering -> GST -> Private -> Medical -> National tier'
    );
  }

  for (const row of VERIFIED_BANGLADESH_RANKINGS) {
    assert.ok(row.sourceCitation.length > 0);
    assert.equal(row.citationYear, 2026);
    assert.ok(row.sourceUrl.startsWith('https://'));
    assert.ok(row.bangladeshStandingEn.length > 0);
    assert.ok(row.bangladeshStandingBn.length > 0);
  }
});
