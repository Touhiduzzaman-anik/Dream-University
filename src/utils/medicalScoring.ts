import type { AcademicGroup, StudentAcademicInput } from './eligibilityEngine.ts';

export interface MedicalGpaScoreBreakdown {
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
}

const BIOLOGY_KEYS = ['Biology', 'biology', '178'];

function extractBiologyGpa(subjectGrades?: Record<string, number>): number | null {
  if (!subjectGrades) return null;
  for (const key of BIOLOGY_KEYS) {
    const val = subjectGrades[key];
    if (val !== undefined && Number.isFinite(val)) {
      return Number(val);
    }
  }
  return null;
}

function hasBiologySelected(selectedSubjects?: string[], biologyGpa?: number | null): boolean {
  if (Array.isArray(selectedSubjects)) {
    const normalized = new Set(selectedSubjects.map((s) => s.trim().toLowerCase()));
    return normalized.has('biology') || normalized.has('178');
  }
  return biologyGpa !== null && biologyGpa !== undefined;
}

/**
 * Official DGME (Bangladesh Medical & Dental) 100-Mark GPA Scoring Calculation:
 * - SSC Score = SSC_GPA * 8 (Max 40.00)
 * - HSC Score = HSC_GPA * 12 (Max 60.00)
 * - Total Score = (SSC_GPA * 8) + (HSC_GPA * 12) out of 100.00
 *
 * Official DGME Eligibility Criteria:
 * - Group must be Science
 * - SSC GPA >= 4.00 and HSC GPA >= 4.00
 * - Combined (SSC + HSC) GPA >= 9.00
 * - Minimum Biology GPA 4.00 (Grade A) in HSC
 */
export function calculateDgmeMedicalGpaScore(
  input: Pick<
    StudentAcademicInput,
    'sscGpa' | 'hscGpa' | 'hscGroup' | 'selectedSubjects' | 'subjectGrades'
  >
): MedicalGpaScoreBreakdown | null {
  if (
    input.sscGpa === undefined ||
    input.hscGpa === undefined ||
    !Number.isFinite(input.sscGpa) ||
    !Number.isFinite(input.hscGpa)
  ) {
    return null;
  }

  const sscGpa = Math.max(0, Math.min(5, Number(input.sscGpa)));
  const hscGpa = Math.max(0, Math.min(5, Number(input.hscGpa)));
  const sscScore = Number((sscGpa * 8).toFixed(2));
  const hscScore = Number((hscGpa * 12).toFixed(2));
  const totalScore = Number((sscScore + hscScore).toFixed(2));
  const combinedGpa = Number((sscGpa + hscGpa).toFixed(2));

  const biologyGpa = extractBiologyGpa(input.subjectGrades);
  const hasBiology = hasBiologySelected(input.selectedSubjects, biologyGpa);
  const isScienceGroup = (input.hscGroup as AcademicGroup | undefined) === 'Science';

  const meetsMinimumCriteria =
    isScienceGroup &&
    sscGpa >= 4.0 &&
    hscGpa >= 4.0 &&
    combinedGpa >= 9.0 &&
    hasBiology &&
    biologyGpa !== null &&
    biologyGpa >= 4.0;

  return {
    sscGpa,
    hscGpa,
    sscScore,
    hscScore,
    totalScore,
    maxSscScore: 40,
    maxHscScore: 60,
    maxTotalScore: 100,
    combinedGpa,
    biologyGpa,
    hasBiology,
    isScienceGroup,
    meetsMinimumCriteria,
    formattedSummaryEn: `Medical GPA Score Breakdown: ${totalScore.toFixed(2)} / 100 (SSC: ${sscScore.toFixed(2)}/40 + HSC: ${hscScore.toFixed(2)}/60)`,
    formattedSummaryBn: `মেডিকেল জিপিএ স্কোর বিশ্লেষণ: ${totalScore.toFixed(2)} / 100 (SSC: ${sscScore.toFixed(2)}/40 + HSC: ${hscScore.toFixed(2)}/60)`,
  };
}
