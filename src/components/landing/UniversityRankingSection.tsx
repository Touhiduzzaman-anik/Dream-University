import { useEffect, useMemo, useState } from 'react';
import { ExternalLink, Trophy } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import {
  type UniversityRankingEntry,
  VERIFIED_BANGLADESH_RANKINGS,
} from '../../data/universityRankings';
import type { AdmissionCategoryId } from '../../types/domain';

interface UniversityRankingSectionProps {
  onSelectInstitutionCode?: (code: string) => void;
}

const INITIAL_VISIBLE_ROWS = 30;
const LOAD_MORE_STEP = 30;

export function UniversityRankingSection({ onSelectInstitutionCode }: UniversityRankingSectionProps) {
  const { lang } = useLanguage();
  const [categoryFilter, setCategoryFilter] = useState<'all' | AdmissionCategoryId>('all');
  const [rankings, setRankings] = useState<UniversityRankingEntry[]>(VERIFIED_BANGLADESH_RANKINGS);
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_ROWS);

  useEffect(() => {
    let active = true;
    apiFetch('/api/rankings')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && Array.isArray(data?.rankings) && data.rankings.length > 0) {
          setRankings(data.rankings);
        }
      })
      .catch(() => {
        // Keep initial verified catalog rankings on transient network failure
      });
    return () => {
      active = false;
    };
  }, []);

  const handleCategoryChange = (next: 'all' | AdmissionCategoryId) => {
    setCategoryFilter(next);
    setVisibleLimit(INITIAL_VISIBLE_ROWS);
  };

  const filteredRows = useMemo(() => {
    if (categoryFilter === 'all') return rankings;
    return rankings.filter((r) => r.category === categoryFilter);
  }, [categoryFilter, rankings]);

  const rows = useMemo(() => {
    return filteredRows.slice(0, visibleLimit);
  }, [filteredRows, visibleLimit]);

  const hasMore = rows.length < filteredRows.length;

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-[#E2E8F0] px-6 py-5 dark:border-[#222222] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
            <Trophy className="h-4 w-4 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
            <span>
              {lang === 'bn'
                ? 'তথ্যসূত্রসহ যাচাইকৃত বৈশ্বিক ও দেশীয় র‍্যাঙ্কিং'
                : 'Cited Bangladesh & Global Rankings (2026)'}
            </span>
          </div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
            {lang === 'bn'
              ? 'বিশ্ববিদ্যালয় র‍্যাঙ্কিং (QS & THE World University Rankings)'
              : 'University Rankings with Official Source & Year Citations'}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] p-1 dark:bg-[#0A0A0A] dark:border-[#222222]">
          {(
            [
              { id: 'all', labelEn: 'All', labelBn: 'সকল' },
              { id: 'public', labelEn: 'Public', labelBn: 'পাবলিক' },
              { id: 'engineering', labelEn: 'Engineering', labelBn: 'প্রকৌশল' },
              { id: 'private', labelEn: 'Private', labelBn: 'প্রাইভেট' },
              { id: 'medical', labelEn: 'Medical', labelBn: 'মেডিকেল' },
              { id: 'gst', labelEn: 'GST', labelBn: 'জিএসটি' },
              { id: 'national', labelEn: 'National', labelBn: 'জাতীয়' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleCategoryChange(tab.id)}
              className={`rounded-md px-2.5 py-1 text-xs font-semibold whitespace-nowrap transition-colors ${
                categoryFilter === tab.id
                  ? 'bg-[#00796B] text-white shadow-xs dark:bg-[#26A69A] dark:text-[#050505]'
                  : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {lang === 'bn' ? tab.labelBn : tab.labelEn}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
            <tr>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                {lang === 'bn' ? 'প্রতিষ্ঠান' : 'Institution'}
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                {lang === 'bn' ? 'QS বিশ্ব র‍্যাঙ্কিং (২০২৬)' : 'QS Global (2026)'}
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                {lang === 'bn' ? 'THE বিশ্ব র‍্যাঙ্কিং (২০২৬)' : 'THE Global (2026)'}
              </th>
              <th scope="col" className="px-4 py-3.5 font-semibold">
                {lang === 'bn' ? 'বাংলাদেশ অবস্থান' : 'Bangladesh Standing'}
              </th>
              <th scope="col" className="px-6 py-3.5 font-semibold">
                {lang === 'bn' ? 'উৎস ও সাল' : 'Source & Year'}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
            {rows.map((row) => (
              <tr
                key={row.code}
                className="hover:bg-[#F8FAFC] dark:hover:bg-[#0A0A0A] transition-colors"
              >
                <td className="px-6 py-4 align-top">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                        {row.code}
                      </span>
                      <span className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                        · {lang === 'bn' ? row.institutionTypeBn : row.institutionTypeEn}
                      </span>
                    </div>
                    {onSelectInstitutionCode ? (
                      <button
                        type="button"
                        onClick={() => onSelectInstitutionCode(row.code)}
                        className="font-sans text-sm font-bold text-[#0F172A] hover:text-[#00796B] dark:text-[#F8FAFC] dark:hover:text-[#26A69A] text-left transition-colors"
                      >
                        {lang === 'bn' ? row.nameBn : row.nameEn}
                      </button>
                    ) : (
                      <p className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {lang === 'bn' ? row.nameBn : row.nameEn}
                      </p>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4 align-top font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap">
                  {row.qsGlobal2026}
                </td>
                <td className="px-4 py-4 align-top font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC] whitespace-nowrap">
                  {row.theGlobal2026}
                </td>
                <td className="px-4 py-4 align-top text-[#475569] dark:text-[#94A3B8] max-w-xs">
                  {lang === 'bn' ? row.bangladeshStandingBn : row.bangladeshStandingEn}
                </td>
                <td className="px-6 py-4 align-top">
                  <a
                    href={row.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 font-medium text-[#00796B] dark:text-[#26A69A] hover:underline"
                  >
                    <span>
                      {row.sourceCitation} ({row.citationYear})
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {hasMore && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-[#E2E8F0] px-6 py-4 dark:border-[#222222] sm:flex-row">
          <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
            {lang === 'bn'
              ? `মোট ${filteredRows.length}টি প্রতিষ্ঠানের মধ্যে ${rows.length}টি প্রদর্শিত হচ্ছে`
              : `Showing ${rows.length} of ${filteredRows.length} institutions`}
          </p>
          <button
            type="button"
            onClick={() =>
              setVisibleLimit((prev) => Math.min(prev + LOAD_MORE_STEP, filteredRows.length))
            }
            className="inline-flex h-9 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
          >
            {lang === 'bn' ? 'আরও দেখুন' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
