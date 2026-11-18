import { useMemo, useState } from 'react';
import { Calculator, ExternalLink, FileText, Search, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ADMISSION_CATEGORIES } from '../../data/demoInstitutions';
import type { AdmissionCategoryId, InstitutionRecord } from '../../types/domain';
import { calculatePrivateUniversityCost } from '../../utils/costEstimator';
import { UniversityHeaderVisual } from '../common/UniversityHeaderVisual';

interface StudentDirectoryViewProps {
  institutions: InstitutionRecord[];
  onCheckEligibility?: () => void;
}

const PAGE_SIZE = 18;

export function StudentDirectoryView({
  institutions,
}: StudentDirectoryViewProps) {
  const { lang, tr } = useLanguage();
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<AdmissionCategoryId | 'all'>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selectedInst, setSelectedInst] = useState<InstitutionRecord | null>(null);
  const [showPdf, setShowPdf] = useState(false);
  const [waiver, setWaiver] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (category !== 'all' && inst.category !== category) return false;
      if (!q) return true;
      return (
        inst.code.toLowerCase().includes(q) ||
        inst.nameEn.toLowerCase().includes(q) ||
        inst.nameBn.toLowerCase().includes(q) ||
        inst.city.toLowerCase().includes(q)
      );
    });
  }, [institutions, query, category]);

  const visibleInstitutions = filtered.slice(0, visibleCount);

  const modalCost =
    selectedInst?.perCreditFeeBdt && selectedInst?.totalCredits
      ? calculatePrivateUniversityCost({
          perCreditFeeBdt: selectedInst.perCreditFeeBdt,
          totalCredits: selectedInst.totalCredits,
          semesterFeeBdt: selectedInst.semesterFeeBdt ?? 0,
          semesters: 8,
          admissionFeeBdt: selectedInst.admissionFeeBdt ?? 0,
          waiverPercent: waiver,
          studentBudgetBdt: profile?.tuitionBudgetBdt,
        })
      : null;

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {tr('studentMenuDirectory')}
            </h1>
            <p className="text-xs text-[#475569] dark:text-[#94A3B8] mt-1 tabular-nums">
              {lang === 'bn'
                ? `মোট ${filtered.length}টি প্রতিষ্ঠানের মধ্যে ${visibleInstitutions.length}টি দেখানো হচ্ছে`
                : `Showing ${visibleInstitutions.length} of ${filtered.length} verified institutions across Bangladesh`}
            </p>
          </div>
          <label className="text-xs flex items-center gap-2 shrink-0">
            <span className="font-semibold text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? `ওয়েভার (${waiver}%):` : `Scholarship Waiver (${waiver}%):`}
            </span>
            <input
              type="range"
              min={0}
              max={50}
              step={5}
              value={waiver}
              onChange={(e) => setWaiver(Number(e.target.value))}
              className="w-24 accent-[#00796B] dark:accent-[#26A69A]"
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#94A3B8]" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder={tr('heroSearchPlaceholder')}
              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
            />
          </div>
          <div className="flex flex-wrap gap-1 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-1 dark:border-[#222222] dark:bg-[#0A0A0A]">
            <button
              type="button"
              onClick={() => {
                setCategory('all');
                setVisibleCount(PAGE_SIZE);
              }}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                category === 'all'
                  ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                  : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {tr('allCategoriesFilter')}
            </button>
            {ADMISSION_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setCategory(c.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold transition-colors ${
                  category === c.id
                    ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                    : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tr(c.titleKey)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {visibleInstitutions.map((inst) => {
          const cost =
            inst.perCreditFeeBdt && inst.totalCredits
              ? calculatePrivateUniversityCost({
                  perCreditFeeBdt: inst.perCreditFeeBdt,
                  totalCredits: inst.totalCredits,
                  semesterFeeBdt: inst.semesterFeeBdt ?? 0,
                  semesters: 8,
                  admissionFeeBdt: inst.admissionFeeBdt ?? 0,
                  waiverPercent: waiver,
                  studentBudgetBdt: profile?.tuitionBudgetBdt,
                })
              : null;

          return (
            <article
              key={inst.id}
              className="overflow-hidden rounded-xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] flex flex-col justify-between transition-colors hover:border-[#00796B]/45 dark:hover:border-[#26A69A]/45"
            >
              <div>
                <div className="h-40 w-full overflow-hidden border-b border-[#E2E8F0] dark:border-[#222222]">
                  <UniversityHeaderVisual
                    imageUrl={inst.imageUrl}
                    alt={lang === 'bn' ? inst.imageAltBn : inst.imageAltEn}
                    code={inst.code}
                    name={lang === 'bn' ? inst.nameBn : inst.nameEn}
                    city={inst.city}
                    establishedYear={inst.establishedYear}
                    category={inst.category}
                    institutionType={lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}
                    lang={lang}
                  />
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                    <strong className="font-mono text-[#00796B] dark:text-[#26A69A]">{inst.code}</strong>
                    <span aria-hidden="true">•</span>
                    <span className="truncate">{lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}</span>
                    <span aria-hidden="true">•</span>
                    <span className="truncate">{inst.city}</span>
                    {inst.establishedYear && (
                      <>
                        <span aria-hidden="true">•</span>
                        <span className="tabular-nums shrink-0">Est. {inst.establishedYear}</span>
                      </>
                    )}
                  </div>
                  <h3 className="font-sans text-lg font-bold leading-snug text-[#0F172A] dark:text-[#F8FAFC] line-clamp-2">
                    {lang === 'bn' ? inst.nameBn : inst.nameEn}
                  </h3>
                  <p className="line-clamp-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn' ? inst.shortNoteBn : inst.shortNoteEn}
                  </p>
                  <p className="line-clamp-1 text-xs text-[#475569] dark:text-[#94A3B8] pt-1 border-t border-[#E2E8F0] dark:border-[#222222]">
                    <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'প্রোগ্রাম:' : 'Programs:'}
                    </span>{' '}
                    {(lang === 'bn' ? inst.programsBn : inst.programsEn).join(', ')}
                  </p>

                  {cost && (
                    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 dark:border-[#222222] dark:bg-[#0A0A0A] text-[11px] space-y-0.5">
                      <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5 tabular-nums">
                        <Calculator className="h-3.5 w-3.5 text-[#00796B] dark:text-[#26A69A] shrink-0" aria-hidden="true" />
                        <span className="truncate">
                          Est. Total ({waiver}% waiver): BDT {cost.estimatedTotalBdt.toLocaleString()}
                        </span>
                      </p>
                      <p className="text-[#475569] dark:text-[#94A3B8] tabular-nums truncate">
                        Per Sem ≈ BDT {cost.estimatedPerSemesterBdt.toLocaleString()}
                        {cost.withinBudget !== null && (
                          <span className={cost.withinBudget ? 'text-[#2E7D32] dark:text-[#66BB6A] font-semibold ml-1.5' : 'text-[#D32F2F] dark:text-[#FF4D4D] font-semibold ml-1.5'}>
                            ({cost.withinBudget ? 'Within Budget' : 'Exceeds Budget'})
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="mx-4 mb-4 pt-3 border-t border-[#E2E8F0] dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedInst(inst);
                    setShowPdf(false);
                  }}
                  className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
                >
                  {tr('viewDetailsBtn')}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount < filtered.length && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
            className="inline-flex h-10 items-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
          >
            {lang === 'bn'
              ? `আরও দেখুন (${filtered.length - visibleCount}টি বাকি)`
              : `Show More (${filtered.length - visibleCount} remaining)`}
          </button>
        </div>
      )}

      {selectedInst && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="student-inst-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl dark:border-[#222222] dark:bg-[#121212] my-auto max-h-[90vh] flex flex-col">
            <div className="aspect-[16/8] w-full shrink-0 overflow-hidden border-b border-[#E2E8F0] dark:border-[#222222]">
              <UniversityHeaderVisual
                imageUrl={selectedInst.imageUrl}
                alt={lang === 'bn' ? selectedInst.imageAltBn : selectedInst.imageAltEn}
                code={selectedInst.code}
                name={lang === 'bn' ? selectedInst.nameBn : selectedInst.nameEn}
                city={selectedInst.city}
                establishedYear={selectedInst.establishedYear}
                category={selectedInst.category}
                institutionType={
                  lang === 'bn' ? selectedInst.institutionTypeBn : selectedInst.institutionType
                }
                lang={lang}
              />
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
                    {selectedInst.code} · {lang === 'bn' ? selectedInst.institutionTypeBn : selectedInst.institutionType}
                    {selectedInst.establishedYear ? ` · Est. ${selectedInst.establishedYear}` : ''}
                  </p>
                  <h2 id="student-inst-modal-title" className="mt-1 font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? selectedInst.nameBn : selectedInst.nameEn}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInst(null)}
                  aria-label="Close modal"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#00796B] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:border-[#26A69A]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn' ? selectedInst.shortNoteBn : selectedInst.shortNoteEn}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                <p>
                  <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{lang === 'bn' ? 'অবস্থান:' : 'Location:'}</strong>{' '}
                  {lang === 'bn' ? selectedInst.locationBn : selectedInst.locationEn}
                </p>
                <p>
                  <strong className="text-[#0F172A] dark:text-[#F8FAFC]">{lang === 'bn' ? 'প্রোগ্রাম:' : 'Programs:'}</strong>{' '}
                  {(lang === 'bn' ? selectedInst.programsBn : selectedInst.programsEn).join(', ')}
                </p>
              </div>

              {modalCost && (
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A] text-xs space-y-1">
                  <p className="font-bold text-[#0F172A] dark:text-[#F8FAFC] tabular-nums">
                    Estimated Total ({waiver}% waiver): BDT {modalCost.estimatedTotalBdt.toLocaleString()}
                  </p>
                  <p className="text-[#475569] dark:text-[#94A3B8] tabular-nums">
                    Per Semester ≈ BDT {modalCost.estimatedPerSemesterBdt.toLocaleString()}
                  </p>
                </div>
              )}

              {selectedInst.publishedCirculars[0] && (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowPdf((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {showPdf ? 'Hide Official Circular PDF' : 'View Official Circular PDF'}
                  </button>
                  {showPdf && (
                    <iframe
                      title={`${selectedInst.code} Official PDF`}
                      src={`/api/circulars/${selectedInst.publishedCirculars[0].id}/pdf`}
                      className="h-64 w-full rounded-lg border border-[#E2E8F0] dark:border-[#222222]"
                    />
                  )}
                </div>
              )}

              <div className="flex items-center justify-end pt-2 border-t border-[#E2E8F0] dark:border-[#222222]">
                <a
                  href={selectedInst.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                >
                  {lang === 'bn' ? 'অফিশিয়াল ওয়েবসাইট' : 'Official University Website'}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
