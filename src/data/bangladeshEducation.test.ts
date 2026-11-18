import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BANGLADESH_EDUCATION_BOARDS,
  HSC_COMPULSORY_SUBJECTS,
  HSC_GROUP_SUBJECTS,
  getDefaultSubjectSelectionForGroup,
  normalizeBoardName,
  toggleGroupSubjectSelection,
} from './bangladeshEducation.ts';

test('contains all 11 official Bangladeshi education boards and normalizes legacy aliases', () => {
  assert.equal(BANGLADESH_EDUCATION_BOARDS.length, 11);
  assert.equal(normalizeBoardName('Dhaka'), 'Dhaka Education Board');
  assert.equal(normalizeBoardName('Chattogram'), 'Chittagong Education Board');
  assert.equal(normalizeBoardName('Jashore'), 'Jessore Education Board');
  assert.equal(normalizeBoardName('Madrasah'), 'Bangladesh Madrasah Education Board');
  assert.equal(normalizeBoardName('Technical'), 'Bangladesh Technical Education Board');
  assert.equal(normalizeBoardName('Cumilla Education Board'), 'Cumilla Education Board');
});

test('defines compulsory subjects and group-specific official HSC codes', () => {
  assert.deepEqual(
    HSC_COMPULSORY_SUBJECTS.map((s) => `${s.name} (${s.code})`),
    ['Bangla (101)', 'English (107)', 'Information & Communication Technology (ICT) (275)']
  );
  assert.equal(HSC_GROUP_SUBJECTS.Science.length, 4);
  assert.equal(HSC_GROUP_SUBJECTS.Commerce.length, 5);
  assert.equal(HSC_GROUP_SUBJECTS.Humanities.length, 8);
});

test('enforces max 4 selectable group subjects for Humanities and preserves compulsory subjects', () => {
  const initial = getDefaultSubjectSelectionForGroup('Humanities');
  const groupKeys = initial.selectedSubjects.filter((k) => !['Bangla', 'English', 'ICT'].includes(k));
  assert.equal(groupKeys.length, 4);

  // Trying to add a 5th Humanities subject leaves selection unchanged
  const blocked = toggleGroupSubjectSelection('Humanities', initial.selectedSubjects, 'Sociology');
  assert.deepEqual(blocked, initial.selectedSubjects);

  // Removing one lets a replacement be added
  const removed = toggleGroupSubjectSelection('Humanities', initial.selectedSubjects, 'Logic');
  const added = toggleGroupSubjectSelection('Humanities', removed, 'Sociology');
  assert.ok(added.includes('Sociology'));
  assert.ok(!added.includes('Logic'));

  // Compulsory subjects cannot be toggled off
  const compulsoryStay = toggleGroupSubjectSelection('Humanities', initial.selectedSubjects, 'Bangla');
  assert.ok(compulsoryStay.includes('Bangla'));
});
