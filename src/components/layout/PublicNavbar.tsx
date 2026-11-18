import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FileText,
  LogOut,
  Menu,
  Search,
  Sparkles,
  UserCheck,
  UserCircle,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import type { AppRoute, InstitutionRecord } from '../../types/domain';
import { BrandLogo } from '../common/BrandLogo';
import { LanguageSwitcher } from '../common/LanguageSwitcher';
import { ThemeToggle } from '../common/ThemeToggle';

interface PublicNavbarProps {
  onOpenDrawer: () => void;
  onLogoClick: () => void;
  onNavigate: (route: AppRoute, anchorId?: string) => void;
  onOpenProfileSection: (tab: 'profile' | 'report') => void;
  onAfterSignOut?: () => void;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onSearchSubmit: (value: string) => void;
  institutions?: InstitutionRecord[];
  showQuickResultsDropdown?: boolean;
  onSelectQuickInstitution?: (inst: InstitutionRecord) => void;
}

export function PublicNavbar({
  onOpenDrawer,
  onLogoClick,
  onNavigate,
  onOpenProfileSection,
  onAfterSignOut,
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  institutions = [],
  showQuickResultsDropdown = false,
  onSelectQuickInstitution,
}: PublicNavbarProps) {
  const { lang } = useLanguage();
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement | null>(null);
  const desktopSearchRef = useRef<HTMLDivElement | null>(null);

  const isStudentLoggedIn = user?.accountType === 'student';

  useEffect(() => {
    if (!menuOpen && !searchFocused) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuContainerRef.current && !menuContainerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
      if (desktopSearchRef.current && !desktopSearchRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMenuOpen(false);
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen, searchFocused]);

  const quickMatches = useMemo(() => {
    if (!showQuickResultsDropdown) return [];
    const normalized = searchQuery.trim().toLowerCase();
    if (!normalized) return [];
    return institutions
      .filter(
        (inst) =>
          inst.code.toLowerCase().includes(normalized) ||
          inst.nameEn.toLowerCase().includes(normalized) ||
          inst.nameBn.toLowerCase().includes(normalized) ||
          inst.city.toLowerCase().includes(normalized) ||
          inst.programsEn.some((p) => p.toLowerCase().includes(normalized)) ||
          inst.programsBn.some((p) => p.toLowerCase().includes(normalized))
      )
      .slice(0, 5);
  }, [institutions, searchQuery, showQuickResultsDropdown]);

  const handleSignOut = async () => {
    setMenuOpen(false);
    onAfterSignOut?.();
    await logout();
  };

  const searchPlaceholder =
    lang === 'bn'
      ? 'সার্চ করুন... (বিশ্ববিদ্যালয়, ইউনিট বা বিষয়)'
      : 'Search universities, units, or subjects...';

  const renderSearchForm = (inputId: string, className: string) => (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        setSearchFocused(false);
        onSearchSubmit(searchQuery);
      }}
      className={`relative flex items-center ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        {searchPlaceholder}
      </label>
      <Sparkles
        className="pointer-events-none absolute left-3.5 h-4 w-4 text-[#00796B] dark:text-[#26A69A]"
        aria-hidden="true"
      />
      <input
        id={inputId}
        type="search"
        value={searchQuery}
        onFocus={() => setSearchFocused(true)}
        onChange={(e) => {
          onSearchChange(e.target.value);
          setSearchFocused(true);
        }}
        placeholder={searchPlaceholder}
        className="h-9 sm:h-10 w-full rounded-full border-[1.5px] border-[#A13D2D] bg-[#F8FAFC] pl-9 pr-16 text-xs sm:text-sm text-[#0F172A] placeholder:text-[#475569] transition-colors focus:border-[#8A3224] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#A13D2D]/20 dark:border-[#A13D2D] dark:bg-[#121212] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8] dark:focus:border-[#8A3224] dark:focus:bg-[#0A0A0A] dark:focus:ring-[#A13D2D]/25"
      />
      {searchQuery.trim().length > 0 && (
        <button
          type="button"
          onClick={() => onSearchChange('')}
          aria-label={lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
          className="absolute right-8 inline-flex h-6 w-6 items-center justify-center rounded-full text-[#475569] hover:bg-[#E2E8F0] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:bg-[#222222] dark:hover:text-[#F8FAFC]"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      )}
      <button
        type="submit"
        aria-label={lang === 'bn' ? 'সার্চ করুন' : 'Search'}
        className="absolute right-1.5 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#A13D2D] text-white hover:bg-[#8A3224] transition-all"
      >
        <Search className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </form>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md dark:border-[#222222] dark:bg-[#0A0A0A]/95 print:hidden">
      <div className="mx-auto max-w-7xl px-2.5 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4">
          {/* Left: 3-line Hamburger + Dream University Logo + Always-Visible Pill Search Bar (sm+) */}
          <div className="flex flex-1 items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={onOpenDrawer}
              aria-label={lang === 'bn' ? 'নেভিগেশন মেনু খুলুন' : 'Open navigation drawer'}
              className="inline-flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] transition-colors focus-visible:outline-2 focus-visible:outline-[#00796B] shrink-0"
            >
              <Menu className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" />
            </button>

            <a
              href="/"
              onClick={(e) => {
                e.preventDefault();
                onLogoClick();
              }}
              className="inline-flex items-center shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00796B] rounded-lg"
            >
              <BrandLogo />
            </a>

            {/* Desktop / Tablet Always-Visible Search Bar Right Beside Logo */}
            <div ref={desktopSearchRef} className="relative hidden sm:block flex-1 max-w-md min-w-[180px]">
              {renderSearchForm('navbar-search-desktop', 'w-full')}

              {showQuickResultsDropdown && searchFocused && searchQuery.trim().length > 0 && (
                <div className="absolute left-0 right-0 mt-1.5 rounded-2xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl dark:border-[#222222] dark:bg-[#121212] z-50">
                  {quickMatches.length > 0 ? (
                    <div className="space-y-0.5">
                      {quickMatches.map((inst) => (
                        <button
                          key={inst.id}
                          type="button"
                          onClick={() => {
                            setSearchFocused(false);
                            if (onSelectQuickInstitution) {
                              onSelectQuickInstitution(inst);
                            } else {
                              onSearchSubmit(inst.code);
                            }
                          }}
                          className="flex w-full items-center justify-between gap-2 rounded-xl px-3 py-2 text-left text-xs hover:bg-[#F8FAFC] dark:hover:bg-[#1A1A1A]"
                        >
                          <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                            {lang === 'bn' ? inst.nameBn : inst.nameEn}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-[#00796B] dark:text-[#26A69A] shrink-0">
                            {inst.code}
                          </span>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          onSearchSubmit(searchQuery);
                        }}
                        className="mt-1 flex w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-1.5 text-[11px] font-semibold text-[#00796B] hover:bg-[#E2E8F0]/70 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#26A69A] dark:hover:bg-[#1E1E1E]"
                      >
                        {lang === 'bn'
                          ? 'ডিরেক্টরিতে সব ফলাফল দেখুন'
                          : 'View all matches in Universities'}
                      </button>
                    </div>
                  ) : (
                    <p className="px-3 py-2 text-xs text-[#475569] dark:text-[#94A3B8]">
                      {lang === 'bn'
                        ? 'কোনো বিশ্ববিদ্যালয় পাওয়া যায়নি।'
                        : 'No matching universities found.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: BN | EN Pill Toggle + Dark/Light Toggle + Single Login Button OR Student Avatar Dropdown */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            <LanguageSwitcher compact />
            <ThemeToggle />

            {isStudentLoggedIn && user ? (
              <div ref={menuContainerRef} className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={`${user.fullName} profile menu`}
                  title={user.fullName}
                  className="inline-flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center overflow-hidden rounded-full border border-[#E2E8F0] bg-white shadow-2xs transition-colors hover:border-[#00796B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:hover:border-[#26A69A] dark:focus-visible:outline-[#26A69A]"
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.fullName}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <UserCircle className="h-5 w-5 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
                  )}
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    aria-label="Student account menu"
                    className="absolute right-0 mt-2 w-60 origin-top-right rounded-xl border border-[#E2E8F0] bg-white p-1.5 shadow-xl dark:border-[#222222] dark:bg-[#121212] z-50"
                  >
                    <div className="border-b border-[#E2E8F0] px-3 py-2 dark:border-[#222222]">
                      <p className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                        {user.fullName}
                      </p>
                      <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] truncate">
                        {user.email || user.phone || 'Verified Student'}
                      </p>
                    </div>

                    <div className="py-1 space-y-0.5">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenProfileSection('profile');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:text-[#F8FAFC] dark:hover:bg-[#1A1A1A]"
                      >
                        <UserCheck className="h-4 w-4 text-[#00796B] dark:text-[#26A69A] shrink-0" aria-hidden="true" />
                        <span>
                          {lang === 'bn' ? 'আমার একাডেমিক প্রোফাইল' : 'My Academic Profile'}
                        </span>
                      </button>

                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setMenuOpen(false);
                          onOpenProfileSection('report');
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#0F172A] hover:bg-[#F8FAFC] dark:text-[#F8FAFC] dark:hover:bg-[#1A1A1A]"
                      >
                        <FileText className="h-4 w-4 text-[#388E3C] dark:text-[#66BB6A] shrink-0" aria-hidden="true" />
                        <span>{lang === 'bn' ? 'সংরক্ষিত এ-ফোর রিপোর্ট' : 'Saved A4 Report'}</span>
                      </button>
                    </div>

                    <div className="border-t border-[#E2E8F0] pt-1 dark:border-[#222222]">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => void handleSignOut()}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs font-semibold text-[#D32F2F] hover:bg-[#D32F2F]/10 dark:text-[#FF4D4D] dark:hover:bg-[#FF4D4D]/12"
                      >
                        <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => onNavigate('/login')}
                className="inline-flex h-8 sm:h-10 items-center justify-center rounded-full bg-[#00796B] px-3.5 sm:px-5 text-xs sm:text-sm font-semibold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.28)] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] dark:shadow-[0_0_16px_rgba(38,166,154,0.28)] whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00796B]"
              >
                {lang === 'bn' ? 'লগ-ইন' : 'Log in'}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Always-Visible Search Row Inside Sticky Navbar */}
        <div className="sm:hidden pb-2.5">
          {renderSearchForm('navbar-search-mobile', 'w-full')}
        </div>
      </div>
    </header>
  );
}
