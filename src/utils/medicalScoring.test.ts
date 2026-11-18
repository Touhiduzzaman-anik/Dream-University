import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDgmeMedicalGpaScore } from './medicalScoring.ts';

test('calculateDgmeMedicalGpaScore computes exact SSC*8 + HSC*12 out of 100 and validates DGME rules', () => {
  // Full 5.00 + 5.00 => 40 + 60 = 100.00
  const perfect = calculateDgmeMedicalGpaScore({
    sscGpa: 5.0,
    hscGpa: 5.0,
    hscGroup: 'Science',
    selectedSubjects: ['Bangla', 'English', 'ICT', 'Physics', 'Chemistry', 'Biology'],
    subjectGrades: { Biology: 5.0 },
  });
  assert.ok(perfect);
  assert.equal(perfect.sscScore, 40);
  assert.equal(perfect.hscScore, 60);
  assert.equal(perfect.totalScore, 100);
  assert.equal(perfect.meetsMinimumCriteria, true);
  assert.equal(
    perfect.formattedSummaryEn,
    'Medical GPA Score Breakdown: 100.00 / 100 (SSC: 40.00/40 + HSC: 60.00/60)'
  );

  // Typical candidate: SSC 5.00 (40.00), HSC 4.83 (57.96) => 97.96 / 100
  const typical = calculateDgmeMedicalGpaScore({
    sscGpa: 5.0,
    hscGpa: 4.83,
    hscGroup: 'Science',
    selectedSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    subjectGrades: { Biology: 4.0 },
  });
  assert.ok(typical);
  assert.equal(typical.sscScore, 40);
  assert.equal(typical.hscScore, 57.96);
  assert.equal(typical.totalScore, 97.96);
  assert.equal(typical.meetsMinimumCriteria, true);

  // Combined 9.00 boundary (SSC 4.50 + HSC 4.50) but Biology 3.50 (< 4.00) -> fails minimum criteria
  const lowBio = calculateDgmeMedicalGpaScore({
    sscGpa: 4.5,
    hscGpa: 4.5,
    hscGroup: 'Science',
    selectedSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    subjectGrades: { Biology: 3.5 },
  });
  assert.ok(lowBio);
  assert.equal(lowBio.sscScore, 36);
  assert.equal(lowBio.hscScore, 54);
  assert.equal(lowBio.totalScore, 90);
  assert.equal(lowBio.meetsMinimumCriteria, false);

  // Combined < 9.00 (4.90 + 4.00 = 8.90) -> fails minimum criteria
  const lowCombined = calculateDgmeMedicalGpaScore({
    sscGpa: 4.9,
    hscGpa: 4.0,
    hscGroup: 'Science',
    selectedSubjects: ['Physics', 'Chemistry', 'Biology', 'Mathematics'],
    subjectGrades: { Biology: 5.0 },
  });
  assert.ok(lowCombined);
  assert.equal(lowCombined.totalScore, 87.2);
  assert.equal(lowCombined.meetsMinimumCriteria, false);

  // Commerce group -> fails Science group requirement
  const nonScience = calculateDgmeMedicalGpaScore({
    sscGpa: 5.0,
    hscGpa: 5.0,
    hscGroup: 'Commerce',
    selectedSubjects: ['Accounting', 'Finance', 'Management'],
    subjectGrades: {},
  });
  assert.ok(nonScience);
  assert.equal(nonScience.meetsMinimumCriteria, false);
});
