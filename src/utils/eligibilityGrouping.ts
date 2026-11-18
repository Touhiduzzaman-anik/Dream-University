import { VERIFIED_BANGLADESH_RANKINGS } from '../data/universityRankings.ts';
import type { AdmissionCategoryId, EligibilityResultItem } from '../types/domain';
import type { MedicalGpaScoreBreakdown } from './medicalScoring.ts';

export const ELIGIBILITY_CHECKBOX_CATEGORIES = [
  { id: 'public', labelEn: 'Public', labelBn: 'পাবলিক' },
  { id: 'private', labelEn: 'Private', labelBn: 'প্রাইভেট' },
  { id: 'medical', labelEn: 'Medical', labelBn: 'মেডিকেল' },
  { id: 'engineering', labelEn: 'Engineering', labelBn: 'প্রকৌশল' },
  { id: 'gst', labelEn: 'GST', labelBn: 'জিএসটি' },
] as const;

export type EligibilityCheckboxCategory = (typeof ELIGIBILITY_CHECKBOX_CATEGORIES)[number]['id'];

export const ALL_ELIGIBILITY_CHECKBOX_CATEGORIES: EligibilityCheckboxCategory[] = [
  'public',
  'private',
  'medical',
  'engineering',
  'gst',
];

const SELECTED_CATEGORIES_STORAGE_KEY = 'dream_uni_eligibility_categories_v1';
export const ELIGIBILITY_CATEGORIES_SYNC_EVENT = 'dream-uni:eligibility-categories-changed';

/**
 * Curated Top-Down Institutional Priority Order within each category (case-insensitive code lookup).
 * Remaining institutions in each category follow top-down ranking order from VERIFIED_BANGLADESH_RANKINGS.
 */
export const CATEGORY_PRIORITY_ORDER: Record<string, string[]> = {
  private: ['DIU', 'BRACU', 'NSU', 'IUB', 'AIUB', 'EWU', 'AUST', 'UIU'],
  public: ['DU', 'RU', 'CU', 'JU', 'BUP', 'JNU'],
  engineering: ['BUET', 'KUET', 'RUET', 'CUET', 'BUTEX', 'MIST', 'IUT'],
  gst: ['SUST', 'COU', 'HSTU', 'MBSTU', 'JUST', 'NSTU'],
  medical: ['DMC', 'SSMC', 'SHSMC', 'CMC', 'RMC', 'SOMC', 'MMC'],
};

const CATEGORY_PRIORITY_MAPS: Record<string, Map<string, number>> = Object.fromEntries(
  Object.entries(CATEGORY_PRIORITY_ORDER).map(([cat, codes]) => [
    cat,
    new Map(codes.map((code, idx) => [code.toUpperCase(), idx])),
  ])
);

const GLOBAL_RANKING_ORDER_MAP = new Map<string, number>(
  VERIFIED_BANGLADESH_RANKINGS.map((row, idx) => [row.code.toUpperCase(), idx])
);

export function getCategoryPriorityRank(category: string, institutionCode: string): number {
  const normalizedCode = institutionCode.trim().toUpperCase();
  const catMap = CATEGORY_PRIORITY_MAPS[category];
  if (catMap) {
    const rank = catMap.get(normalizedCode);
    if (rank !== undefined) return rank;
  }
  return Number.MAX_SAFE_INTEGER;
}

export function getGlobalRankingOrderIndex(institutionCode: string): number {
  const rank = GLOBAL_RANKING_ORDER_MAP.get(institutionCode.trim().toUpperCase());
  return rank !== undefined ? rank : Number.MAX_SAFE_INTEGER;
}

export function loadSelectedEligibilityCategories(): EligibilityCheckboxCategory[] {
  if (typeof window === 'undefined') return [...ALL_ELIGIBILITY_CHECKBOX_CATEGORIES];
  try {
    const raw = window.localStorage.getItem(SELECTED_CATEGORIES_STORAGE_KEY);
    if (!raw) return [...ALL_ELIGIBILITY_CHECKBOX_CATEGORIES];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [...ALL_ELIGIBILITY_CHECKBOX_CATEGORIES];
    const validSet = new Set<string>(ALL_ELIGIBILITY_CHECKBOX_CATEGORIES);
    return parsed.filter(
      (item): item is EligibilityCheckboxCategory => typeof item === 'string' && validSet.has(item)
    );
  } catch {
    return [...ALL_ELIGIBILITY_CHECKBOX_CATEGORIES];
  }
}

export function saveSelectedEligibilityCategories(categories: EligibilityCheckboxCategory[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SELECTED_CATEGORIES_STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(
      new CustomEvent(ELIGIBILITY_CATEGORIES_SYNC_EVENT, { detail: categories })
    );
  } catch {
    // Ignore storage errors in restricted browsing contexts
  }
}

export function toggleEligibilityCategory(
  current: EligibilityCheckboxCategory[],
  category: EligibilityCheckboxCategory
): EligibilityCheckboxCategory[] {
  if (current.includes(category)) {
    return current.filter((item) => item !== category);
  }
  return ALL_ELIGIBILITY_CHECKBOX_CATEGORIES.filter(
    (item) => item === category || current.includes(item)
  );
}

export interface InstitutionEligibilityGroup {
  institutionId: number;
  institutionCode: string;
  institutionNameEn: string;
  institutionNameBn: string;
  institutionType: string;
  institutionTypeBn: string;
  category: AdmissionCategoryId;
  city: string;
  estimatedTotalCostBdt: number | null;
  applicationDeadline: string | null;
  eligibleUnits: EligibilityResultItem[];
  notEligibleUnits: EligibilityResultItem[];
  pendingUnits: EligibilityResultItem[];
  allUnits: EligibilityResultItem[];
  overallStatus: 'Eligible' | 'Not Eligible' | 'Pending';
  medicalScoreBreakdown?: MedicalGpaScoreBreakdown | null;
}

