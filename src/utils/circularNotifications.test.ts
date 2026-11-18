import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCircularNotifications } from './circularNotifications';
import type { InstitutionRecord } from '../types/domain';

const mockInstitutions: InstitutionRecord[] = [
  {
    id: 1,
    code: 'DU',
    nameEn: 'University of Dhaka',
    nameBn: 'ঢাকা বিশ্ববিদ্যালয়',
    shortNoteEn: '',
    shortNoteBn: '',
    locationEn: 'Dhaka',
    locationBn: 'ঢাকা',
    city: 'Dhaka',
    category: 'public',
    establishedYear: 1921,
    institutionType: 'Public University',
    institutionTypeBn: 'পাবলিক বিশ্ববিদ্যালয়',
    officialWebsite: 'https://www.du.ac.bd',
    imageUrl: '/images/universities/du.jpg',
    imageAltEn: '',
    imageAltBn: '',
    programsEn: [],
    programsBn: [],
    perCreditFeeBdt: null,
    totalCredits: null,
    semesterFeeBdt: null,
    admissionFeeBdt: null,
    estimatedTotalCostBdt: null,
    publishedCirculars: [
      {
        id: 11,
        institutionId: 1,
        titleEn: 'DU Science Unit 2025-26',
        titleBn: 'ঢাবি বিজ্ঞান ইউনিট',
        session: '2025-2026',
        sourceUrl: 'https://admission.eis.du.ac.bd',
        applicationDeadline: '2026-11-25',
        pdfFilename: 'du.pdf',
        status: 'published',
        version: 1,
      },
      {
        id: 12,
        institutionId: 1,
        titleEn: 'DU Past Session',
        titleBn: 'পূর্বের সেশন',
        session: '2024-2025',
        sourceUrl: 'https://admission.eis.du.ac.bd',
        applicationDeadline: '2026-11-01',
        pdfFilename: 'du-old.pdf',
        status: 'published',
        version: 1,
      },
    ],
    verifiedRules: [
      {
        id: 101,
        circularId: 11,
        institutionId: 1,
        programName: 'Ka Unit',
        minSscGpa: 3.5,
        minHscGpa: 3.5,
        minCombinedGpa: 8.0,
        allowedGroups: ['Science'],
        allowedHscYears: [2025],
        allowsSecondTimer: false,
        requiredSubjectMinGpa: {},
        pageReference: 'Page 1',
        status: 'published',
        isVerified: true,
        version: 1,
      },
    ],
  },
  {
    id: 2,
    code: 'BUET',
    nameEn: 'BUET',
    nameBn: 'বুয়েট',
    shortNoteEn: '',
    shortNoteBn: '',
    locationEn: 'Dhaka',
    locationBn: 'ঢাকা',
    city: 'Dhaka',
    category: 'engineering',
    establishedYear: 1962,
    institutionType: 'Engineering University',
    institutionTypeBn: 'প্রকৌশল বিশ্ববিদ্যালয়',
    officialWebsite: 'https://www.buet.ac.bd',
    imageUrl: '/images/universities/buet.jpg',
    imageAltEn: '',
    imageAltBn: '',
    programsEn: [],
    programsBn: [],
    perCreditFeeBdt: null,
    totalCredits: null,
    semesterFeeBdt: null,
    admissionFeeBdt: null,
    estimatedTotalCostBdt: null,
    publishedCirculars: [
      {
        id: 21,
        institutionId: 2,
        titleEn: 'BUET Admission 2025-26',
        titleBn: 'বুয়েট ভর্তি',
        session: '2025-2026',
        sourceUrl: 'https://ugadmission.buet.ac.bd',
        applicationDeadline: '2026-12-10',
        pdfFilename: 'buet.pdf',
        status: 'published',
        version: 1,
      },
    ],
    verifiedRules: [],
  },
];

test('computes deadline countdowns, classifies urgency, and sorts soonest active alerts first', () => {
  const ref = new Date('2026-11-15T00:00:00Z');
  const notifications = buildCircularNotifications(mockInstitutions, ref);

  assert.equal(notifications.length, 3);
  assert.equal(notifications[0].circularId, 11);
  assert.equal(notifications[0].daysRemaining, 10);
  assert.equal(notifications[0].urgency, 'closing_soon');
  assert.equal(notifications[0].verifiedRuleCount, 1);

  assert.equal(notifications[1].circularId, 21);
  assert.equal(notifications[1].daysRemaining, 25);
  assert.equal(notifications[1].urgency, 'upcoming');

  assert.equal(notifications[2].circularId, 12);
  assert.equal(notifications[2].daysRemaining, -14);
  assert.equal(notifications[2].urgency, 'expired');
});
