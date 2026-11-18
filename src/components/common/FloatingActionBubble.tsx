import { useEffect, useRef, useState } from 'react';
import {
  Compass,
  ExternalLink,
  Lock,
  MessageCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { parseJsonSafe } from '../../lib/authFetch';
import type { AppRoute, HelpSettingsRecord } from '../../types/domain';
import {
  buildLoginUrlWithRedirect,
  consumePendingFabAction,
  getFabActionLabel,
  savePendingFabAction,
  saveRedirectAfterLogin,
  type FabActionId,
} from '../../utils/authRedirect';
import {
  buildWhatsAppContactUrl,
  DEFAULT_HELP_SETTINGS,
  HELP_SETTINGS_UPDATED_EVENT,
  normalizeHelpSettingsRecord,
} from '../../utils/helpSettings';
import { CareerSubjectFinderModal } from './CareerSubjectFinderModal';

interface FloatingActionBubbleProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute | string, anchorId?: string) => void;
}

function DolphinIcon() {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      className="h-8 w-8 text-white drop-shadow-[0_1px_2px_rgba(8,51,68,0.28)]"
      aria-hidden="true"
    >
      <path
        d="M27.2 17.6c.4.8-.4 1.6-1.8 1.3-1-.2-1.8-.8-3-1.7-1.8-1.4-3.8-2-6-1.8-3.2.3-5.8 2.4-8.2 5.8-.3 1.6-1.5 3.4-3 4.1-.6.3-1.1-.2-.8-.9.5-1.2.8-2.1.9-2.9-1.1-.2-2.2-.9-3-1.8-.5-.6 0-1.3.7-1.2 1.3.1 2.5.2 3.4-.1 1.4-4.2 4.2-7.2 7.8-8.1.6-2 1.9-3.6 3.5-4 .7-.2 1.1.4.7 1.1-.5 1-.6 2-.3 2.8 3.3.5 5.9 2.6 7.2 5.4.9.4 1.6 1.2 1.9 2z"
        fill="currentColor"
      />
      <path
        d="M17.8 15.6c-.4 2-1.6 3.6-2.9 4-.5.2-.7-.4-.4-.9.7-1.1 1.3-2.3 1.6-3.3l1.7.2z"
        fill="currentColor"
      />
      <circle cx="22.8" cy="14.2" r="1.05" fill="#00796B" />
    </svg>
  );
}

function WhatsAppBadgeIcon() {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-sm">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm5.77 14.12c-.24.68-1.41 1.3-1.95 1.38-.5.07-1.13.1-1.82-.12-.42-.13-.96-.31-1.66-.61-2.92-1.26-4.83-4.2-4.97-4.39-.15-.2-1.19-1.58-1.19-3.02 0-1.44.75-2.15 1.02-2.44.27-.29.59-.37.78-.37.2 0 .39.01.56.01.18 0 .42-.07.66.5.24.59.83 2.02.9 2.17.07.15.12.32.02.52-.1.2-.15.32-.29.49-.15.17-.31.38-.44.51-.15.15-.3.31-.13.61.17.3.76 1.26 1.64 2.04 1.13 1 2.08 1.32 2.38 1.47.3.15.47.12.64-.07.17-.2.74-.86.94-1.16.2-.29.39-.24.66-.15.27.1 1.72.81 2.02.96.29.15.49.22.56.34.07.12.07.71-.17 1.39z" />
      </svg>
    </span>
  );
}

