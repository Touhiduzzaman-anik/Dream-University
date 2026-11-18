import { useEffect, useState, type FormEvent } from 'react';
import {
  Compass,
  ExternalLink,
  LifeBuoy,
  Lock,
  MessageCircle,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import {
  apiFetch,
  extractApiErrorMessage,
  parseJsonSafe,
} from '../../lib/authFetch';
import type { HelpSettingsRecord } from '../../types/domain';
import {
  buildWhatsAppContactUrl,
  DEFAULT_HELP_SETTINGS,
  DEFAULT_WHATSAPP_MESSAGE,
  DEFAULT_WHATSAPP_PHONE,
  dispatchHelpSettingsUpdated,
  normalizeHelpSettingsRecord,
} from '../../utils/helpSettings';

interface AdminHelpSettingsViewProps {
  initialSettings: HelpSettingsRecord;
  onRefresh: () => Promise<void>;
  onSettingsUpdated?: (settings: HelpSettingsRecord) => void;
}

interface ToggleRowProps {
  id: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  title: string;
  description: string;
  testId?: string;
}

function ToggleRow({
  id,
  checked,
  onChange,
  title,
  description,
  testId,
}: ToggleRowProps) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4 transition-colors hover:border-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#26A69A]"
    >
      <div className="space-y-1">
        <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">{title}</p>
        <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
          {description}
        </p>
      </div>
      <div className="relative inline-flex shrink-0 items-center pt-0.5">
        <input
          id={id}
          data-testid={testId}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span className="h-6 w-11 rounded-full bg-[#CBD5E1] transition-colors peer-checked:bg-[#00796B] peer-focus-visible:ring-4 peer-focus-visible:ring-[#00796B]/30 dark:bg-[#333333] dark:peer-checked:bg-[#26A69A]" />
        <span className="pointer-events-none absolute left-0.5 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  );
}

