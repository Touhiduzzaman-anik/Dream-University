import { useState, type FormEvent } from 'react';
import { Award, ExternalLink, Pencil, Save, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type { UniversityRankingEntry } from '../../data/universityRankings';
import type { AdminRole } from '../../types/domain';

export interface AdminRankingRecord extends UniversityRankingEntry {
  updatedBy?: string | null;
}

interface AdminRankingsViewProps {
  rankings: AdminRankingRecord[];
  adminRole: AdminRole;
  onRefresh: () => Promise<void>;
}

export function AdminRankingsView({
  rankings,
  adminRole,
  onRefresh,
}: AdminRankingsViewProps) {
  const { lang } = useLanguage();
  const canEdit = adminRole === 'super_admin' || adminRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [qsGlobal2026, setQsGlobal2026] = useState('');
  const [theGlobal2026, setTheGlobal2026] = useState('');
  const [qsRankScore, setQsRankScore] = useState('');
  const [theRankScore, setTheRankScore] = useState('');
  const [qsAsiaRankScore, setQsAsiaRankScore] = useState('');
  const [bangladeshStandingEn, setBangladeshStandingEn] = useState('');
  const [bangladeshStandingBn, setBangladeshStandingBn] = useState('');
  const [sourceCitation, setSourceCitation] = useState('');
  const [citationYear, setCitationYear] = useState('2026');
  const [sourceUrl, setSourceUrl] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const filtered = rankings.filter((r) => {
    if (categoryFilter !== 'all' && r.category !== categoryFilter) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      r.code.toLowerCase().includes(q) ||
      r.nameEn.toLowerCase().includes(q) ||
      r.nameBn.toLowerCase().includes(q) ||
      r.bangladeshStandingEn.toLowerCase().includes(q)
    );
  });

  const startEdit = (entry: AdminRankingRecord) => {
    setFeedback(null);
    setEditingCode(entry.code);
    setQsGlobal2026(entry.qsGlobal2026 === '—' ? 'N/R' : entry.qsGlobal2026);
    setTheGlobal2026(entry.theGlobal2026 === '—' ? 'N/R' : entry.theGlobal2026);
    const qsNumericMatch = entry.qsGlobal2026.match(/\d+/);
    const theNumericMatch = entry.theGlobal2026.match(/\d+/);
    setQsRankScore(qsNumericMatch ? qsNumericMatch[0] : '');
    setTheRankScore(theNumericMatch ? theNumericMatch[0] : '');
    setQsAsiaRankScore('');
    setBangladeshStandingEn(entry.bangladeshStandingEn);
    setBangladeshStandingBn(entry.bangladeshStandingBn);
    setSourceCitation(entry.sourceCitation);
    setCitationYear(String(entry.citationYear || 2026));
    setSourceUrl(entry.sourceUrl);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingCode) return;
    setFeedback(null);
    setSaving(true);
    try {
      const res = await apiFetch(`/api/admin/rankings/${encodeURIComponent(editingCode)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          qsGlobal2026,
          theGlobal2026,
          qsRankScore: qsRankScore ? Number(qsRankScore) : null,
          theRankScore: theRankScore ? Number(theRankScore) : null,
          qsAsiaRankScore: qsAsiaRankScore ? Number(qsAsiaRankScore) : null,
          bangladeshStandingEn,
          bangladeshStandingBn: bangladeshStandingBn || bangladeshStandingEn,
          sourceCitation,
          citationYear: citationYear ? Number(citationYear) : 2026,
          sourceUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update university ranking.');
      }

      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `${editingCode} এর র‍্যাঙ্কিং তথ্য সফলভাবে হালনাগাদ হয়েছে (${data.ranking.updatedBy || 'Admin'})।`
            : `Updated ranking for ${editingCode} (${data.ranking.updatedBy || 'Admin'}).`,
      });
      setEditingCode(null);
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save ranking update.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex items-start gap-3">
          <Award className="mt-1 h-5 w-5 text-[#00796B] dark:text-[#26A69A] shrink-0" aria-hidden="true" />
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {lang === 'bn' ? 'বিশ্ববিদ্যালয় র‍্যাঙ্কিং ব্যবস্থাপনা' : 'University Rankings Management'}
            </h1>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? 'QS, THE এবং জাতীয় পর্যায়ের অবস্থান ও উৎস হালনাগাদ করুন। প্রতিটি পরিবর্তনে অ্যাডমিনের নাম সংরক্ষিত থাকবে।'
                : 'Update QS WUR 2026, THE WUR 2026, Bangladesh standing, and official ranking citations. Persisted to PostgreSQL with admin attribution.'}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                lang === 'bn'
                  ? 'কোড বা বিশ্ববিদ্যালয়ের নাম লিখুন...'
                  : 'Filter by code or university name...'
              }
              className="h-10 w-64 rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
            />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
            >
              <option value="all">{lang === 'bn' ? 'সব ক্যাটাগরি' : 'All Categories'}</option>
              <option value="public">Public</option>
              <option value="engineering">Engineering</option>
              <option value="medical">Medical</option>
              <option value="gst">GST</option>
              <option value="private">Private</option>
            </select>
          </div>
          <span className="text-xs font-mono tabular-nums text-[#475569] dark:text-[#94A3B8]">
            {filtered.length} {lang === 'bn' ? 'টি প্রতিষ্ঠান' : 'institutions'}
          </span>
        </div>

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

        {editingCode && canEdit && (
          <form
            onSubmit={handleSave}
            className="rounded-xl border border-[#00796B]/30 bg-[#F8FAFC] p-5 dark:border-[#26A69A]/35 dark:bg-[#0A0A0A] space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn'
                  ? `র‍্যাঙ্কিং সম্পাদনা — ${editingCode}`
                  : `Update Ranking Entry — ${editingCode}`}
              </h3>
              <button
                type="button"
                onClick={() => setEditingCode(null)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-white dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]"
                aria-label="Close ranking editor"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  QS Global 2026
                </label>
                <input
                  type="text"
                  required
                  value={qsGlobal2026}
                  onChange={(e) => setQsGlobal2026(e.target.value)}
                  placeholder="#584 or N/R"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  THE Global 2026
                </label>
                <input
                  type="text"
                  required
                  value={theGlobal2026}
                  onChange={(e) => setTheGlobal2026(e.target.value)}
                  placeholder="801–1000 or N/R"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  QS Numeric Sort Score
                </label>
                <input
                  type="number"
                  min="1"
                  value={qsRankScore}
                  onChange={(e) => setQsRankScore(e.target.value)}
                  placeholder="Optional (e.g. 584)"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  THE Numeric Sort Score
                </label>
                <input
                  type="number"
                  min="1"
                  value={theRankScore}
                  onChange={(e) => setTheRankScore(e.target.value)}
                  placeholder="Optional (e.g. 801)"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Bangladesh Standing (English) *
                </label>
                <input
                  type="text"
                  required
                  value={bangladeshStandingEn}
                  onChange={(e) => setBangladeshStandingEn(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Bangladesh Standing (Bangla)
                </label>
                <input
                  type="text"
                  value={bangladeshStandingBn}
                  onChange={(e) => setBangladeshStandingBn(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Source Citation *
                </label>
                <input
                  type="text"
                  required
                  value={sourceCitation}
                  onChange={(e) => setSourceCitation(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Citation Year
                </label>
                <input
                  type="number"
                  min="2020"
                  max="2035"
                  value={citationYear}
                  onChange={(e) => setCitationYear(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Official Source URL *
                </label>
                <input
                  type="url"
                  required
                  value={sourceUrl}
                  onChange={(e) => setSourceUrl(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingCode(null)}
                className="h-10 rounded-lg border border-[#E2E8F0] px-4 text-xs font-semibold text-[#0F172A] hover:bg-white dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving
                  ? lang === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving...'
                  : lang === 'bn'
                  ? 'র‍্যাঙ্কিং সংরক্ষণ করুন'
                  : 'Save Ranking'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden dark:border-[#222222] dark:bg-[#121212]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8]">
              <tr>
                <th className="px-4 py-3 font-semibold">#</th>
                <th className="px-4 py-3 font-semibold">Institution</th>
                <th className="px-4 py-3 font-semibold">QS 2026</th>
                <th className="px-4 py-3 font-semibold">THE 2026</th>
                <th className="px-4 py-3 font-semibold">Standing & Attribution</th>
                <th className="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#222222]">
              {filtered.map((entry, idx) => (
                <tr key={entry.code} className="hover:bg-[#F8FAFC] dark:hover:bg-[#1E1E1E]/60">
                  <td className="px-4 py-3 font-mono tabular-nums text-[#475569] dark:text-[#94A3B8]">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                        {entry.code}
                      </span>
                      <span className="uppercase text-[10px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {entry.category}
                      </span>
                    </div>
                    <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? entry.nameBn : entry.nameEn}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {entry.qsGlobal2026}
                  </td>
                  <td className="px-4 py-3 font-mono tabular-nums font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {entry.theGlobal2026}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <p className="text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? entry.bangladeshStandingBn : entry.bangladeshStandingEn}
                    </p>
                    <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      {entry.sourceCitation} ({entry.citationYear})
                    </p>
                    {entry.updatedBy && (
                      <p className="mt-0.5 text-[11px] font-mono text-[#00796B] dark:text-[#26A69A]">
                        Updated by: {entry.updatedBy}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => startEdit(entry)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] px-2.5 font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </button>
                      )}
                      <a
                        href={entry.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#E2E8F0] text-[#475569] hover:text-[#00796B] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:text-[#26A69A]"
                        aria-label={`Open ranking source for ${entry.code}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
