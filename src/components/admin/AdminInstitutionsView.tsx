import { useState, type FormEvent } from 'react';
import { Building2, ExternalLink, Pencil, Plus, Save, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type { AdmissionCategoryId, AdminRole, InstitutionRecord } from '../../types/domain';

interface AdminInstitutionsViewProps {
  institutions: InstitutionRecord[];
  adminRole: AdminRole;
  onRefresh: () => Promise<void>;
}

const INSTITUTION_TYPES: Array<{ en: string; bn: string }> = [
  { en: 'Public University', bn: 'পাবলিক বিশ্ববিদ্যালয়' },
  { en: 'Private University', bn: 'প্রাইভেট বিশ্ববিদ্যালয়' },
  { en: 'Medical College', bn: 'মেডিকেল কলেজ' },
  { en: 'Engineering University', bn: 'প্রকৌশল বিশ্ববিদ্যালয়' },
  { en: 'Agricultural University', bn: 'কৃষি বিশ্ববিদ্যালয়' },
  { en: 'Specialized University', bn: 'বিশেষায়িত বিশ্ববিদ্যালয়' },
  { en: 'Affiliated College', bn: 'অধিভুক্ত কলেজ' },
  { en: 'National University', bn: 'জাতীয় বিশ্ববিদ্যালয়' },
];

export function AdminInstitutionsView({
  institutions,
  adminRole,
  onRefresh,
}: AdminInstitutionsViewProps) {
  const { lang } = useLanguage();
  const canManage = adminRole === 'super_admin' || adminRole === 'admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [nameBn, setNameBn] = useState('');
  const [category, setCategory] = useState<AdmissionCategoryId>('public');
  const [institutionType, setInstitutionType] = useState('Public University');
  const [city, setCity] = useState('Dhaka');
  const [officialWebsite, setOfficialWebsite] = useState('https://');
  const [programsText, setProgramsText] = useState('B.Sc. in Computer Science, BBA');
  const [shortNoteEn, setShortNoteEn] = useState('');
  const [perCreditFeeBdt, setPerCreditFeeBdt] = useState('');
  const [totalCredits, setTotalCredits] = useState('');
  const [semesterFeeBdt, setSemesterFeeBdt] = useState('');
  const [admissionFeeBdt, setAdmissionFeeBdt] = useState('');

  // Inline Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNameEn, setEditNameEn] = useState('');
  const [editNameBn, setEditNameBn] = useState('');
  const [editCategory, setEditCategory] = useState<AdmissionCategoryId>('public');
  const [editType, setEditType] = useState('Public University');
  const [editCity, setEditCity] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editProgramsText, setEditProgramsText] = useState('');
  const [editShortNoteEn, setEditShortNoteEn] = useState('');
  const [editShortNoteBn, setEditShortNoteBn] = useState('');
  const [editPerCredit, setEditPerCredit] = useState('');
  const [editTotalCredits, setEditTotalCredits] = useState('');
  const [editSemesterFee, setEditSemesterFee] = useState('');
  const [editAdmissionFee, setEditAdmissionFee] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const filteredInstitutions = institutions.filter((inst) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      inst.code.toLowerCase().includes(q) ||
      inst.nameEn.toLowerCase().includes(q) ||
      inst.nameBn.toLowerCase().includes(q) ||
      inst.city.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const typeObj =
        INSTITUTION_TYPES.find((item) => item.en === institutionType) ?? INSTITUTION_TYPES[0];
      const programsEn = programsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await apiFetch('/api/admin/institutions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          nameEn,
          nameBn: nameBn || nameEn,
          category,
          institutionType: typeObj.en,
          institutionTypeBn: typeObj.bn,
          city,
          locationEn: `${city}, Bangladesh`,
          locationBn: city,
          officialWebsite,
          shortNoteEn: shortNoteEn || `${nameEn} undergraduate admission directory entry.`,
          shortNoteBn: `${nameBn || nameEn} স্নাতক ভর্তি তথ্য।`,
          programsEn,
          programsBn: programsEn,
          perCreditFeeBdt: category === 'private' && perCreditFeeBdt ? Number(perCreditFeeBdt) : null,
          totalCredits: category === 'private' && totalCredits ? Number(totalCredits) : null,
          semesterFeeBdt: category === 'private' && semesterFeeBdt ? Number(semesterFeeBdt) : null,
          admissionFeeBdt: category === 'private' && admissionFeeBdt ? Number(admissionFeeBdt) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add institution.');
      }

      setSuccess(
        lang === 'bn'
          ? `নতুন প্রতিষ্ঠান (${data.institution.code}) সফলভাবে যুক্ত হয়েছে।`
          : `Institution (${data.institution.code}) added to PostgreSQL.`
      );
      setCode('');
      setNameEn('');
      setNameBn('');
      setShortNoteEn('');
      setShowForm(false);
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to create institution.');
    } finally {
      setSaving(false);
    }
  };

  const startEditing = (inst: InstitutionRecord) => {
    setError(null);
    setSuccess(null);
    setEditingId(inst.id);
    setEditNameEn(inst.nameEn);
    setEditNameBn(inst.nameBn);
    setEditCategory(inst.category);
    setEditType(inst.institutionType);
    setEditCity(inst.city);
    setEditWebsite(inst.officialWebsite);
    setEditProgramsText(inst.programsEn.join(', '));
    setEditShortNoteEn(inst.shortNoteEn);
    setEditShortNoteBn(inst.shortNoteBn);
    setEditPerCredit(inst.perCreditFeeBdt ? String(inst.perCreditFeeBdt) : '');
    setEditTotalCredits(inst.totalCredits ? String(inst.totalCredits) : '');
    setEditSemesterFee(inst.semesterFeeBdt ? String(inst.semesterFeeBdt) : '');
    setEditAdmissionFee(inst.admissionFeeBdt ? String(inst.admissionFeeBdt) : '');
  };

  const handleSaveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      const typeObj =
        INSTITUTION_TYPES.find((item) => item.en === editType) ?? INSTITUTION_TYPES[0];
      const programsEn = editProgramsText
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await apiFetch(`/api/admin/institutions/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: editNameEn,
          nameBn: editNameBn || editNameEn,
          category: editCategory,
          institutionType: typeObj.en,
          institutionTypeBn: typeObj.bn,
          city: editCity,
          locationEn: `${editCity}, Bangladesh`,
          locationBn: editCity,
          officialWebsite: editWebsite,
          shortNoteEn: editShortNoteEn,
          shortNoteBn: editShortNoteBn,
          programsEn,
          programsBn: programsEn,
          perCreditFeeBdt: editCategory === 'private' && editPerCredit ? Number(editPerCredit) : null,
          totalCredits: editCategory === 'private' && editTotalCredits ? Number(editTotalCredits) : null,
          semesterFeeBdt: editCategory === 'private' && editSemesterFee ? Number(editSemesterFee) : null,
          admissionFeeBdt: editCategory === 'private' && editAdmissionFee ? Number(editAdmissionFee) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update institution.');
      }

      setSuccess(
        lang === 'bn'
          ? `${data.institution.code} প্রতিষ্ঠানের তথ্য হালনাগাদ হয়েছে।`
          : `Updated ${data.institution.code} (${data.institution.nameEn}).`
      );
      setEditingId(null);
      await onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to update institution.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
              {lang === 'bn' ? 'প্রতিষ্ঠান ও প্রোগ্রাম ব্যবস্থাপনা' : 'Institutions & Programs'}
            </h1>
            <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? 'সরকারি, বেসরকারি, মেডিকেল কলেজ, জিএসটি ও প্রকৌশল প্রতিষ্ঠানের তথ্য তৈরি ও হালনাগাদ করুন।'
                : 'Add or update accredited universities and medical colleges in PostgreSQL. Every update records admin attribution.'}
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] shrink-0 transition-colors"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              {showForm
                ? lang === 'bn'
                  ? 'ফর্ম বন্ধ করুন'
                  : 'Close Form'
                : lang === 'bn'
                ? 'নতুন প্রতিষ্ঠান যুক্ত করুন'
                : 'Add Institution'}
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              lang === 'bn'
                ? 'কোড, নাম বা শহর দিয়ে খুঁজুন (যেমন DU, BUET, NSU)...'
                : 'Search institutions by code, name, or city (e.g., DU, BUET, NSU)...'
            }
            className="h-10 w-full max-w-md rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
          />
          <span className="text-xs font-mono tabular-nums text-[#475569] dark:text-[#94A3B8]">
            {filteredInstitutions.length} / {institutions.length}
          </span>
        </div>

        {error && (
          <div className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-4 py-3 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-4 py-3 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]">
            {success}
          </div>
        )}

        {showForm && canManage && (
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-5 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-4"
          >
            <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {lang === 'bn' ? 'নতুন প্রতিষ্ঠানের তথ্য দিন' : 'Register New Institution'}
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'প্রতিষ্ঠান কোড *' : 'Short Code *'}
                </label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g., BRACU or NSU"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (ইংরেজি) *' : 'Name (English) *'}
                </label>
                <input
                  type="text"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder="e.g., North South University"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'প্রতিষ্ঠানের নাম (বাংলা)' : 'Name (Bangla)'}
                </label>
                <input
                  type="text"
                  value={nameBn}
                  onChange={(e) => setNameBn(e.target.value)}
                  placeholder="নর্থ সাউথ ইউনিভার্সিটি"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'ভর্তি ক্যাটাগরি' : 'Admission Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as AdmissionCategoryId)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                >
                  <option value="public">Public University</option>
                  <option value="private">Private University</option>
                  <option value="medical">Medical College</option>
                  <option value="gst">GST / Guccho</option>
                  <option value="engineering">Engineering</option>
                  <option value="national">National University</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'প্রতিষ্ঠানের ধরন' : 'Institution Type'}
                </label>
                <select
                  value={institutionType}
                  onChange={(e) => setInstitutionType(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                >
                  {INSTITUTION_TYPES.map((item) => (
                    <option key={item.en} value={item.en}>
                      {lang === 'bn' ? item.bn : item.en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'শহর' : 'City'}
                </label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'প্রোগ্রামসমূহ (কমা দিয়ে)' : 'Programs (comma-separated)'}
                </label>
                <input
                  type="text"
                  value={programsText}
                  onChange={(e) => setProgramsText(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'অফিশিয়াল ওয়েবসাইট' : 'Official Website'}
                </label>
                <input
                  type="url"
                  value={officialWebsite}
                  onChange={(e) => setOfficialWebsite(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'সংক্ষিপ্ত বর্ণনা' : 'Short Summary'}
                </label>
                <input
                  type="text"
                  value={shortNoteEn}
                  onChange={(e) => setShortNoteEn(e.target.value)}
                  placeholder="Undergraduate programs and official admission pathway..."
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                />
              </div>
            </div>

            {category === 'private' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 border-t border-[#E2E8F0] dark:border-[#222222] pt-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Per-Credit Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={perCreditFeeBdt}
                    onChange={(e) => setPerCreditFeeBdt(e.target.value)}
                    placeholder="5500"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Total Credits
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={totalCredits}
                    onChange={(e) => setTotalCredits(e.target.value)}
                    placeholder="130"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Semester Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={semesterFeeBdt}
                    onChange={(e) => setSemesterFeeBdt(e.target.value)}
                    placeholder="16000"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Admission Fee (BDT)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={admissionFeeBdt}
                    onChange={(e) => setAdmissionFeeBdt(e.target.value)}
                    placeholder="25000"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="h-10 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
              >
                {saving
                  ? lang === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving...'
                  : lang === 'bn'
                  ? 'ডেটাবেসে সংরক্ষণ করুন'
                  : 'Save Institution'}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filteredInstitutions.map((inst) => {
          const isEditing = editingId === inst.id;
          return (
            <article
              key={inst.id}
              className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] flex flex-col justify-between gap-4"
            >
              {isEditing ? (
                <form onSubmit={handleSaveEdit} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#00796B] dark:text-[#26A69A]">
                      {lang === 'bn' ? `সম্পাদনা: ${inst.code}` : `Editing ${inst.code}`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#1E1E1E]"
                      aria-label="Cancel edit"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'নাম (ইংরেজি)' : 'Name (English)'}
                      </label>
                      <input
                        type="text"
                        required
                        value={editNameEn}
                        onChange={(e) => setEditNameEn(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'নাম (বাংলা)' : 'Name (Bangla)'}
                      </label>
                      <input
                        type="text"
                        value={editNameBn}
                        onChange={(e) => setEditNameBn(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                      </label>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as AdmissionCategoryId)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      >
                        <option value="public">Public University</option>
                        <option value="private">Private University</option>
                        <option value="medical">Medical College</option>
                        <option value="gst">GST / Guccho</option>
                        <option value="engineering">Engineering</option>
                        <option value="national">National University</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'শহর' : 'City'}
                      </label>
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'অফিশিয়াল ওয়েবসাইট' : 'Official Website'}
                      </label>
                      <input
                        type="url"
                        value={editWebsite}
                        onChange={(e) => setEditWebsite(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'প্রোগ্রামসমূহ (কমা দিয়ে)' : 'Programs (comma-separated)'}
                      </label>
                      <input
                        type="text"
                        value={editProgramsText}
                        onChange={(e) => setEditProgramsText(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-1 block text-[11px] font-semibold text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'সংক্ষিপ্ত তথ্য (ইংরেজি)' : 'Summary Note (EN)'}
                      </label>
                      <input
                        type="text"
                        value={editShortNoteEn}
                        onChange={(e) => setEditShortNoteEn(e.target.value)}
                        className="h-9 w-full rounded-lg border border-[#E2E8F0] bg-white px-2.5 text-xs text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                  </div>

                  {editCategory === 'private' && (
                    <div className="grid grid-cols-2 gap-2 border-t border-[#E2E8F0] dark:border-[#222222] pt-2">
                      <input
                        type="number"
                        min="0"
                        value={editPerCredit}
                        onChange={(e) => setEditPerCredit(e.target.value)}
                        placeholder="Per-Credit BDT"
                        className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                      <input
                        type="number"
                        min="0"
                        value={editTotalCredits}
                        onChange={(e) => setEditTotalCredits(e.target.value)}
                        placeholder="Total Credits"
                        className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                      <input
                        type="number"
                        min="0"
                        value={editSemesterFee}
                        onChange={(e) => setEditSemesterFee(e.target.value)}
                        placeholder="Semester Fee"
                        className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                      <input
                        type="number"
                        min="0"
                        value={editAdmissionFee}
                        onChange={(e) => setEditAdmissionFee(e.target.value)}
                        placeholder="Admission Fee"
                        className="h-8 rounded-lg border border-[#E2E8F0] bg-white px-2 text-xs font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="h-9 rounded-lg border border-[#E2E8F0] px-3 text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                    >
                      {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#00796B] px-3.5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
                    >
                      <Save className="h-3.5 w-3.5" aria-hidden="true" />
                      {saving
                        ? lang === 'bn'
                          ? 'সংরক্ষণ হচ্ছে...'
                          : 'Saving...'
                        : lang === 'bn'
                        ? 'আপডেট সংরক্ষণ করুন'
                        : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                        <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                          {inst.code}
                        </span>
                        <span>·</span>
                        <span>{lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}</span>
                        <span>·</span>
                        <span>{inst.city}</span>
                      </div>
                      <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {lang === 'bn' ? inst.nameBn : inst.nameEn}
                      </h3>
                      <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? inst.shortNoteBn : inst.shortNoteEn}
                      </p>
                    </div>
                    <Building2 className="h-5 w-5 text-[#94A3B8] shrink-0" aria-hidden="true" />
                  </div>

                  {inst.estimatedTotalCostBdt && (
                    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] flex items-center justify-between">
                      <span>{lang === 'bn' ? 'আনুমানিক মোট খরচ:' : 'Est. Total Cost:'}</span>
                      <span className="font-mono font-bold tabular-nums text-[#0F172A] dark:text-[#26A69A]">
                        ৳ {inst.estimatedTotalCostBdt.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {inst.updatedBy && (
                    <div className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                      <span className="font-semibold">
                        {lang === 'bn' ? 'সর্বশেষ হালনাগাদ:' : 'Last updated by:'}
                      </span>{' '}
                      <span className="font-mono text-[#00796B] dark:text-[#26A69A]">
                        {inst.updatedBy}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 border-t border-[#E2E8F0] pt-3 dark:border-[#222222] text-xs">
                    <span className="text-[#475569] dark:text-[#94A3B8] truncate">
                      {inst.programsEn.slice(0, 3).join(' · ')}
                    </span>
                    <div className="flex items-center gap-3 shrink-0">
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => startEditing(inst)}
                          className="inline-flex h-8 items-center gap-1 rounded-md border border-[#E2E8F0] px-2.5 font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:bg-[#1E1E1E]"
                        >
                          <Pencil className="h-3 w-3" aria-hidden="true" />
                          {lang === 'bn' ? 'সম্পাদনা' : 'Edit'}
                        </button>
                      )}
                      <a
                        href={inst.officialWebsite}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline shrink-0"
                      >
                        {lang === 'bn' ? 'ওয়েবসাইট' : 'Website'}
                        <ExternalLink className="h-3 w-3" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}
