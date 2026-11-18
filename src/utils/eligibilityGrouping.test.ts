import test from 'node:test';
import assert from 'node:assert/strict';
import type { EligibilityResultItem } from '../types/domain.ts';
import {
  ALL_ELIGIBILITY_CHECKBOX_CATEGORIES,
  groupEligibilityByInstitution,
  toggleEligibilityCategory,
} from './eligibilityGrouping.ts';

function makeEvalItem(
  overrides: Partial<EligibilityResultItem> & {
    status: 'Eligible' | 'Not Eligible' | 'Pending';
    programName: string;
    institutionId: number;
    institutionCode: string;
    institutionNameEn: string;
    category: EligibilityResultItem['category'];
  }
): EligibilityResultItem {
  return {
    ruleId: Math.floor(Math.random() * 100000),
    circularId: 1,
    institutionId: overrides.institutionId,
    institutionCode: overrides.institutionCode,
    institutionNameEn: overrides.institutionNameEn,
    institutionNameBn: overrides.institutionNameEn,
    institutionType: 'Public University',
    institutionTypeBn: 'পাবলিক বিশ্ববিদ্যালয়',
    category: overrides.category,
    city: 'Dhaka',
    estimatedTotalCostBdt: null,
    programName: overrides.programName,
    applicationDeadline: '2026-12-01',
    pdfUrl: '/api/circulars/1/pdf',
    evaluation: {
      status: overrides.status,
      failedRequirements:
        overrides.status === 'Not Eligible'
          ? [
              {
                code: 'hsc_gpa',
                messageEn: 'Requires HSC GPA 4.50 without 4th subject.',
                messageBn: '৪র্থ বিষয় ছাড়া এইচএসসি জিপিএ ৪.৫০ আবশ্যক।',
                source: {
                  circularTitle: 'Official Circular',
                  session: '2025-2026',
                  officialUrl: 'https://example.edu.bd',
                },
              },
            ]
          : [],
      missingStudentFields: [],
    },
  };
}

test('groupEligibilityByInstitution computes unit-level mixed eligibility and keeps fully ineligible institutions visible', () => {
  const items: EligibilityResultItem[] = [
    // DU: 2 eligible units + 1 not eligible unit
    makeEvalItem({
      institutionId: 1,
      institutionCode: 'DU',
      institutionNameEn: 'University of Dhaka',
      category: 'public',
      programName: 'Unit A (Science)',
      status: 'Not Eligible',
    }),
    makeEvalItem({
      institutionId: 1,
      institutionCode: 'DU',
      institutionNameEn: 'University of Dhaka',
      category: 'public',
      programName: 'Unit B (Arts & Law)',
      status: 'Eligible',
    }),
    makeEvalItem({
      institutionId: 1,
      institutionCode: 'DU',
      institutionNameEn: 'University of Dhaka',
      category: 'public',
      programName: 'Unit C (Business Studies)',
      status: 'Eligible',
    }),
    // BUET: 0 eligible units, 2 not eligible units
    makeEvalItem({
      institutionId: 2,
      institutionCode: 'BUET',
      institutionNameEn: 'BUET',
      category: 'engineering',
      programName: 'Engineering Track',
      status: 'Not Eligible',
    }),
    makeEvalItem({
      institutionId: 2,
      institutionCode: 'BUET',
      institutionNameEn: 'BUET',
      category: 'engineering',
      programName: 'Architecture',
      status: 'Not Eligible',
    }),
    // DMC: Medical (filtered out when medical unticked)
    makeEvalItem({
      institutionId: 3,
      institutionCode: 'DMC',
      institutionNameEn: 'Dhaka Medical College',
      category: 'medical',
      programName: 'MBBS',
      status: 'Eligible',
    }),
  ];

  const allResult = groupEligibilityByInstitution(items, ALL_ELIGIBILITY_CHECKBOX_CATEGORIES);
  assert.equal(allResult.summary.eligibleInstitutions, 2);
  assert.equal(allResult.summary.eligibleUnits, 3);
  assert.equal(allResult.summary.notEligibleInstitutions, 1);
  assert.equal(allResult.groups.length, 3);

  const du = allResult.groups.find((g) => g.institutionCode === 'DU');
  assert.ok(du);
  assert.equal(du.overallStatus, 'Eligible');
  assert.equal(du.eligibleUnits.length, 2);
  assert.equal(du.notEligibleUnits.length, 1);

  const buet = allResult.groups.find((g) => g.institutionCode === 'BUET');
  assert.ok(buet);
  assert.equal(buet.overallStatus, 'Not Eligible');
  assert.equal(buet.eligibleUnits.length, 0);
  assert.equal(buet.notEligibleUnits.length, 2);

  // Unticking 'medical' excludes DMC dynamically
  const withoutMedical = toggleEligibilityCategory(ALL_ELIGIBILITY_CHECKBOX_CATEGORIES, 'medical');
  const filteredResult = groupEligibilityByInstitution(items, withoutMedical);
  assert.equal(filteredResult.summary.eligibleInstitutions, 1);
  assert.equal(filteredResult.summary.eligibleUnits, 2);
  assert.equal(filteredResult.summary.notEligibleInstitutions, 1);
  assert.equal(filteredResult.groups.length, 2);
});

