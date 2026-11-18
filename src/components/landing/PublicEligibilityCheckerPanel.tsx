import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, FileText, Save, SearchCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/authFetch';
import type { AppRoute, EligibilityResultItem, StudentProfileRecord } from '../../types/domain';
import { buildStudentProfileSaveBody } from '../../utils/academicProfileSync';
import {
  ELIGIBILITY_CATEGORIES_SYNC_EVENT,
  loadSelectedEligibilityCategories,
  saveSelectedEligibilityCategories,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';
import { calculateDgmeMedicalGpaScore } from '../../utils/medicalScoring';
import {
  BangladeshAcademicForm,
  buildValidatedAcademicPayload,
  createInitialAcademicFormValue,
  type BangladeshAcademicFormValue,
} from '../academic/BangladeshAcademicForm';
import { CategoryCheckboxBar } from '../eligibility/CategoryCheckboxBar';
import { InstitutionUnitResultsList } from '../eligibility/InstitutionUnitResultsList';

interface PublicEligibilityCheckerPanelProps {
  onNavigate: (route: AppRoute) => void;
  onOpenSavedReport?: () => void;
}

export function PublicEligibilityCheckerPanel({
  onNavigate,
  onOpenSavedReport,
}: PublicEligibilityCheckerPanelProps) {
  const { user, profile, setProfile } = useAuth();
  const isStudentLoggedIn = user?.accountType === 'student';

  const [formValue, setFormValue] = useState<BangladeshAcademicFormValue>(() =>
    createInitialAcademicFormValue(profile)
  );
  const [selectedCategories, setSelectedCategories] = useState<EligibilityCheckboxCategory[]>(() =>
    loadSelectedEligibilityCategories()
  );
  const [results, setResults] = useState<EligibilityResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleSync = (evt: Event) => {
      const detail = (evt as CustomEvent<EligibilityCheckboxCategory[]>).detail;
      if (Array.isArray(detail)) {
        setSelectedCategories(detail);
      }
    };
    window.addEventListener(ELIGIBILITY_CATEGORIES_SYNC_EVENT, handleSync);
    return () => window.removeEventListener(ELIGIBILITY_CATEGORIES_SYNC_EVENT, handleSync);
  }, []);

  const handleCategoriesChange = (next: EligibilityCheckboxCategory[]) => {
    setSelectedCategories(next);
    saveSelectedEligibilityCategories(next);
  };

  const runEligibilityCheck = useCallback(
    async (customValue?: BangladeshAcademicFormValue) => {
      setError(null);
      const validated = buildValidatedAcademicPayload(customValue ?? formValue);
      if (validated.ok === false) {
        setError(validated.error);
        return;
      }

      setLoading(true);
      try {
        const res = await apiFetch('/api/eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            category: 'all',
            input: validated.payload,
          }),
        });
        const data = (await res.json()) as { evaluations?: EligibilityResultItem[]; error?: string };
        if (!res.ok) {
          throw new Error(data.error || 'Eligibility check failed.');
        }

        setResults(data.evaluations ?? []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unable to evaluate eligibility.');
      } finally {
        setLoading(false);
      }
    },
    [formValue]
  );

  // Sync automatically from PostgreSQL saved profile when logged in and evaluate immediately
  useEffect(() => {
    if (profile) {
      const synced = createInitialAcademicFormValue(profile);
      setFormValue(synced);
      void runEligibilityCheck(synced);
    } else {
      void runEligibilityCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleSaveToProfile = async () => {
    if (!user || user.accountType !== 'student') return;
    setError(null);
    setSaveNotice(null);

    const validated = buildValidatedAcademicPayload(formValue);
    if (validated.ok === false) {
      setError(validated.error);
      return;
    }

    setSaving(true);
    try {
      const payload = buildStudentProfileSaveBody({
        academicPayload: validated.payload,
        user,
        profile,
      });
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as {
        error?: string;
        profile?: StudentProfileRecord;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save academic profile.');
      }
      if (data.profile) {
        setProfile(data.profile);
      }
      setSaveNotice('Academic record saved to your profile.');
      void runEligibilityCheck(formValue);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save academic profile.');
    } finally {
      setSaving(false);
    }
  };

  const medicalScore = useMemo(() => {
    const validated = buildValidatedAcademicPayload(formValue);
    if (validated.ok) {
      return calculateDgmeMedicalGpaScore(validated.payload);
    }
    const sscGpa = Number(formValue.sscGpa);
    const hscGpa = Number(formValue.hscGpa);
    if (!Number.isFinite(sscGpa) || !Number.isFinite(hscGpa)) return null;
    const numericGrades: Record<string, number> = {};
    for (const [k, v] of Object.entries(formValue.subjectGrades)) {
      const n = Number(v);
      if (Number.isFinite(n)) numericGrades[k] = n;
    }
    return calculateDgmeMedicalGpaScore({
      sscGpa,
      hscGpa,
      hscGroup: formValue.hscGroup,
      selectedSubjects: formValue.selectedSubjects,
      subjectGrades: numericGrades,
    });
  }, [formValue]);

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-6 py-5 dark:border-[#222222] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            Rule-Based Eligibility Checker
          </h2>
          <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8] max-w-2xl">
            Enter your SSC and HSC board details, GPA with &amp; without 4th subject, and group-specific subject grades. Filter by institution categories below to see unit-by-unit eligibility across every selected university.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isStudentLoggedIn ? (
            <>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveToProfile()}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#388E3C]/40 bg-[#388E3C]/10 px-3.5 text-xs font-semibold text-[#2E7D32] hover:bg-[#388E3C]/20 disabled:opacity-60 dark:border-[#66BB6A]/45 dark:bg-[#66BB6A]/15 dark:text-[#66BB6A] dark:hover:bg-[#66BB6A]/25 whitespace-nowrap transition-colors"
              >
                <Save className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save to My Profile'}</span>
              </button>
              {onOpenSavedReport && (
                <button
                  type="button"
                  onClick={onOpenSavedReport}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] whitespace-nowrap transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Saved A4 Report</span>
                </button>
              )}
            </>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('/login')}
              className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#26A69A] dark:hover:border-[#26A69A] whitespace-nowrap shrink-0 transition-colors"
            >
              Sign in to Save Profile
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
        {/* Top Section: SSC + HSC Cards, Dynamic Subject Grades, and Category Checkboxes */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runEligibilityCheck();
          }}
          className="p-6 space-y-5"
        >
          {isStudentLoggedIn && profile && (
            <div className="flex items-center gap-2 rounded-lg border border-[#00796B]/30 bg-[#00796B]/10 px-3.5 py-2 text-xs font-medium text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/12 dark:text-[#26A69A]">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>Auto-synced with your saved PostgreSQL academic profile.</span>
            </div>
          )}

          <BangladeshAcademicForm idPrefix="pub" value={formValue} onChange={setFormValue} />

          {/* Multi-select Institution Category Checkboxes directly below academic input form */}
          <CategoryCheckboxBar
            idPrefix="pub-cat"
            selectedCategories={selectedCategories}
            onChange={handleCategoriesChange}
          />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-3.5 py-2.5 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
            >
              {error}
            </div>
          )}

          {saveNotice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2.5 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{saveNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            {isStudentLoggedIn && (
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSaveToProfile()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] disabled:opacity-60 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
              >
                <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save to My Profile'}</span>
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="inline-flex h-11 w-full sm:w-auto sm:min-w-[240px] items-center justify-center gap-2 rounded-xl bg-[#00796B] px-6 text-sm font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
            >
              <SearchCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{loading ? 'Checking Eligibility...' : 'Check Eligibility Now'}</span>
            </button>
          </div>
        </form>

        {/* Bottom Section: Unit-by-Unit Institution Eligibility Breakdown */}
        <div className="p-6 space-y-4">
          <div className="space-y-1">
            <h4 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Unit-by-Unit Institution Eligibility Breakdown
            </h4>
          </div>

          <InstitutionUnitResultsList
            results={results}
            selectedCategories={selectedCategories}
            loading={loading}
            medicalScore={medicalScore}
            onEditProfile={() => onNavigate('/profile')}
          />
        </div>
      </div>
    </div>
  );
}
