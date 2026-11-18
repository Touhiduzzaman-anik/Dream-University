import { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { EligibilityResultItem } from '../../types/domain';
import {
  ELIGIBILITY_CATEGORIES_SYNC_EVENT,
  ELIGIBILITY_CHECKBOX_CATEGORIES,
  getCategoryBadgeLabel,
  groupEligibilityByInstitution,
  loadSelectedEligibilityCategories,
  saveSelectedEligibilityCategories,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';
import { CategoryCheckboxBar } from '../eligibility/CategoryCheckboxBar';

interface StudentReportsViewProps {
  results: EligibilityResultItem[];
}

export function StudentReportsView({ results }: StudentReportsViewProps) {
  const { lang, tr } = useLanguage();
  const { user, profile } = useAuth();
  const [selectedCategories, setSelectedCategories] = useState<EligibilityCheckboxCategory[]>(() =>
    loadSelectedEligibilityCategories()
  );

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

  const { groups, summary } = useMemo(
    () => groupEligibilityByInstitution(results, selectedCategories),
    [results, selectedCategories]
  );

  const selectedCategoryLabels = ELIGIBILITY_CHECKBOX_CATEGORIES.filter((c) =>
    selectedCategories.includes(c.id)
  )
    .map((c) => (lang === 'bn' ? c.labelBn : c.labelEn))
    .join(', ');

  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] print:hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-2xl">
              {tr('studentMenuReports')}
            </h1>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? 'নির্বাচিত ক্যাটাগরি ও ইউনিটভিত্তিক যোগ্যতা অনুযায়ী এ-ফোর আকারে অফিশিয়াল রিপোর্ট প্রিন্ট বা পিডিএফ হিসেবে সংরক্ষণ করুন।'
                : 'Synced with your ticked institution categories and unit-wise eligibility for A4 printing or Save as PDF export.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] shrink-0 transition-colors"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {lang === 'bn' ? 'এ-ফোর পিডিএফ প্রিন্ট / ডাউনলোড' : 'Print / Save A4 PDF'}
          </button>
        </div>

        <CategoryCheckboxBar
          idPrefix="report-cat"
          selectedCategories={selectedCategories}
          onChange={handleCategoriesChange}
        />
      </div>

      {/* Printable A4 Report Sheet (always crisp white paper for printing) */}
      <article className="mx-auto max-w-[210mm] rounded-xl border border-[#E2E8F0] bg-white p-8 text-[#0F172A] shadow-xs dark:border-[#222222] print:border-none print:shadow-none print:p-0 space-y-6">
        <header className="border-b-2 border-[#00796B] pb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#00796B]">
              Dream University · Official Unit-Wise Eligibility Report
            </p>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A]">
              {user?.fullName || 'Student Applicant'}
            </h2>
            <p className="text-xs text-[#475569]">
              {[user?.email, user?.phone].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-left sm:text-right text-xs text-[#475569] space-y-0.5">
            <p className="font-mono tabular-nums">
              Generated: {new Date().toISOString().slice(0, 10)}
            </p>
            <p className="font-semibold text-[#0F172A]">
              Categories: {selectedCategoryLabels || 'None Selected'}
            </p>
          </div>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-xs">
          <div>
            <p className="text-[#475569]">SSC ({profile?.sscBoard || 'Board not set'})</p>
            <p className="font-bold text-[#0F172A] tabular-nums">
              {profile?.sscGroup || '—'} ·{' '}
              {profile?.sscGpa != null ? `${profile.sscGpa.toFixed(2)} (w/ 4th)` : '—'}
            </p>
            {profile?.sscGpaWithoutFourth != null && (
              <p className="text-[11px] text-[#475569] tabular-nums">
                Without 4th: {profile.sscGpaWithoutFourth.toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[#475569]">HSC ({profile?.hscBoard || 'Board not set'})</p>
            <p className="font-bold text-[#0F172A] tabular-nums">
              {profile?.hscGroup || '—'} ·{' '}
              {profile?.hscGpa != null ? `${profile.hscGpa.toFixed(2)} (w/ 4th)` : '—'}
            </p>
            {profile?.hscGpaWithoutFourth != null && (
              <p className="text-[11px] text-[#475569] tabular-nums">
                Without 4th: {profile.hscGpaWithoutFourth.toFixed(2)}
              </p>
            )}
          </div>
          <div>
            <p className="text-[#475569]">HSC Year / 2nd Timer</p>
            <p className="font-bold text-[#0F172A] tabular-nums">
              {profile?.hscYear ?? '—'} · {profile?.isSecondTimer ? 'Yes' : 'No'}
            </p>
          </div>
          <div>
            <p className="text-[#475569]">Preference / Budget</p>
            <p className="font-bold text-[#0F172A] tabular-nums">
              {profile?.preferredCity || 'Any'} ·{' '}
              {profile?.tuitionBudgetBdt ? `BDT ${profile.tuitionBudgetBdt.toLocaleString()}` : 'Open'}
            </p>
          </div>
        </section>

        {/* Synced Summary Bar */}
        <section
          data-testid="report-summary-bar"
          className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-3 text-xs font-bold text-[#0F172A] tabular-nums flex flex-wrap items-center justify-between gap-2"
        >
          <span>
            {`${summary.eligibleInstitutions} Eligible Institutions (${summary.eligibleUnits} Eligible Units) · ${summary.notEligibleInstitutions} Not Eligible`}
          </span>
          <span className="font-normal text-[#475569]">
            Total Evaluated: {summary.totalInstitutions} Institutions
          </span>
        </section>

        <section className="overflow-x-auto">
          {groups.length === 0 ? (
            <p className="py-6 text-center text-xs text-[#475569]">
              Select at least one category checkbox above to populate the A4 eligibility report.
            </p>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-[#475569]">
                  <th className="py-2 pr-3 font-bold">Institution &amp; Category</th>
                  <th className="py-2 pr-3 font-bold">Standing</th>
                  <th className="py-2 font-bold">Unit-by-Unit Eligibility &amp; Rule Basis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {groups.map((group) => {
                  const firstSource = group.allUnits.find((u) => u.evaluation.source)?.evaluation
                    .source;
                  return (
                    <tr key={group.institutionId} className="align-top">
                      <td className="py-2.5 pr-3">
                        <p className="font-bold text-[#0F172A]">
                          {group.institutionNameEn} ({group.institutionCode})
                        </p>
                        <p className="text-[11px] text-[#475569]">
                          {getCategoryBadgeLabel(group.category, 'en')} · {group.city}
                        </p>
                      </td>
                      <td className="py-2.5 pr-3 font-bold whitespace-nowrap">
                        {group.overallStatus === 'Eligible' ? (
                          <span className="text-[#2E7D32]">
                            Eligible ({group.eligibleUnits.length}{' '}
                            {group.eligibleUnits.length === 1 ? 'Unit' : 'Units'}) ✅
                          </span>
                        ) : group.overallStatus === 'Not Eligible' ? (
                          <span className="text-[#D32F2F]">Not Eligible ❌</span>
                        ) : (
                          <span className="text-[#E65100]">Pending</span>
                        )}
                      </td>
                      <td className="py-2.5 text-[#475569] space-y-1">
                        {group.eligibleUnits.map((u) => (
                          <p key={u.ruleId} className="text-[#2E7D32] font-medium">
                            • {u.programName} — Eligible ✅
                          </p>
                        ))}
                        {group.notEligibleUnits.map((u) => (
                          <p key={u.ruleId} className="text-[#D32F2F]">
                            • <strong>{u.programName}: Not Eligible ❌</strong>{' '}
                            {u.evaluation.failedRequirements.map((f) => f.messageEn).join(' ')}
                          </p>
                        ))}
                        {group.pendingUnits.map((u) => (
                          <p key={u.ruleId} className="text-[#E65100]">
                            • {u.programName}: {u.evaluation.pendingReasonEn}
                          </p>
                        ))}
                        {firstSource && (
                          <p className="text-[11px] text-[#475569] pt-0.5">
                            Source: {firstSource.circularTitle} ({firstSource.session})
                          </p>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>
      </article>
    </div>
  );
}