test('groupEligibilityByInstitution sorts strictly by curated Top-Down Priority Order within each category', () => {
  // Private priority: DIU -> BracU -> NSU -> IUB -> AIUB -> EWU -> AUST -> UIU -> others (IUBAT)
  const privateScrambled = ['UIU', 'IUBAT', 'EWU', 'AUST', 'NSU', 'AIUB', 'BracU', 'IUB', 'DIU'].map(
    (code, idx) =>
      makeEvalItem({
        institutionId: 100 + idx,
        institutionCode: code,
        institutionNameEn: code,
        category: 'private',
        programName: 'CSE',
        status: 'Eligible',
      })
  );
  // Give EWU extra eligible units to confirm curated priority overrides raw unit counts
  privateScrambled.push(
    makeEvalItem({
      institutionId: 102,
      institutionCode: 'EWU',
      institutionNameEn: 'EWU',
      category: 'private',
      programName: 'BBA',
      status: 'Eligible',
    })
  );
  const privateSorted = groupEligibilityByInstitution(privateScrambled, ['private']).groups.map(
    (g) => g.institutionCode
  );
  assert.deepEqual(privateSorted, ['DIU', 'BracU', 'NSU', 'IUB', 'AIUB', 'EWU', 'AUST', 'UIU', 'IUBAT']);

  // Public priority: DU -> RU -> CU -> JU -> BUP -> JnU -> KU
  const publicScrambled = ['JnU', 'KU', 'BUP', 'CU', 'JU', 'RU', 'DU'].map((code, idx) =>
    makeEvalItem({
      institutionId: 200 + idx,
      institutionCode: code,
      institutionNameEn: code,
      category: 'public',
      programName: 'Unit A',
      status: 'Eligible',
    })
  );
  const publicSorted = groupEligibilityByInstitution(publicScrambled, ['public']).groups.map(
    (g) => g.institutionCode
  );
  assert.deepEqual(publicSorted, ['DU', 'RU', 'CU', 'JU', 'BUP', 'JnU', 'KU']);

  // Engineering priority: BUET -> KUET -> RUET -> CUET -> BUTEX -> MIST -> IUT -> DUET
  const engScrambled = ['IUT', 'DUET', 'MIST', 'BUTEX', 'CUET', 'RUET', 'KUET', 'BUET'].map(
    (code, idx) =>
      makeEvalItem({
        institutionId: 300 + idx,
        institutionCode: code,
        institutionNameEn: code,
        category: 'engineering',
        programName: 'Engineering',
        status: 'Eligible',
      })
  );
  const engSorted = groupEligibilityByInstitution(engScrambled, ['engineering']).groups.map(
    (g) => g.institutionCode
  );
  assert.deepEqual(engSorted, ['BUET', 'KUET', 'RUET', 'CUET', 'BUTEX', 'MIST', 'IUT', 'DUET']);

  // GST priority: SUST -> CoU -> HSTU -> MBSTU -> JUST -> NSTU -> PUST
  const gstScrambled = ['NSTU', 'PUST', 'JUST', 'MBSTU', 'HSTU', 'CoU', 'SUST'].map((code, idx) =>
    makeEvalItem({
      institutionId: 400 + idx,
      institutionCode: code,
      institutionNameEn: code,
      category: 'gst',
      programName: 'GST Unit A',
      status: 'Eligible',
    })
  );
  const gstSorted = groupEligibilityByInstitution(gstScrambled, ['gst']).groups.map(
    (g) => g.institutionCode
  );
  assert.deepEqual(gstSorted, ['SUST', 'CoU', 'HSTU', 'MBSTU', 'JUST', 'NSTU', 'PUST']);

  // Medical priority: DMC -> SSMC -> ShSMC -> CMC -> RMC -> SOMC -> MMC -> SBMC
  const medScrambled = ['MMC', 'SBMC', 'SOMC', 'RMC', 'CMC', 'ShSMC', 'SSMC', 'DMC'].map(
    (code, idx) =>
      makeEvalItem({
        institutionId: 500 + idx,
        institutionCode: code,
        institutionNameEn: code,
        category: 'medical',
        programName: 'MBBS',
        status: 'Eligible',
      })
  );
  const medSorted = groupEligibilityByInstitution(medScrambled, ['medical']).groups.map(
    (g) => g.institutionCode
  );
  assert.deepEqual(medSorted, ['DMC', 'SSMC', 'ShSMC', 'CMC', 'RMC', 'SOMC', 'MMC', 'SBMC']);
});
