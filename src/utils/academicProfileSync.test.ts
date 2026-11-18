import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReadOnlySubjectChips,
  buildStudentProfileSaveBody,
  formatAcademicGroupLabel,
  formatCompactAcademicSummary,
  getUserInitials,
  hasAcademicStageData,
} from './academicProfileSync';

test('getUserInitials computes two-letter initials accurately', () => {
  assert.equal(getUserInitials('Tanvir Ahmed'), 'TA');
  assert.equal(getUserInitials('Nusrat Jahan Mim'), 'NM');
  assert.equal(getUserInitials('Tasnim'), 'TA');
  assert.equal(getUserInitials(''), 'ST');
});

test('buildStudentProfileSaveBody preserves existing preferences and collegeName when saving from Eligibility Checker', () => {
  const body = buildStudentProfileSaveBody({
    academicPayload: {
      sscBoard: 'Dhaka Education Board',
      sscYear: 2023,
      sscGroup: 'Science',
      sscGpaWithoutFourth: 5.0,
      sscGpa: 5.0,
      hscBoard: 'Dhaka Education Board',
      hscYear: 2025,
      hscGroup: 'Science',
      hscGpaWithoutFourth: 4.58,
      hscGpa: 4.83,
      isSecondTimer: false,
      fourthSubjectCode: '178',
      selectedSubjects: ['101', '107', '275', '174', '176', '178', '265'],
      subjectGrades: { Bangla: 5, English: 5, ICT: 5, Physics: 5, Chemistry: 5, Biology: 5, Mathematics: 5 },
    },
    user: { fullName: 'Tanvir Ahmed', phone: '01712345678' },
    profile: {
      id: 1,
      userId: 1,
      sscBoard: 'Dhaka Education Board',
      hscBoard: 'Dhaka Education Board',
      sscYear: 2023,
      hscYear: 2025,
      sscGroup: 'Science',
      hscGroup: 'Science',
      sscGpa: 5.0,
      sscGpaWithoutFourth: 5.0,
      hscGpa: 4.83,
      hscGpaWithoutFourth: 4.58,
      fourthSubjectCode: '178',
      selectedSubjects: [],
      subjectGrades: {},
      isSecondTimer: false,
      preferredSubject: 'Computer Science & Engineering',
      preferredCity: 'Dhaka',
      collegeName: 'Notre Dame College, Dhaka',
      tuitionBudgetBdt: 950000,
    },
  });

  assert.equal(body.fullName, 'Tanvir Ahmed');
  assert.equal(body.collegeName, 'Notre Dame College, Dhaka');
  assert.equal(body.preferredSubject, 'Computer Science & Engineering');
  assert.equal(body.preferredCity, 'Dhaka');
  assert.equal(body.tuitionBudgetBdt, 950000);
});

test('buildStudentProfileSaveBody applies preference overrides when saving from Best for U', () => {
  const body = buildStudentProfileSaveBody({
    academicPayload: {
      sscBoard: 'Rajshahi Education Board',
      sscYear: 2023,
      sscGroup: 'Science',
      sscGpaWithoutFourth: 4.8,
      sscGpa: 5.0,
      hscBoard: 'Rajshahi Education Board',
      hscYear: 2025,
      hscGroup: 'Science',
      hscGpaWithoutFourth: 4.5,
      hscGpa: 4.75,
      isSecondTimer: false,
      fourthSubjectCode: '178',
      selectedSubjects: ['101', '107', '275', '174', '176', '178', '265'],
      subjectGrades: { Bangla: 5, English: 5, ICT: 5, Physics: 5, Chemistry: 4, Biology: 5, Mathematics: 5 },
    },
    user: { fullName: 'Tanvir Ahmed', phone: null },
    profile: null,
    preferencesOverride: {
      preferredSubject: 'Medical / MBBS',
      preferredCity: 'Sylhet',
      tuitionBudgetBdt: '600000',
    },
  });

  assert.equal(body.phone, '');
  assert.equal(body.collegeName, '');
  assert.equal(body.preferredSubject, 'Medical / MBBS');
  assert.equal(body.preferredCity, 'Sylhet');
  assert.equal(body.tuitionBudgetBdt, 600000);
});

test('hasAcademicStageData and buildReadOnlySubjectChips format saved and empty profiles accurately', () => {
  assert.equal(hasAcademicStageData('ssc', null), false);
  assert.equal(hasAcademicStageData('hsc', undefined), false);

  const emptyProfile = {
    sscBoard: null,
    sscYear: null,
    sscGroup: null,
    sscGpa: null,
    sscGpaWithoutFourth: null,
    hscBoard: null,
    hscYear: null,
    hscGroup: null,
    hscGpa: null,
    hscGpaWithoutFourth: null,
    fourthSubjectCode: null,
    selectedSubjects: [],
    subjectGrades: {},
    isSecondTimer: false,
    preferredSubject: null,
    preferredCity: null,
    collegeName: null,
    tuitionBudgetBdt: null,
  };
  assert.equal(hasAcademicStageData('ssc', emptyProfile), false);
  assert.equal(hasAcademicStageData('hsc', emptyProfile), false);
  assert.deepEqual(buildReadOnlySubjectChips(emptyProfile), []);
  assert.equal(formatCompactAcademicSummary(emptyProfile), 'Not added yet');
  assert.equal(formatCompactAcademicSummary(null, 'bn'), 'এখনো যোগ করা হয়নি');

  const filledProfile = {
    ...emptyProfile,
    sscBoard: 'Dhaka Education Board',
    sscYear: 2023,
    sscGroup: 'Science',
    sscGpa: 5.0,
    hscBoard: 'Dhaka Education Board',
    hscYear: 2025,
    hscGroup: 'Science',
    hscGpa: 4.83,
    fourthSubjectCode: '178',
    selectedSubjects: ['Bangla', 'Physics', 'Biology'],
    subjectGrades: { Bangla: 5.0, Physics: 5.0, Biology: 4.5 },
  };
  assert.equal(hasAcademicStageData('ssc', filledProfile), true);
  assert.equal(hasAcademicStageData('hsc', filledProfile), true);
  assert.equal(formatAcademicGroupLabel('Commerce'), 'Business Studies / Commerce');
  assert.equal(
    formatCompactAcademicSummary(filledProfile),
    'SSC: Science (GPA 5.00) • HSC: Science (GPA 4.83)'
  );
  assert.equal(
    formatCompactAcademicSummary({ ...emptyProfile, sscGroup: 'Commerce', sscGpa: 4.75 }),
    'SSC: Commerce (GPA 4.75)'
  );

  const chips = buildReadOnlySubjectChips(filledProfile);
  assert.equal(chips.length, 3);
  assert.deepEqual(chips[2], {
    key: 'Biology',
    code: '178',
    name: 'Biology',
    gpaLabel: '4.50',
    isFourthSubject: true,
  });
});