export function FloatingActionBubble({
  currentRoute,
  onNavigate,
}: FloatingActionBubbleProps) {
  const { lang } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isStudentLoggedIn = !authLoading && user?.accountType === 'student';

  const isAdminRoute =
    currentRoute.startsWith('/admin') ||
    (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  const [helpSettings, setHelpSettings] = useState<HelpSettingsRecord>(DEFAULT_HELP_SETTINGS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [careerModalOpen, setCareerModalOpen] = useState(false);
  const [whatsappToastOpen, setWhatsappToastOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const whatsappLinkTriggerRef = useRef<HTMLAnchorElement | null>(null);

  // Load persisted Help & Support Controls from PostgreSQL and listen for live admin updates
  useEffect(() => {
    let active = true;

    const loadSettings = async () => {
      try {
        const res = await fetch('/api/help-settings', { credentials: 'include' });
        if (!res.ok) return;
        const parsed = await parseJsonSafe<{ settings?: HelpSettingsRecord }>(res);
        if (active && parsed.data?.settings) {
          setHelpSettings(normalizeHelpSettingsRecord(parsed.data.settings));
        }
      } catch {
        // Keep safe defaults if network is briefly unavailable
      }
    };

    void loadSettings();

    const handleLiveUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<HelpSettingsRecord>;
      if (customEvent.detail) {
        setHelpSettings(normalizeHelpSettingsRecord(customEvent.detail));
      } else {
        void loadSettings();
      }
    };

    window.addEventListener(HELP_SETTINGS_UPDATED_EVENT, handleLiveUpdate);
    return () => {
      active = false;
      window.removeEventListener(HELP_SETTINGS_UPDATED_EVENT, handleLiveUpdate);
    };
  }, []);

  // Ensure any open help menu/modals close immediately if user enters any /admin route
  useEffect(() => {
    if (isAdminRoute) {
      setMenuOpen(false);
      setCareerModalOpen(false);
      setWhatsappToastOpen(false);
    }
  }, [isAdminRoute]);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [menuOpen]);

  const executeFabAction = (action: FabActionId) => {
    if (action === 'career-finder') {
      setCareerModalOpen(true);
      return;
    }
    if (action === 'whatsapp') {
      setWhatsappToastOpen(true);
      whatsappLinkTriggerRef.current?.click();
    }
  };

  // Auto-run queued FAB action immediately once authenticated via /login page
  useEffect(() => {
    if (!isStudentLoggedIn || isAdminRoute) return;
    const pending = consumePendingFabAction();
    if (!pending) return;
    executeFabAction(pending.action);
  }, [isStudentLoggedIn, isAdminRoute]);

  // Never render floating Dolphin Help Bubble or popup on any /admin route or when disabled
  if (isAdminRoute || !helpSettings.isEnabled) {
    return null;
  }

  const requiresAuthToUse = helpSettings.requireLogin && !isStudentLoggedIn;
  const whatsappUrl = buildWhatsAppContactUrl(
    helpSettings.whatsappPhone,
    helpSettings.whatsappMessage
  );
  const defaultEnPrefix = `WhatsApp Direct · ${helpSettings.whatsappPhone}`;
  const whatsappSubtitleDisplay =
    lang === 'bn' &&
    (helpSettings.whatsappSubtitle === defaultEnPrefix ||
      helpSettings.whatsappSubtitle === DEFAULT_HELP_SETTINGS.whatsappSubtitle)
      ? `সরাসরি হোয়াটসঅ্যাপ · ${helpSettings.whatsappPhone}`
      : helpSettings.whatsappSubtitle ||
        (lang === 'bn'
          ? `সরাসরি হোয়াটসঅ্যাপ · ${helpSettings.whatsappPhone}`
          : defaultEnPrefix);

  const handleActionClick = (action: FabActionId) => {
    setMenuOpen(false);

    if (requiresAuthToUse) {
      const actionLabel = getFabActionLabel(action);
      savePendingFabAction({ action, returnRoute: currentRoute });
      saveRedirectAfterLogin({
        route: currentRoute,
        section: 'home',
        labelEn: actionLabel.labelEn,
        labelBn: actionLabel.labelBn,
      });
      onNavigate(buildLoginUrlWithRedirect(currentRoute));
      return;
    }

    executeFabAction(action);
  };

  return (
    <>
      {/* Hidden safe anchor for post-login automatic WhatsApp launch without window.open */}
      <a
        ref={whatsappLinkTriggerRef}
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        tabIndex={-1}
        aria-hidden="true"
        className="sr-only"
      >
        WhatsApp Direct
      </a>

      <div
        ref={containerRef}
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 print:hidden"
      >
        {/* Post-login WhatsApp Ready Card (fallback if popup blocker prevents auto tab) */}
        {whatsappToastOpen && !requiresAuthToUse && helpSettings.showWhatsapp && (
          <div
            role="status"
            data-testid="whatsapp-ready-toast"
            className="w-72 rounded-2xl border border-[#388E3C]/35 bg-white/95 p-3.5 shadow-xl backdrop-blur-md dark:border-[#66BB6A]/40 dark:bg-[#121212]/95"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#2E7D32] dark:text-[#66BB6A]">
                <MessageCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  {lang === 'bn' ? 'হোয়াটসঅ্যাপ সাপোর্ট প্রস্তুত' : 'WhatsApp Support Ready'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setWhatsappToastOpen(false)}
                aria-label="Dismiss WhatsApp notice"
                className="rounded p-0.5 text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <p className="mt-1 text-[11px] text-[#475569] dark:text-[#94A3B8]">
              {lang === 'bn'
                ? `সরাসরি ভর্তি সহায়তার জন্য ${helpSettings.whatsappPhone} নম্বরে মেসেজ করুন।`
                : `Message Dream University guidance directly on ${helpSettings.whatsappPhone}.`}
            </p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="whatsapp-direct-cta"
              className="mt-2.5 inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#388E3C] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#2E7D32] dark:bg-[#66BB6A] dark:text-[#050505]"
            >
              <span>
                {lang === 'bn'
                  ? 'হোয়াটসঅ্যাপ খুলুন'
                  : `Open WhatsApp (${helpSettings.whatsappPhone})`}
              </span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          </div>
        )}

        {/* Expandable Glassmorphic Popover Menu */}
        {menuOpen && (
          <div
            role="menu"
            data-testid="fab-menu"
            aria-label={lang === 'bn' ? 'সহায়তা ও গাইড মেনু' : 'Support and Guidance Menu'}
            className="w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-[#E2E8F0] bg-white/95 p-3 shadow-2xl backdrop-blur-xl dark:border-[#222222] dark:bg-[#121212]/95 space-y-2"
          >
            <div className="px-1.5 pt-0.5 pb-1 flex items-center justify-between gap-2">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn' ? 'ভর্তি সহায়তা ও গাইড' : 'Dream University Help'}
              </p>
              {requiresAuthToUse && (
                <span
                  data-testid="fab-signin-required-badge"
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#E65100] dark:text-[#FFA726]"
                >
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  <span>{lang === 'bn' ? 'লগইন প্রয়োজন' : 'Sign in required'}</span>
                </span>
              )}
            </div>

            {/* Option 1: Contact with Us (WhatsApp Direct) */}
            {helpSettings.showWhatsapp &&
              (!requiresAuthToUse ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  data-testid="fab-option-whatsapp"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-left transition-colors hover:border-[#388E3C] hover:bg-[#388E3C]/10 dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#66BB6A] dark:hover:bg-[#66BB6A]/10"
                >
                  <WhatsAppBadgeIcon />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'আমাদের সাথে যোগাযোগ (WhatsApp)' : 'Contact with Us'}
                    </p>
                    <p className="truncate text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                      {whatsappSubtitleDisplay}
                    </p>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
                </a>
              ) : (
                <button
                  type="button"
                  role="menuitem"
                  data-testid="fab-option-whatsapp"
                  onClick={() => handleActionClick('whatsapp')}
                  className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-left transition-colors hover:border-[#388E3C] hover:bg-[#388E3C]/10 dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#66BB6A] dark:hover:bg-[#66BB6A]/10"
                >
                  <WhatsAppBadgeIcon />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'আমাদের সাথে যোগাযোগ (WhatsApp)' : 'Contact with Us'}
                    </p>
                    <p className="truncate text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                      {whatsappSubtitleDisplay}
                    </p>
                  </div>
                  <Lock
                    data-testid="fab-lock-whatsapp"
                    className="h-4 w-4 shrink-0 text-[#F57C00] dark:text-[#FFA726]"
                    aria-label="Locked"
                  />
                </button>
              ))}

            {/* Option 2: Career & Subject Finder (30-Question Assessment) */}
            {helpSettings.showCareerFinder && (
              <button
                type="button"
                role="menuitem"
                data-testid="fab-option-career"
                onClick={() => handleActionClick('career-finder')}
                className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-2.5 text-left transition-colors hover:border-[#00796B] hover:bg-[#00796B]/10 dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#26A69A] dark:hover:bg-[#26A69A]/10"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#00796B] to-[#388E3C] text-white shadow-sm dark:from-[#26A69A] dark:to-[#66BB6A] dark:text-[#050505]">
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
                {requiresAuthToUse && (
                  <Lock
                    data-testid="fab-lock-career"
                    className="h-4 w-4 shrink-0 text-[#F57C00] dark:text-[#FFA726]"
                    aria-label="Locked"
                  />
                )}
              </button>
            )}

            {!helpSettings.showWhatsapp && !helpSettings.showCareerFinder && (
              <p className="rounded-xl border border-dashed border-[#E2E8F0] px-3 py-3 text-center text-xs text-[#475569] dark:border-[#222222] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? 'সাপোর্ট অপশনগুলো সাময়িকভাবে বন্ধ রয়েছে।'
                  : 'Support options are currently offline. Please check back soon.'}
              </p>
            )}
          </div>
        )}

        {/* Circular Dolphin Floating Bubble + Hover-Only Tooltip */}
        <div className="group relative flex items-center">
          {!menuOpen && (
            <span
              role="tooltip"
              className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-full border border-[#E2E8F0] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-lg backdrop-blur-md opacity-0 translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0 group-focus-within:opacity-100 group-focus-within:translate-x-0 dark:border-[#222222] dark:bg-[#121212]/95 dark:text-[#F8FAFC]"
            >
              Need Help? / সহায়তা
            </span>
          )}

          <div className={menuOpen ? '' : 'animate-dolphin-float'}>
            <button
              type="button"
              data-testid="fab-trigger"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              aria-label={lang === 'bn' ? 'সহায়তা মেনু খুলুন' : 'Need Help? Open support menu'}
              onClick={() => setMenuOpen((prev) => !prev)}
              className="relative flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#00796B] to-[#388E3C] text-white shadow-[0_12px_28px_-6px_rgba(0,121,107,0.55),inset_0_1px_1px_rgba(255,255,255,0.45)] ring-1 ring-white/30 transition-transform duration-200 hover:scale-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#00796B]/50 dark:from-[#26A69A] dark:to-[#00796B] dark:ring-[#26A69A]/40 dark:shadow-[0_0_24px_rgba(38,166,154,0.4)]"
            >
              {menuOpen ? (
                <X className="h-6 w-6 text-white" aria-hidden="true" />
              ) : (
                <DolphinIcon />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive 30-Question Assessment Modal */}
      <CareerSubjectFinderModal
        open={careerModalOpen}
        onClose={() => setCareerModalOpen(false)}
      />
    </>
  );
}
