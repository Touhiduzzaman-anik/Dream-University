import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMISSION_CATEGORIES,
  DEMO_INSTITUTIONS,
  countSeededUniversitiesExcludingMedicalCollege,
  filterDemoInstitutions,
} from './demoInstitutions';

test('contains six admission categories and four demo institutions with DMC as Medical College', () => {
  assert.equal(ADMISSION_CATEGORIES.length, 6);
  assert.equal(DEMO_INSTITUTIONS.length, 4);

  const dmc = DEMO_INSTITUTIONS.find((i) => i.code === 'DMC');
  assert.ok(dmc);
  assert.equal(dmc.institutionType, 'Medical College');
  assert.equal(dmc.category, 'medical');
  assert.equal(countSeededUniversitiesExcludingMedicalCollege(DEMO_INSTITUTIONS), 3);

  for (const inst of DEMO_INSTITUTIONS) {
    assert.equal(inst.isDemo, true);
    assert.equal(inst.verificationStatus, 'sample_not_verified');
  }
});

test('filterDemoInstitutions filters by query and category accurately', () => {
  assert.equal(filterDemoInstitutions(DEMO_INSTITUTIONS, '', 'all').length, 4);
  assert.equal(filterDemoInstitutions(DEMO_INSTITUTIONS, 'BUET', 'all')[0]?.code, 'BUET');
  assert.equal(filterDemoInstitutions(DEMO_INSTITUTIONS, 'MBBS', 'medical')[0]?.code, 'DMC');
  assert.equal(filterDemoInstitutions(DEMO_INSTITUTIONS, 'BUET', 'medical').length, 0);
});
