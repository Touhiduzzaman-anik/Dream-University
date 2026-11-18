import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { EligibilityResultItem } from '../../types/domain';
import type { AcademicGroup } from '../../utils/eligibilityEngine';
import {
  ELIGIBILITY_CATEGORIES_SYNC_EVENT,
  loadSelectedEligibilityCategories,
  saveSelectedEligibilityCategories,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';
import { calculateDgmeMedicalGpaScore } from '../../utils/medicalScoring';
import { CategoryCheckboxBar } from '../eligibility/CategoryCheckboxBar';
import { InstitutionUnitResultsList } from '../eligibility/InstitutionUnitResultsList';

interface StudentEligibilityViewProps {
  results: EligibilityResultItem[];
  loading: boolean;
  onRefresh: () => void;
  onEditProfile: () => void;
}

export function StudentEligibilityView({
  results,
  loading,
  onRefresh,
  onEditProfile,
}: StudentEligibilityViewProps) {
  const { lang, tr } = useLanguage();
  const { profile } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<EligibilityCheckboxCategory[]>(() =>
    loadSelectedEligibilityCategories()
  );

  const medicalScore = useMemo(() => {
    if (!profile || profile.sscGpa == null || profile.hscGpa == null) return null;
    return calculateDgmeMedicalGpaScore({
      sscGpa: profile.sscGpa,
      hscGpa: profile.hscGpa,
      hscGroup: (profile.hscGroup as AcademicGroup | null) ?? undefined,
      selectedSubjects:
        Array.isArray(profile.selectedSubjects) && profile.selectedSubjects.length > 0
          ? profile.selectedSubjects
          : undefined,
      subjectGrades: profile.subjectGrades ?? {},
    });
  }, [profile]);

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

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {tr('studentMenuEligibility')}
            </h1>
            <p className="mt-1 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8] max-w-3xl">
              {lang === 'bn'
                ? 'ফলাফল শুধুমাত্র যাচাইকৃত ও প্রকাশিত অফিশিয়াল নীতিমালার ভিত্তিতে ইউনিট-ভিত্তিকভাবে নির্ণীত। অনুমাননির্ভর কোনো তথ্য প্রদর্শিত হয় না।'
                : 'Evaluated deterministically unit-by-unit against verified and published official circulars only. Every ineligible unit cites its exact missing condition.'}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onEditProfile}
              className="h-9 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
            >
              {tr('studentMenuProfile')}
            </button>
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="h-9 rounded-lg bg-[#00796B] px-3.5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
            >
              {loading
                ? lang === 'bn'
                  ? 'যাচাই হচ্ছে...'
                  : 'Checking...'
                : lang === 'bn'
                  ? 'পুনরায় যাচাই'
                  : 'Re-evaluate'}
            </button>
          </div>
        </div>

        <CategoryCheckboxBar
          idPrefix="stud-elig-cat"
          selectedCategories={selectedCategories}
          onChange={handleCategoriesChange}
        />
      </div>

      <InstitutionUnitResultsList
        results={results}
        selectedCategories={selectedCategories}
        loading={loading}
        medicalScore={medicalScore}
        onEditProfile={onEditProfile}
      />
    </div>
  );
}
