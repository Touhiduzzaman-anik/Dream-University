import type { AcademicGroup } from '../utils/eligibilityEngine';

export const BANGLADESH_EDUCATION_BOARDS = [
  'Dhaka Education Board',
  'Chittagong Education Board',
  'Cumilla Education Board',
  'Rajshahi Education Board',
  'Jessore Education Board',
  'Barisal Education Board',
  'Sylhet Education Board',
  'Dinajpur Education Board',
  'Mymensingh Education Board',
  'Bangladesh Madrasah Education Board',
  'Bangladesh Technical Education Board',
] as const;

export type BangladeshBoard = (typeof BANGLADESH_EDUCATION_BOARDS)[number];

const BOARD_ALIAS_MAP: Record<string, BangladeshBoard> = {
  dhaka: 'Dhaka Education Board',
  chattogram: 'Chittagong Education Board',
  chittagong: 'Chittagong Education Board',
  cumilla: 'Cumilla Education Board',
  comilla: 'Cumilla Education Board',
  rajshahi: 'Rajshahi Education Board',
  jashore: 'Jessore Education Board',
  jessore: 'Jessore Education Board',
  barisal: 'Barisal Education Board',
  barishal: 'Barisal Education Board',
  sylhet: 'Sylhet Education Board',
  dinajpur: 'Dinajpur Education Board',
  mymensingh: 'Mymensingh Education Board',
  madrasah: 'Bangladesh Madrasah Education Board',
  technical: 'Bangladesh Technical Education Board',
};

export function normalizeBoardName(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim();
  if (!trimmed) return 'Dhaka Education Board';
  const exact = BANGLADESH_EDUCATION_BOARDS.find(
    (board) => board.toLowerCase() === trimmed.toLowerCase()
  );
  if (exact) return exact;
  const alias = BOARD_ALIAS_MAP[trimmed.toLowerCase()];
  return alias ?? trimmed;
}

export const SSC_PASSING_YEARS = [2024, 2023, 2022, 2021] as const;
export const HSC_PASSING_YEARS = [2026, 2025, 2024, 2023] as const;

export const ACADEMIC_GROUP_OPTIONS: Array<{
  value: AcademicGroup;
  label: string;
}> = [
  { value: 'Science', label: 'Science' },
  { value: 'Commerce', label: 'Business Studies / Commerce' },
  { value: 'Humanities', label: 'Humanities / Arts' },
];

export const HSC_GRADE_OPTIONS = [
  { value: '5.00', label: '5.00 / A+' },
  { value: '4.00', label: '4.00 / A' },
  { value: '3.50', label: '3.50 / A-' },
  { value: '3.00', label: '3.00 / B' },
  { value: '2.00', label: '2.00 / C' },
  { value: '1.00', label: '1.00 / D' },
] as const;

export interface HscSubjectDefinition {
  code: string;
  key: string;
  name: string;
  category: 'compulsory' | 'group';
  coreInGroup: boolean;
  canBeFourthSubject: boolean;
}

export const HSC_COMPULSORY_SUBJECTS: HscSubjectDefinition[] = [
  {
    code: '101',
    key: 'Bangla',
    name: 'Bangla',
    category: 'compulsory',
    coreInGroup: true,
    canBeFourthSubject: false,
  },
  {
    code: '107',
    key: 'English',
    name: 'English',
    category: 'compulsory',
    coreInGroup: true,
    canBeFourthSubject: false,
  },
  {
    code: '275',
    key: 'ICT',
    name: 'Information & Communication Technology (ICT)',
    category: 'compulsory',
    coreInGroup: true,
    canBeFourthSubject: false,
  },
];

