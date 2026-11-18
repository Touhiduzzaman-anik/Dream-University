import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  CheckCircle2,
  FileSearch,
  FileUp,
  Pencil,
  RotateCcw,
  Save,
  Sparkles,
  X,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch, withAuthTokenUrl } from '../../lib/authFetch';
import type {
  AdminCircularRecord,
  AdminRole,
  InstitutionRecord,
  VerifiedRuleRecord,
} from '../../types/domain';
import type { RulePublicationStatus } from '../../utils/eligibilityEngine';

interface AdminCircularsAndVerificationViewProps {
  mode: 'circulars' | 'verification' | 'publications';
  adminRole: AdminRole;
  institutions: InstitutionRecord[];
  circulars: AdminCircularRecord[];
  onRefresh: () => Promise<void>;
}

const STATUS_BADGE: Record<RulePublicationStatus, string> = {
  draft: 'bg-[#F8FAFC] text-[#475569] border-[#E2E8F0] dark:bg-[#1E1E1E] dark:text-[#94A3B8] dark:border-[#222222]',
  ai_extracted:
    'bg-[#00796B]/10 text-[#00796B] border-[#00796B]/30 dark:bg-[#26A69A]/12 dark:text-[#26A69A] dark:border-[#26A69A]/35',
  under_review:
    'bg-[#F57C00]/10 text-[#E65100] border-[#F57C00]/35 dark:bg-[#FFA726]/12 dark:text-[#FFA726] dark:border-[#FFA726]/40',
  published:
    'bg-[#388E3C]/10 text-[#2E7D32] border-[#388E3C]/35 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A] dark:border-[#66BB6A]/40',
  expired:
    'bg-[#D32F2F]/10 text-[#D32F2F] border-[#D32F2F]/35 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D] dark:border-[#FF4D4D]/40',
  archived:
    'bg-[#E2E8F0] text-[#475569] border-[#CBD5E1] dark:bg-[#1E1E1E] dark:text-[#94A3B8] dark:border-[#222222]',
};

