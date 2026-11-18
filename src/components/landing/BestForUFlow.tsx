import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Compass,
  ExternalLink,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type {
  AppRoute,
  GroundedRecommendationItem,
  StudentProfileRecord,
} from '../../types/domain';
import { buildStudentProfileSaveBody } from '../../utils/academicProfileSync';
import {
  BangladeshAcademicForm,
  buildValidatedAcademicPayload,
  createInitialAcademicFormValue,
  type BangladeshAcademicFormValue,
} from '../academic/BangladeshAcademicForm';

interface BestForUFlowProps {
  onNavigate: (route: AppRoute) => void;
  onOpenSavedReport?: () => void;
}

const SUBJECT_PRESETS = [
  'Computer Science & Engineering (CSE)',
  'Medical / MBBS',
  'BBA / Business Administration',
  'Electrical & Electronic Engineering (EEE)',
  'Economics & Social Sciences',
];

export function BestForUFlow({ onNavigate, onOpenSavedReport }: BestForUFlowProps) {
  const { lang } = useLanguage();
  const { user, profile, setProfile } = useAuth();
  const isStudentLoggedIn = user?.accountType === 'student';

  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Academic Intake (Authentic Bangladesh SSC & HSC cards + subjects)
  const [academicForm, setAcademicForm] = useState<BangladeshAcademicFormValue>(() =>
    createInitialAcademicFormValue(profile)
  );

  // Step 2: Preferences & Budget
  const [preferredSubject, setPreferredSubject] = useState('Computer Science & Engineering (CSE)');
  const [preferredCity, setPreferredCity] = useState('Dhaka');
  const [tuitionBudgetBdt, setTuitionBudgetBdt] = useState('950000');

  // Step 3: Grounded AI Advisor Output
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [eligibleCount, setEligibleCount] = useState(0);
  const [totalEvaluated, setTotalEvaluated] = useState(0);
  const [summary, setSummary] = useState('');
  const [recommendations, setRecommendations] = useState<GroundedRecommendationItem[]>([]);

  // Auto-fill if student is logged in
  useEffect(() => {
    if (profile) {
      setAcademicForm(createInitialAcademicFormValue(profile));
      if (profile.preferredSubject) setPreferredSubject(profile.preferredSubject);
      if (profile.preferredCity) setPreferredCity(profile.preferredCity);
      if (profile.tuitionBudgetBdt != null) setTuitionBudgetBdt(String(profile.tuitionBudgetBdt));
    }
  }, [profile]);

  const validateStep1 = (): boolean => {
    setError(null);
    const validated = buildValidatedAcademicPayload(academicForm);
    if (validated.ok === false) {
      setError(validated.error);
      return false;
    }
    return true;
  };

  const handleSaveToProfile = async () => {
    if (!user || user.accountType !== 'student') return;
    setError(null);
    setSaveNotice(null);

    const validated = buildValidatedAcademicPayload(academicForm);
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
        preferencesOverride: {
          preferredSubject,
          preferredCity,
          tuitionBudgetBdt,
        },
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
      setSaveNotice('Academic profile & preferences saved to PostgreSQL.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save academic profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitAdvisor = async (e: React.FormEvent) => {
    e.preventDefault();
    const validated = buildValidatedAcademicPayload(academicForm);
    if (validated.ok === false) {
      setError(validated.error);
      return;
    }

    setError(null);
    setSaveNotice(null);
    setLoading(true);
    setStep(3);

    try {
      const res = await apiFetch('/api/public/best-for-u', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validated.payload,
          preferredSubject,
          preferredCity,
          tuitionBudgetBdt: tuitionBudgetBdt.trim() ? Number(tuitionBudgetBdt) : null,
          lang,
        }),
      });

      const data = (await res.json()) as {
        eligibleCount?: number;
        totalEvaluated?: number;
        summary?: string;
        recommendations?: GroundedRecommendationItem[];
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate Best for U recommendations.');
      }

      setEligibleCount(data.eligibleCount ?? 0);
      setTotalEvaluated(data.totalEvaluated ?? 0);
      setSummary(data.summary ?? '');
      setRecommendations(data.recommendations ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to generate recommendations right now.');
    } finally {
      setLoading(false);
    }
  };

  const tierGroups: Array<{
    tier: 'dream' | 'match' | 'safer';
    title: string;
    borderClass: string;
    badgeClass: string;
  }> = [
    {
      tier: 'dream',
      title: 'Dream Tier',
      borderClass: 'border-[#F57C00]/35 dark:border-[#FFA726]/40',
      badgeClass: 'bg-[#F57C00]/12 text-[#E65100] dark:bg-[#FFA726]/15 dark:text-[#FFA726]',
    },
    {
      tier: 'match',
      title: 'Match Tier',
      borderClass: 'border-[#00796B]/35 dark:border-[#26A69A]/40',
      badgeClass: 'bg-[#00796B]/12 text-[#00796B] dark:bg-[#26A69A]/15 dark:text-[#26A69A]',
    },
    {
      tier: 'safer',
      title: 'Safer Tier',
      borderClass: 'border-[#388E3C]/35 dark:border-[#66BB6A]/40',
      badgeClass: 'bg-[#388E3C]/12 text-[#2E7D32] dark:bg-[#66BB6A]/15 dark:text-[#66BB6A]',
    },
  ];

  return (
    <div className="rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212] overflow-hidden">
      {/* Header + 3-Step Indicator */}
      <div className="border-b border-[#E2E8F0] px-6 py-5 dark:border-[#222222] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
              <Compass className="h-4 w-4" aria-hidden="true" />
              <span>Best for U · Deterministic Filter + Gemini AI Advisor</span>
            </div>
            <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
              Find the Best Matching Universities &amp; Subjects for You
            </h2>
          </div>

          {isStudentLoggedIn && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2E7D32] dark:text-[#66BB6A]">
              <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
              Auto-filled from your saved profile
            </span>
          )}
        </div>

        {/* Stepper Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2" role="tablist" aria-label="Best for U steps">
          {[
            { num: 1 as const, label: '1. Academic Results' },
            { num: 2 as const, label: '2. Subject & Budget' },
            { num: 3 as const, label: '3. AI Tier Results' },
          ].map((s) => (
            <button
              key={s.num}
              type="button"
              role="tab"
              aria-selected={step === s.num}
              onClick={() => {
                if (s.num === 3 && recommendations.length === 0) return;
                setStep(s.num);
              }}
              className={`rounded-lg px-3 py-2 text-xs font-semibold text-left transition-colors whitespace-nowrap ${
                step === s.num
                  ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                  : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#00796B] hover:text-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:hover:border-[#26A69A] dark:hover:text-[#F8FAFC]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Authentic Academic Intake */}
      {step === 1 && (
        <div className="p-6 space-y-5">
          <BangladeshAcademicForm idPrefix="bfu" value={academicForm} onChange={setAcademicForm} />

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-3 py-2 text-xs text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
            >
              {error}
            </div>
          )}

          {saveNotice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
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
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-5 text-sm font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] disabled:opacity-60 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
              >
                <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{saving ? 'Saving...' : 'Save to My Profile'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (validateStep1()) setStep(2);
              }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00796B] px-5 text-sm font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
            >
              <span>Next: Preferences &amp; Budget</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preferences & Tuition Budget */}
      {step === 2 && (
        <form onSubmit={handleSubmitAdvisor} className="p-6 space-y-5">
          <div className="space-y-2.5">
            <label
              htmlFor="bfu-pref-subject"
              className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
            >
              Preferred Subject / Field
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SUBJECT_PRESETS.map((label) => {
                const active = preferredSubject === label;
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setPreferredSubject(label)}
                    className={`rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors ${
                      active
                        ? 'border-[#00796B] bg-[#00796B]/10 text-[#00796B] dark:border-[#26A69A] dark:bg-[#26A69A]/15 dark:text-[#26A69A]'
                        : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:border-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:hover:border-[#26A69A]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <input
              id="bfu-pref-subject"
              type="text"
              value={preferredSubject}
              onChange={(e) => setPreferredSubject(e.target.value)}
              placeholder="e.g., CSE, MBBS, BBA, Economics, EEE"
              className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="bfu-city"
                className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
              >
                Preferred City / Location
              </label>
              <select
                id="bfu-city"
                value={preferredCity}
                onChange={(e) => setPreferredCity(e.target.value)}
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              >
                <option value="Any">Any City in Bangladesh</option>
                <option value="Dhaka">Dhaka</option>
                <option value="Sylhet">Sylhet</option>
                <option value="Gazipur">Gazipur / Nationwide</option>
                <option value="Chattogram">Chattogram</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="bfu-budget"
                className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1"
              >
                Maximum Tuition Budget (BDT)
              </label>
              <input
                id="bfu-budget"
                type="number"
                min="0"
                step="25000"
                value={tuitionBudgetBdt}
                onChange={(e) => setTuitionBudgetBdt(e.target.value)}
                placeholder="950000"
                className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 font-mono text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              />
            </div>
          </div>

          {saveNotice && (
            <div
              role="status"
              className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{saveNotice}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              Back to Grades
            </button>

            <div className="flex flex-wrap items-center gap-2.5">
              {isStudentLoggedIn && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleSaveToProfile()}
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] disabled:opacity-60 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
                >
                  <Save className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{saving ? 'Saving...' : 'Save to My Profile'}</span>
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-11 items-center gap-2 rounded-xl bg-[#00796B] px-5 text-sm font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                <span>Get Best for U AI Recommendations</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Step 3: Grounded AI Results */}
      {step === 3 && (
        <div className="p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
            >
              <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
              Adjust Grades or Preferences
            </button>

            {isStudentLoggedIn && onOpenSavedReport ? (
              <button
                type="button"
                onClick={onOpenSavedReport}
                className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
              >
                Open Saved A4 Report →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/register')}
                className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
              >
                Create account to save plan →
              </button>
            )}
          </div>

          {loading ? (
            <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-8 text-center space-y-2 dark:border-[#222222] dark:bg-[#0A0A0A]">
              <Sparkles className="h-6 w-6 mx-auto text-[#00796B] dark:text-[#26A69A] animate-pulse" aria-hidden="true" />
              <p className="text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                Filtering verified eligibility rules and generating Gemini AI recommendations...
              </p>
            </div>
          ) : error ? (
            <div
              role="alert"
              className="rounded-xl border border-[#D32F2F]/35 bg-[#D32F2F]/10 p-4 text-xs text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
            >
              {error}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-xl border border-[#00796B]/30 bg-[#00796B]/8 p-4 dark:border-[#26A69A]/35 dark:bg-[#26A69A]/10 space-y-1">
                <p className="text-xs font-bold tabular-nums text-[#00796B] dark:text-[#26A69A]">
                  {`Grounded strictly in ${eligibleCount} deterministically eligible program(s) out of ${totalEvaluated} evaluated`}
                </p>
                <p className="text-sm leading-relaxed text-[#0F172A] dark:text-[#F8FAFC]">{summary}</p>
              </div>

              {recommendations.length === 0 ? (
                <div className="rounded-xl border border-[#F57C00]/35 bg-[#F57C00]/10 p-6 text-sm text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]">
                  No verified eligible programs matched these academic thresholds. Go back to Step 1 to adjust GPA or subject combination.
                </div>
              ) : (
                <div className="space-y-4">
                  {tierGroups.map((group) => {
                    const tierItems = recommendations.filter((r) => r.tier === group.tier);
                    if (tierItems.length === 0) return null;
                    return (
                      <div key={group.tier} className="space-y-3">
                        <h4 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {group.title}
                        </h4>
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                          {tierItems.map((rec) => (
                            <article
                              key={rec.ruleId}
                              className={`rounded-xl border bg-[#F8FAFC] p-4 dark:bg-[#0A0A0A] space-y-2.5 ${group.borderClass}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-mono text-xs font-bold text-[#00796B] dark:text-[#26A69A]">
                                    {rec.institutionCode}
                                  </span>
                                  <h5 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                                    {rec.institutionNameEn}
                                  </h5>
                                  <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                                    {rec.programName}
                                  </p>
                                </div>
                                <span
                                  className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase whitespace-nowrap ${group.badgeClass}`}
                                >
                                  {group.tier}
                                </span>
                              </div>

                              <dl className="space-y-1 text-xs text-[#475569] dark:text-[#94A3B8] pt-2 border-t border-[#E2E8F0] dark:border-[#222222]">
                                <div>
                                  <dt className="inline font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                    Academic Fit:{' '}
                                  </dt>
                                  <dd className="inline">{rec.academicMatchReason}</dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                    Subject Fit:{' '}
                                  </dt>
                                  <dd className="inline">{rec.relevantProgramReason}</dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                    Location:{' '}
                                  </dt>
                                  <dd className="inline">{rec.locationSuitability}</dd>
                                </div>
                                <div>
                                  <dt className="inline font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                    Budget:{' '}
                                  </dt>
                                  <dd className="inline">{rec.budgetSuitability}</dd>
                                </div>
                              </dl>

                              <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0] dark:border-[#222222] text-[11px] text-[#475569] dark:text-[#94A3B8]">
                                <span className="truncate">{rec.circularTitle}</span>
                                {rec.sourceUrl && (
                                  <a
                                    href={rec.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline shrink-0"
                                  >
                                    Source
                                    <ExternalLink className="h-3 w-3" aria-hidden="true" />
                                  </a>
                                )}
                              </div>
                            </article>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