export function AdminHelpSettingsView({
  initialSettings,
  onRefresh,
  onSettingsUpdated,
}: AdminHelpSettingsViewProps) {
  const { lang } = useLanguage();

  const [isEnabled, setIsEnabled] = useState(initialSettings.isEnabled);
  const [showWhatsapp, setShowWhatsapp] = useState(initialSettings.showWhatsapp);
  const [whatsappPhone, setWhatsappPhone] = useState(initialSettings.whatsappPhone);
  const [whatsappSubtitle, setWhatsappSubtitle] = useState(initialSettings.whatsappSubtitle);
  const [whatsappMessage, setWhatsappMessage] = useState(initialSettings.whatsappMessage);
  const [showCareerFinder, setShowCareerFinder] = useState(initialSettings.showCareerFinder);
  const [requireLogin, setRequireLogin] = useState(initialSettings.requireLogin);

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; text: string } | null>(
    null
  );

  useEffect(() => {
    setIsEnabled(initialSettings.isEnabled);
    setShowWhatsapp(initialSettings.showWhatsapp);
    setWhatsappPhone(initialSettings.whatsappPhone);
    setWhatsappSubtitle(initialSettings.whatsappSubtitle);
    setWhatsappMessage(initialSettings.whatsappMessage);
    setShowCareerFinder(initialSettings.showCareerFinder);
    setRequireLogin(initialSettings.requireLogin);
  }, [initialSettings]);

  const previewUrl = buildWhatsAppContactUrl(
    whatsappPhone || DEFAULT_WHATSAPP_PHONE,
    whatsappMessage || DEFAULT_WHATSAPP_MESSAGE
  );

  const previewSubtitle =
    whatsappSubtitle.trim() ||
    `WhatsApp Direct · ${whatsappPhone.trim() || DEFAULT_WHATSAPP_PHONE}`;

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setSaving(true);
    try {
      const res = await apiFetch('/api/admin/help-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isEnabled,
          showWhatsapp,
          whatsappPhone,
          whatsappSubtitle,
          whatsappMessage,
          showCareerFinder,
          requireLogin,
        }),
      });
      const parsed = await parseJsonSafe<{
        settings?: HelpSettingsRecord;
        error?: string;
        message?: string;
      }>(res);

      if (!res.ok || !parsed.data?.settings) {
        const msg = extractApiErrorMessage(res, parsed, 'Failed to save Help & Support settings.');
        throw new Error(msg);
      }

      const saved = normalizeHelpSettingsRecord(parsed.data.settings);
      onSettingsUpdated?.(saved);
      dispatchHelpSettingsUpdated(saved);

      setFeedback({
        type: 'success',
        text:
          lang === 'bn'
            ? `সহায়তা ও সাপোর্ট সেটিংস সংরক্ষণ করা হয়েছে (${saved.updatedBy || 'Admin'})।`
            : `Help & Support settings saved and published live (${saved.updatedBy || 'Admin'}).`,
      });
      await onRefresh();
    } catch (err: unknown) {
      setFeedback({
        type: 'error',
        text: err instanceof Error ? err.message : 'Unable to save Help & Support settings.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    setFeedback(null);
    setIsEnabled(DEFAULT_HELP_SETTINGS.isEnabled);
    setShowWhatsapp(DEFAULT_HELP_SETTINGS.showWhatsapp);
    setWhatsappPhone(DEFAULT_HELP_SETTINGS.whatsappPhone);
    setWhatsappSubtitle(DEFAULT_HELP_SETTINGS.whatsappSubtitle);
    setWhatsappMessage(DEFAULT_HELP_SETTINGS.whatsappMessage);
    setShowCareerFinder(DEFAULT_HELP_SETTINGS.showCareerFinder);
    setRequireLogin(DEFAULT_HELP_SETTINGS.requireLogin);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <LifeBuoy
              className="mt-1 h-5 w-5 shrink-0 text-[#00796B] dark:text-[#26A69A]"
              aria-hidden="true"
            />
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
                {lang === 'bn' ? 'সহায়তা ও সাপোর্ট নিয়ন্ত্রণ' : 'Help & Support Controls'}
              </h1>
              <p className="mt-1 text-xs text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? 'পাবলিক সাইটের ভাসমান ডলফিন সহায়তা বাবল, হোয়াটসঅ্যাপ ডাইরেক্ট নম্বর, বার্তা ও লগইন শর্ত সরাসরি নিয়ন্ত্রণ করুন।'
                  : 'Customize the floating Dolphin Help Bubble on public & student pages. Changes persist to PostgreSQL and apply immediately for all visitors.'}
              </p>
            </div>
          </div>

          {initialSettings.updatedBy && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#00796B]/30 bg-[#00796B]/10 px-2.5 py-1 text-[11px] font-mono text-[#00796B] dark:border-[#26A69A]/35 dark:bg-[#26A69A]/12 dark:text-[#26A69A] shrink-0">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              {lang === 'bn' ? 'সর্বশেষ হালনাগাদ:' : 'Last saved by:'} {initialSettings.updatedBy}
            </span>
          )}
        </div>

        {feedback && (
          <div
            role="status"
            data-testid="help-settings-feedback"
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSave}
          className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-5"
        >
          <div className="space-y-3">
            <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'দৃশ্যমানতা ও প্রবেশাধিকার' : 'Visibility & Access Controls'}
            </h2>

            <ToggleRow
              id="help-master-enabled"
              testId="toggle-help-master-enabled"
              checked={isEnabled}
              onChange={setIsEnabled}
              title={
                lang === 'bn'
                  ? 'পাবলিক সাইটে ভাসমান ডলফিন বাবল চালু রাখুন'
                  : 'Enable Floating Dolphin Help Bubble'
              }
              description={
                lang === 'bn'
                  ? 'বন্ধ করলে হোমপেজ ও শিক্ষার্থী পেজে ভাসমান সহায়তা বাটন আর দেখাবে না (অ্যাডমিন প্যানেলে এটি সবসময় লুকানো থাকে)।'
                  : 'Show the circular Dolphin Help Bubble on public and student-facing routes (always hidden across /admin routes).'
              }
            />

            <ToggleRow
              id="help-require-login"
              testId="toggle-help-require-login"
              checked={requireLogin}
              onChange={setRequireLogin}
              title={
                lang === 'bn'
                  ? 'সাপোর্ট ব্যবহারে লগইন বাধ্যতামূলক (Sign in required)'
                  : 'Require Student Sign-In (Sign in required)'
              }
              description={
                lang === 'bn'
                  ? 'চালু থাকলে অতিথিদের সাইন-ইন করতে বলা হবে। বন্ধ করলে যেকোনো ভিজিটর লগইন ছাড়াই হোয়াটসঅ্যাপ ও কুইজ ব্যবহার করতে পারবেন।'
                  : 'When enabled, guests see "Sign in required" and authenticate first. Turn off to let guests open WhatsApp Direct & Career Finder immediately.'
              }
            />

            <ToggleRow
              id="help-show-career"
              testId="toggle-help-show-career"
              checked={showCareerFinder}
              onChange={setShowCareerFinder}
              title={
                lang === 'bn'
                  ? 'মেনুতে "Career & Subject Finder" দেখান'
                  : 'Show Career & Subject Finder Shortcut'
              }
              description={
                lang === 'bn'
                  ? 'সহায়তা পপওভারে ৩০টি প্রশ্নের বিষয় ও ক্যারিয়ার নির্ধারণ কুইজের অপশন দেখান বা লুকান।'
                  : 'Toggle visibility of the 30-question Career & Subject Finder assessment inside the help popup.'
              }
            />
          </div>

          <div className="border-t border-[#E2E8F0] pt-5 dark:border-[#222222] space-y-4">
            <h2 className="font-sans text-sm font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn' ? 'হোয়াটসঅ্যাপ ডাইরেক্ট সেটিংস' : 'WhatsApp Direct Settings'}
            </h2>

            <ToggleRow
              id="help-show-whatsapp"
              testId="toggle-help-show-whatsapp"
              checked={showWhatsapp}
              onChange={setShowWhatsapp}
              title={
                lang === 'bn'
                  ? 'হোয়াটসঅ্যাপ ডাইরেক্ট (Contact with Us) দেখান'
                  : 'Show WhatsApp Direct Option'
              }
              description={
                lang === 'bn'
                  ? 'সহায়তা মেনুতে সরাসরি হোয়াটসঅ্যাপ চ্যাট লিংকটি প্রদর্শন করুন।'
                  : 'Enable or hide the direct WhatsApp support card inside the Dolphin Help menu.'
              }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="help-whatsapp-phone"
                  className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {lang === 'bn' ? 'হোয়াটসঅ্যাপ ফোন নম্বর *' : 'WhatsApp Phone Number *'}
                </label>
                <input
                  id="help-whatsapp-phone"
                  data-testid="input-help-whatsapp-phone"
                  type="text"
                  required
                  value={whatsappPhone}
                  onChange={(e) => setWhatsappPhone(e.target.value)}
                  placeholder="01753653351"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm font-mono text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
                <p className="mt-1 text-[11px] text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'যেমন: 01753653351 বা +8801753653351'
                    : 'e.g., 01753653351 or +8801753653351'}
                </p>
              </div>

              <div>
                <label
                  htmlFor="help-whatsapp-subtitle"
                  className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                >
                  {lang === 'bn' ? 'কাস্টম সাবটাইটেল টেক্সট' : 'Custom Subtitle Text'}
                </label>
                <input
                  id="help-whatsapp-subtitle"
                  data-testid="input-help-whatsapp-subtitle"
                  type="text"
                  maxLength={120}
                  value={whatsappSubtitle}
                  onChange={(e) => setWhatsappSubtitle(e.target.value)}
                  placeholder="WhatsApp Direct · 01753653351"
                  className="h-10 w-full rounded-lg border border-[#E2E8F0] bg-white px-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="help-whatsapp-message"
                className="mb-1.5 block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
              >
                {lang === 'bn'
                  ? 'পূর্ব-নির্ধারিত স্বাগত বার্তা (WhatsApp Greeting)'
                  : 'Pre-filled Greeting Message'}
              </label>
              <textarea
                id="help-whatsapp-message"
                data-testid="input-help-whatsapp-message"
                rows={3}
                maxLength={500}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Hello Dream University Team, I need admission guidance."
                className="w-full rounded-lg border border-[#E2E8F0] bg-white p-3 text-sm text-[#0F172A] focus:border-[#00796B] focus:outline-none dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E2E8F0] pt-4 dark:border-[#222222]">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="h-10 rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#475569] hover:border-[#00796B] hover:text-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:hover:border-[#26A69A] dark:hover:text-[#F8FAFC] transition-colors"
            >
              {lang === 'bn' ? 'ডিফল্ট রিসেট' : 'Reset to Defaults'}
            </button>

            <button
              type="submit"
              data-testid="btn-save-help-settings"
              disabled={saving}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#00796B] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              <span>
                {saving
                  ? lang === 'bn'
                    ? 'সংরক্ষণ হচ্ছে...'
                    : 'Saving Settings...'
                  : lang === 'bn'
                  ? 'হেল্প সেটিংস সংরক্ষণ করুন'
                  : 'Save Help Settings'}
              </span>
            </button>
          </div>
        </form>

        {/* Live Popover Preview Panel */}
        <aside className="lg:col-span-5 space-y-4">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn' ? 'লাইভ হেল্প পপওভার প্রিভিউ' : 'Live Help Menu Preview'}
              </h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  isEnabled
                    ? 'bg-[#388E3C]/12 text-[#2E7D32] dark:bg-[#66BB6A]/15 dark:text-[#66BB6A]'
                    : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] dark:bg-[#0A0A0A] dark:text-[#94A3B8] dark:border-[#222222]'
                }`}
              >
                {isEnabled
                  ? lang === 'bn'
                    ? 'পাবলিক সাইটে সক্রিয়'
                    : 'Visible on Public Site'
                  : lang === 'bn'
                  ? 'লুকানো আছে'
                  : 'Hidden on Public Site'}
              </span>
            </div>

            <div
              className={`rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 shadow-sm transition-opacity dark:border-[#222222] dark:bg-[#0A0A0A] space-y-2.5 ${
                !isEnabled ? 'opacity-50' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn' ? 'ভর্তি সহায়তা ও গাইড' : 'Dream University Help'}
                </p>
                {requireLogin && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E65100] dark:text-[#FFA726]">
                    <Lock className="h-3 w-3" aria-hidden="true" />
                    <span>{lang === 'bn' ? 'লগইন প্রয়োজন' : 'Sign in required'}</span>
                  </span>
                )}
              </div>

              {showWhatsapp && (
                <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-2.5 dark:border-[#222222] dark:bg-[#121212]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#388E3C] dark:bg-[#66BB6A] text-white dark:text-[#050505]">
                    <MessageCircle className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'আমাদের সাথে যোগাযোগ (WhatsApp)' : 'Contact with Us'}
                    </p>
                    <p className="truncate text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                      {previewSubtitle}
                    </p>
                  </div>
                  {requireLogin ? (
                    <Lock className="h-4 w-4 shrink-0 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
                  ) : (
                    <ExternalLink className="h-4 w-4 shrink-0 text-[#94A3B8]" aria-hidden="true" />
                  )}
                </div>
              )}

              {showCareerFinder && (
                <div className="flex items-center gap-3 rounded-xl border border-[#E2E8F0] bg-white p-2.5 dark:border-[#222222] dark:bg-[#121212]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00796B] to-[#388E3C] text-white">
                    <Compass className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'বিষয় ও ক্যারিয়ার গাইড' : 'Career & Subject Finder'}
                    </p>
                    <p className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                      {lang === 'bn'
                        ? '৩০টি প্রশ্নের বিষয় নির্ধারণ কুইজ'
                        : '30-Question Subject Assessment'}
                    </p>
                  </div>
                  {requireLogin ? (
                    <Lock className="h-4 w-4 shrink-0 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
                  ) : null}
                </div>
              )}

              {!showWhatsapp && !showCareerFinder && (
                <p className="rounded-xl border border-dashed border-[#E2E8F0] p-3 text-center text-xs text-[#475569] dark:border-[#222222] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'উভয় সাপোর্ট আইটেম বন্ধ রয়েছে।'
                    : 'Both menu shortcuts are currently disabled.'}
                </p>
              )}
            </div>

            {showWhatsapp && (
              <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3 text-[11px] dark:border-[#222222] dark:bg-[#0A0A0A] space-y-1">
                <p className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'জেনারেটেড হোয়াটসঅ্যাপ লিংক:' : 'Resolved WhatsApp Link:'}
                </p>
                <p className="break-all font-mono text-[#00796B] dark:text-[#26A69A]">
                  {previewUrl}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
