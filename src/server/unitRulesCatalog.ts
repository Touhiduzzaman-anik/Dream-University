import type { SeedInstitutionSpec } from '../data/bangladeshInstitutions.ts';

export interface UnitRuleTemplate {
  programName: string;
  gpaMode?: 'with_fourth' | 'without_fourth';
  minSscGpa: number;
  minHscGpa: number;
  minCombinedGpa: number;
  minSscGpaWithoutFourth?: number | null;
  minHscGpaWithoutFourth?: number | null;
  allowedGroups: Array<'Science' | 'Commerce' | 'Humanities'>;
  allowedHscYears: number[];
  allowsSecondTimer: boolean;
  requiredSubjectMinGpa: Record<string, number>;
  pageReference: string;
}

export interface InstitutionCircularTemplate {
  titleEn: string;
  titleBn: string;
  session: string;
  sourceUrl: string;
  deadline: string;
  rawText: string;
  rules: UnitRuleTemplate[];
}

const AGRI_CODES = new Set(['BAU', 'GAU', 'SBAU', 'CVASU', 'SAU', 'KAU', 'HAU', 'ShAU', 'KuriAU']);
const PUBLIC_ENG_TECH_COLLEGES = new Set([
  'PTEC',
  'CTEC',
  'MEC',
  'SEC',
  'TTEC',
  'TECN',
  'BTEC',
  'FEC',
  'JTEC',
  'BEC',
  'RTEC',
  'GTEC',
  'JTEC2',
]);
const CKRUET_CODES = new Set(['RUET', 'KUET', 'CUET']);
const TIER1_PRIVATE_CODES = new Set(['NSU', 'BRACU', 'EWU', 'AIUB', 'IUB', 'AUST', 'UIU']);