export function AdminCircularsAndVerificationView({
  mode,
  adminRole,
  institutions,
  circulars,
  onRefresh,
}: AdminCircularsAndVerificationViewProps) {
  const { lang, tr } = useLanguage();

  const canUploadAndExtract = adminRole === 'super_admin' || adminRole === 'admin';
  const canApprovePublish = adminRole === 'super_admin' || adminRole === 'admin';
  const canArchive = adminRole === 'super_admin' || adminRole === 'admin';

  // Upload Circular Form State
  const [institutionId, setInstitutionId] = useState<number>(() => institutions[0]?.id ?? 1);
  const [titleEn, setTitleEn] = useState('');
  const [titleBn, setTitleBn] = useState('');
  const [session, setSession] = useState('2025-2026');
  const [sourceUrl, setSourceUrl] = useState('https://');
  const [applicationDeadline, setApplicationDeadline] = useState('2026-06-30');
  const [rawCircularText, setRawCircularText] = useState('');
  const [pdfFilename, setPdfFilename] = useState('');
  const [pdfBase64, setPdfBase64] = useState('');

  // Inline Circular Metadata Edit State
  const [editingCircularId, setEditingCircularId] = useState<number | null>(null);
  const [editCircTitleEn, setEditCircTitleEn] = useState('');
  const [editCircTitleBn, setEditCircTitleBn] = useState('');
  const [editCircSession, setEditCircSession] = useState('');
  const [editCircSourceUrl, setEditCircSourceUrl] = useState('');
  const [editCircDeadline, setEditCircDeadline] = useState('');
  const [editCircNotes, setEditCircNotes] = useState('');

  // Side-by-side Verification State
  const [selectedCircularId, setSelectedCircularId] = useState<number | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [editingRule, setEditingRule] = useState<VerifiedRuleRecord | null>(null);
  const [subjectJsonText, setSubjectJsonText] = useState('{}');

  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  useEffect(() => {
    if (institutions.length > 0 && !institutions.some((i) => i.id === institutionId)) {
      setInstitutionId(institutions[0].id);
    }
  }, [institutions, institutionId]);

  useEffect(() => {
    if (circulars.length === 0) {
      setSelectedCircularId(null);
      return;
    }
    if (!selectedCircularId || !circulars.some((c) => c.id === selectedCircularId)) {
      const pending =
        circulars.find((c) => c.status === 'under_review' || c.status === 'ai_extracted') ??
        circulars[0];
      setSelectedCircularId(pending.id);
    }
  }, [circulars, selectedCircularId]);

  const selectedCircular = circulars.find((c) => c.id === selectedCircularId) ?? null;

  useEffect(() => {
    if (selectedCircular) {
      setReviewNotes(selectedCircular.reviewNotes ?? '');
      const firstRule = selectedCircular.rules[0] ?? null;
      setEditingRule(firstRule ? { ...firstRule } : null);
      setSubjectJsonText(
        firstRule ? JSON.stringify(firstRule.requiredSubjectMinGpa ?? {}, null, 2) : '{}'
      );
    } else {
      setEditingRule(null);
    }
  }, [selectedCircular]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      setFeedback({
        type: 'error',
        text: lang === 'bn' ? 'শুধুমাত্র PDF ফাইল আপলোড করুন।' : 'Only PDF files are accepted.',
      });
      return;
    }
    setPdfFilename(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPdfBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUploadCircular = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setBusyAction('upload');
    try {
      const res = await apiFetch('/api/admin/circulars', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institutionId,
          titleEn,
          titleBn: titleBn || titleEn,
          session,
          sourceUrl,
          applicationDeadline,
          pdfFilename: pdfFilename || 'official-circular.pdf',
          pdfBase64: pdfBase64 || undefined,
          rawCircularText: rawCircularText || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload circular.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? 'সার্কুলার খসড়া (Draft) হিসেবে আপলোড হয়েছে। এখন Gemini AI দিয়ে নীতিমালা এক্সট্র্যাক্ট করুন।'
            : 'Circular uploaded as Draft. Run Gemini AI Extraction next to parse structured admission rules.',
      });
      setTitleEn('');
      setTitleBn('');
      setRawCircularText('');
      setPdfFilename('');
      setPdfBase64('');
      setSelectedCircularId(data.circular.id);
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Upload failed.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleExtractWithGemini = async (circularId: number) => {
    setFeedback(null);
    setBusyAction(`extract-${circularId}`);
    try {
      const res = await apiFetch(`/api/admin/circulars/${circularId}/extract`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gemini extraction failed.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `Gemini AI সফলভাবে ${data.rules.length}টি ভর্তি নীতিমালা এক্সট্র্যাক্ট করেছে।`
            : `Gemini extracted ${data.rules.length} rule(s). Inspect side-by-side against the PDF before review.`,
      });
      setSelectedCircularId(circularId);
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Gemini extraction failed.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleSaveRuleEdits = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setFeedback(null);
    setBusyAction('save-rule');
    try {
      let parsedSubjects: Record<string, number> = {};
      try {
        parsedSubjects = JSON.parse(subjectJsonText || '{}');
      } catch {
        throw new Error(
          lang === 'bn'
            ? 'Subject Minimum GPA অবশ্যই সঠিক JSON হতে হবে।'
            : 'Subject Minimum GPA must be valid JSON (e.g., {"Mathematics": 4.0}).'
        );
      }

      const res = await apiFetch(`/api/admin/rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programName: editingRule.programName,
          minSscGpa: editingRule.minSscGpa,
          minHscGpa: editingRule.minHscGpa,
          minCombinedGpa: editingRule.minCombinedGpa,
          allowedGroups: editingRule.allowedGroups,
          allowedHscYears: editingRule.allowedHscYears,
          allowsSecondTimer: editingRule.allowsSecondTimer,
          requiredSubjectMinGpa: parsedSubjects,
          pageReference: editingRule.pageReference,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update rule.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `নীতিমালা (সংস্করণ v${data.rule.version}) সংরক্ষিত হয়েছে।`
            : `Admission rule saved (version v${data.rule.version}).`,
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save rule.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const handleTransitionWorkflow = async (
    circularId: number,
    status: RulePublicationStatus
  ) => {
    setFeedback(null);
    setBusyAction(`wf-${circularId}-${status}`);
    try {
      const res = await apiFetch(`/api/admin/circulars/${circularId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Workflow update rejected.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `সার্কুলার অবস্থা "${status}"-এ পরিবর্তন হয়েছে (v${data.circular.version})।`
            : `Circular transitioned to "${status}" (v${data.circular.version}).`,
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Workflow transition failed.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  const startEditingCircular = (c: AdminCircularRecord) => {
    setFeedback(null);
    setEditingCircularId(c.id);
    setEditCircTitleEn(c.titleEn);
    setEditCircTitleBn(c.titleBn);
    setEditCircSession(c.session);
    setEditCircSourceUrl(c.sourceUrl);
    setEditCircDeadline(c.applicationDeadline ?? '');
    setEditCircNotes(c.reviewNotes ?? '');
  };

  const handleSaveCircularMetadata = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCircularId) return;
    setFeedback(null);
    setBusyAction(`edit-circ-${editingCircularId}`);
    try {
      const res = await apiFetch(`/api/admin/circulars/${editingCircularId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titleEn: editCircTitleEn,
          titleBn: editCircTitleBn || editCircTitleEn,
          session: editCircSession,
          sourceUrl: editCircSourceUrl,
          applicationDeadline: editCircDeadline || null,
          reviewNotes: editCircNotes || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update circular.');
      }
      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `সার্কুলার হালনাগাদ হয়েছে (v${data.circular.version})।`
            : `Circular updated (v${data.circular.version}) by ${data.circular.updatedBy || 'Admin'}.`,
      });
      setEditingCircularId(null);
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to update circular metadata.',
      });
    } finally {
      setBusyAction(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-3">
        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
          {mode === 'circulars'
            ? tr('adminMenuCirculars')
            : mode === 'verification'
            ? tr('adminMenuVerification')
            : tr('adminMenuPublications')}
        </h1>
        <p className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2.5 text-xs font-medium text-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC]">
          {tr('workflowLabel')}
        </p>

        {feedback && (
          <div
            role="status"
            className={`rounded-lg border px-4 py-3 text-xs font-medium ${
              feedback.type === 'error'
                ? 'border-[#D32F2F]/35 bg-[#D32F2F]/10 text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]'
                : 'border-[#388E3C]/35 bg-[#388E3C]/10 text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]'
            }`}
          >
            {feedback.text}
          </div>
        )}
      </div>

      {/* Mode 1: Circular Upload & Gemini Extraction Trigger */}
      {mode === 'circulars' && (
        <>
          {canUploadAndExtract ? (
            <form
              onSubmit={handleUploadCircular}
              className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4"
            >
              <div className="flex items-center gap-2">
                <FileUp className="h-5 w-5 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
                <h2 className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn'
                    ? 'নতুন অফিশিয়াল সার্কুলার পিডিএফ আপলোড করুন'
                    : 'Upload Official Admission Circular PDF'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'প্রতিষ্ঠান নির্বাচন *' : 'Institution *'}
                  </label>
                  <select
                    value={institutionId}
                    onChange={(e) => setInstitutionId(Number(e.target.value))}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.id} value={inst.id}>
                        {inst.code} — {lang === 'bn' ? inst.nameBn : inst.nameEn}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'ভর্তি সেশন *' : 'Admission Session *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={session}
                    onChange={(e) => setSession(e.target.value)}
                    placeholder="2025-2026"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'সার্কুলারের শিরোনাম (ইংরেজি) *' : 'Circular Title (English) *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={titleEn}
                    onChange={(e) => setTitleEn(e.target.value)}
                    placeholder="e.g., Undergraduate CSE Admission Circular 2025-2026"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'সার্কুলারের শিরোনাম (বাংলা)' : 'Circular Title (Bangla)'}
                  </label>
                  <input
                    type="text"
                    value={titleBn}
                    onChange={(e) => setTitleBn(e.target.value)}
                    placeholder="স্নাতক ভর্তি বিজ্ঞপ্তি ২০২৫-২০২৬"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'অফিশিয়াল উৎস URL *' : 'Official Source URL *'}
                  </label>
                  <input
                    type="url"
                    required
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                    placeholder="https://admission.example.edu.bd"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'আবেদনের শেষ তারিখ' : 'Application Deadline'}
                  </label>
                  <input
                    type="date"
                    value={applicationDeadline}
                    onChange={(e) => setApplicationDeadline(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'অফিশিয়াল পিডিএফ ফাইল' : 'Official PDF File (optional if pasting text)'}
                  </label>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="block w-full text-xs text-[#475569] file:mr-3 file:rounded-lg file:border-0 file:bg-[#00796B] file:px-4 file:py-2 file:text-xs file:font-semibold file:text-white dark:text-[#94A3B8] dark:file:bg-[#26A69A] dark:file:text-[#050505]"
                  />
                  {pdfFilename && (
                    <p className="mt-1 text-[11px] font-medium text-[#2E7D32] dark:text-[#66BB6A]">
                      Attached: {pdfFilename}
                    </p>
                  )}
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn'
                      ? 'সার্কুলারের টেক্সট (এআই এক্সট্র্যাকশন ও পিডিএফ জেনারেটরের জন্য)'
                      : 'Circular Requirements Text (used by Gemini Extractor & PDF Builder)'}
                  </label>
                  <textarea
                    rows={3}
                    value={rawCircularText}
                    onChange={(e) => setRawCircularText(e.target.value)}
                    placeholder="e.g., Minimum SSC GPA 4.00 and HSC GPA 4.00 (combined 8.50). Science group only. Higher Math 3.50 required. Second timers allowed."
                    className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={busyAction === 'upload'}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
                >
                  <FileUp className="h-4 w-4" aria-hidden="true" />
                  {busyAction === 'upload'
                    ? lang === 'bn'
                      ? 'আপলোড হচ্ছে...'
                      : 'Uploading Draft...'
                    : lang === 'bn'
                    ? 'খসড়া হিসেবে আপলোড করুন'
                    : 'Upload Circular Draft'}
                </button>
              </div>
            </form>
          ) : (
            <div className="rounded-xl border border-[#F57C00]/35 bg-[#F57C00]/10 p-4 text-xs text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]">
              {lang === 'bn'
                ? 'নতুন সার্কুলার আপলোড ও এআই এক্সট্র্যাকশন শুধুমাত্র অনুমোদিত অ্যাডমিনদের জন্য সংরক্ষিত।'
                : 'Uploading circular PDFs and running Gemini extraction requires Admin or Super Admin authorization.'}
            </div>
          )}

          {editingCircularId && canUploadAndExtract && (
            <form
              onSubmit={handleSaveCircularMetadata}
              className="rounded-xl border border-[#00796B]/30 bg-[#F8FAFC] p-5 dark:border-[#26A69A]/35 dark:bg-[#0A0A0A] space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'সার্কুলারের তথ্য সম্পাদনা করুন' : 'Edit Admission Circular'}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingCircularId(null)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-white dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]"
                  aria-label="Close circular editor"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Circular Title (English) *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCircTitleEn}
                    onChange={(e) => setEditCircTitleEn(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Circular Title (Bangla)
                  </label>
                  <input
                    type="text"
                    value={editCircTitleBn}
                    onChange={(e) => setEditCircTitleBn(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Admission Session *
                  </label>
                  <input
                    type="text"
                    required
                    value={editCircSession}
                    onChange={(e) => setEditCircSession(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Application Deadline
                  </label>
                  <input
                    type="date"
                    value={editCircDeadline}
                    onChange={(e) => setEditCircDeadline(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Official Source URL *
                  </label>
                  <input
                    type="url"
                    required
                    value={editCircSourceUrl}
                    onChange={(e) => setEditCircSourceUrl(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Review Notes
                  </label>
                  <input
                    type="text"
                    value={editCircNotes}
                    onChange={(e) => setEditCircNotes(e.target.value)}
                    className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCircularId(null)}
                  className="h-9 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:bg-white dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={Boolean(busyAction)}
                  className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
                >
                  <Save className="h-3.5 w-3.5" aria-hidden="true" />
                  {lang === 'bn' ? 'আপডেট সংরক্ষণ করুন' : 'Save Circular Updates'}
                </button>
              </div>
            </form>
          )}

          {/* List of Uploaded Circulars */}
          <div className="space-y-3">
            {circulars.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                      {c.institution?.code ?? `#${c.institutionId}`}
                    </span>
                    <span
                      className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${
                        STATUS_BADGE[c.status]
                      }`}
                    >
                      {c.status.replace('_', ' ')}
                    </span>
                    <span className="font-mono text-[#475569] dark:text-[#94A3B8]">v{c.version}</span>
                    <span className="text-[#475569] dark:text-[#94A3B8]">{c.session}</span>
                  </div>
                  <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? c.titleBn : c.titleEn}
                  </h3>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? `নিয়ম সংখ্যা: ${c.rules.length}`
                      : `Rules attached: ${c.rules.length}`}
                    {c.pdfFilename ? ` · ${c.pdfFilename}` : ''}
                    {c.updatedBy ? ` · Updated by ${c.updatedBy}` : ''}
                  </p>
                </div>

                {canUploadAndExtract && (
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditingCircular(c)}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                    >
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                    </button>
                    <button
                      type="button"
                      disabled={busyAction === `extract-${c.id}`}
                      onClick={() => void handleExtractWithGemini(c.id)}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#00796B] px-3 text-xs font-semibold text-[#00796B] hover:bg-[#00796B]/10 disabled:opacity-60 dark:border-[#26A69A] dark:text-[#26A69A] dark:hover:bg-[#26A69A]/12"
                    >
                      <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                      {busyAction === `extract-${c.id}`
                        ? lang === 'bn'
                          ? 'এক্সট্র্যাক্ট হচ্ছে...'
                          : 'Extracting...'
                        : lang === 'bn'
                        ? 'Gemini দিয়ে নিয়ম বের করুন'
                        : 'Extract Rules with Gemini'}
                    </button>
                    {c.status !== 'published' && (
                      <button
                        type="button"
                        onClick={() => void handleTransitionWorkflow(c.id, 'published')}
                        className="inline-flex h-9 items-center rounded-lg bg-[#388E3C] px-3 text-xs font-semibold text-white hover:bg-[#2E7D32] dark:bg-[#66BB6A] dark:text-[#050505] dark:hover:bg-[#81C784]"
                      >
                        {lang === 'bn' ? 'প্রকাশ করুন' : 'Approve & Publish'}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Mode 2: Side-by-Side PDF AI Verification Workspace */}
      {mode === 'verification' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-4 dark:border-[#222222] dark:bg-[#121212] flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#475569] dark:text-[#94A3B8] mr-2">
              <FileSearch className="h-4 w-4 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
              {lang === 'bn' ? 'সার্কুলার নির্বাচন:' : 'Select Circular:'}
            </span>
            {circulars.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedCircularId(c.id)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  selectedCircularId === c.id
                    ? 'border-[#00796B] bg-[#00796B] text-white dark:border-[#26A69A] dark:bg-[#26A69A] dark:text-[#050505]'
                    : 'border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] hover:bg-white dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]'
                }`}
              >
                {c.institution?.code ?? `#${c.institutionId}`} · {c.status.replace('_', ' ')}
              </button>
            ))}
          </div>

          {selectedCircular && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              {/* Left Pane: Official PDF Browser Viewer */}
              <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-4 dark:border-[#222222] dark:bg-[#121212] space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? selectedCircular.titleBn : selectedCircular.titleEn}
                    </h3>
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      {selectedCircular.session} · {selectedCircular.sourceUrl}
                    </p>
                  </div>
                  <span
                    className={`rounded-md border px-2.5 py-1 text-[11px] font-bold uppercase whitespace-nowrap shrink-0 ${
                      STATUS_BADGE[selectedCircular.status]
                    }`}
                  >
                    {selectedCircular.status.replace('_', ' ')} · v{selectedCircular.version}
                  </span>
                </div>

                {selectedCircular.rawCircularText && (
                  <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-xs leading-relaxed text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
                    <p className="mb-1 text-[11px] font-bold uppercase tracking-wide text-[#475569] dark:text-[#94A3B8]">
                      {lang === 'bn' ? 'সার্কুলারের মূল পাঠ্য' : 'Official Circular Text'}
                    </p>
                    <p>{selectedCircular.rawCircularText}</p>
                  </div>
                )}

                <div className="overflow-hidden rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A]">
                  <iframe
                    title={`${selectedCircular.titleEn} PDF`}
                    src={withAuthTokenUrl(selectedCircular.pdfUrl)}
                    className="h-[460px] w-full"
                  />
                </div>
              </section>

              {/* Right Pane: Extracted Admission Rules Editor & Verification Controls */}
              <section className="lg:col-span-6 rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn'
                      ? 'এআই-এক্সট্র্যাক্টকৃত নীতিমালা সম্পাদনা ও অনুমোদন'
                      : 'Extracted Rule Editor & Verification'}
                  </h3>
                  {selectedCircular.rules.length > 1 && editingRule && (
                    <select
                      value={editingRule.id}
                      onChange={(e) => {
                        const found = selectedCircular.rules.find(
                          (r) => r.id === Number(e.target.value)
                        );
                        if (found) {
                          setEditingRule({ ...found });
                          setSubjectJsonText(
                            JSON.stringify(found.requiredSubjectMinGpa ?? {}, null, 2)
                          );
                        }
                      }}
                      className="h-8 rounded-md border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                    >
                      {selectedCircular.rules.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.programName}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {!editingRule ? (
                  <div className="rounded-lg border border-[#F57C00]/35 bg-[#F57C00]/10 p-4 text-xs text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726] space-y-3">
                    <p>
                      {lang === 'bn'
                        ? 'এই সার্কুলারে এখনো কোনো নীতিমালা যুক্ত হয়নি।'
                        : 'No structured rules extracted for this circular yet.'}
                    </p>
                    {canUploadAndExtract && (
                      <button
                        type="button"
                        onClick={() => void handleExtractWithGemini(selectedCircular.id)}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#00796B] px-3 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505]"
                      >
                        <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                        {lang === 'bn' ? 'Gemini দিয়ে নিয়ম বের করুন' : 'Extract Rules with Gemini'}
                      </button>
                    )}
                  </div>
                ) : (
                  <form onSubmit={handleSaveRuleEdits} className="space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Program / Unit Name
                      </label>
                      <input
                        type="text"
                        required
                        value={editingRule.programName}
                        onChange={(e) =>
                          setEditingRule({ ...editingRule, programName: e.target.value })
                        }
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Min SSC GPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="5"
                          value={editingRule.minSscGpa ?? ''}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              minSscGpa: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Min HSC GPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="1"
                          max="5"
                          value={editingRule.minHscGpa ?? ''}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              minHscGpa: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Combined GPA
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="2"
                          max="10"
                          value={editingRule.minCombinedGpa ?? ''}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              minCombinedGpa: e.target.value ? Number(e.target.value) : null,
                            })
                          }
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Allowed Groups (comma-separated)
                        </label>
                        <input
                          type="text"
                          value={editingRule.allowedGroups.join(', ')}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              allowedGroups: e.target.value
                                .split(',')
                                .map((s) => s.trim())
                                .filter(Boolean),
                            })
                          }
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Allowed HSC Years
                        </label>
                        <input
                          type="text"
                          value={editingRule.allowedHscYears.join(', ')}
                          onChange={(e) =>
                            setEditingRule({
                              ...editingRule,
                              allowedHscYears: e.target.value
                                .split(',')
                                .map((s) => Number(s.trim()))
                                .filter(Number.isInteger),
                            })
                          }
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-center">
                      <div>
                        <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                          Circular Page Reference
                        </label>
                        <input
                          type="text"
                          value={editingRule.pageReference ?? ''}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, pageReference: e.target.value })
                          }
                          placeholder="Page 1, Section 2"
                          className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                        />
                      </div>
                      <label className="flex items-center gap-2 pt-4 text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        <input
                          type="checkbox"
                          checked={editingRule.allowsSecondTimer}
                          onChange={(e) =>
                            setEditingRule({ ...editingRule, allowsSecondTimer: e.target.checked })
                          }
                          className="h-4 w-4 rounded border-[#E2E8F0] accent-[#00796B] dark:accent-[#26A69A]"
                        />
                        Allows Second Timer
                      </label>
                    </div>

                    <div>
                      <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        Required Subject Min GPA (JSON)
                      </label>
                      <textarea
                        rows={2}
                        value={subjectJsonText}
                        onChange={(e) => setSubjectJsonText(e.target.value)}
                        className="w-full rounded-lg border border-[#E2E8F0] bg-white p-2 font-mono text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={busyAction === 'save-rule'}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      {busyAction === 'save-rule'
                        ? lang === 'bn'
                          ? 'সংরক্ষণ হচ্ছে...'
                          : 'Saving...'
                        : lang === 'bn'
                        ? 'নিয়ম সংরক্ষণ করুন'
                        : 'Save Rule Edits'}
                    </button>
                  </form>
                )}

                {/* Workflow Transition & Reviewer Verification Actions */}
                <div className="border-t border-[#E2E8F0] dark:border-[#222222] pt-4 space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'রিভিউ নোট / মন্তব্য' : 'Verification / Review Notes'}
                    </label>
                    <input
                      type="text"
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      placeholder="Checked GPA & subject thresholds against official PDF..."
                      className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={Boolean(busyAction)}
                      onClick={() => void handleTransitionWorkflow(selectedCircular.id, 'draft')}
                      className="inline-flex h-9 items-center gap-1 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                    >
                      <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                      {lang === 'bn' ? 'খসড়ায় ফেরত পাঠান' : 'Return to Draft'}
                    </button>

                    <button
                      type="button"
                      disabled={Boolean(busyAction)}
                      onClick={() =>
                        void handleTransitionWorkflow(selectedCircular.id, 'under_review')
                      }
                      className="inline-flex h-9 items-center rounded-lg border border-[#F57C00]/35 bg-[#F57C00]/10 px-3 text-xs font-semibold text-[#E65100] hover:bg-[#F57C00]/20 dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]"
                    >
                      {lang === 'bn' ? 'রিভিউ পর্যায়ে রাখুন' : 'Mark Under Review'}
                    </button>

                    {canApprovePublish && (
                      <button
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() =>
                          void handleTransitionWorkflow(selectedCircular.id, 'published')
                        }
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#388E3C] px-4 text-xs font-semibold text-white hover:bg-[#2E7D32] dark:bg-[#66BB6A] dark:text-[#050505] dark:hover:bg-[#81C784]"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                        {lang === 'bn' ? 'যাচাই ও প্রকাশ করুন' : 'Approve & Publish'}
                      </button>
                    )}

                    {canArchive && (
                      <button
                        type="button"
                        disabled={Boolean(busyAction)}
                        onClick={() =>
                          void handleTransitionWorkflow(selectedCircular.id, 'archived')
                        }
                        className="inline-flex h-9 items-center rounded-lg border border-[#E2E8F0] bg-[#475569] px-3 text-xs font-semibold text-white hover:bg-[#334155] dark:border-[#222222] dark:bg-[#1E1E1E] dark:text-[#F8FAFC] dark:hover:bg-[#2A2A2A]"
                      >
                        {lang === 'bn' ? 'আর্কাইভ করুন' : 'Archive'}
                      </button>
                    )}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      )}

      {/* Mode 3: Publications & Versions Management */}
      {mode === 'publications' && (
        <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden dark:border-[#222222] dark:bg-[#121212]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
                <tr>
                  <th className="px-4 py-3 font-semibold">Institution & Circular</th>
                  <th className="px-4 py-3 font-semibold">Session</th>
                  <th className="px-4 py-3 font-semibold">Version</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
                {circulars.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E1E1E]/60">
                    <td className="px-4 py-3">
                      <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {c.institution?.code ?? `#${c.institutionId}`} —{' '}
                        {lang === 'bn' ? c.titleBn : c.titleEn}
                      </p>
                      {c.reviewNotes && (
                        <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                          {c.reviewNotes}
                        </p>
                      )}
                      {c.updatedBy && (
                        <p className="text-[11px] font-mono text-[#00796B] dark:text-[#26A69A]">
                          Updated by: {c.updatedBy}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-[#0F172A] dark:text-[#F8FAFC]">{c.session}</td>
                    <td className="px-4 py-3 font-mono text-[#0F172A] dark:text-[#F8FAFC]">v{c.version}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-semibold uppercase ${
                          STATUS_BADGE[c.status]
                        }`}
                      >
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                      {canApprovePublish && c.status !== 'published' && (
                        <button
                          type="button"
                          onClick={() => void handleTransitionWorkflow(c.id, 'published')}
                          className="rounded-md bg-[#388E3C] px-2.5 py-1 font-semibold text-white hover:bg-[#2E7D32] dark:bg-[#66BB6A] dark:text-[#050505]"
                        >
                          {lang === 'bn' ? 'প্রকাশ করুন' : 'Publish'}
                        </button>
                      )}
                      {canArchive && c.status === 'published' && (
                        <button
                          type="button"
                          onClick={() => void handleTransitionWorkflow(c.id, 'expired')}
                          className="rounded-md bg-[#F57C00] px-2.5 py-1 font-semibold text-white hover:bg-[#E65100] dark:bg-[#FFA726] dark:text-[#050505]"
                        >
                          {lang === 'bn' ? 'মেয়াদোত্তীর্ণ' : 'Mark Expired'}
                        </button>
                      )}
                      {canArchive && c.status !== 'archived' && (
                        <button
                          type="button"
                          onClick={() => void handleTransitionWorkflow(c.id, 'archived')}
                          className="rounded-md border border-[#E2E8F0] px-2.5 py-1 font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                        >
                          {lang === 'bn' ? 'আর্কাইভ' : 'Archive'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
