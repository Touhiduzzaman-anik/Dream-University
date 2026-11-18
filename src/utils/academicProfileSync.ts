import type { BangladeshAcademicFormValue } from '../components/academic/BangladeshAcademicForm';
import {
  HSC_COMPULSORY_SUBJECTS,
  HSC_GROUP_SUBJECTS,
  type HscSubjectDefinition,
} from '../data/bangladeshEducation';
import type { AuthUser, StudentProfileRecord } from '../types/domain';
import type { AcademicGroup } from './eligibilityEngine';

export interface StudentProfileSaveBody {
  fullName: string;
  phone: string;
  collegeName: string;
  sscBoard: string;
  sscYear: number;
  sscGroup: AcademicGroup;
  sscGpaWithoutFourth: number;
  sscGpa: number;
  hscBoard: string;
  hscYear: number;
  hscGroup: AcademicGroup;
  hscGpaWithoutFourth: number;
  hscGpa: number;
  isSecondTimer: boolean;
  fourthSubjectCode: string;
  selectedSubjects: string[];
  subjectGrades: Record<string, number>;
  preferredSubject: string;
  preferredCity: string;
  tuitionBudgetBdt: number | '';
}

export function buildStudentProfileSaveBody(params: {
  academicPayload: {
    sscBoard: string;
    sscYear: number;
    sscGroup: AcademicGroup;
    sscGpaWithoutFourth: number;
    sscGpa: number;
    hscBoard: string;
    hscYear: number;
    hscGroup: AcademicGroup;
    hscGpaWithoutFourth: number;
    hscGpa: number;
    isSecondTimer: boolean;
    fourthSubjectCode: string;
    selectedSubjects: string[];
    subjectGrades: Record<string, number>;
  };
  user: Pick<AuthUser, 'fullName' | 'phone'>;
  profile: StudentProfileRecord | null;
  preferencesOverride?: {
    preferredSubject?: string;
    preferredCity?: string;
    collegeName?: string;
    tuitionBudgetBdt?: string;
  };
}): StudentProfileSaveBody {
  const { academicPayload, user, profile, preferencesOverride } = params;

  const preferredSubject =
    preferencesOverride?.preferredSubject !== undefined
      ? preferencesOverride.preferredSubject.trim()
      : profile?.preferredSubject ?? '';

  const preferredCity =
    preferencesOverride?.preferredCity !== undefined
      ? preferencesOverride.preferredCity.trim()
      : profile?.preferredCity ?? '';

  const collegeName =
    preferencesOverride?.collegeName !== undefined
      ? preferencesOverride.collegeName.trim()
      : profile?.collegeName ?? '';

  let tuitionBudgetBdt: number | '' = '';
  if (preferencesOverride?.tuitionBudgetBdt !== undefined) {
    const trimmed = preferencesOverride.tuitionBudgetBdt.trim();
    if (trimmed !== '' && Number.isFinite(Number(trimmed))) {
      tuitionBudgetBdt = Math.max(0, Number(trimmed));
    }
  } else if (profile?.tuitionBudgetBdt != null) {
    tuitionBudgetBdt = profile.tuitionBudgetBdt;
  }

  return {
    fullName: user.fullName,
    phone: user.phone ?? '',
    collegeName,
    ...academicPayload,
    preferredSubject,
    preferredCity,
    tuitionBudgetBdt,
  };
}

export function getUserInitials(fullName: string | null | undefined): string {
  const cleaned = (fullName ?? '').trim();
  if (!cleaned) return 'ST';
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase();
}

export function hasAcademicStageData(
  stage: 'ssc' | 'hsc',
  profile: StudentProfileRecord | null | undefined
): boolean {
  if (!profile) return false;
  if (stage === 'ssc') {
    return Boolean(
      profile.sscBoard ||
        profile.sscYear != null ||
        profile.sscGroup ||
        profile.sscGpa != null ||
        profile.sscGpaWithoutFourth != null
    );
  }
  return Boolean(
    profile.hscBoard ||
      profile.hscYear != null ||
      profile.hscGroup ||
      profile.hscGpa != null ||
      profile.hscGpaWithoutFourth != null ||
      Object.keys(profile.subjectGrades ?? {}).length > 0
  );
}

export function formatAcademicGroupLabel(group: string | null | undefined): string {
  if (group === 'Commerce') return 'Business Studies / Commerce';
  if (group === 'Humanities') return 'Humanities / Arts';
  if (group === 'Science') return 'Science';
  return group || '—';
}

export interface ReadOnlySubjectChip {
  key: string;
  code: string | null;
  name: string;
  gpaLabel: string;
  isFourthSubject: boolean;
}

export function buildReadOnlySubjectChips(
  profile: StudentProfileRecord | null | undefined
): ReadOnlySubjectChip[] {
  if (!profile) return [];
  const grades = profile.subjectGrades ?? {};
  const group = (profile.hscGroup as AcademicGroup | null) || 'Science';
  const defs: HscSubjectDefinition[] = [
    ...HSC_COMPULSORY_SUBJECTS,
    ...(HSC_GROUP_SUBJECTS[group] ?? []),
  ];
  const defByKey = new Map(defs.map((d) => [d.key, d]));

  const keys =
    Array.isArray(profile.selectedSubjects) && profile.selectedSubjects.length > 0
      ? profile.selectedSubjects
      : Object.keys(grades);

  const uniqueKeys = Array.from(new Set([...keys, ...Object.keys(grades)]));
  return uniqueKeys
    .filter((k) => grades[k] !== undefined || defByKey.has(k))
    .map((key) => {
      const def = defByKey.get(key);
      const val = grades[key];
      return {
        key,
        code: def?.code ?? null,
        name: def?.name ?? key,
        gpaLabel: val != null && Number.isFinite(val) ? val.toFixed(2) : '—',
        isFourthSubject: Boolean(def?.code && profile.fourthSubjectCode === def.code),
      };
    });
}

export function formatCompactAcademicSummary(
  profile: StudentProfileRecord | null | undefined,
  lang: 'en' | 'bn' = 'en'
): string {
  const emptyText = lang === 'bn' ? 'এখনো যোগ করা হয়নি' : 'Not added yet';
  if (!profile) return emptyText;

  const formatStage = (
    label: 'SSC' | 'HSC',
    group: string | null | undefined,
    gpa: number | null | undefined
  ): string | null => {
    const cleanGroup = group ? group.trim() : '';
    const hasGpa = gpa != null && Number.isFinite(gpa);
    if (!cleanGroup && !hasGpa) return null;

    if (cleanGroup && hasGpa) {
      return `${label}: ${cleanGroup} (GPA ${gpa.toFixed(2)})`;
    }
    if (cleanGroup) {
      return `${label}: ${cleanGroup}`;
    }
    return `${label}: GPA ${gpa!.toFixed(2)}`;
  };

  const parts = [
    formatStage('SSC', profile.sscGroup, profile.sscGpa),
    formatStage('HSC', profile.hscGroup, profile.hscGpa),
  ].filter((part): part is string => Boolean(part));

  return parts.length > 0 ? parts.join(' • ') : emptyText;
}

export type AcademicFormStateForSync = BangladeshAcademicFormValue;
