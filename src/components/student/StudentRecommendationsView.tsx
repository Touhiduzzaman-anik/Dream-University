import { useState } from 'react';
import { ExternalLink, Sparkles } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type { GroundedRecommendationItem } from '../../types/domain';

interface StudentRecommendationsViewProps {
  onGoToEligibility: () => void;
}

export function StudentRecommendationsView({ onGoToEligibility }: StudentRecommendationsViewProps) {
  const { lang, tr } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [eligibleCount, setEligibleCount] = useState<number | null>(null);
  const [recommendations, setRecommendations] = useState<GroundedRecommendationItem[]>([]);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch('/api/student/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Gemini recommendations.');
      }
      setSummary(data.summary);
      setEligibleCount(data.eligibleCount);
      setRecommendations(data.recommendations ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate recommendations.');
    } finally {
      setLoading(false);
    }
  };

  const tierStyles = {
    dream: 'border-[#F57C00]/35 bg-[#F57C00]/8 dark:border-[#FFA726]/40 dark:bg-[#121212]',
    match: 'border-[#00796B]/35 bg-[#00796B]/8 dark:border-[#26A69A]/40 dark:bg-[#121212]',
    safer: 'border-[#388E3C]/35 bg-[#388E3C]/8 dark:border-[#66BB6A]/40 dark:bg-[#121212]',
  };

  const tierTextColor = {
    dream: 'text-[#E65100] dark:text-[#FFA726]',
    match: 'text-[#00796B] dark:text-[#26A69A]',
    safer: 'text-[#2E7D32] dark:text-[#66BB6A]',
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              {lang === 'bn' ? 'জেমিনি এআই পরামর্শদাতা' : 'Explainable Gemini AI Recommender'}
            </p>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {tr('studentMenuRecommendations')}
            </h1>
            <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8] max-w-2xl">
              {lang === 'bn'
                ? 'প্রথমে যোগ্যতা ইঞ্জিন দিয়ে আপনার যোগ্য প্রতিষ্ঠান নির্ণয় করা হয়; তারপর শুধুমাত্র সেই যোগ্য প্রতিষ্ঠানগুলোর ভিত্তিতে জেমিনি পরামর্শ তৈরি করে।'
                : 'Strictly grounded in your deterministically verified Eligible institutions—never recommends ineligible schools or invents probabilities.'}
            </p>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] shrink-0 transition-colors"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {loading
              ? lang === 'bn'
                ? 'পরামর্শ তৈরি হচ্ছে...'
                : 'Analyzing Eligible Fits...'
              : lang === 'bn'
              ? 'এআই পরামর্শ তৈরি করুন'
              : 'Generate AI Recommendations'}
          </button>
        </div>

        {error && (
          <div role="alert" className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 p-3.5 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]">
            {error}
          </div>
        )}
      </div>

      {summary && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-2">
          <p className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
            {lang === 'bn'
              ? `যোগ্য প্রতিষ্ঠান পাওয়া গেছে: ${eligibleCount ?? 0}`
              : `Verified Eligible Programs Evaluated: ${eligibleCount ?? 0}`}
          </p>
          <p className="text-sm leading-relaxed text-[#0F172A] dark:text-[#F8FAFC]">{summary}</p>
          {recommendations.length === 0 && (
            <button
              type="button"
              onClick={onGoToEligibility}
              className="mt-2 inline-flex h-9 items-center rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
            >
              {lang === 'bn' ? 'যোগ্যতা যাচাইকারী দেখুন' : 'Inspect Eligibility Breakdown'}
            </button>
          )}
        </div>
      )}

      {recommendations.length > 0 && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {recommendations.map((rec) => (
            <article
              key={`${rec.tier}-${rec.ruleId}`}
              className={`rounded-xl border p-5 space-y-3 ${tierStyles[rec.tier]}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${tierTextColor[rec.tier]}`}>
                    {rec.tier === 'dream' && tr('aiGroupDream')}
                    {rec.tier === 'match' && tr('aiGroupMatch')}
                    {rec.tier === 'safer' && tr('aiGroupSafer')}
                  </p>
                  <h3 className="mt-0.5 font-sans text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? rec.institutionNameBn : rec.institutionNameEn}
                  </h3>
                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                    {rec.institutionCode} · {rec.programName}
                  </p>
                </div>
              </div>

              <dl className="space-y-2 text-xs text-[#0F172A] dark:text-[#F8FAFC] pt-2 border-t border-[#E2E8F0] dark:border-[#222222]">
                <div>
                  <dt className="font-bold">{tr('aiExplainAcademic')}:</dt>
                  <dd className="text-[#475569] dark:text-[#94A3B8]">{rec.academicMatchReason}</dd>
                </div>
                <div>
                  <dt className="font-bold">{tr('aiExplainProgram')}:</dt>
                  <dd className="text-[#475569] dark:text-[#94A3B8]">{rec.relevantProgramReason}</dd>
                </div>
                <div>
                  <dt className="font-bold">{tr('aiExplainLocation')}:</dt>
                  <dd className="text-[#475569] dark:text-[#94A3B8]">{rec.locationSuitability}</dd>
                </div>
                <div>
                  <dt className="font-bold">{tr('aiExplainBudget')}:</dt>
                  <dd className="text-[#475569] dark:text-[#94A3B8]">{rec.budgetSuitability}</dd>
                </div>
              </dl>

              {rec.sourceUrl && (
                <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#222222]">
                  <a
                    href={rec.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                  >
                    {rec.circularTitle}
                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
