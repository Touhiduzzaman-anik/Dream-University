import { normalizeBoardName } from '../data/bangladeshEducation.ts';

export type AcademicGroup = 'Science' | 'Commerce' | 'Humanities';

export type RulePublicationStatus =
  | 'draft'
  | 'ai_extracted'
  | 'under_review'
  | 'published'
  | 'expired'
  | 'archived';

export interface StudentAcademicInput {
  sscGpa?: number;
  sscGpaWithoutFourth?: number;
  hscGpa?: number;
  hscGpaWithoutFourth?: number;
  sscBoard?: string;
  hscBoard?: string;
  sscGroup?: AcademicGroup;
  sscYear?: number;
  hscYear?: number;
  hscGroup?: AcademicGroup;
  isSecondTimer?: boolean;
  fourthSubjectCode?: string;
  selectedSubjects?: string[];
  subjectGrades?: Record<string, number>;
}

export interface OfficialRuleSource {
  circularTitle: string;
  session: string;
  officialUrl: string;
  pageReference?: string;
}

export interface VerifiedAdmissionRule {
  id: string;
  institutionId: string;
  programName: string;
  status: RulePublicationStatus;
  isVerified: boolean;
  source: OfficialRuleSource;
  gpaMode?: 'with_fourth' | 'without_fourth';
  minSscGpa?: number;
  minHscGpa?: number;
  minCombinedGpa?: number;
  minSscGpaWithoutFourth?: number;
  minHscGpaWithoutFourth?: number;
  minCombinedGpaWithoutFourth?: number;
  allowedGroups?: AcademicGroup[];
  allowedBoards?: string[];
  allowedSscYears?: number[];
  allowedHscYears?: number[];
  allowsSecondTimer?: boolean;
  requiredSubjectMinGpa?: Record<string, number>;
}

export interface FailedRequirement {
  code:
    | 'ssc_gpa'
    | 'hsc_gpa'
    | 'combined_gpa'
    | 'ssc_gpa_without_fourth'
    | 'hsc_gpa_without_fourth'
    | 'combined_gpa_without_fourth'
    | 'group_restriction'
    | 'board_restriction'
    | 'ssc_passing_year'
    | 'passing_year'
    | 'second_timer'
    | 'subject_missing'
    | 'subject_gpa';
  messageEn: string;
  messageBn: string;
  source: OfficialRuleSource;
}

export type EligibilityStatus = 'Eligible' | 'Not Eligible' | 'Pending';

export interface EligibilityEvaluation {
  status: EligibilityStatus;
  failedRequirements: FailedRequirement[];
  missingStudentFields: string[];
  pendingReasonEn?: string;
  pendingReasonBn?: string;
  source?: OfficialRuleSource;
  medicalScoreBreakdown?: {
    sscGpa: number;
    hscGpa: number;
    sscScore: number;
    hscScore: number;
    totalScore: number;
    maxSscScore: 40;
    maxHscScore: 60;
    maxTotalScore: 100;
    combinedGpa: number;
    biologyGpa: number | null;
    hasBiology: boolean;
    isScienceGroup: boolean;
    meetsMinimumCriteria: boolean;
    formattedSummaryEn: string;
    formattedSummaryBn: string;
  } | null;
}

const SUBJECT_ALIASES: Record<string, string[]> = {
  bangla: ['Bangla', '101'],
  '101': ['Bangla', '101'],
  english: ['English', '107'],
  '107': ['English', '107'],
  ict: ['ICT', 'Information & Communication Technology', 'Information & Communication Technology (ICT)', '275'],
  '275': ['ICT', '275'],
  physics: ['Physics', '174'],
  '174': ['Physics', '174'],
  chemistry: ['Chemistry', '176'],
  '176': ['Chemistry', '176'],
  biology: ['Biology', '178'],
  '178': ['Biology', '178'],
  mathematics: ['Mathematics', 'Higher Math', 'Higher Mathematics', '265'],
  'higher math': ['Mathematics', 'Higher Math', 'Higher Mathematics', '265'],
  'higher mathematics': ['Mathematics', 'Higher Math', 'Higher Mathematics', '265'],
  '265': ['Mathematics', 'Higher Math', '265'],
  accounting: ['Accounting', '253'],
  '253': ['Accounting', '253'],
  finance: ['Finance', 'Finance & Banking', '292'],
  'finance & banking': ['Finance', 'Finance & Banking', '292'],
  '292': ['Finance', '292'],
  management: ['Management', 'Business Organization & Management', '277'],
  'business organization & management': ['Management', '277'],
  '277': ['Management', '277'],
  marketing: ['Marketing', 'Production Management & Marketing', '286'],
  '286': ['Marketing', '286'],
  economics: ['Economics', '109'],
  '109': ['Economics', '109'],
  civics: ['Civics', 'Civics & Good Governance', '269'],
  '269': ['Civics', '269'],
  'islamic history': ['Islamic History', 'Islamic History & Culture', '267'],
  '267': ['Islamic History', '267'],
  history: ['History', '304'],
  '304': ['History', '304'],
  'social work': ['Social Work', '271'],
  '271': ['Social Work', '271'],
  sociology: ['Sociology', '117'],
  '117': ['Sociology', '117'],
  logic: ['Logic', '121'],
  '121': ['Logic', '121'],
  'home science': ['Home Science', '273'],
  '273': ['Home Science', '273'],
};

