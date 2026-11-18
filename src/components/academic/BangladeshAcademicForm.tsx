import { Check, Info } from 'lucide-react';
import {
  ACADEMIC_GROUP_OPTIONS,
  BANGLADESH_EDUCATION_BOARDS,
  HSC_GRADE_OPTIONS,
  HSC_PASSING_YEARS,
  SSC_PASSING_YEARS,
  buildDefaultSubjectGradesMap,
  getDefaultSubjectSelectionForGroup,
  getMaxGroupSubjects,
  getSubjectsForGroup,
  normalizeBoardName,
  toggleGroupSubjectSelection,
  type HscSubjectDefinition,
} from '../../data/bangladeshEducation';
import type { StudentProfileRecord } from '../../types/domain';
import type { AcademicGroup } from '../../utils/eligibilityEngine';

export interface BangladeshAcademicFormValue {
  sscBoard: string;
  sscYear: string;
  sscGroup: AcademicGroup;
  sscGpaWithoutFourth: string;
  sscGpa: string;
  hscBoard: string;
  hscYear: string;
  hscGroup: AcademicGroup;
  hscGpaWithoutFourth: string;
  hscGpa: string;
  isSecondTimer: boolean;
  fourthSubjectCode: string;
  selectedSubjects: string[];
  subjectGrades: Record<string, string>;
}

export function createInitialAcademicFormValue(
  profile?: StudentProfileRecord | null
): BangladeshAcademicFormValue {
  const hscGroup = (profile?.hscGroup as AcademicGroup | null) || 'Science';
  const sscGroup = (profile?.sscGroup as AcademicGroup | null) || hscGroup;
  const defaults = getDefaultSubjectSelectionForGroup(hscGroup);

  const profileSelected =
    Array.isArray(profile?.selectedSubjects) && profile.selectedSubjects.length > 0
      ? profile.selectedSubjects
      : Object.keys(profile?.subjectGrades ?? {}).length > 0
      ? Array.from(
          new Set([
            'Bangla',
            'English',
            'ICT',
            ...Object.keys(profile?.subjectGrades ?? {}),
          ])
        )
      : defaults.selectedSubjects;

  return {
    sscBoard: normalizeBoardName(profile?.sscBoard),
    sscYear: profile?.sscYear ? String(profile.sscYear) : '2023',
    sscGroup,
    sscGpaWithoutFourth:
      profile?.sscGpaWithoutFourth != null
        ? profile.sscGpaWithoutFourth.toFixed(2)
        : profile?.sscGpa != null
        ? profile.sscGpa.toFixed(2)
        : '5.00',
    sscGpa: profile?.sscGpa != null ? profile.sscGpa.toFixed(2) : '5.00',
    hscBoard: normalizeBoardName(profile?.hscBoard),
    hscYear: profile?.hscYear ? String(profile.hscYear) : '2025',
    hscGroup,
    hscGpaWithoutFourth:
      profile?.hscGpaWithoutFourth != null
        ? profile.hscGpaWithoutFourth.toFixed(2)
        : '4.58',
    hscGpa: profile?.hscGpa != null ? profile.hscGpa.toFixed(2) : '4.83',
    isSecondTimer: Boolean(profile?.isSecondTimer),
    fourthSubjectCode: profile?.fourthSubjectCode || defaults.defaultFourthSubjectCode,
    selectedSubjects: profileSelected,
    subjectGrades: buildDefaultSubjectGradesMap(hscGroup, profile?.subjectGrades),
  };
}