export function getCircularTemplateForInstitution(
  inst: Pick<SeedInstitutionSpec, 'code' | 'nameEn' | 'nameBn' | 'category' | 'officialWebsite'>
): InstitutionCircularTemplate {
  const code = inst.code;

  // --- Specific Flagship Public Universities ---
  if (code === 'DU') {
    return {
      titleEn: 'University of Dhaka Undergraduate Admission Circular 2025-2026',
      titleBn: 'ঢাকা বিশ্ববিদ্যালয় স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: 'https://admission.eis.du.ac.bd',
      deadline: '2026-11-30',
      rawText:
        'University of Dhaka Admission 2025-2026: Unit A (Science) SSC/HSC 3.50, Combined 8.00; Unit B (Arts/Law/Social Sciences) SSC/HSC 3.00, Combined 7.50; Unit C (Business Studies) SSC/HSC 3.00, Combined 7.50; IBA (BBA) SSC/HSC 4.00, Combined 8.50, English 4.00. First-time applicants (HSC 2025) only.',
      rules: [
        {
          programName: 'Science Unit (Ka) — CSE & Physical Sciences',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 3.5, Chemistry: 3.5, Mathematics: 3.5 },
          pageReference: 'Page 1, Unit Ka (Science)',
        },
        {
          programName: 'Unit B (Kha) — Arts, Law & Social Sciences',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 7.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Bangla: 3.0, English: 3.0 },
          pageReference: 'Page 2, Unit Kha',
        },
        {
          programName: 'Unit C (Ga) — Business Studies',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 7.5,
          allowedGroups: ['Commerce', 'Science', 'Humanities'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { English: 3.0 },
          pageReference: 'Page 3, Unit Ga',
        },
        {
          programName: 'IBA — Bachelor of Business Administration (BBA)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { English: 4.0 },
          pageReference: 'IBA Circular, Section 2',
        },
      ],
    };
  }

  if (code === 'JU') {
    return {
      titleEn: 'Jahangirnagar University Undergraduate Admission Circular 2025-2026',
      titleBn: 'জাহাঙ্গীরনগর বিশ্ববিদ্যালয় স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-03',
      rawText:
        'Jahangirnagar University Admission 2025-2026 (Second-timers permitted): Unit A (Mathematical & Physical Sciences) Combined 8.00; Unit B (Social Sciences & Law) Combined 7.00; Unit C (Arts & Humanities) Combined 7.00; Unit D (Biological Sciences) Combined 8.00; IBA-JU Combined 8.00.',
      rules: [
        {
          programName: 'Unit A — Mathematical & Physical Sciences (CSE / Physics / Math)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Mathematics: 3.5, Physics: 3.5 },
          pageReference: 'Unit A Criteria',
        },
        {
          programName: 'Unit B — Social Sciences & Law',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 7.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { English: 3.0 },
          pageReference: 'Unit B Criteria',
        },
        {
          programName: 'Unit C — Arts & Humanities',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 7.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Unit C Criteria',
        },
        {
          programName: 'Unit D — Biological Sciences & Pharmacy',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Biology: 3.5, Chemistry: 3.5 },
          pageReference: 'Unit D Criteria',
        },
        {
          programName: 'Unit E / IBA-JU — Business Studies',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { English: 3.5 },
          pageReference: 'Unit E / IBA Criteria',
        },
      ],
    };
  }

  if (code === 'RU' || code === 'CU') {
    return {
      titleEn: `${inst.nameEn} Undergraduate Admission Circular 2025-2026`,
      titleBn: `${inst.nameBn} স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-06',
      rawText: `${inst.nameEn} Admission 2025-2026 (Second timers eligible): Unit A (Humanities/Social Sciences/Law) Combined 7.00; Unit B (Business Studies) Combined 7.00; Unit C (Science & Engineering) Combined 8.00.`,
      rules: [
        {
          programName: 'Unit C — Science & Engineering',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Physics: 3.0, Chemistry: 3.0 },
          pageReference: 'Science Unit Criteria',
        },
        {
          programName: 'Unit A — Humanities, Law & Social Sciences',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 7.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Arts & Social Science Criteria',
        },
        {
          programName: 'Unit B — Business Studies (BBA)',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 7.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Business Studies Criteria',
        },
      ],
    };
  }

  if (code === 'BUP') {
    return {
      titleEn: 'Bangladesh University of Professionals (BUP) Admission Circular 2025-2026',
      titleBn: 'বাংলাদেশ ইউনিভার্সিটি অব প্রফেশনালস (বিইউপি) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-02',
      rawText:
        'BUP Admission 2025-2026: FST (Science & Tech) SSC/HSC 4.50, Combined 9.00; FBS (Business Studies) SSC/HSC 4.00, Combined 8.50; FASS / FSSS SSC/HSC 3.50, Combined 7.50.',
      rules: [
        {
          programName: 'FST — Science, Engineering & ICT',
          minSscGpa: 4.5,
          minHscGpa: 4.5,
          minCombinedGpa: 9.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Mathematics: 4.0, Physics: 4.0 },
          pageReference: 'FST Admission Notice',
        },
        {
          programName: 'FBS — Business Studies (BBA)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { English: 3.5 },
          pageReference: 'FBS Admission Notice',
        },
        {
          programName: 'FASS / FSSS — Arts, Law & Social Sciences',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 7.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'FASS / FSSS Admission Notice',
        },
      ],
    };
  }

  // --- Engineering Category ---
  if (code === 'BUET') {
    return {
      titleEn: 'BUET Undergraduate Admission Circular 2025-2026',
      titleBn: 'বুয়েট স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: 'https://ugadmission.buet.ac.bd',
      deadline: '2026-12-05',
      rawText:
        'BUET Undergraduate Admission 2025-2026: Science group only. Minimum SSC/HSC GPA 4.50, Combined 9.00, and minimum GPA 4.00 without 4th subject. HSC 2025 only.',
      rules: [
        {
          programName: 'Engineering Track (CSE / EEE / Civil)',
          gpaMode: 'with_fourth',
          minSscGpa: 4.5,
          minHscGpa: 4.5,
          minCombinedGpa: 9.0,
          minSscGpaWithoutFourth: 4.0,
          minHscGpaWithoutFourth: 4.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 4.5, Chemistry: 4.5, Mathematics: 4.5 },
          pageReference: 'Page 1, Clause 3(a)',
        },
        {
          programName: 'Architecture (B.Arch)',
          gpaMode: 'with_fourth',
          minSscGpa: 4.5,
          minHscGpa: 4.5,
          minCombinedGpa: 9.0,
          minSscGpaWithoutFourth: 4.0,
          minHscGpaWithoutFourth: 4.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 4.0, Mathematics: 4.0, English: 4.0 },
          pageReference: 'Page 2, Architecture Clause',
        },
      ],
    };
  }

  if (CKRUET_CODES.has(code)) {
    return {
      titleEn: `CKRUET Combined Engineering Admission (${code}) 2025-2026`,
      titleBn: `CKRUET (চুয়েট · কুয়েট · রুয়েট) সমন্বিত প্রকৌশল ভর্তি বিজ্ঞপ্তি (${code}) ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: 'https://admissionckruet.ac.bd',
      deadline: '2026-12-08',
      rawText: `CKRUET Combined Engineering (${code}): Science group only. Minimum SSC/HSC GPA 4.00 (without 4th >= 4.00), Combined 8.50. Physics, Chemistry, Higher Math >= 4.00, English >= 3.50.`,
      rules: [
        {
          programName: 'CKRUET Combined Engineering (CSE / EEE / ME / Civil)',
          gpaMode: 'with_fourth',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          minSscGpaWithoutFourth: 4.0,
          minHscGpaWithoutFourth: 4.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 4.0, Chemistry: 4.0, Mathematics: 4.0, English: 3.5 },
          pageReference: 'CKRUET Engineering Eligibility',
        },
        {
          programName: 'CKRUET Architecture & Urban Planning (B.Arch / BURP)',
          gpaMode: 'with_fourth',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          minSscGpaWithoutFourth: 4.0,
          minHscGpaWithoutFourth: 4.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 3.5, Mathematics: 3.5, English: 3.5 },
          pageReference: 'CKRUET Architecture & URP Criteria',
        },
      ],
    };
  }

  if (code === 'IUT') {
    return {
      titleEn: 'Islamic University of Technology (IUT) Admission Circular 2025-2026',
      titleBn: 'ইসলামিক ইউনিভার্সিটি অব টেকনোলজি (আইইউটি) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-07',
      rawText:
        'IUT Undergraduate Admission 2025-2026: Engineering (CSE/SWE/EEE/ME) SSC/HSC 4.50, Combined 9.00, Math/Physics/Chem >= 4.00, English >= 4.00. BBA in Technology Management (BTM) Combined 8.00.',
      rules: [
        {
          programName: 'Engineering & Computing (CSE / SWE / EEE / ME)',
          minSscGpa: 4.5,
          minHscGpa: 4.5,
          minCombinedGpa: 9.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2025],
          allowsSecondTimer: false,
          requiredSubjectMinGpa: { Physics: 4.0, Chemistry: 4.0, Mathematics: 4.0, English: 4.0 },
          pageReference: 'IUT Engineering Eligibility',
        },
        {
          programName: 'BBA in Technology Management (BTM)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { English: 4.0 },
          pageReference: 'IUT BTM Eligibility',
        },
      ],
    };
  }

  if (code === 'MIST') {
    return {
      titleEn: 'Military Institute of Science and Technology (MIST) Circular 2025-2026',
      titleBn: 'মিলিটারি ইনস্টিটিউট অব সায়েন্স অ্যান্ড টেকনোলজি (এমআইএসটি) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬',
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-10',
      rawText:
        'MIST Admission 2025-2026 (2nd timers permitted): Unit A Engineering SSC/HSC 4.00, Combined 8.50, Physics/Chemistry/Math >= 4.00; Unit B Architecture Combined 8.50.',
      rules: [
        {
          programName: 'Unit A — Engineering (CSE / EECE / CE / ME / AE)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Physics: 4.0, Chemistry: 4.0, Mathematics: 4.0, English: 3.5 },
          pageReference: 'MIST Unit A Clause',
        },
        {
          programName: 'Unit B — Architecture (B.Arch)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 8.5,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Mathematics: 3.5, English: 3.5 },
          pageReference: 'MIST Unit B Clause',
        },
      ],
    };
  }

  if (inst.category === 'engineering') {
    const isButex = code === 'BUTEX';
    return {
      titleEn: `${inst.nameEn} Undergraduate Admission Circular 2025-2026`,
      titleBn: `${inst.nameBn} স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-11',
      rawText: `${inst.nameEn} Admission 2025-2026: Science group required with Physics, Chemistry, and Higher Mathematics.`,
      rules: [
        {
          programName: isButex
            ? 'Textile Engineering & Management'
            : 'B.Sc. in Engineering (CSE / EEE / Specialized Tech)',
          minSscGpa: isButex ? 4.5 : 4.0,
          minHscGpa: isButex ? 4.5 : 4.0,
          minCombinedGpa: isButex ? 9.0 : 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: isButex ? [2025] : [2024, 2025],
          allowsSecondTimer: !isButex,
          requiredSubjectMinGpa: {
            Physics: isButex ? 4.0 : 3.5,
            Chemistry: isButex ? 4.0 : 3.5,
            Mathematics: isButex ? 4.0 : 3.5,
          },
          pageReference: 'Engineering Admission Notice',
        },
      ],
    };
  }

  // --- Medical Category ---
  if (inst.category === 'medical') {
    const isDental = code === 'DDC';
    return {
      titleEn: `DGME Centralized ${isDental ? 'BDS' : 'MBBS'} Admission Circular (${code}) 2025-2026`,
      titleBn: `স্বাস্থ্য শিক্ষা অধিদপ্তর ${isDental ? 'বিডিএস' : 'এমবিবিএস'} ভর্তি বিজ্ঞপ্তি (${code}) ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: 'https://dgme.gov.bd',
      deadline: '2026-12-12',
      rawText: `DGME Centralized ${isDental ? 'BDS' : 'MBBS'} Admission (${inst.nameEn}): Minimum SSC GPA 4.00, HSC GPA 4.00, Combined GPA at least 9.00. Science group required with minimum Biology GPA 4.00. Second-time applicants eligible.`,
      rules: [
        {
          programName: isDental
            ? 'BDS (Centralized DGME Dental Admission)'
            : 'MBBS (Centralized DGME Admission)',
          minSscGpa: 4.0,
          minHscGpa: 4.0,
          minCombinedGpa: 9.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: { Biology: 4.0 },
          pageReference: 'DGME Clause 4',
        },
      ],
    };
  }

  // --- GST Cluster Category ---
  if (inst.category === 'gst') {
    return {
      titleEn: `GST Integrated Cluster Admission Circular (${code}) 2025-2026`,
      titleBn: `জিএসটি গুচ্ছ সমন্বিত ভর্তি বিজ্ঞপ্তি (${code}) ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: 'https://gstadmission.ac.bd',
      deadline: '2026-12-15',
      rawText: `GST Cluster Admission (${inst.nameEn}): Unit A (Science) SSC/HSC 3.50, Combined 8.00; Unit B (Humanities) SSC/HSC 3.00, Combined 6.00; Unit C (Business Studies) SSC/HSC 3.00, Combined 6.50.`,
      rules: [
        {
          programName: 'GST Unit A — CSE & Applied Sciences',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 8.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'GST Unit A Criteria',
        },
        {
          programName: 'GST Unit B — Humanities & Social Sciences',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 6.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'GST Unit B Criteria',
        },
        {
          programName: 'GST Unit C — Business Studies (BBA)',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 6.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'GST Unit C Criteria',
        },
      ],
    };
  }

  // --- Public Category (Agricultural, Engineering Colleges, General Public Universities) ---
  if (inst.category === 'public') {
    if (AGRI_CODES.has(code)) {
      return {
        titleEn: `Agricultural Cluster Admission Circular (${code}) 2025-2026`,
        titleBn: `কৃষি গুচ্ছ সমন্বিত ভর্তি বিজ্ঞপ্তি (${code}) ২০২৫-২০২৬`,
        session: '2025-2026',
        sourceUrl: inst.officialWebsite,
        deadline: '2026-12-14',
        rawText: `Agricultural Cluster Integrated Admission (${inst.nameEn}): Science group only. Minimum SSC/HSC GPA 4.00, Combined 8.50, Biology/Chemistry >= 3.50.`,
        rules: [
          {
            programName: 'Agricultural Cluster — B.Sc. Agriculture / DVM / Fisheries',
            minSscGpa: 4.0,
            minHscGpa: 4.0,
            minCombinedGpa: 8.5,
            allowedGroups: ['Science'],
            allowedHscYears: [2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: { Biology: 3.5, Chemistry: 3.5 },
            pageReference: 'Agri Cluster Clause 2',
          },
        ],
      };
    }

    if (PUBLIC_ENG_TECH_COLLEGES.has(code)) {
      return {
        titleEn: `${inst.nameEn} B.Sc. Engineering Admission Circular 2025-2026`,
        titleBn: `${inst.nameBn} বি.এসসি. ইঞ্জিনিয়ারিং ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬`,
        session: '2025-2026',
        sourceUrl: inst.officialWebsite,
        deadline: '2026-12-16',
        rawText: `${inst.nameEn} B.Sc. Engineering Admission: Science group only. Minimum SSC/HSC 3.50, Combined 7.50, Physics/Chemistry/Mathematics >= 3.50.`,
        rules: [
          {
            programName: 'B.Sc. in Engineering / Textile Engineering',
            minSscGpa: 3.5,
            minHscGpa: 3.5,
            minCombinedGpa: 7.5,
            allowedGroups: ['Science'],
            allowedHscYears: [2024, 2025],
            allowsSecondTimer: true,
            requiredSubjectMinGpa: { Physics: 3.5, Chemistry: 3.5, Mathematics: 3.5 },
            pageReference: 'Engineering Admission Notice',
          },
        ],
      };
    }

    return {
      titleEn: `${inst.nameEn} Undergraduate Admission Circular 2025-2026`,
      titleBn: `${inst.nameBn} স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬`,
      session: '2025-2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-10',
      rawText: `${inst.nameEn} Undergraduate Admission 2025-2026: Unit A (Science) SSC/HSC 3.50, Combined 7.50; Unit B (Humanities & Social Sciences) Combined 6.50; Unit C (Business Studies) Combined 6.50.`,
      rules: [
        {
          programName: 'Unit A — Science & Engineering',
          minSscGpa: 3.5,
          minHscGpa: 3.5,
          minCombinedGpa: 7.5,
          allowedGroups: ['Science'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Unit A Criteria',
        },
        {
          programName: 'Unit B — Humanities & Social Sciences',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 6.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Unit B Criteria',
        },
        {
          programName: 'Unit C — Business Studies (BBA)',
          minSscGpa: 3.0,
          minHscGpa: 3.0,
          minCombinedGpa: 6.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'Unit C Criteria',
        },
      ],
    };
  }

  // --- Private Category ---
  if (inst.category === 'private') {
    const isTier1 = TIER1_PRIVATE_CODES.has(code);
    return {
      titleEn: `${inst.nameEn} Undergraduate Admission Circular 2026`,
      titleBn: `${inst.nameBn} স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৬`,
      session: 'Spring/Summer 2026',
      sourceUrl: inst.officialWebsite,
      deadline: '2026-12-20',
      rawText: `${inst.nameEn} Undergraduate Admission 2026: CSE / EEE Science track (SSC/HSC ${isTier1 ? '3.50' : '2.50'}, Combined ${isTier1 ? '7.50' : '6.00'}), BBA & English / Social Sciences tracks.`,
      rules: [
        {
          programName:
            code === 'DIU'
              ? 'B.Sc. in Computer Science & Engineering (CSE)'
              : 'CSE / EEE (Engineering & Computing)',
          minSscGpa: isTier1 ? 3.5 : 2.5,
          minHscGpa: isTier1 ? 3.5 : 2.5,
          minCombinedGpa: isTier1 ? 7.5 : 6.0,
          allowedGroups: ['Science'],
          allowedHscYears: [2023, 2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: isTier1
            ? { Mathematics: 3.5, Physics: 3.0 }
            : { Mathematics: 2.5 },
          pageReference: 'School of Engineering & Computing',
        },
        {
          programName: 'BBA (School of Business & Economics)',
          minSscGpa: isTier1 ? 3.0 : 2.5,
          minHscGpa: isTier1 ? 3.0 : 2.5,
          minCombinedGpa: isTier1 ? 6.5 : 5.5,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2023, 2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'School of Business',
        },
        {
          programName: 'B.A. / BSS (English, Economics & Social Sciences)',
          minSscGpa: isTier1 ? 3.0 : 2.5,
          minHscGpa: isTier1 ? 3.0 : 2.5,
          minCombinedGpa: isTier1 ? 6.0 : 5.0,
          allowedGroups: ['Science', 'Commerce', 'Humanities'],
          allowedHscYears: [2023, 2024, 2025],
          allowsSecondTimer: true,
          requiredSubjectMinGpa: {},
          pageReference: 'School of Humanities & Social Sciences',
        },
      ],
    };
  }

  // --- National Category ---
  return {
    titleEn: `${inst.nameEn} Honours Admission Circular 2025-2026`,
    titleBn: `${inst.nameBn} স্নাতক (সম্মান) ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬`,
    session: '2025-2026',
    sourceUrl: 'https://app1.nu.edu.bd',
    deadline: '2026-12-28',
    rawText: `${inst.nameEn} Honours Admission 2025-2026: Open to Science, Commerce, and Humanities. Minimum SSC/HSC GPA 2.50, Combined 5.50.`,
    rules: [
      {
        programName: 'Honours (Science / Business / Humanities Tracks)',
        minSscGpa: 2.5,
        minHscGpa: 2.5,
        minCombinedGpa: 5.5,
        allowedGroups: ['Science', 'Commerce', 'Humanities'],
        allowedHscYears: [2023, 2024, 2025],
        allowsSecondTimer: true,
        requiredSubjectMinGpa: {},
        pageReference: 'NU General Eligibility',
      },
    ],
  };
}
