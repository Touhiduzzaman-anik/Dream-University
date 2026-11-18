import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDeterministicEligibility,
  type VerifiedAdmissionRule,
} from './eligibilityEngine';

const samplePublishedRule: VerifiedAdmissionRule = {
  id: 'rule-1',
  institutionId: 'sample-inst',
  programName: 'B.Sc. Engineering (Sample Test Fixture)',
  status: 'published',
  isVerified: true,
  source: {
    circularTitle: 'Official Admission Circular 2025-26',
    session: '2025-26',
    officialUrl: 'https://example.edu.bd/circular.pdf',
    pageReference: 'Page 2, Section 3.1',
  },
  minSscGpa: 4.0,
  minHscGpa: 4.5,
  minCombinedGpa: 9.0,
  allowedGroups: ['Science'],
  allowedHscYears: [2025, 2026],
  allowsSecondTimer: false,
  requiredSubjectMinGpa: { Physics: 4.0, Mathematics: 4.0 },
};

test('returns Pending when rules are unverified or not published (never guesses)', () => {
  const draftResult = evaluateDeterministicEligibility(
    { sscGpa: 5.0, hscGpa: 5.0 },
    { ...samplePublishedRule, status: 'under_review', isVerified: false }
  );
  assert.equal(draftResult.status, 'Pending');

  const missingRuleResult = evaluateDeterministicEligibility({ sscGpa: 5.0 }, null);
  assert.equal(missingRuleResult.status, 'Pending');
});

test('returns Pending and requests missing student fields when required data is omitted', () => {
  const result = evaluateDeterministicEligibility(
    { sscGpa: 4.5, hscGroup: 'Science' },
    samplePublishedRule
  );
  assert.equal(result.status, 'Pending');
  assert.ok(result.missingStudentFields.includes('HSC GPA'));
  assert.ok(result.missingStudentFields.includes('Physics GPA'));
});

test('returns Not Eligible and reports ALL failed conditions with official source citation', () => {
  const result = evaluateDeterministicEligibility(
    {
      sscGpa: 4.2,
      hscGpa: 4.25,
      hscGroup: 'Science',
      hscYear: 2024,
      isSecondTimer: true,
      subjectGrades: { Physics: 3.5, Mathematics: 4.5 },
    },
    samplePublishedRule
  );

  assert.equal(result.status, 'Not Eligible');
  const codes = result.failedRequirements.map((f) => f.code);
  assert.deepEqual(codes, [
    'hsc_gpa',
    'combined_gpa',
    'passing_year',
    'second_timer',
    'subject_gpa',
  ]);
  assert.equal(result.failedRequirements[0].messageEn, 'Required HSC GPA: 4.50. Your HSC GPA: 4.25.');
  assert.equal(result.failedRequirements[0].source.pageReference, 'Page 2, Section 3.1');
});

test('returns Eligible when all verified published conditions are satisfied', () => {
  const result = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      hscGpa: 4.75,
      hscGroup: 'Science',
      hscYear: 2026,
      isSecondTimer: false,
      selectedSubjects: ['Physics', 'Chemistry', 'Mathematics'],
      subjectGrades: { Physics: 5.0, Mathematics: 4.5 },
    },
    samplePublishedRule
  );
  assert.equal(result.status, 'Eligible');
  assert.equal(result.failedRequirements.length, 0);
});

test('returns Not Eligible when a required subject is absent from selectedSubjects', () => {
  const result = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      hscGpa: 5.0,
      hscGroup: 'Science',
      hscYear: 2026,
      isSecondTimer: false,
      selectedSubjects: ['Physics', 'Chemistry', 'Biology'], // No Mathematics (PCB)
      subjectGrades: { Physics: 5.0, Chemistry: 5.0, Biology: 5.0 },
    },
    samplePublishedRule
  );
  assert.equal(result.status, 'Not Eligible');
  assert.equal(result.failedRequirements[0].code, 'subject_missing');
  assert.match(result.failedRequirements[0].messageEn, /Mathematics/);
});

test('returns Pending when required subject is in selectedSubjects but grade is omitted', () => {
  const result = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      hscGpa: 5.0,
      hscGroup: 'Science',
      hscYear: 2026,
      isSecondTimer: false,
      selectedSubjects: ['Physics', 'Chemistry', 'Mathematics'],
      subjectGrades: { Physics: 5.0 },
    },
    samplePublishedRule
  );
  assert.equal(result.status, 'Pending');
  assert.ok(result.missingStudentFields.includes('Mathematics GPA'));
});

test('evaluates GPA Without 4th Subject and Education Board deterministically', () => {
  const buetLikeRule: VerifiedAdmissionRule = {
    ...samplePublishedRule,
    id: 'rule-buet-4th',
    minSscGpa: 4.5,
    minHscGpa: 4.5,
    minCombinedGpa: 9.0,
    minSscGpaWithoutFourth: 4.0,
    minHscGpaWithoutFourth: 4.25,
    allowedBoards: ['Dhaka Education Board', 'Rajshahi Education Board'],
    allowedSscYears: [2023, 2024],
  };

  // Missing GPA without 4th subject -> Pending
  const pendingRes = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      hscGpa: 5.0,
      sscYear: 2024,
      hscYear: 2026,
      hscGroup: 'Science',
      hscBoard: 'Dhaka Education Board',
      isSecondTimer: false,
      subjectGrades: { Physics: 5.0, Mathematics: 5.0 },
    },
    buetLikeRule
  );
  assert.equal(pendingRes.status, 'Pending');
  assert.ok(pendingRes.missingStudentFields.includes('SSC GPA (Without 4th Subject)'));
  assert.ok(pendingRes.missingStudentFields.includes('HSC GPA (Without 4th Subject)'));

  // Fails HSC GPA without 4th subject while passing GPA with 4th subject
  const failedWithoutFourth = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      sscGpaWithoutFourth: 4.75,
      hscGpa: 4.83,
      hscGpaWithoutFourth: 4.0,
      sscYear: 2024,
      hscYear: 2026,
      hscGroup: 'Science',
      hscBoard: 'Dhaka',
      isSecondTimer: false,
      subjectGrades: { Physics: 5.0, Mathematics: 5.0 },
    },
    buetLikeRule
  );
  assert.equal(failedWithoutFourth.status, 'Not Eligible');
  assert.deepEqual(
    failedWithoutFourth.failedRequirements.map((f) => f.code),
    ['hsc_gpa_without_fourth']
  );

  // Passes when both with & without 4th subject and board match
  const eligibleRes = evaluateDeterministicEligibility(
    {
      sscGpa: 5.0,
      sscGpaWithoutFourth: 4.75,
      hscGpa: 4.83,
      hscGpaWithoutFourth: 4.5,
      sscYear: 2024,
      hscYear: 2026,
      hscGroup: 'Science',
      hscBoard: 'Dhaka Education Board',
      isSecondTimer: false,
      selectedSubjects: ['Bangla', 'English', 'ICT', 'Physics', 'Chemistry', 'Mathematics'],
      subjectGrades: { Physics: 5.0, Mathematics: 4.5 },
    },
    buetLikeRule
  );
  assert.equal(eligibleRes.status, 'Eligible');
});