export interface InstitutionEligibilitySummaryCounts {
  eligibleInstitutions: number;
  eligibleUnits: number;
  notEligibleInstitutions: number;
  pendingInstitutions: number;
  totalInstitutions: number;
}

export function filterEvaluationsByCategories(
  results: EligibilityResultItem[],
  selectedCategories: ReadonlyArray<EligibilityCheckboxCategory>
): EligibilityResultItem[] {
  const categorySet = new Set<string>(selectedCategories);
  return results.filter((item) => categorySet.has(item.category));
}

export function groupEligibilityByInstitution(
  results: EligibilityResultItem[],
  selectedCategories: ReadonlyArray<EligibilityCheckboxCategory>
): {
  groups: InstitutionEligibilityGroup[];
  summary: InstitutionEligibilitySummaryCounts;
} {
  const filtered = filterEvaluationsByCategories(results, selectedCategories);
  const map = new Map<number, InstitutionEligibilityGroup>();

  for (const item of filtered) {
    let group = map.get(item.institutionId);
    if (!group) {
      group = {
        institutionId: item.institutionId,
        institutionCode: item.institutionCode,
        institutionNameEn: item.institutionNameEn,
        institutionNameBn: item.institutionNameBn,
        institutionType: item.institutionType,
        institutionTypeBn: item.institutionTypeBn,
        category: item.category,
        city: item.city,
        estimatedTotalCostBdt: item.estimatedTotalCostBdt,
        applicationDeadline: item.applicationDeadline,
        eligibleUnits: [],
        notEligibleUnits: [],
        pendingUnits: [],
        allUnits: [],
        overallStatus: 'Pending',
        medicalScoreBreakdown: item.evaluation.medicalScoreBreakdown ?? null,
      };
      map.set(item.institutionId, group);
    } else if (!group.medicalScoreBreakdown && item.evaluation.medicalScoreBreakdown) {
      group.medicalScoreBreakdown = item.evaluation.medicalScoreBreakdown;
    }

    group.allUnits.push(item);
    if (!group.applicationDeadline && item.applicationDeadline) {
      group.applicationDeadline = item.applicationDeadline;
    }

    if (item.evaluation.status === 'Eligible') {
      group.eligibleUnits.push(item);
    } else if (item.evaluation.status === 'Not Eligible') {
      group.notEligibleUnits.push(item);
    } else {
      group.pendingUnits.push(item);
    }
  }

  let eligibleInstitutions = 0;
  let eligibleUnits = 0;
  let notEligibleInstitutions = 0;
  let pendingInstitutions = 0;

  const groups = Array.from(map.values()).map((group) => {
    if (group.eligibleUnits.length > 0) {
      group.overallStatus = 'Eligible';
      eligibleInstitutions += 1;
      eligibleUnits += group.eligibleUnits.length;
    } else if (group.notEligibleUnits.length > 0) {
      group.overallStatus = 'Not Eligible';
      notEligibleInstitutions += 1;
    } else {
      group.overallStatus = 'Pending';
      pendingInstitutions += 1;
    }
    return group;
  });

  const statusOrder: Record<InstitutionEligibilityGroup['overallStatus'], number> = {
    Eligible: 0,
    Pending: 1,
    'Not Eligible': 2,
  };
  const categoryOrder: Record<string, number> = {
    public: 0,
    engineering: 1,
    gst: 2,
    medical: 3,
    private: 4,
    national: 5,
  };

  groups.sort((a, b) => {
    // 1. Eligible institutions first, then Pending, then Not Eligible
    const statusDiff = statusOrder[a.overallStatus] - statusOrder[b.overallStatus];
    if (statusDiff !== 0) return statusDiff;

    // 2. Consistent Category Order (Public -> Engineering -> GST -> Medical -> Private -> National)
    const catDiff = (categoryOrder[a.category] ?? 9) - (categoryOrder[b.category] ?? 9);
    if (catDiff !== 0) return catDiff;

    // 3. Curated Top-Down Institutional Priority Order within each category
    const prioA = getCategoryPriorityRank(a.category, a.institutionCode);
    const prioB = getCategoryPriorityRank(b.category, b.institutionCode);
    if (prioA !== prioB) return prioA - prioB;

    // 4. Remaining institutions ordered top-down by VERIFIED_BANGLADESH_RANKINGS
    const rankA = getGlobalRankingOrderIndex(a.institutionCode);
    const rankB = getGlobalRankingOrderIndex(b.institutionCode);
    if (rankA !== rankB) return rankA - rankB;

    // 5. Fallback tie-breakers
    const eligibleDiff = b.eligibleUnits.length - a.eligibleUnits.length;
    if (eligibleDiff !== 0) return eligibleDiff;
    return a.institutionNameEn.localeCompare(b.institutionNameEn);
  });

  return {
    groups,
    summary: {
      eligibleInstitutions,
      eligibleUnits,
      notEligibleInstitutions,
      pendingInstitutions,
      totalInstitutions: groups.length,
    },
  };
}

export function getCategoryBadgeLabel(
  category: AdmissionCategoryId,
  lang: 'en' | 'bn' = 'en'
): string {
  const match = ELIGIBILITY_CHECKBOX_CATEGORIES.find((c) => c.id === category);
  if (match) return lang === 'bn' ? match.labelBn : match.labelEn;
  return lang === 'bn' ? 'জাতীয়' : 'National';
}
