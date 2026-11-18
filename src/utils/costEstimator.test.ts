import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePrivateUniversityCost } from './costEstimator';

test('calculates total tuition cost with scholarship waiver and budget comparison', () => {
  const base = calculatePrivateUniversityCost({
    perCreditFeeBdt: 5200,
    totalCredits: 148,
    semesterFeeBdt: 15000,
    semesters: 8,
    admissionFeeBdt: 25000,
    waiverPercent: 0,
    studentBudgetBdt: 1000000,
  });

  assert.equal(base.grossTuitionBdt, 769600);
  assert.equal(base.totalSemesterFeesBdt, 120000);
  assert.equal(base.estimatedTotalBdt, 914600);
  assert.equal(base.withinBudget, true);

  const tightBudget = calculatePrivateUniversityCost({
    perCreditFeeBdt: 5200,
    totalCredits: 148,
    semesterFeeBdt: 15000,
    semesters: 8,
    admissionFeeBdt: 25000,
    waiverPercent: 25,
    studentBudgetBdt: 700000,
  });

  assert.equal(tightBudget.discountedTuitionBdt, 577200);
  assert.equal(tightBudget.estimatedTotalBdt, 722200);
  assert.equal(tightBudget.withinBudget, false);
});
