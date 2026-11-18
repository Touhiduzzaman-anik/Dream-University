import { useEffect } from 'react';
import {
  Bell,
  Building2,
  CheckSquare,
  Compass,
  Info,
  Lock,
  LogOut,
  Trophy,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { AppRoute } from '../../types/domain';
import type { DrawerSectionId } from '../../utils/authRedirect';
import { BrandLogo } from '../common/BrandLogo';

export type { DrawerSectionId };

interface NavigationDrawerProps {
  open: boolean;
  activeSection: DrawerSectionId;
  activeNotificationCount: number;
  onClose: () => void;
  onSelectSection: (section: DrawerSectionId) => void;
  onNavigate: (route: AppRoute) => void;
  onAfterSignOut?: () => void;
}

export function NavigationDrawer({
  open,
  activeSection,
  activeNotificationCount,
  onClose,
  onSelectSection,
  onNavigate,
  onAfterSignOut,
}: NavigationDrawerProps) {
  const { lang } = useLanguage();
  const { user, logout } = useAuth();
  const isStudentLoggedIn = user?.accountType === 'student';

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Compact 6-item drawer: Home / Universities and About are public; 4 core tools require sign-in
  const items: Array<{
    id: DrawerSectionId;
    labelEn: string;
    labelBn: string;
    icon: typeof Building2;
    requiresAuth: boolean;
    badgeCount?: number;
  }> = [
    {
      id: 'home',
      labelEn: 'Home / Universities',
      labelBn: 'হোম / বিশ্ববিদ্যালয়',
      icon: Building2,
      requiresAuth: false,
    },
    {
      id: 'eligibility',
      labelEn: 'Eligibility Checker',
      labelBn: 'যোগ্যতা যাচাইকারী',
      icon: CheckSquare,
      requiresAuth: true,
    },
    {
      id: 'ranking',
      labelEn: 'University Ranking',
      labelBn: 'বিশ্ববিদ্যালয় র‍্যাঙ্কিং',
      icon: Trophy,
      requiresAuth: true,
    },
    {
      id: 'best-for-u',
      labelEn: 'Best for U',
      labelBn: 'আপনার জন্য সেরা',
      icon: Compass,
      requiresAuth: true,
    },
    {
      id: 'notifications',
      labelEn: 'Notifications',
      labelBn: 'নোটিফিকেশন',
      icon: Bell,
      requiresAuth: true,
      badgeCount: activeNotificationCount,
    },
    {
      id: 'about',
      labelEn: 'About',
      labelBn: 'সম্পর্কে',
      icon: Info,
      requiresAuth: false,
    },
  ];

  const handleSignOut = async () => {
    onClose();
    onAfterSignOut?.();
    await logout();
  };

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-200 print:hidden ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Compact Slide-Out Left Panel (6 Core Navigation Items) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={lang === 'bn' ? 'প্রধান মেনু' : 'Dream University Navigation Menu'}
        className={`relative z-10 flex h-full w-80 max-w-[88vw] flex-col justify-between border-r border-[#E2E8F0] bg-white text-[#0F172A] shadow-2xl transition-transform duration-200 ease-out dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          {/* Drawer Header */}
          <div className="flex items-center justify-between gap-3 border-b border-[#E2E8F0] px-5 py-3.5 dark:border-[#222222]">
            <BrandLogo
              onClick={() => {
                onSelectSection('home');
                onClose();
              }}
            />
            <button
              type="button"
              onClick={onClose}
              aria-label={lang === 'bn' ? 'মেনু বন্ধ করুন' : 'Close navigation drawer'}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#121212] dark:hover:text-[#F8FAFC]"
            >
              <X className="h-4.5 w-4.5" aria-hidden="true" />
            </button>
          </div>

          {/* 6 Compact Navigation Items */}
          <nav aria-label="Core platform features" className="p-3 space-y-1">
            {items.map((item) => {
              const Icon = item.icon;
              const isPublicActive =
                !item.requiresAuth &&
                (activeSection === item.id ||
                  (item.id === 'home' && activeSection === 'universities'));
              const isProtectedActive =
                item.requiresAuth && isStudentLoggedIn && activeSection === item.id;
              const isActive = isPublicActive || isProtectedActive;
              const showLock = item.requiresAuth && !isStudentLoggedIn;

              return (
                <button
                  key={item.id}
                  type="button"
                  data-testid={`drawer-item-${item.id}`}
                  onClick={() => {
                    onClose();
                    onSelectSection(item.id);
                  }}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    isActive
                      ? 'bg-[#00796B]/10 text-[#00796B] dark:bg-[#26A69A]/15 dark:text-[#26A69A]'
                      : 'text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#121212] dark:hover:text-[#F8FAFC]'
                  }`}
                >
                  <span
                    className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                      isActive
                        ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                        : 'bg-[#F8FAFC] text-[#0F172A] group-hover:bg-[#E2E8F0]/70 dark:bg-[#121212] dark:text-[#26A69A] dark:group-hover:bg-[#1A1A1A]'
                    }`}
                  >
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className="flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span className="font-sans text-sm font-bold truncate">
                      {lang === 'bn' ? item.labelBn : item.labelEn}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {typeof item.badgeCount === 'number' && item.badgeCount > 0 && (
                        <span className="rounded-md bg-[#F57C00]/12 px-2 py-0.5 font-mono text-xs font-bold tabular-nums text-[#E65100] dark:bg-[#FFA726]/15 dark:text-[#FFA726]">
                          {item.badgeCount}
                        </span>
                      )}
                      {showLock && (
                        <Lock
                          data-testid={`drawer-lock-${item.id}`}
                          className="h-3.5 w-3.5 text-[#94A3B8] dark:text-[#64748B]"
                          aria-hidden="true"
                        />
                      )}
                    </span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Drawer Footer Account Info / Login */}
        <div className="border-t border-[#E2E8F0] p-4 space-y-2.5 dark:border-[#222222]">
          {isStudentLoggedIn && user ? (
            <div className="space-y-2.5">
              <div className="flex items-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 dark:border-[#222222] dark:bg-[#121212]">
                <span className="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#050505] shrink-0">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate">
                    {user.email || user.phone || 'Verified Student'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleSignOut()}
                className="flex h-10 w-full items-center justify-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-3 text-xs font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/8 dark:border-[#222222] dark:bg-[#121212] dark:text-[#FF4D4D] dark:hover:bg-[#FF4D4D]/12"
              >
                <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigate('/login');
              }}
              className="flex h-10 w-full items-center justify-center rounded-xl bg-[#00796B] px-3 text-xs font-semibold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.25)] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
            >
              {lang === 'bn' ? 'লগ-ইন' : 'Log in'}
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
