import { useEffect, useState } from 'react';
import { CheckCircle2, RotateCcw, Save, SearchCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { apiFetch } from '../../lib/authFetch';
import type { EligibilityResultItem, StudentProfileRecord } from '../../types/domain';
import {
  ELIGIBILITY_CATEGORIES_SYNC_EVENT,
  loadSelectedEligibilityCategories,
  saveSelectedEligibilityCategories,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';
import {
  BangladeshAcademicForm,
  buildValidatedAcademicPayload,
  createInitialAcademicFormValue,
  type BangladeshAcademicFormValue,
} from '../academic/BangladeshAcademicForm';
import { CategoryCheckboxBar } from '../eligibility/CategoryCheckboxBar';
import { InstitutionUnitResultsList } from '../eligibility/InstitutionUnitResultsList';

interface QuickEligibilityToolProps {
  onProfileSynced?: () => void;
}

export function QuickEligibilityTool({ onProfileSynced }: QuickEligibilityToolProps) {
  const { user, profile, setUser, setProfile } = useAuth();

  const [formValue, setFormValue] = useState<BangladeshAcademicFormValue>(() =>
    createInitialAcademicFormValue(profile)
  );
  const [selectedCategories, setSelectedCategories] = useState<EligibilityCheckboxCategory[]>(() =>
    loadSelectedEligibilityCategories()
  );
  const [results, setResults] = useState<EligibilityResultItem[]>([]);
  const [checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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

  const runCheck = async (customValue?: BangladeshAcademicFormValue) => {
    setError(null);
    setNotice(null);

    const validated = buildValidatedAcademicPayload(customValue ?? formValue);
    if (validated.ok === false) {
      setError(validated.error);
      return;
    }

    setChecking(true);
    try {
      const res = await apiFetch('/api/student/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'all',
          overrideInput: validated.payload,
        }),
      });
      const data = (await res.json()) as {
        evaluations?: EligibilityResultItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Eligibility check failed.');
      }

      setResults(data.evaluations ?? []);
      setHasChecked(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to evaluate eligibility.');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    if (user?.accountType === 'student' && !hasChecked) {
      void runCheck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const handleResetToSaved = () => {
    const nextVal = createInitialAcademicFormValue(profile);
    setFormValue(nextVal);
    void runCheck(nextVal);
  };

  const handleSaveToProfile = async () => {
    setError(null);
    setNotice(null);

    const validated = buildValidatedAcademicPayload(formValue);
    if (validated.ok === false) {
      setError(validated.error);
      return;
    }

    setSaving(true);
    try {
      const res = await apiFetch('/api/student/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: user?.fullName || '',
          phone: user?.phone || '',
          ...validated.payload,
          preferredSubject: profile?.preferredSubject || '',
          preferredCity: profile?.preferredCity || 'Dhaka',
          tuitionBudgetBdt: profile?.tuitionBudgetBdt ?? '',
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        user?: typeof user;
        profile?: StudentProfileRecord;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile.');
      }
      if (data.user) setUser(data.user);
      if (data.profile) setProfile(data.profile);

      setNotice('Academic details, 4th-subject GPAs, and subject grades saved to your profile.');
      onProfileSynced?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section
      aria-labelledby="quick-eligibility-tool-heading"
      className="rounded-xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] overflow-hidden"
    >
      {/* Top Tool Bar */}
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-6 py-5 dark:border-[#222222] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h2
            id="quick-eligibility-tool-heading"
            className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]"
          >
            GPA &amp; Subject Combination Eligibility Tool
          </h2>
          <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8] max-w-2xl">
            Test your SSC &amp; HSC board records, GPA with &amp; without 4th subject, and group-specific subject grades against verified published university circulars.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetToSaved}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] whitespace-nowrap shrink-0 transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            Load Saved
          </button>
          <button
            type="button"
            onClick={() => void handleSaveToProfile()}
            disabled={saving}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#388E3C]/40 bg-[#388E3C]/10 px-3 text-xs font-semibold text-[#2E7D32] hover:bg-[#388E3C]/20 disabled:opacity-60 dark:border-[#66BB6A]/45 dark:bg-[#66BB6A]/15 dark:text-[#66BB6A] dark:hover:bg-[#66BB6A]/25 whitespace-nowrap shrink-0 transition-colors"
          >
            <Save className="h-3.5 w-3.5" aria-hidden="true" />
            {saving ? 'Saving...' : 'Save to Profile'}
          </button>
        </div>
      </div>

      <div className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
        {/* Form Inputs + Category Checkboxes */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runCheck();
          }}
          className="p-6 space-y-5"
        >
          <BangladeshAcademicForm idPrefix="tool" value={formValue} onChange={setFormValue} />

          <CategoryCheckboxBar
            idPrefix="tool-cat"
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

          {notice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2.5 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{notice}</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={checking}
              className="inline-flex h-11 w-full sm:w-auto sm:min-w-[240px] items-center justify-center gap-2 rounded-lg bg-[#00796B] px-6 text-sm font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
            >
              <SearchCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{checking ? 'Checking Eligibility...' : 'Check Eligible Universities'}</span>
            </button>
          </div>
        </form>

        {/* Results Pane */}
        <div className="p-6 space-y-4">
          <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
            Unit-by-Unit Institution Eligibility Breakdown
          </h3>

          <InstitutionUnitResultsList
            results={results}
            selectedCategories={selectedCategories}
            loading={checking && !hasChecked}
          />
        </div>
      </div>
    </section>
  );
}
