import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookmarkCheck,
  CheckCircle2,
  Compass,
  ExternalLink,
  GraduationCap,
  Printer,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  CAREER_QUIZ_QUESTIONS,
  CAREER_QUIZ_STORAGE_KEY,
  evaluateCareerQuiz,
  type CareerQuizEvaluation,
} from '../../utils/careerQuizEngine';

interface CareerSubjectFinderModalProps {
  open: boolean;
  onClose: () => void;
}

export function CareerSubjectFinderModal({ open, onClose }: CareerSubjectFinderModalProps) {
  const { lang } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const totalQuestions = CAREER_QUIZ_QUESTIONS.length;
  const currentQuestion = CAREER_QUIZ_QUESTIONS[currentIndex];
  const answeredCount = Object.keys(answers).length;

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const evaluation: CareerQuizEvaluation | null = useMemo(() => {
    if (!submitted) return null;
    return evaluateCareerQuiz(answers);
  }, [submitted, answers]);

  if (!open) return null;

  const progressPercent = submitted
    ? 100
    : Math.round(((currentIndex + 1) / totalQuestions) * 100);

  const selectedOptionId = currentQuestion ? answers[currentQuestion.id] : undefined;

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }));
  };

  const handleNextOrFinish = () => {
    if (!selectedOptionId) return;
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSubmitted(true);
      setSavedNotice(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setCurrentIndex(0);
    setSubmitted(false);
    setSavedNotice(false);
  };

  const handleSaveAndPrint = () => {
    if (!evaluation) return;
    try {
      window.localStorage.setItem(CAREER_QUIZ_STORAGE_KEY, JSON.stringify(evaluation));
      setSavedNotice(true);
    } catch {
      // Ignore storage failures
    }
    if (typeof window.print === 'function') {
      window.setTimeout(() => {
        window.print();
      }, 60);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="career-finder-modal-title"
      data-testid="career-finder-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto print:static print:p-0"
    >
      <div
        className="fixed inset-0 bg-[#050505]/80 backdrop-blur-xs print:hidden"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-3xl max-h-[92vh] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#222222] dark:bg-[#121212] print:max-h-none print:border-0 print:shadow-none">
        {/* Top Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E2E8F0] bg-[#F8FAFC] px-5 py-4 dark:border-[#222222] dark:bg-[#0A0A0A]">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#00796B]/30 bg-[#00796B]/10 text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/15 dark:text-[#26A69A]">
              <Compass className="h-5 w-5" aria-hidden="true" />
            </div>
            <div>
              <h2
                id="career-finder-modal-title"
                className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]"
              >
                {lang === 'bn'
                  ? 'বিষয় ও ক্যারিয়ার গাইড (৩০টি প্রশ্ন)'
                  : 'Career & Subject Finder (30 Questions)'}
              </h2>
              <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? 'আপনার আগ্রহ, কাজের ধরন ও ২০২৬–২০৩৫ চাকরির বাজার অনুযায়ী সেরা অনার্স বিষয় নির্ধারণ'
                  : 'Discover your best-fit Honours subjects based on interests, work style & 2026–2035 career demand'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            data-testid="career-finder-close"
            aria-label={lang === 'bn' ? 'মোডাল বন্ধ করুন' : 'Close Career & Subject Finder'}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2E8F0] bg-white text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:border-[#222222] dark:bg-[#121212] dark:text-[#94A3B8] dark:hover:bg-[#0A0A0A] dark:hover:text-[#F8FAFC] print:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="border-b border-[#E2E8F0] bg-white px-5 py-3 dark:border-[#222222] dark:bg-[#121212] print:hidden">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold">
            <span className="text-[#00796B] dark:text-[#26A69A]">
              {submitted
                ? lang === 'bn'
                  ? 'মূল্যায়ন সম্পন্ন হয়েছে'
                  : 'Assessment Complete'
                : lang === 'bn'
                  ? currentQuestion.sectionLabelBn
                  : currentQuestion.sectionLabelEn}
            </span>
            <span
              data-testid="career-finder-progress-label"
              className="font-mono text-[#475569] dark:text-[#94A3B8]"
            >
              {submitted
                ? `${totalQuestions} / ${totalQuestions}`
                : `${lang === 'bn' ? 'প্রশ্ন' : 'Question'} ${currentIndex + 1} / ${totalQuestions}`}
            </span>
          </div>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#222222]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#00796B] via-[#388E3C] to-[#F57C00] transition-all duration-300 dark:from-[#26A69A] dark:via-[#66BB6A] dark:to-[#FFA726]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6">
          {!submitted && currentQuestion ? (
            <div className="space-y-5">
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? `উত্তর দিয়েছেন ${answeredCount} / ${totalQuestions}টি`
                    : `Answered ${answeredCount} of ${totalQuestions}`}
                </p>
                <h3
                  data-testid="career-question-prompt"
                  className="font-sans text-lg sm:text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug"
                >
                  {lang === 'bn' ? currentQuestion.promptBn : currentQuestion.promptEn}
                </h3>
              </div>

              <div className="grid gap-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = selectedOptionId === option.id;
                  const optionLetter = String.fromCharCode(65 + idx);
                  return (
                    <button
                      key={option.id}
                      type="button"
                      data-testid={`career-option-${idx}`}
                      aria-pressed={isSelected}
                      onClick={() => handleSelectOption(option.id)}
                      className={`group flex w-full items-start gap-3.5 rounded-xl border p-4 text-left transition-all ${
                        isSelected
                          ? 'border-[#00796B] bg-[#00796B]/10 shadow-sm ring-2 ring-[#00796B]/20 dark:border-[#26A69A] dark:bg-[#26A69A]/12 dark:ring-[#26A69A]/25'
                          : 'border-[#E2E8F0] bg-white hover:border-[#00796B]/50 hover:bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#26A69A]/45 dark:hover:bg-[#121212]'
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                            : 'border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] group-hover:border-[#00796B]/50 dark:border-[#222222] dark:bg-[#121212] dark:text-[#94A3B8]'
                        }`}
                      >
                        {optionLetter}
                      </span>
                      <span className="flex-1 text-sm font-medium text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
                        {lang === 'bn' ? option.labelBn : option.labelEn}
                      </span>
                      {isSelected && (
                        <CheckCircle2
                          className="mt-0.5 h-5 w-5 shrink-0 text-[#00796B] dark:text-[#26A69A]"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : evaluation ? (
            <div data-testid="career-finder-results" className="space-y-6">
              {/* Summary Header */}
              <div className="rounded-xl border border-[#00796B]/30 bg-[#00796B]/10 p-4 dark:border-[#26A69A]/35 dark:bg-[#26A69A]/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00796B] dark:text-[#26A69A]">
                    <Sparkles className="h-4 w-4 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
                    <span>
                      {lang === 'bn'
                        ? 'আপনার সেরা ৪টি অনার্স বিষয়ের সুপারিশ'
                        : 'Top 4 Best-Matched Honours Subjects'}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? `${evaluation.answeredCount}/৩০ প্রশ্নের বিশ্লেষণ`
                      : `Based on ${evaluation.answeredCount}/30 Responses`}
                  </span>
                </div>

                {evaluation.dominantTraitsEn.length > 0 && (
                  <p className="mt-2 text-xs text-[#0F172A] dark:text-[#F8FAFC] leading-relaxed">
                    <span className="font-semibold">
                      {lang === 'bn' ? 'প্রধান দক্ষতা ও প্রবণতা: ' : 'Core Profile Signals: '}
                    </span>
                    {(lang === 'bn'
                      ? evaluation.dominantTraitsBn
                      : evaluation.dominantTraitsEn
                    ).join(' · ')}
                  </p>
                )}
              </div>

              {savedNotice && (
                <div
                  role="status"
                  data-testid="career-result-saved-banner"
                  className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2.5 text-xs font-semibold text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] print:hidden"
                >
                  <BookmarkCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>
                    {lang === 'bn'
                      ? 'আপনার ক্যারিয়ার ও বিষয় সুপারিশ ব্রাউজারে সংরক্ষণ করা হয়েছে।'
                      : 'Your Career & Subject Finder report has been saved locally.'}
                  </span>
                </div>
              )}

              {/* Top 4 Subject Cards */}
              <div className="space-y-4">
                {evaluation.topSubjects.map((subject, idx) => (
                  <article
                    key={subject.id}
                    data-testid={`career-result-card-${idx}`}
                    className="rounded-xl border border-[#E2E8F0] bg-white p-4 sm:p-5 shadow-xs dark:border-[#222222] dark:bg-[#0A0A0A] space-y-3.5"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                          <span>#{idx + 1}</span>
                          <span>·</span>
                          <span>{lang === 'bn' ? subject.degreeBadgeBn : subject.degreeBadgeEn}</span>
                        </div>
                        <h3 className="font-sans text-base sm:text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {lang === 'bn' ? subject.titleBn : subject.titleEn}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3 py-1.5 text-xs font-extrabold text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]">
                        <span>{subject.matchPercentage}%</span>
                        <span>{lang === 'bn' ? 'মিল' : 'Match'}</span>
                      </div>
                    </div>

                    {/* Match percentage bar */}
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#E2E8F0] dark:bg-[#222222]">
                      <div
                        className="h-full rounded-full bg-[#388E3C] dark:bg-[#66BB6A]"
                        style={{ width: `${subject.matchPercentage}%` }}
                      />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#222222] dark:bg-[#121212]">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#00796B] dark:text-[#26A69A] mb-1">
                          {lang === 'bn'
                            ? 'কেন আপনার আগ্রহের সাথে মেলে'
                            : 'Why It Fits Your Interest'}
                        </p>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {lang === 'bn' ? subject.whyItFitsBn : subject.whyItFitsEn}
                        </p>
                      </div>

                      <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 dark:border-[#222222] dark:bg-[#121212]">
                        <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#2E7D32] dark:text-[#66BB6A] mb-1">
                          <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>
                            {lang === 'bn'
                              ? 'ভবিষ্যৎ চাকরির সম্ভাবনা'
                              : 'Future Job Perspective'}
                          </span>
                        </p>
                        <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                          {lang === 'bn' ? subject.jobOutlookBn : subject.jobOutlookEn}
                        </p>
                        <p className="mt-2 text-[11px] font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          {(lang === 'bn'
                            ? subject.demandHighlightsBn
                            : subject.demandHighlightsEn
                          ).join(' · ')}
                        </p>
                      </div>
                    </div>

                    {/* Top Bangladeshi Universities Offering This Subject */}
                    <div>
                      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8] mb-2">
                        <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>
                          {lang === 'bn'
                            ? 'বাংলাদেশের শীর্ষ বিশ্ববিদ্যালয়সমূহ'
                            : 'Top Bangladeshi Universities Offering This Subject'}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {subject.topUniversities.map((uni) => (
                          <a
                            key={uni.code}
                            href={uni.officialWebsite}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-2.5 py-1.5 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
                          >
                            <span className="font-mono text-[11px] font-bold text-[#00796B] dark:text-[#26A69A]">
                              {uni.code}
                            </span>
                            <span>{lang === 'bn' ? uni.nameBn : uni.nameEn}</span>
                            <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] bg-[#F8FAFC] px-5 py-3.5 dark:border-[#222222] dark:bg-[#0A0A0A] print:hidden">
          {!submitted ? (
            <>
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                data-testid="career-quiz-prev"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] disabled:opacity-40 dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>{lang === 'bn' ? 'পূর্ববর্তী' : 'Previous'}</span>
              </button>

              <button
                type="button"
                onClick={handleNextOrFinish}
                disabled={!selectedOptionId}
                data-testid="career-quiz-next"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#00695C] disabled:opacity-40 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
              >
                <span>
                  {currentIndex === totalQuestions - 1
                    ? lang === 'bn'
                      ? 'ফলাফল দেখুন'
                      : 'See Top 4 Subjects'
                    : lang === 'bn'
                      ? 'পরবর্তী প্রশ্ন'
                      : 'Next Question'}
                </span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleRetake}
                data-testid="career-quiz-retake"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                <span>{lang === 'bn' ? 'পুনরায় কুইজ দিন' : 'Retake Quiz'}</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAndPrint}
                data-testid="career-quiz-save-print"
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
              >
                <Printer className="h-4 w-4" aria-hidden="true" />
                <span>{lang === 'bn' ? 'সংরক্ষণ / প্রিন্ট করুন' : 'Save / Print Result'}</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