export function buildValidatedAcademicPayload(value: BangladeshAcademicFormValue):
  | {
      ok: true;
      payload: {
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
    }
  | { ok: false; error: string } {
  const sscWith = Number(value.sscGpa);
  const sscWithout = Number(value.sscGpaWithoutFourth);
  const hscWith = Number(value.hscGpa);
  const hscWithout = Number(value.hscGpaWithoutFourth);
  const sscYr = Number(value.sscYear);
  const hscYr = Number(value.hscYear);

  if (!Number.isFinite(sscWithout) || sscWithout < 0 || sscWithout > 5) {
    return { ok: false, error: 'SSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' };
  }
  if (!Number.isFinite(sscWith) || sscWith < 0 || sscWith > 5) {
    return { ok: false, error: 'SSC GPA (With 4th Subject) must be between 0.00 and 5.00.' };
  }
  if (!Number.isFinite(hscWithout) || hscWithout < 0 || hscWithout > 5) {
    return { ok: false, error: 'HSC GPA (Without 4th Subject) must be between 0.00 and 5.00.' };
  }
  if (!Number.isFinite(hscWith) || hscWith < 0 || hscWith > 5) {
    return { ok: false, error: 'HSC GPA (With 4th Subject) must be between 0.00 and 5.00.' };
  }
  if (!Number.isInteger(sscYr) || sscYr < 2015 || sscYr > 2027) {
    return { ok: false, error: 'Please select a valid SSC passing year.' };
  }
  if (!Number.isInteger(hscYr) || hscYr < 2018 || hscYr > 2027) {
    return { ok: false, error: 'Please select a valid HSC passing year.' };
  }

  const numericGrades: Record<string, number> = {};
  for (const key of value.selectedSubjects) {
    const raw = (value.subjectGrades[key] ?? '5.00').trim();
    if (!raw) continue;
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0 || num > 5) {
      return { ok: false, error: `${key} GPA must be between 0.00 and 5.00.` };
    }
    numericGrades[key] = num;
  }

  return {
    ok: true,
    payload: {
      sscBoard: value.sscBoard,
      sscYear: sscYr,
      sscGroup: value.sscGroup,
      sscGpaWithoutFourth: sscWithout,
      sscGpa: sscWith,
      hscBoard: value.hscBoard,
      hscYear: hscYr,
      hscGroup: value.hscGroup,
      hscGpaWithoutFourth: hscWithout,
      hscGpa: hscWith,
      isSecondTimer: value.isSecondTimer,
      fourthSubjectCode: value.fourthSubjectCode,
      selectedSubjects: value.selectedSubjects,
      subjectGrades: numericGrades,
    },
  };
}

interface BangladeshAcademicFormProps {
  idPrefix: string;
  value: BangladeshAcademicFormValue;
  onChange: (next: BangladeshAcademicFormValue) => void;
}

