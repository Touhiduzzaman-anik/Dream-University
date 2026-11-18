import { useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  Pencil,
  Save,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { apiFetch } from '../../lib/authFetch';
import type { AuthUser, StudentProfileRecord } from '../../types/domain';
import {
  formatCompactAcademicSummary,
  getUserInitials,
} from '../../utils/academicProfileSync';
import { validateAvatarFileMeta } from '../../utils/avatarValidation';
import {
  BangladeshAcademicForm,
  buildValidatedAcademicPayload,
  createInitialAcademicFormValue,
  type BangladeshAcademicFormValue,
} from '../academic/BangladeshAcademicForm';

interface StudentProfileFormProps {
  onSaved?: () => void;
}

export function StudentProfileForm({ onSaved }: StudentProfileFormProps) {
  const { lang } = useLanguage();
  const { user, profile, setUser, setProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Unified Edit Modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [avatarDraft, setAvatarDraft] = useState<string | null | undefined>(undefined);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [collegeName, setCollegeName] = useState(profile?.collegeName || '');
  const [academicForm, setAcademicForm] = useState<BangladeshAcademicFormValue>(() =>
    createInitialAcademicFormValue(profile)
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!editModalOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) {
        setEditModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [editModalOpen, saving]);

  const openEditModal = () => {
    setFullName(user?.fullName || '');
    setPhone(user?.phone || '');
    setCollegeName(profile?.collegeName || '');
    setAcademicForm(createInitialAcademicFormValue(profile));
    setAvatarDraft(undefined);
    setAvatarError(null);
    setError(null);
    setEditModalOpen(true);
  };

  const modalPreviewAvatar =
    avatarDraft !== undefined ? avatarDraft : (user?.avatarUrl ?? null);

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAvatarError(null);
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    const validation = validateAvatarFileMeta(file);
    if (validation.ok === false) {
      setAvatarError(validation.error);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarDraft(reader.result);
      } else {
        setAvatarError(
          lang === 'bn'
            ? 'নির্বাচিত ছবির ফাইল পড়া যায়নি।'
            : 'Unable to read the selected image file.'
        );
      }
    };
    reader.onerror = () => {
      setAvatarError(
        lang === 'bn'
          ? 'নির্বাচিত ছবির ফাইল পড়া ব্যর্থ হয়েছে।'
          : 'Failed to read the selected image file.'
      );
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfileModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSavedNotice(null);

    const validated = buildValidatedAcademicPayload(academicForm);
    if (validated.ok === false) {
      setError(validated.error);
      return;
    }

    setSaving(true);
    try {
      const payloadBody: Record<string, unknown> = {
        fullName,
        phone,
        collegeName,
        ...validated.payload,
        preferredSubject: profile?.preferredSubject ?? '',
        preferredCity: profile?.preferredCity ?? '',
        tuitionBudgetBdt: profile?.tuitionBudgetBdt ?? '',
      };
      if (avatarDraft !== undefined) {
        payloadBody.avatarUrl = avatarDraft;
      }

      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadBody),
      });

      const data = (await res.json()) as {
        error?: string;
        user?: AuthUser;
        profile?: StudentProfileRecord;
      };
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save profile.');
      }

      if (data.user) setUser(data.user);
      if (data.profile) setProfile(data.profile);

      setAvatarDraft(undefined);
      setEditModalOpen(false);
      setSavedNotice(
        lang === 'bn'
          ? 'প্রোফাইল সফলভাবে আপডেট করা হয়েছে।'
          : 'Profile updated successfully.'
      );
      onSaved?.();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unable to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const emptyLabel = lang === 'bn' ? 'এখনো যোগ করা হয়নি' : 'Not added yet';
  const academicSummary = formatCompactAcademicSummary(profile, lang);

  const profileRows = [
    {
      key: 'fullName',
      label: lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name',
      value: user?.fullName?.trim() || emptyLabel,
      tabular: false,
    },
    {
      key: 'email',
      label: lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address',
      value: user?.email?.trim() || emptyLabel,
      tabular: false,
    },
    {
      key: 'phone',
      label: lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number',
      value: user?.phone?.trim() || emptyLabel,
      tabular: true,
    },
    {
      key: 'college',
      label: lang === 'bn' ? 'কলেজ / প্রতিষ্ঠান' : 'College / Institution',
      value: profile?.collegeName?.trim() || emptyLabel,
      tabular: false,
    },
    {
      key: 'academic',
      label: lang === 'bn' ? 'এসএসসি ও এইচএসসি সারসংক্ষেপ' : 'SSC & HSC Summary',
      value: academicSummary,
      tabular: true,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-xl py-2 sm:py-4">
      {savedNotice && (
        <div
          role="status"
          className="mb-4 flex items-center gap-2 rounded-xl border border-[#388E3C]/35 bg-[#388E3C]/10 px-4 py-3 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Single Clean Centered Profile Card */}
      <section className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-xs dark:border-[#222222] dark:bg-[#121212]">
        {/* Top: Centered Profile Photo */}
        <div className="flex flex-col items-center pb-6">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-[#E2E8F0] bg-[#00796B] text-2xl font-bold text-white shadow-xs dark:border-[#222222] dark:bg-[#26A69A] dark:text-[#050505]">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName || 'Student profile avatar'}
                referrerPolicy="no-referrer"
                className="h-full w-full object-cover"
              />
            ) : (
              <span>{getUserInitials(user?.fullName || 'Student')}</span>
            )}
          </div>
        </div>

        {/* Middle: Clean Vertical List (One Serial Column) */}
        <dl className="divide-y divide-[#E2E8F0] border-y border-[#E2E8F0] dark:divide-[#222222] dark:border-[#222222]">
          {profileRows.map((row) => (
            <div key={row.key} className="py-3.5">
              <dt className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                {row.label}
              </dt>
              <dd
                className={`mt-1 text-sm font-semibold text-[#0F172A] dark:text-[#F8FAFC] break-words ${
                  row.tabular ? 'tabular-nums' : ''
                }`}
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>

        {/* Bottom: Single Unified "Edit Profile" Button */}
        <div className="pt-6">
          <button
            type="button"
            onClick={openEditModal}
            className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#00796B] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#00695C] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00796B] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
          >
            <Pencil className="h-4 w-4" aria-hidden="true" />
            <span>{lang === 'bn' ? 'প্রোফাইল এডিট করুন' : 'Edit Profile'}</span>
          </button>
        </div>
      </section>

      {/* Unified Edit Profile Modal (Photo + Personal + SSC/HSC Academic Info) */}
      {editModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-profile-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs"
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#222222] dark:bg-[#121212]">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-[#E2E8F0] bg-white px-6 py-4 dark:border-[#222222] dark:bg-[#121212]">
              <div>
                <h2
                  id="edit-profile-modal-title"
                  className="font-display text-xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {lang === 'bn' ? 'প্রোফাইল এডিট করুন' : 'Edit Profile'}
                </h2>
                <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'ছবি, ব্যক্তিগত তথ্য এবং এসএসসি/এইচএসসি ফলাফল একসাথে আপডেট করুন।'
                    : 'Update your profile photo, personal details, and SSC/HSC academic credentials.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => !saving && setEditModalOpen(false)}
                aria-label="Close edit profile modal"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:border-[#00796B] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:border-[#26A69A]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSaveProfileModal} className="p-6 space-y-6">
              {/* Profile Photo Upload / Preview / Remove */}
              <div className="flex flex-col gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 sm:flex-row sm:items-center dark:border-[#222222] dark:bg-[#0A0A0A]">
                <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 border-[#E2E8F0] bg-[#00796B] text-xl font-bold text-white dark:border-[#222222] dark:bg-[#26A69A] dark:text-[#050505] shrink-0">
                  {modalPreviewAvatar ? (
                    <img
                      src={modalPreviewAvatar}
                      alt={fullName || 'Profile photo preview'}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{getUserInitials(fullName || user?.fullName || 'Student')}</span>
                  )}
                </div>

                <div className="space-y-2 min-w-0">
                  <p className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'প্রোফাইল ছবি' : 'Profile Photo'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors"
                    >
                      <Upload className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>
                        {modalPreviewAvatar
                          ? lang === 'bn'
                            ? 'ছবি পরিবর্তন'
                            : 'Change Photo'
                          : lang === 'bn'
                          ? 'ছবি আপলোড'
                          : 'Upload Photo'}
                      </span>
                    </button>

                    {modalPreviewAvatar && (
                      <button
                        type="button"
                        onClick={() => {
                          setAvatarDraft(null);
                          setAvatarError(null);
                        }}
                        className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#D32F2F]/35 bg-white px-3 text-xs font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/10 dark:border-[#FF4D4D]/40 dark:bg-[#121212] dark:text-[#FF4D4D] dark:hover:bg-[#FF4D4D]/12 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{lang === 'bn' ? 'ছবি সরান' : 'Remove Photo'}</span>
                      </button>
                    )}

                    <input
                      ref={fileInputRef}
                      id="edit-prof-avatar-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarFileChange}
                      className="sr-only"
                    />
                  </div>
                  <p className="text-[11px] text-[#475569] dark:text-[#94A3B8]">
                    JPG, PNG, WebP · Max 2MB
                  </p>
                  {avatarError && (
                    <p role="alert" className="text-xs font-medium text-[#D32F2F] dark:text-[#FF4D4D]">
                      {avatarError}
                    </p>
                  )}
                </div>
              </div>

              {/* Personal Info Fields */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label
                    htmlFor="edit-prof-name"
                    className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    {lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'}
                  </label>
                  <input
                    id="edit-prof-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-prof-phone"
                    className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    {lang === 'bn' ? 'ফোন নম্বর' : 'Phone Number'}
                  </label>
                  <input
                    id="edit-prof-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="017XXXXXXXX"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
                <div>
                  <label
                    htmlFor="edit-prof-college"
                    className="mb-1 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    {lang === 'bn' ? 'কলেজ / প্রতিষ্ঠান' : 'College / Institution'}
                  </label>
                  <input
                    id="edit-prof-college"
                    type="text"
                    value={collegeName}
                    onChange={(e) => setCollegeName(e.target.value)}
                    placeholder="e.g., Notre Dame College, Dhaka"
                    className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                  />
                </div>
              </div>

              {/* SSC & HSC Academic Info */}
              <div className="border-t border-[#E2E8F0] pt-4 dark:border-[#222222]">
                <BangladeshAcademicForm
                  idPrefix="edit-prof"
                  value={academicForm}
                  onChange={setAcademicForm}
                />
              </div>

              {error && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-4 py-2.5 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
                >
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 border-t border-[#E2E8F0] pt-4 dark:border-[#222222]">
                <button
                  type="button"
                  onClick={() => setEditModalOpen(false)}
                  disabled={saving}
                  className="inline-flex h-10 items-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#475569] hover:border-[#00796B] hover:text-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:hover:border-[#26A69A] dark:hover:text-[#F8FAFC]"
                >
                  {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
                >
                  <Save className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {saving
                      ? lang === 'bn'
                        ? 'সংরক্ষণ হচ্ছে...'
                        : 'Saving...'
                      : lang === 'bn'
                      ? 'পরিবর্তন সংরক্ষণ করুন'
                      : 'Save Changes'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