export const HSC_GROUP_SUBJECTS: Record<AcademicGroup, HscSubjectDefinition[]> = {
  Science: [
    {
      code: '174',
      key: 'Physics',
      name: 'Physics',
      category: 'group',
      coreInGroup: true,
      canBeFourthSubject: false,
    },
    {
      code: '176',
      key: 'Chemistry',
      name: 'Chemistry',
      category: 'group',
      coreInGroup: true,
      canBeFourthSubject: false,
    },
    {
      code: '178',
      key: 'Biology',
      name: 'Biology',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '265',
      key: 'Mathematics',
      name: 'Higher Math',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
  ],
  Commerce: [
    {
      code: '253',
      key: 'Accounting',
      name: 'Accounting',
      category: 'group',
      coreInGroup: true,
      canBeFourthSubject: false,
    },
    {
      code: '292',
      key: 'Finance',
      name: 'Finance & Banking',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '277',
      key: 'Management',
      name: 'Business Organization & Management',
      category: 'group',
      coreInGroup: true,
      canBeFourthSubject: false,
    },
    {
      code: '286',
      key: 'Marketing',
      name: 'Production Management & Marketing',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '109',
      key: 'Economics',
      name: 'Economics',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
  ],
  Humanities: [
    {
      code: '269',
      key: 'Civics',
      name: 'Civics & Good Governance',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '109',
      key: 'Economics',
      name: 'Economics',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '267',
      key: 'Islamic History',
      name: 'Islamic History & Culture',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '304',
      key: 'History',
      name: 'History',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '271',
      key: 'Social Work',
      name: 'Social Work',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '117',
      key: 'Sociology',
      name: 'Sociology',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '121',
      key: 'Logic',
      name: 'Logic',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
    {
      code: '273',
      key: 'Home Science',
      name: 'Home Science',
      category: 'group',
      coreInGroup: false,
      canBeFourthSubject: true,
    },
  ],
};

export function getSubjectsForGroup(group: AcademicGroup): {
  compulsory: HscSubjectDefinition[];
  groupSubjects: HscSubjectDefinition[];
} {
  return {
    compulsory: HSC_COMPULSORY_SUBJECTS,
    groupSubjects: HSC_GROUP_SUBJECTS[group] ?? HSC_GROUP_SUBJECTS.Science,
  };
}

export function getMaxGroupSubjects(group: AcademicGroup): number | null {
  return group === 'Humanities' ? 4 : null;
}

export function getDefaultSubjectSelectionForGroup(group: AcademicGroup): {
  selectedSubjects: string[];
  defaultFourthSubjectCode: string;
} {
  const compulsoryKeys = HSC_COMPULSORY_SUBJECTS.map((s) => s.key);
  if (group === 'Science') {
    return {
      selectedSubjects: [...compulsoryKeys, 'Physics', 'Chemistry', 'Biology', 'Mathematics'],
      defaultFourthSubjectCode: '178',
    };
  }
  if (group === 'Commerce') {
    return {
      selectedSubjects: [...compulsoryKeys, 'Accounting', 'Finance', 'Management', 'Economics'],
      defaultFourthSubjectCode: '109',
    };
  }
  return {
    selectedSubjects: [...compulsoryKeys, 'Civics', 'Economics', 'Islamic History', 'Logic'],
    defaultFourthSubjectCode: '121',
  };
}

export function toggleGroupSubjectSelection(
  group: AcademicGroup,
  currentSelectedKeys: string[],
  targetKey: string
): string[] {
  const compulsoryKeys = HSC_COMPULSORY_SUBJECTS.map((s) => s.key);
  if (compulsoryKeys.includes(targetKey)) {
    return Array.from(new Set([...compulsoryKeys, ...currentSelectedKeys]));
  }

  const groupDefs = HSC_GROUP_SUBJECTS[group] ?? [];
  const allowedGroupKeys = new Set(groupDefs.map((s) => s.key));
  if (!allowedGroupKeys.has(targetKey)) {
    return currentSelectedKeys;
  }

  const currentGroupKeys = currentSelectedKeys.filter((k) => allowedGroupKeys.has(k));
  const exists = currentGroupKeys.includes(targetKey);

  let nextGroupKeys: string[];
  if (exists) {
    nextGroupKeys = currentGroupKeys.filter((k) => k !== targetKey);
  } else {
    const maxAllowed = getMaxGroupSubjects(group);
    if (maxAllowed !== null && currentGroupKeys.length >= maxAllowed) {
      return currentSelectedKeys;
    }
    nextGroupKeys = [...currentGroupKeys, targetKey];
  }

  return Array.from(new Set([...compulsoryKeys, ...nextGroupKeys]));
}

export function buildDefaultSubjectGradesMap(
  group: AcademicGroup,
  existingGrades?: Record<string, number> | null
): Record<string, string> {
  const map: Record<string, string> = {};
  const allDefs = [...HSC_COMPULSORY_SUBJECTS, ...(HSC_GROUP_SUBJECTS[group] ?? [])];
  for (const subj of allDefs) {
    const existing = existingGrades?.[subj.key];
    map[subj.key] = existing != null && Number.isFinite(existing) ? existing.toFixed(2) : '5.00';
  }
  return map;
}