export function BangladeshAcademicForm({
  idPrefix,
  value,
  onChange,
}: BangladeshAcademicFormProps) {
  const { compulsory, groupSubjects } = getSubjectsForGroup(value.hscGroup);
  const maxGroupSubjects = getMaxGroupSubjects(value.hscGroup);

  const selectedGroupKeys = groupSubjects
    .map((s) => s.key)
    .filter((key) => value.selectedSubjects.includes(key));

  const combinedWithFourth =
    Number.isFinite(Number(value.sscGpa)) && Number.isFinite(Number(value.hscGpa))
      ? (Number(value.sscGpa) + Number(value.hscGpa)).toFixed(2)
      : '—';

  const combinedWithoutFourth =
    Number.isFinite(Number(value.sscGpaWithoutFourth)) &&
    Number.isFinite(Number(value.hscGpaWithoutFourth))
      ? (Number(value.sscGpaWithoutFourth) + Number(value.hscGpaWithoutFourth)).toFixed(2)
      : '—';

  const handleHscGroupChange = (nextGroup: AcademicGroup) => {
    const defaults = getDefaultSubjectSelectionForGroup(nextGroup);
    const existingNumeric: Record<string, number> = {};
    for (const [k, v] of Object.entries(value.subjectGrades)) {
      const n = Number(v);
      if (Number.isFinite(n)) existingNumeric[k] = n;
    }

    onChange({
      ...value,
      hscGroup: nextGroup,
      selectedSubjects: defaults.selectedSubjects,
      fourthSubjectCode: defaults.defaultFourthSubjectCode,
      subjectGrades: buildDefaultSubjectGradesMap(nextGroup, existingNumeric),
    });
  };

  const handleSubjectGradeChange = (key: string, grade: string) => {
    onChange({
      ...value,
      subjectGrades: {
        ...value.subjectGrades,
        [key]: grade,
      },
    });
  };

  const handleToggleSubject = (subj: HscSubjectDefinition) => {
    const nextSelected = toggleGroupSubjectSelection(
      value.hscGroup,
      value.selectedSubjects,
      subj.key
    );
    let nextFourth = value.fourthSubjectCode;
    if (!nextSelected.includes(subj.key) && nextFourth === subj.code) {
      const remainingElective = groupSubjects.find(
        (s) => s.canBeFourthSubject && nextSelected.includes(s.key)
      );
      nextFourth = remainingElective?.code ?? '';
    }
    onChange({
      ...value,
      selectedSubjects: nextSelected,
      fourthSubjectCode: nextFourth,
    });
  };

  const renderGradeSelect = (subj: HscSubjectDefinition, disabled: boolean) => {
    const currentValue = value.subjectGrades[subj.key] || '5.00';
    const hasExactOption = HSC_GRADE_OPTIONS.some((opt) => opt.value === currentValue);
    return (
      <select
        id={`${idPrefix}-subj-grade-${subj.code}`}
        aria-label={`${subj.name} (${subj.code}) GPA`}
        disabled={disabled}
        value={currentValue}
        onChange={(e) => handleSubjectGradeChange(subj.key, e.target.value)}
        className="h-9 min-w-[120px] rounded-lg border border-[#E2E8F0] bg-white px-2.5 font-mono text-xs font-medium tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none disabled:opacity-50 dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
      >
        {!hasExactOption && (
          <option value={currentValue}>{`${Number(currentValue).toFixed(2)} (Custom)`}</option>
        )}
        {HSC_GRADE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  };

  return (
    <div className="space-y-5">
      {/* 1. Separate SSC & HSC Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Card 1: SSC / Equivalent Details */}
        <section
          aria-labelledby={`${idPrefix}-ssc-heading`}
          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#222222]">
            <div>
              <h4
                id={`${idPrefix}-ssc-heading`}
                className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                SSC / Equivalent Details
              </h4>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                Secondary School Certificate or Dakhil / Vocational record
              </p>
            </div>
            <span className="rounded-md border border-[#00796B]/30 bg-[#00796B]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/15 dark:text-[#26A69A]">
              SSC
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor={`${idPrefix}-ssc-board`}
                className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
              >
                Education Board
              </label>
              <select
                id={`${idPrefix}-ssc-board`}
                value={value.sscBoard}
                onChange={(e) => onChange({ ...value, sscBoard: e.target.value })}
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              >
                {BANGLADESH_EDUCATION_BOARDS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${idPrefix}-ssc-year`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  Passing Year
                </label>
                <select
                  id={`${idPrefix}-ssc-year`}
                  value={value.sscYear}
                  onChange={(e) => onChange({ ...value, sscYear: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                >
                  {SSC_PASSING_YEARS.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-ssc-group`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  Group
                </label>
                <select
                  id={`${idPrefix}-ssc-group`}
                  value={value.sscGroup}
                  onChange={(e) =>
                    onChange({ ...value, sscGroup: e.target.value as AcademicGroup })
                  }
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                >
                  {ACADEMIC_GROUP_OPTIONS.map((grp) => (
                    <option key={grp.value} value={grp.value}>
                      {grp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${idPrefix}-ssc-gpa-without`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  SSC GPA (Without 4th Subject)
                </label>
                <input
                  id={`${idPrefix}-ssc-gpa-without`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={value.sscGpaWithoutFourth}
                  onChange={(e) =>
                    onChange({ ...value, sscGpaWithoutFourth: e.target.value })
                  }
                  placeholder="0.00 - 5.00"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-ssc-gpa-with`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  SSC GPA (With 4th Subject)
                </label>
                <input
                  id={`${idPrefix}-ssc-gpa-with`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={value.sscGpa}
                  onChange={(e) => onChange({ ...value, sscGpa: e.target.value })}
                  placeholder="0.00 - 5.00"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Card 2: HSC / Equivalent Details */}
        <section
          aria-labelledby={`${idPrefix}-hsc-heading`}
          className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#222222]">
            <div>
              <h4
                id={`${idPrefix}-hsc-heading`}
                className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                HSC / Equivalent Details
              </h4>
              <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                Higher Secondary Certificate or Alim / Diploma record
              </p>
            </div>
            <span className="rounded-md border border-[#388E3C]/30 bg-[#388E3C]/10 px-2 py-0.5 font-mono text-[11px] font-bold text-[#2E7D32] dark:border-[#66BB6A]/35 dark:bg-[#66BB6A]/15 dark:text-[#66BB6A]">
              HSC
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label
                htmlFor={`${idPrefix}-hsc-board`}
                className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
              >
                Education Board
              </label>
              <select
                id={`${idPrefix}-hsc-board`}
                value={value.hscBoard}
                onChange={(e) => onChange({ ...value, hscBoard: e.target.value })}
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              >
                {BANGLADESH_EDUCATION_BOARDS.map((board) => (
                  <option key={board} value={board}>
                    {board}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${idPrefix}-hsc-year`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  Passing Year
                </label>
                <select
                  id={`${idPrefix}-hsc-year`}
                  value={value.hscYear}
                  onChange={(e) => onChange({ ...value, hscYear: e.target.value })}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                >
                  {HSC_PASSING_YEARS.map((yr) => (
                    <option key={yr} value={String(yr)}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-hsc-group`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  Group
                </label>
                <select
                  id={`${idPrefix}-hsc-group`}
                  value={value.hscGroup}
                  onChange={(e) => handleHscGroupChange(e.target.value as AcademicGroup)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                >
                  {ACADEMIC_GROUP_OPTIONS.map((grp) => (
                    <option key={grp.value} value={grp.value}>
                      {grp.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`${idPrefix}-hsc-gpa-without`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  HSC GPA (Without 4th Subject)
                </label>
                <input
                  id={`${idPrefix}-hsc-gpa-without`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={value.hscGpaWithoutFourth}
                  onChange={(e) =>
                    onChange({ ...value, hscGpaWithoutFourth: e.target.value })
                  }
                  placeholder="0.00 - 5.00"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>

              <div>
                <label
                  htmlFor={`${idPrefix}-hsc-gpa-with`}
                  className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
                >
                  HSC GPA (With 4th Subject)
                </label>
                <input
                  id={`${idPrefix}-hsc-gpa-with`}
                  type="number"
                  step="0.01"
                  min="0"
                  max="5"
                  value={value.hscGpa}
                  onChange={(e) => onChange({ ...value, hscGpa: e.target.value })}
                  placeholder="0.00 - 5.00"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Combined GPA Totals & Second-Timer Status */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-white px-4 py-3.5 dark:border-[#222222] dark:bg-[#0A0A0A] sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#475569] dark:text-[#94A3B8]">
              Combined GPA (Without 4th Subject):
            </span>
            <span className="font-mono font-bold tabular-nums text-[#00796B] dark:text-[#26A69A]">
              {combinedWithoutFourth}
            </span>
          </div>
          <span className="hidden sm:inline text-[#E2E8F0] dark:text-[#222222]" aria-hidden="true">
            |
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[#475569] dark:text-[#94A3B8]">
              Combined GPA (With 4th Subject):
            </span>
            <span className="font-mono font-bold tabular-nums text-[#2E7D32] dark:text-[#66BB6A]">
              {combinedWithFourth}
            </span>
          </div>
        </div>

        <label
          htmlFor={`${idPrefix}-second-timer`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] cursor-pointer select-none"
        >
          <input
            id={`${idPrefix}-second-timer`}
            type="checkbox"
            checked={value.isSecondTimer}
            onChange={(e) => onChange({ ...value, isSecondTimer: e.target.checked })}
            className="h-4 w-4 accent-[#00796B] dark:accent-[#26A69A]"
          />
          <span>Second-timer applicant (prior HSC passing year)</span>
        </label>
      </div>

      {/* 2. Dynamic Group-Based HSC Subject & GPA Input (With Official Subject Codes) */}
      <section
        aria-labelledby={`${idPrefix}-subjects-heading`}
        className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E2E8F0] pb-3 dark:border-[#222222]">
          <div>
            <h4
              id={`${idPrefix}-subjects-heading`}
              className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]"
            >
              HSC Subject-Wise Grades ({ACADEMIC_GROUP_OPTIONS.find((g) => g.value === value.hscGroup)?.label})
            </h4>
            <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] mt-0.5">
              Official Bangladesh Education Board subject codes and grades. Mark your elective 4th subject where applicable.
            </p>
          </div>
          {maxGroupSubjects !== null && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00796B]/30 bg-[#00796B]/10 px-2.5 py-1 font-mono text-[11px] font-bold text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/15 dark:text-[#26A69A] whitespace-nowrap shrink-0">
              {selectedGroupKeys.length} / {maxGroupSubjects} Group Subjects Selected
            </span>
          )}
        </div>

        {/* Compulsory Subjects */}
        <div className="space-y-2.5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
            Compulsory Subjects (All Groups)
          </p>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
            {compulsory.map((subj) => (
              <div
                key={subj.code}
                className="flex items-center justify-between gap-2.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 dark:border-[#222222] dark:bg-[#121212]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-start gap-1.5">
                    <span className="mt-0.5 rounded bg-[#E2E8F0] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0F172A] dark:bg-[#222222] dark:text-[#26A69A] shrink-0">
                      {subj.code}
                    </span>
                    <span className="text-xs font-semibold leading-snug text-[#0F172A] dark:text-[#F8FAFC]">
                      {subj.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-[#475569] dark:text-[#94A3B8]">
                    Compulsory
                  </span>
                </div>
                <div className="shrink-0">{renderGradeSelect(subj, false)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Group & Elective Subjects */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
              Group &amp; Elective Subjects ({value.hscGroup === 'Commerce' ? 'Business Studies' : value.hscGroup})
            </p>
            {maxGroupSubjects !== null && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                <Info className="h-3.5 w-3.5 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
                Select up to {maxGroupSubjects} Humanities subjects from the list below
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {groupSubjects.map((subj) => {
              const isSelected = value.selectedSubjects.includes(subj.key);
              const isFourth = isSelected && value.fourthSubjectCode === subj.code;
              const humanitiesLimitReached =
                maxGroupSubjects !== null &&
                !isSelected &&
                selectedGroupKeys.length >= maxGroupSubjects;

              return (
                <div
                  key={subj.code}
                  className={`flex flex-wrap items-center justify-between gap-2.5 rounded-lg border px-3 py-2.5 transition-colors ${
                    isSelected
                      ? 'border-[#388E3C]/35 bg-[#388E3C]/5 dark:border-[#26A69A]/40 dark:bg-[#26A69A]/10'
                      : 'border-[#E2E8F0] bg-[#F8FAFC]/50 opacity-75 dark:border-[#222222] dark:bg-[#121212]/40'
                  }`}
                >
                  <label
                    htmlFor={`${idPrefix}-subj-toggle-${subj.code}`}
                    className={`flex items-center gap-2.5 min-w-0 flex-1 ${
                      humanitiesLimitReached ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <input
                      id={`${idPrefix}-subj-toggle-${subj.code}`}
                      type="checkbox"
                      checked={isSelected}
                      disabled={humanitiesLimitReached}
                      onChange={() => handleToggleSubject(subj)}
                      className="h-4 w-4 accent-[#00796B] dark:accent-[#26A69A] shrink-0"
                    />
                    <span className="rounded bg-[#E2E8F0] px-1.5 py-0.5 font-mono text-[10px] font-bold text-[#0F172A] dark:bg-[#222222] dark:text-[#26A69A] shrink-0">
                      {subj.code}
                    </span>
                    <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                      {subj.name}
                    </span>
                  </label>

                  <div className="flex items-center gap-2 shrink-0">
                    {isSelected && subj.canBeFourthSubject && (
                      <button
                        type="button"
                        aria-pressed={isFourth}
                        onClick={() =>
                          onChange({
                            ...value,
                            fourthSubjectCode: isFourth ? '' : subj.code,
                          })
                        }
                        className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-bold transition-colors whitespace-nowrap ${
                          isFourth
                            ? 'border-[#00796B] bg-[#00796B] text-white dark:border-[#26A69A] dark:bg-[#26A69A] dark:text-[#050505]'
                            : 'border-[#E2E8F0] bg-white text-[#475569] hover:border-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#94A3B8] dark:hover:border-[#26A69A]'
                        }`}
                      >
                        {isFourth && <Check className="h-3 w-3" aria-hidden="true" />}
                        <span>4th Subject</span>
                      </button>
                    )}
                    {isSelected ? (
                      renderGradeSelect(subj, false)
                    ) : (
                      <span className="text-[11px] text-[#475569]/60 dark:text-[#94A3B8]/60 px-2">
                        Not Taken
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