function candidateSubjectKeys(subject: string): string[] {
  const aliases = SUBJECT_ALIASES[subject.trim().toLowerCase()];
  return aliases ? Array.from(new Set([subject, ...aliases])) : [subject];
}

function isSubjectInSelection(selectedSet: Set<string>, subject: string): boolean {
  return candidateSubjectKeys(subject).some((k) => selectedSet.has(k));
}

function lookupSubjectGrade(grades: Record<string, number> | undefined, subject: string): number | undefined {
  if (!grades) return undefined;
  for (const key of candidateSubjectKeys(subject)) {
    const v = grades[key];
    if (v !== undefined && Number.isFinite(v)) {
      return v;
    }
  }
  return undefined;
}

export function evaluateDeterministicEligibility(
  student: StudentAcademicInput,
  rule: VerifiedAdmissionRule | null | undefined
): EligibilityEvaluation {
  // 1. Only verified and published admission rules can be used. Never guess.
  if (!rule || !rule.isVerified || rule.status !== 'published') {
    return {
      status: 'Pending',
      failedRequirements: [],
      missingStudentFields: [],
      pendingReasonEn:
        'Verified published admission rules are not yet available for this program. Eligibility cannot be guessed.',
      pendingReasonBn:
        'এই প্রোগ্রামের জন্য যাচাইকৃত ও প্রকাশিত ভর্তির নীতিমালা এখনো যুক্ত হয়নি। অনুমানের ভিত্তিতে যোগ্যতা নির্ণয় করা হবে না।',
      source: rule?.source,
    };
  }

  const usesWithoutFourthAsPrimary = rule.gpaMode === 'without_fourth';
  const hasExplicitCombination = Array.isArray(student.selectedSubjects);
  const selectedSet = new Set(student.selectedSubjects ?? []);

  // 2. Check for missing required student academic fields
  const missing: string[] = [];
  if (!usesWithoutFourthAsPrimary) {
    if (rule.minSscGpa !== undefined || rule.minCombinedGpa !== undefined) {
      if (student.sscGpa === undefined || !Number.isFinite(student.sscGpa)) {
        missing.push('SSC GPA');
      }
    }
    if (rule.minHscGpa !== undefined || rule.minCombinedGpa !== undefined) {
      if (student.hscGpa === undefined || !Number.isFinite(student.hscGpa)) {
        missing.push('HSC GPA');
      }
    }
  }

  const needsSscWithoutFourth =
    usesWithoutFourthAsPrimary && (rule.minSscGpa !== undefined || rule.minCombinedGpa !== undefined);
  if (
    needsSscWithoutFourth ||
    rule.minSscGpaWithoutFourth !== undefined ||
    rule.minCombinedGpaWithoutFourth !== undefined
  ) {
    if (student.sscGpaWithoutFourth === undefined || !Number.isFinite(student.sscGpaWithoutFourth)) {
      missing.push('SSC GPA (Without 4th Subject)');
    }
  }

  const needsHscWithoutFourth =
    usesWithoutFourthAsPrimary && (rule.minHscGpa !== undefined || rule.minCombinedGpa !== undefined);
  if (
    needsHscWithoutFourth ||
    rule.minHscGpaWithoutFourth !== undefined ||
    rule.minCombinedGpaWithoutFourth !== undefined
  ) {
    if (student.hscGpaWithoutFourth === undefined || !Number.isFinite(student.hscGpaWithoutFourth)) {
      missing.push('HSC GPA (Without 4th Subject)');
    }
  }

  if (rule.allowedGroups && rule.allowedGroups.length > 0 && !student.hscGroup) {
    missing.push('HSC Group');
  }
  if (rule.allowedBoards && rule.allowedBoards.length > 0 && !student.hscBoard) {
    missing.push('HSC Education Board');
  }
  if (rule.allowedSscYears && rule.allowedSscYears.length > 0 && student.sscYear === undefined) {
    missing.push('SSC Passing Year');
  }
  if (rule.allowedHscYears && rule.allowedHscYears.length > 0 && student.hscYear === undefined) {
    missing.push('HSC Passing Year');
  }
  if (rule.allowsSecondTimer === false && student.isSecondTimer === undefined) {
    missing.push('Second Timer Status');
  }
  if (rule.requiredSubjectMinGpa) {
    for (const subject of Object.keys(rule.requiredSubjectMinGpa)) {
      // If student specified their subject combination and omitted this subject,
      // it is a deterministic failure (evaluated in Step 3), NOT a missing field.
      if (hasExplicitCombination && !isSubjectInSelection(selectedSet, subject)) {
        continue;
      }
      if (lookupSubjectGrade(student.subjectGrades, subject) === undefined) {
        missing.push(`${subject} GPA`);
      }
    }
  }

  if (missing.length > 0) {
    return {
      status: 'Pending',
      failedRequirements: [],
      missingStudentFields: missing,
      pendingReasonEn: `Missing required academic information: ${missing.join(', ')}.`,
      pendingReasonBn: `প্রয়োজনীয় একাডেমিক তথ্য অসম্পূর্ণ: ${missing.join(', ')}।`,
      source: rule.source,
    };
  }

  // 3. Evaluate ALL applicable conditions deterministically (never stop at the first failure)
  const failed: FailedRequirement[] = [];

  if (!usesWithoutFourthAsPrimary) {
    if (rule.minSscGpa !== undefined && student.sscGpa! < rule.minSscGpa) {
      failed.push({
        code: 'ssc_gpa',
        messageEn: `Required SSC GPA: ${rule.minSscGpa.toFixed(2)}. Your SSC GPA: ${student.sscGpa!.toFixed(2)}.`,
        messageBn: `প্রয়োজনীয় এসএসসি জিপিএ: ${rule.minSscGpa.toFixed(2)}। আপনার এসএসসি জিপিএ: ${student.sscGpa!.toFixed(2)}।`,
        source: rule.source,
      });
    }

    if (rule.minHscGpa !== undefined && student.hscGpa! < rule.minHscGpa) {
      failed.push({
        code: 'hsc_gpa',
        messageEn: `Required HSC GPA: ${rule.minHscGpa.toFixed(2)}. Your HSC GPA: ${student.hscGpa!.toFixed(2)}.`,
        messageBn: `প্রয়োজনীয় এইচএসসি জিপিএ: ${rule.minHscGpa.toFixed(2)}। আপনার এইচএসসি জিপিএ: ${student.hscGpa!.toFixed(2)}।`,
        source: rule.source,
      });
    }

    if (rule.minCombinedGpa !== undefined) {
      const combined = Number((student.sscGpa! + student.hscGpa!).toFixed(2));
      if (combined < rule.minCombinedGpa) {
        failed.push({
          code: 'combined_gpa',
          messageEn: `Required Combined (SSC + HSC) GPA: ${rule.minCombinedGpa.toFixed(2)}. Your Combined GPA: ${combined.toFixed(2)}.`,
          messageBn: `প্রয়োজনীয় সম্মিলিত (এসএসসি + এইচএসসি) জিপিএ: ${rule.minCombinedGpa.toFixed(2)}। আপনার সম্মিলিত জিপিএ: ${combined.toFixed(2)}।`,
          source: rule.source,
        });
      }
    }
  } else {
    if (rule.minSscGpa !== undefined && student.sscGpaWithoutFourth! < rule.minSscGpa) {
      failed.push({
        code: 'ssc_gpa_without_fourth',
        messageEn: `Required SSC GPA (Without 4th Subject): ${rule.minSscGpa.toFixed(2)}. Yours: ${student.sscGpaWithoutFourth!.toFixed(2)}.`,
        messageBn: `প্রয়োজনীয় এসএসসি জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minSscGpa.toFixed(2)}। আপনার জিপিএ: ${student.sscGpaWithoutFourth!.toFixed(2)}।`,
        source: rule.source,
      });
    }

    if (rule.minHscGpa !== undefined && student.hscGpaWithoutFourth! < rule.minHscGpa) {
      failed.push({
        code: 'hsc_gpa_without_fourth',
        messageEn: `Required HSC GPA (Without 4th Subject): ${rule.minHscGpa.toFixed(2)}. Yours: ${student.hscGpaWithoutFourth!.toFixed(2)}.`,
        messageBn: `প্রয়োজনীয় এইচএসসি জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minHscGpa.toFixed(2)}। আপনার জিপিএ: ${student.hscGpaWithoutFourth!.toFixed(2)}।`,
        source: rule.source,
      });
    }

    if (rule.minCombinedGpa !== undefined) {
      const combined = Number(
        (student.sscGpaWithoutFourth! + student.hscGpaWithoutFourth!).toFixed(2)
      );
      if (combined < rule.minCombinedGpa) {
        failed.push({
          code: 'combined_gpa_without_fourth',
          messageEn: `Required Combined GPA (Without 4th Subject): ${rule.minCombinedGpa.toFixed(2)}. Yours: ${combined.toFixed(2)}.`,
          messageBn: `প্রয়োজনীয় সম্মিলিত জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minCombinedGpa.toFixed(2)}। আপনার জিপিএ: ${combined.toFixed(2)}।`,
          source: rule.source,
        });
      }
    }
  }

  // Explicit Without-4th-Subject checks (used when circular checks BOTH with & without 4th subject, e.g., BUET/CKRUET/Medical)
  if (
    rule.minSscGpaWithoutFourth !== undefined &&
    student.sscGpaWithoutFourth! < rule.minSscGpaWithoutFourth
  ) {
    failed.push({
      code: 'ssc_gpa_without_fourth',
      messageEn: `Required SSC GPA (Without 4th Subject): ${rule.minSscGpaWithoutFourth.toFixed(2)}. Yours: ${student.sscGpaWithoutFourth!.toFixed(2)}.`,
      messageBn: `প্রয়োজনীয় এসএসসি জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minSscGpaWithoutFourth.toFixed(2)}। আপনার জিপিএ: ${student.sscGpaWithoutFourth!.toFixed(2)}।`,
      source: rule.source,
    });
  }

  if (
    rule.minHscGpaWithoutFourth !== undefined &&
    student.hscGpaWithoutFourth! < rule.minHscGpaWithoutFourth
  ) {
    failed.push({
      code: 'hsc_gpa_without_fourth',
      messageEn: `Required HSC GPA (Without 4th Subject): ${rule.minHscGpaWithoutFourth.toFixed(2)}. Yours: ${student.hscGpaWithoutFourth!.toFixed(2)}.`,
      messageBn: `প্রয়োজনীয় এইচএসসি জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minHscGpaWithoutFourth.toFixed(2)}। আপনার জিপিএ: ${student.hscGpaWithoutFourth!.toFixed(2)}।`,
      source: rule.source,
    });
  }

  if (rule.minCombinedGpaWithoutFourth !== undefined) {
    const combinedWithout = Number(
      (student.sscGpaWithoutFourth! + student.hscGpaWithoutFourth!).toFixed(2)
    );
    if (combinedWithout < rule.minCombinedGpaWithoutFourth) {
      failed.push({
        code: 'combined_gpa_without_fourth',
        messageEn: `Required Combined GPA (Without 4th Subject): ${rule.minCombinedGpaWithoutFourth.toFixed(2)}. Yours: ${combinedWithout.toFixed(2)}.`,
        messageBn: `প্রয়োজনীয় সম্মিলিত জিপিএ (৪র্থ বিষয় ছাড়া): ${rule.minCombinedGpaWithoutFourth.toFixed(2)}। আপনার জিপিএ: ${combinedWithout.toFixed(2)}।`,
        source: rule.source,
      });
    }
  }

  if (
    rule.allowedGroups &&
    rule.allowedGroups.length > 0 &&
    !rule.allowedGroups.includes(student.hscGroup!)
  ) {
    failed.push({
      code: 'group_restriction',
      messageEn: `Allowed HSC Group(s): ${rule.allowedGroups.join(', ')}. Your Group: ${student.hscGroup}.`,
      messageBn: `অনুমোদিত এইচএসসি বিভাগ: ${rule.allowedGroups.join(', ')}। আপনার বিভাগ: ${student.hscGroup}।`,
      source: rule.source,
    });
  }

  if (rule.allowedBoards && rule.allowedBoards.length > 0) {
    const normalizedStudentBoard = normalizeBoardName(student.hscBoard);
    const allowedSet = new Set(rule.allowedBoards.map((b) => normalizeBoardName(b)));
    if (!allowedSet.has(normalizedStudentBoard)) {
      failed.push({
        code: 'board_restriction',
        messageEn: `Eligible Education Board(s): ${rule.allowedBoards.join(', ')}. Your Board: ${normalizedStudentBoard}.`,
        messageBn: `অনুমোদিত শিক্ষা বোর্ড: ${rule.allowedBoards.join(', ')}। আপনার বোর্ড: ${normalizedStudentBoard}।`,
        source: rule.source,
      });
    }
  }

  if (
    rule.allowedSscYears &&
    rule.allowedSscYears.length > 0 &&
    !rule.allowedSscYears.includes(student.sscYear!)
  ) {
    failed.push({
      code: 'ssc_passing_year',
      messageEn: `Eligible SSC Passing Year(s): ${rule.allowedSscYears.join(', ')}. Your SSC Year: ${student.sscYear}.`,
      messageBn: `যোগ্য এসএসসি পাসের সাল: ${rule.allowedSscYears.join(', ')}। আপনার পাসের সাল: ${student.sscYear}।`,
      source: rule.source,
    });
  }

  if (
    rule.allowedHscYears &&
    rule.allowedHscYears.length > 0 &&
    !rule.allowedHscYears.includes(student.hscYear!)
  ) {
    failed.push({
      code: 'passing_year',
      messageEn: `Eligible HSC Passing Year(s): ${rule.allowedHscYears.join(', ')}. Your HSC Year: ${student.hscYear}.`,
      messageBn: `যোগ্য এইচএসসি পাসের সাল: ${rule.allowedHscYears.join(', ')}। আপনার পাসের সাল: ${student.hscYear}।`,
      source: rule.source,
    });
  }

  if (rule.allowsSecondTimer === false && student.isSecondTimer === true) {
    failed.push({
      code: 'second_timer',
      messageEn: 'Second-time applicants are not permitted under this admission circular.',
      messageBn: 'এই ভর্তি সার্কুলার অনুযায়ী দ্বিতীয়বার (সেকেন্ড টাইমার) আবেদন অনুমোদিত নয়।',
      source: rule.source,
    });
  }

  if (rule.requiredSubjectMinGpa) {
    for (const [subject, minSubjectGpa] of Object.entries(rule.requiredSubjectMinGpa)) {
      if (hasExplicitCombination && !isSubjectInSelection(selectedSet, subject)) {
        failed.push({
          code: 'subject_missing',
          messageEn: `Required subject not in your HSC subject combination: ${subject} (minimum GPA ${minSubjectGpa.toFixed(2)} required).`,
          messageBn: `আপনার এইচএসসি বিষয় সমন্বয়ে প্রয়োজনীয় বিষয়টি নেই: ${subject} (ন্যূনতম জিপিএ ${minSubjectGpa.toFixed(2)} আবশ্যক)।`,
          source: rule.source,
        });
        continue;
      }
      const actual = lookupSubjectGrade(student.subjectGrades, subject)!;
      if (actual < minSubjectGpa) {
        failed.push({
          code: 'subject_gpa',
          messageEn: `Required ${subject} GPA: ${minSubjectGpa.toFixed(2)}. Your ${subject} GPA: ${actual.toFixed(2)}.`,
          messageBn: `${subject}-এ প্রয়োজনীয় জিপিএ: ${minSubjectGpa.toFixed(2)}। আপনার ${subject} জিপিএ: ${actual.toFixed(2)}।`,
          source: rule.source,
        });
      }
    }
  }

  if (failed.length > 0) {
    return {
      status: 'Not Eligible',
      failedRequirements: failed,
      missingStudentFields: [],
      source: rule.source,
    };
  }

  return {
    status: 'Eligible',
    failedRequirements: [],
    missingStudentFields: [],
    source: rule.source,
  };
}
