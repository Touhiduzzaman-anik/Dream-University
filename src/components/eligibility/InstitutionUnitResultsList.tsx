import { useMemo, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  Stethoscope,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import type { EligibilityResultItem } from '../../types/domain';
import {
  getCategoryBadgeLabel,
  groupEligibilityByInstitution,
  type EligibilityCheckboxCategory,
} from '../../utils/eligibilityGrouping';
import type { MedicalGpaScoreBreakdown } from '../../utils/medicalScoring';

interface InstitutionUnitResultsListProps {
  results: EligibilityResultItem[];
  selectedCategories: EligibilityCheckboxCategory[];
  loading?: boolean;
  medicalScore?: MedicalGpaScoreBreakdown | null;
  onEditProfile?: () => void;
}

type StatusFilter = 'all' | 'Eligible' | 'Not Eligible';

export function InstitutionUnitResultsList({
  results,
  selectedCategories,
  loading = false,
  medicalScore: propMedicalScore = null,
  onEditProfile,
}: InstitutionUnitResultsListProps) {
  const { lang } = useLanguage();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [openPdfMap, setOpenPdfMap] = useState<Record<number, { url: string; title: string }>>({});

  const { groups, summary } = useMemo(
    () => groupEligibilityByInstitution(results, selectedCategories),
    [results, selectedCategories]
  );

  const medicalSelected = selectedCategories.includes('medical');
  const activeMedicalScore =
    propMedicalScore ?? groups.find((g) => g.medicalScoreBreakdown)?.medicalScoreBreakdown ?? null;

  const visibleGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return groups.filter((group) => {
      if (statusFilter === 'Eligible' && group.overallStatus !== 'Eligible') return false;
      if (statusFilter === 'Not Eligible' && group.overallStatus !== 'Not Eligible') return false;
      if (query) {
        const hay =
          `${group.institutionCode} ${group.institutionNameEn} ${group.institutionNameBn} ${group.city}`.toLowerCase();
        if (!hay.includes(query)) return false;
      }
      return true;
    });
  }, [groups, statusFilter, searchTerm]);

  const togglePdf = (institutionId: number, url: string, title: string) => {
    setOpenPdfMap((prev) => {
      if (prev[institutionId]?.url === url) {
        const next = { ...prev };
        delete next[institutionId];
        return next;
      }
      return { ...prev, [institutionId]: { url, title } };
    });
  };

  if (selectedCategories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center dark:border-[#222222] dark:bg-[#0A0A0A]">
        <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
          {lang === 'bn'
            ? 'প্রতিষ্ঠানগুলোর তালিকা দেখতে উপরে কমপক্ষে একটি ক্যাটাগরি টিক দিন।'
            : 'Tick at least one institution category checkbox above to view eligibility results.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Compact Summary Counter Bar */}
      <div className="flex flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A] lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <p
            data-testid="eligibility-summary-bar"
            className="font-sans text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums"
          >
            {lang === 'bn'
              ? `${summary.eligibleInstitutions}টি যোগ্য প্রতিষ্ঠান (${summary.eligibleUnits}টি যোগ্য ইউনিট) · ${summary.notEligibleInstitutions}টি অযোগ্য`
              : `${summary.eligibleInstitutions} Eligible Institutions (${summary.eligibleUnits} Eligible Units) · ${summary.notEligibleInstitutions} Not Eligible`}
          </p>
          <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
            {lang === 'bn'
              ? `নির্বাচিত ক্যাটাগরিতে মোট ${summary.totalInstitutions}টি প্রতিষ্ঠান প্রদর্শিত হচ্ছে`
              : `Showing ${summary.totalInstitutions} evaluated institutions across selected categories`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lang === 'bn' ? 'বিশ্ববিদ্যালয় খুঁজুন...' : 'Filter by university...'}
              aria-label="Filter evaluated institutions"
              className="h-8 w-44 rounded-lg border border-[#E2E8F0] bg-white pl-8 pr-2.5 text-xs text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
            />
          </div>

          <div
            role="tablist"
            aria-label="Filter institution status"
            className="flex items-center gap-1 rounded-lg bg-[#E2E8F0]/70 p-0.5 dark:bg-[#121212]"
          >
            {(
              [
                { id: 'all', label: lang === 'bn' ? `সব (${groups.length})` : `All (${groups.length})` },
                {
                  id: 'Eligible',
                  label:
                    lang === 'bn'
                      ? `যোগ্য (${summary.eligibleInstitutions})`
                      : `Eligible (${summary.eligibleInstitutions})`,
                },
                {
                  id: 'Not Eligible',
                  label:
                    lang === 'bn'
                      ? `অযোগ্য (${summary.notEligibleInstitutions})`
                      : `Not Eligible (${summary.notEligibleInstitutions})`,
                },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={statusFilter === tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-semibold tabular-nums whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-white text-[#00796B] shadow-2xs dark:bg-[#26A69A] dark:text-[#050505]'
                    : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dedicated DGME Medical (MBBS/BDS) 100-Mark GPA Score Card when Medical is selected */}
      {medicalSelected && activeMedicalScore && (
        <div
          data-testid="medical-gpa-summary-card"
          className={`rounded-xl border p-4 sm:p-5 space-y-2.5 ${
            activeMedicalScore.meetsMinimumCriteria
              ? 'border-[#D32F2F]/35 bg-[#D32F2F]/5 dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/10'
              : 'border-[#F57C00]/35 bg-[#F57C00]/10 dark:border-[#FFA726]/40 dark:bg-[#FFA726]/10'
          }`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#D32F2F] text-white dark:bg-[#FF4D4D] dark:text-[#050505]">
                <Stethoscope className="h-4.5 w-4.5" aria-hidden="true" />
              </span>
              <div>
                <p
                  data-testid="medical-gpa-breakdown-text"
                  className="font-sans text-sm sm:text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums"
                >
                  {lang === 'bn'
                    ? activeMedicalScore.formattedSummaryBn
                    : activeMedicalScore.formattedSummaryEn}
                </p>
                <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'সরকারি ও বেসরকারি মেডিকেল (DGME MBBS/BDS): SSC × 8 (সর্বোচ্চ ৪০) + HSC × 12 (সর্বোচ্চ ৬০) = ১০০ নম্বর'
                    : 'DGME Official MBBS/BDS Formula: (SSC GPA × 8, max 40) + (HSC GPA × 12, max 60) = 100 Marks'}
                </p>
              </div>
            </div>

            <span
              className={`inline-flex w-fit items-center gap-1 rounded-md border px-2.5 py-1 text-xs font-bold whitespace-nowrap ${
                activeMedicalScore.meetsMinimumCriteria
                  ? 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
                  : 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
              }`}
            >
              {activeMedicalScore.meetsMinimumCriteria
                ? lang === 'bn'
                  ? 'ডিজিএমই শর্ত পূরণ ✅'
                  : 'DGME Criteria Met ✅'
                : lang === 'bn'
                  ? 'ডিজিএমই শর্ত পূরণ হয়নি ❌'
                  : 'DGME Criteria Not Met ❌'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium">
            <span
              className={`rounded-md border px-2 py-0.5 tabular-nums ${
                activeMedicalScore.sscGpa >= 4.0 && activeMedicalScore.hscGpa >= 4.0
                  ? 'border-[#388E3C]/30 bg-white text-[#2E7D32] dark:border-[#66BB6A]/35 dark:bg-[#121212] dark:text-[#66BB6A]'
                  : 'border-[#D32F2F]/30 bg-white text-[#D32F2F] dark:border-[#FF4D4D]/35 dark:bg-[#121212] dark:text-[#FF4D4D]'
              }`}
            >
              SSC {activeMedicalScore.sscGpa.toFixed(2)} &amp; HSC {activeMedicalScore.hscGpa.toFixed(2)} (Min 4.00)
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 tabular-nums ${
                activeMedicalScore.combinedGpa >= 9.0
                  ? 'border-[#388E3C]/30 bg-white text-[#2E7D32] dark:border-[#66BB6A]/35 dark:bg-[#121212] dark:text-[#66BB6A]'
                  : 'border-[#D32F2F]/30 bg-white text-[#D32F2F] dark:border-[#FF4D4D]/35 dark:bg-[#121212] dark:text-[#FF4D4D]'
              }`}
            >
              Combined: {activeMedicalScore.combinedGpa.toFixed(2)} / 10.00 (Min 9.00)
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 ${
                activeMedicalScore.isScienceGroup
                  ? 'border-[#388E3C]/30 bg-white text-[#2E7D32] dark:border-[#66BB6A]/35 dark:bg-[#121212] dark:text-[#66BB6A]'
                  : 'border-[#D32F2F]/30 bg-white text-[#D32F2F] dark:border-[#FF4D4D]/35 dark:bg-[#121212] dark:text-[#FF4D4D]'
              }`}
            >
              Group: Science {activeMedicalScore.isScienceGroup ? '✓' : '✗'}
            </span>
            <span
              className={`rounded-md border px-2 py-0.5 tabular-nums ${
                activeMedicalScore.hasBiology &&
                activeMedicalScore.biologyGpa !== null &&
                activeMedicalScore.biologyGpa >= 4.0
                  ? 'border-[#388E3C]/30 bg-white text-[#2E7D32] dark:border-[#66BB6A]/35 dark:bg-[#121212] dark:text-[#66BB6A]'
                  : 'border-[#D32F2F]/30 bg-white text-[#D32F2F] dark:border-[#FF4D4D]/35 dark:bg-[#121212] dark:text-[#FF4D4D]'
              }`}
            >
              Biology:{' '}
              {activeMedicalScore.hasBiology && activeMedicalScore.biologyGpa !== null
                ? `${activeMedicalScore.biologyGpa.toFixed(2)}`
                : 'Not Taken'}{' '}
              (Min A / 4.00)
            </span>
          </div>
        </div>
      )}

      {loading && results.length === 0 ? (
        <div className="space-y-3 py-2">
          <div className="h-24 rounded-xl bg-[#E2E8F0] dark:bg-[#121212] animate-pulse" />
          <div className="h-24 rounded-xl bg-[#E2E8F0] dark:bg-[#121212] animate-pulse" />
          <div className="h-24 rounded-xl bg-[#E2E8F0] dark:bg-[#121212] animate-pulse" />
        </div>
      ) : visibleGroups.length === 0 ? (
        <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center dark:border-[#222222] dark:bg-[#0A0A0A]">
          <p className="text-sm font-medium text-[#475569] dark:text-[#94A3B8]">
            {lang === 'bn'
              ? 'এই ফিল্টারের সাথে কোনো প্রতিষ্ঠান মেলেনি।'
              : 'No institutions match this search or status filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleGroups.map((group) => {
            const openPdf = openPdfMap[group.institutionId];
            const firstUnitWithSource = group.allUnits.find((u) => u.evaluation.source);
            const categoryLabel = getCategoryBadgeLabel(group.category, lang);

            return (
              <article
                key={group.institutionId}
                data-testid={`inst-eligibility-card-${group.institutionCode}`}
                className={`rounded-xl border p-4 sm:p-5 transition-colors space-y-3 ${
                  group.overallStatus === 'Eligible'
                    ? 'border-[#388E3C]/35 bg-white dark:border-[#66BB6A]/35 dark:bg-[#121212]'
                    : group.overallStatus === 'Not Eligible'
                      ? 'border-[#E2E8F0] bg-[#F8FAFC]/60 dark:border-[#222222] dark:bg-[#0A0A0A]'
                      : 'border-[#F57C00]/35 bg-white dark:border-[#FFA726]/35 dark:bg-[#121212]'
                }`}
              >
                {/* Card Header: Short Code, Category Badge, University Name & Overall Status */}
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <span className="rounded bg-[#00796B] px-2 py-0.5 font-mono font-bold text-white dark:bg-[#26A69A]/20 dark:text-[#26A69A]">
                        {group.institutionCode}
                      </span>
                      <span className="rounded border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-0.5 font-semibold text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
                        {categoryLabel}
                      </span>
                      <span className="text-[#475569] dark:text-[#94A3B8]">{group.city}</span>
                      {group.applicationDeadline && (
                        <>
                          <span className="text-[#E2E8F0] dark:text-[#222222]" aria-hidden="true">
                            ·
                          </span>
                          <span className="text-[#475569] dark:text-[#94A3B8] tabular-nums">
                            {lang === 'bn' ? 'শেষ তারিখ:' : 'Deadline:'} {group.applicationDeadline}
                          </span>
                        </>
                      )}
                    </div>
                    <h5 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? group.institutionNameBn : group.institutionNameEn}
                    </h5>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {group.overallStatus === 'Eligible' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#388E3C]/35 bg-[#388E3C]/10 px-2.5 py-1 text-xs font-bold text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] whitespace-nowrap">
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {lang === 'bn'
                            ? `${group.eligibleUnits.length}টি ইউনিট যোগ্য ✅`
                            : `${group.eligibleUnits.length} ${
                                group.eligibleUnits.length === 1 ? 'Unit' : 'Units'
                              } Eligible ✅`}
                        </span>
                      </span>
                    )}
                    {group.overallStatus === 'Not Eligible' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-2.5 py-1 text-xs font-bold text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D] whitespace-nowrap">
                        <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{lang === 'bn' ? 'যোগ্য নয় ❌' : 'Not Eligible ❌'}</span>
                      </span>
                    )}
                    {group.overallStatus === 'Pending' && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-[#F57C00]/35 bg-[#F57C00]/10 px-2.5 py-1 text-xs font-bold text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726] whitespace-nowrap">
                        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{lang === 'bn' ? 'অপেক্ষমাণ' : 'Pending'}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline DGME Medical GPA Score Breakdown Badge for Medical College Cards */}
                {group.category === 'medical' && (group.medicalScoreBreakdown || activeMedicalScore) && (
                  <div
                    data-testid={`medical-gpa-badge-${group.institutionCode}`}
                    className="inline-flex flex-wrap items-center gap-1.5 rounded-lg border border-[#D32F2F]/30 bg-[#D32F2F]/8 px-3 py-1.5 text-xs font-semibold text-[#D32F2F] dark:border-[#FF4D4D]/35 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D] tabular-nums"
                  >
                    <Stethoscope className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>
                      {lang === 'bn'
                        ? (group.medicalScoreBreakdown ?? activeMedicalScore)!.formattedSummaryBn
                        : (group.medicalScoreBreakdown ?? activeMedicalScore)!.formattedSummaryEn}
                    </span>
                  </div>
                )}

                {/* Eligible Units (Green Badges) */}
                {group.eligibleUnits.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-[#66BB6A]">
                      {lang === 'bn' ? 'যোগ্য ইউনিটসমূহ' : 'Eligible Units & Programs'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {group.eligibleUnits.map((unit) => (
                        <span
                          key={unit.ruleId}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-2.5 py-1 text-xs font-semibold text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          <span>{unit.programName} — Eligible ✅</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Not Eligible Units & Exact Reasons */}
                {group.notEligibleUnits.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[#D32F2F] dark:text-[#FF4D4D]">
                      {group.eligibleUnits.length > 0
                        ? lang === 'bn'
                          ? 'অন্যান্য অযোগ্য ইউনিট'
                          : 'Other Units — Not Eligible'
                        : lang === 'bn'
                          ? 'অযোগ্য হওয়ার সুনির্দিষ্ট কারণ'
                          : 'Unit-Wise Failure Explanation'}
                    </p>
                    <div className="space-y-1.5">
                      {group.notEligibleUnits.map((unit) => {
                        const reasons = unit.evaluation.failedRequirements
                          .map((f) => (lang === 'bn' ? f.messageBn : f.messageEn))
                          .join(' ');
                        return (
                          <div
                            key={unit.ruleId}
                            className="rounded-lg border border-[#D32F2F]/30 bg-[#D32F2F]/8 px-3 py-2 text-xs dark:border-[#FF4D4D]/35 dark:bg-[#FF4D4D]/10"
                          >
                            <div className="flex flex-wrap items-center gap-1.5 font-semibold text-[#D32F2F] dark:text-[#FF4D4D]">
                              <span className="inline-flex items-center gap-1 rounded bg-[#D32F2F]/15 px-1.5 py-0.5 text-[11px] font-bold text-[#D32F2F] dark:bg-[#FF4D4D]/20 dark:text-[#FF4D4D]">
                                Not Eligible ❌
                              </span>
                              <span>{unit.programName}</span>
                            </div>
                            {reasons && (
                              <p className="mt-1 text-[#0F172A] dark:text-[#F8FAFC]/90 leading-relaxed">
                                {reasons}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Pending Units */}
                {group.pendingUnits.length > 0 && (
                  <div className="space-y-1.5">
                    {group.pendingUnits.map((unit) => (
                      <div
                        key={unit.ruleId}
                        className="flex items-start gap-2 rounded-lg border border-[#F57C00]/35 bg-[#F57C00]/10 px-3 py-2 text-xs text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]"
                      >
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" aria-hidden="true" />
                        <div className="space-y-0.5">
                          <p className="font-semibold">
                            {unit.programName} — Pending
                          </p>
                          <p className="text-[#0F172A] dark:text-[#F8FAFC]">
                            {lang === 'bn'
                              ? unit.evaluation.pendingReasonBn
                              : unit.evaluation.pendingReasonEn}
                          </p>
                          {onEditProfile && unit.evaluation.missingStudentFields.length > 0 && (
                            <button
                              type="button"
                              onClick={onEditProfile}
                              className="font-bold underline hover:no-underline"
                            >
                              {lang === 'bn' ? 'প্রোফাইলে তথ্য দিন →' : 'Complete missing academic fields →'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Official Circular Footer & PDF Toggle */}
                {firstUnitWithSource?.evaluation.source && (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#E2E8F0] dark:border-[#222222] text-[11px] text-[#475569] dark:text-[#94A3B8]">
                    <span>
                      {firstUnitWithSource.evaluation.source.circularTitle} (
                      {firstUnitWithSource.evaluation.source.session})
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        togglePdf(
                          group.institutionId,
                          firstUnitWithSource.pdfUrl,
                          `${group.institutionCode} Official Circular`
                        )
                      }
                      className="inline-flex items-center gap-1 font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline whitespace-nowrap shrink-0"
                    >
                      <FileText className="h-3 w-3" aria-hidden="true" />
                      <span>
                        {openPdf?.url === firstUnitWithSource.pdfUrl
                          ? lang === 'bn'
                            ? 'পিডিএফ বন্ধ করুন'
                            : 'Hide Circular PDF'
                          : lang === 'bn'
                            ? 'অফিশিয়াল পিডিএফ দেখুন'
                            : 'Circular PDF'}
                      </span>
                    </button>
                  </div>
                )}

                {openPdf && (
                  <div className="rounded-lg border border-[#E2E8F0] dark:border-[#222222] overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                    <iframe title={openPdf.title} src={openPdf.url} className="h-64 w-full" />
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
