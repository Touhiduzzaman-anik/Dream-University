export interface CostEstimateInput {
  perCreditFeeBdt: number;
  totalCredits: number;
  semesterFeeBdt: number;
  semesters: number;
  admissionFeeBdt: number;
  waiverPercent?: number;
  studentBudgetBdt?: number | null;
}

export interface CostEstimateResult {
  grossTuitionBdt: number;
  discountedTuitionBdt: number;
  totalSemesterFeesBdt: number;
  admissionFeeBdt: number;
  estimatedTotalBdt: number;
  estimatedPerSemesterBdt: number;
  withinBudget: boolean | null;
}

export function calculatePrivateUniversityCost(input: CostEstimateInput): CostEstimateResult {
  const waiver = Math.max(0, Math.min(100, input.waiverPercent ?? 0));
  const semesters = Math.max(1, Math.round(input.semesters));
  const grossTuitionBdt = Math.max(0, Math.round(input.perCreditFeeBdt * input.totalCredits));
  const discountedTuitionBdt = Math.round(grossTuitionBdt * (1 - waiver / 100));
  const totalSemesterFeesBdt = Math.max(0, Math.round(input.semesterFeeBdt * semesters));
  const admissionFeeBdt = Math.max(0, Math.round(input.admissionFeeBdt));
  const estimatedTotalBdt = discountedTuitionBdt + totalSemesterFeesBdt + admissionFeeBdt;
  const estimatedPerSemesterBdt = Math.round(estimatedTotalBdt / semesters);

  const withinBudget =
    typeof input.studentBudgetBdt === 'number' && input.studentBudgetBdt > 0
      ? estimatedTotalBdt <= input.studentBudgetBdt
      : null;

  return {
    grossTuitionBdt,
    discountedTuitionBdt,
    totalSemesterFeesBdt,
    admissionFeeBdt,
    estimatedTotalBdt,
    estimatedPerSemesterBdt,
    withinBudget,
  };
}
