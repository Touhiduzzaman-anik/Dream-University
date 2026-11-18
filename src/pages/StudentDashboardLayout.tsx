import { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckSquare,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch } from '../lib/authFetch';
import { ADMISSION_CATEGORIES } from '../data/demoInstitutions';
import type {
  AppRoute,
  EligibilityResultItem,
  InstitutionRecord,
  StudentSectionId,
} from '../types/domain';
import { BrandLogo } from '../components/common/BrandLogo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { StudentProfileForm } from '../components/student/StudentProfileForm';
import { StudentEligibilityView } from '../components/student/StudentEligibilityView';
import { StudentDirectoryView } from '../components/student/StudentDirectoryView';
import { StudentRecommendationsView } from '../components/student/StudentRecommendationsView';
import { StudentReportsView } from '../components/student/StudentReportsView';
import { QuickEligibilityTool } from '../components/student/QuickEligibilityTool';

interface StudentDashboardLayoutProps {
  onNavigate: (route: AppRoute) => void;
}

export function StudentDashboardLayout({ onNavigate }: StudentDashboardLayoutProps) {
  const { lang, tr } = useLanguage();
  const { user, profile, loading: authLoading, logout } = useAuth();
  const [activeSection, setActiveSection] = useState<StudentSectionId>('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [eligibilityResults, setEligibilityResults] = useState<EligibilityResultItem[]>([]);
  const [loadingEligibility, setLoadingEligibility] = useState(false);

  const loadInstitutions = useCallback(async () => {
    try {
      const res = await fetch('/api/institutions');
      if (res.ok) {
        const data = (await res.json()) as { institutions: InstitutionRecord[] };
        setInstitutions(data.institutions ?? []);
      }
    } catch {
      // ignore
    }
  }, []);

  const loadEligibility = useCallback(async () => {
    setLoadingEligibility(true);
    try {
      const res = await apiFetch('/api/student/eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: 'all' }),
      });
      if (res.ok) {
        const data = (await res.json()) as { evaluations: EligibilityResultItem[] };
        setEligibilityResults(data.evaluations ?? []);
      }
    } finally {
      setLoadingEligibility(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && (!user || user.accountType !== 'student')) {
      onNavigate('/login');
    }
  }, [authLoading, user, onNavigate]);

  useEffect(() => {
    if (user?.accountType === 'student') {
      void loadInstitutions();
      void loadEligibility();
    }
  }, [user, loadInstitutions, loadEligibility]);

  if (authLoading || !user || user.accountType !== 'student') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] flex items-center justify-center p-6">
        <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
          {lang === 'bn' ? 'সেশন যাচাই হচ্ছে...' : 'Verifying student session...'}
        </p>
      </div>
    );
  }

  const navItems: Array<{
    id: StudentSectionId;
    label: string;
    icon: typeof LayoutDashboard;
  }> = [
    { id: 'overview', label: tr('studentMenuOverview'), icon: LayoutDashboard },
    { id: 'profile', label: tr('studentMenuProfile'), icon: UserCheck },
    { id: 'eligibility', label: tr('studentMenuEligibility'), icon: CheckSquare },
    { id: 'directory', label: tr('studentMenuDirectory'), icon: Building2 },
    { id: 'recommendations', label: tr('studentMenuRecommendations'), icon: Sparkles },
    { id: 'reports', label: tr('studentMenuReports'), icon: FileText },
  ];

  const activeNav = navItems.find((item) => item.id === activeSection) ?? navItems[0];

  const handleSelectSection = (id: StudentSectionId) => {
    setActiveSection(id);
    setMobileDrawerOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    onNavigate('/login');
  };

  const eligibleCount = eligibilityResults.filter((r) => r.evaluation.status === 'Eligible').length;
  const notEligibleCount = eligibilityResults.filter((r) => r.evaluation.status === 'Not Eligible').length;
  const pendingCount = eligibilityResults.filter((r) => r.evaluation.status === 'Pending').length;

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F172A] text-[#F8FAFC] dark:bg-[#0A0A0A] dark:border-r dark:border-[#222222] p-4">
      <div className="space-y-6">
        <div className="px-2 pt-1">
          <BrandLogo inverted onClick={() => onNavigate('/')} />
          <p className="mt-2 text-xs font-medium text-[#26A69A]">{tr('studentSidebarTitle')}</p>
        </div>

        <nav aria-label="Student dashboard navigation" className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-[#00796B]/25 text-[#26A69A] border border-[#26A69A]/30'
                    : 'text-[#CBD5E1] hover:bg-white/5 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">{item.label}</span>
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-white/10 dark:border-[#222222] pt-4 space-y-2">
        <div className="px-2">
          <p className="text-xs font-semibold text-white truncate">{user.fullName}</p>
          <p className="text-[11px] text-[#94A3B8] truncate">{user.email}</p>
        </div>
        <button
          type="button"
          onClick={handleSignOut}
          className="flex min-h-10 w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#D32F2F]/15 hover:text-[#FF4D4D] transition-colors"
        >
          <LogOut className="h-4 w-4 text-[#FF4D4D] shrink-0" aria-hidden="true" />
          <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] flex text-[#0F172A] dark:text-[#F8FAFC]">
      <aside className="hidden lg:block lg:w-[264px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen print:hidden">
        {sidebarContent}
      </aside>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden print:hidden">
          <div
            className="fixed inset-0 bg-black/70"
            onClick={() => setMobileDrawerOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-10 w-72 max-w-[85vw] h-full shadow-xl">
            <button
              type="button"
              onClick={() => setMobileDrawerOpen(false)}
              aria-label={tr('closeMenu')}
              className="absolute right-3 top-3 inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#94A3B8] hover:bg-white/10"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#0A0A0A] print:hidden">
          <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(true)}
                aria-label={tr('openMenu')}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#0F172A] hover:border-[#00796B] dark:border-[#222222] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] lg:hidden shrink-0"
              >
                <Menu className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex items-center gap-2 text-sm truncate">
                <span className="text-[#475569] dark:text-[#94A3B8] hidden sm:inline">
                  {tr('studentSidebarTitle')}
                </span>
                <span className="text-[#94A3B8] dark:text-[#475569] hidden sm:inline">/</span>
                <span className="font-sans font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {activeNav.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <ThemeToggle />
              <LanguageSwitcher compact />
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-lg border border-[#E2E8F0] bg-white px-3 py-1.5 text-xs font-semibold text-[#D32F2F] hover:border-[#D32F2F] hover:bg-[#D32F2F]/5 dark:border-[#222222] dark:bg-[#121212] dark:text-[#FF4D4D] dark:hover:border-[#FF4D4D] whitespace-nowrap shrink-0 transition-colors"
              >
                {lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto space-y-6">
          {activeSection === 'overview' && (
            <>
              <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-2">
                <p className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
                  {lang === 'bn' ? `স্বাগতম, ${user.fullName}` : `Welcome back, ${user.fullName}`}
                </p>
                <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
                  {tr('studentWelcome')}
                </h1>
                <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8] max-w-3xl">
                  {tr('studentOverviewDesc')}
                </p>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-[#388E3C]/35 bg-white p-5 dark:border-[#66BB6A]/40 dark:bg-[#121212]">
                  <p className="text-xs font-semibold text-[#2E7D32] dark:text-[#66BB6A]">
                    {lang === 'bn' ? 'যোগ্য প্রোগ্রাম' : 'Eligible Programs'}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {eligibleCount}
                  </p>
                </div>
                <div className="rounded-xl border border-[#D32F2F]/35 bg-white p-5 dark:border-[#FF4D4D]/40 dark:bg-[#121212]">
                  <p className="text-xs font-semibold text-[#D32F2F] dark:text-[#FF4D4D]">
                    {lang === 'bn' ? 'অযোগ্য প্রোগ্রাম' : 'Not Eligible'}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {notEligibleCount}
                  </p>
                </div>
                <div className="rounded-xl border border-[#F57C00]/35 bg-white p-5 dark:border-[#FFA726]/40 dark:bg-[#121212]">
                  <p className="text-xs font-semibold text-[#E65100] dark:text-[#FFA726]">
                    {lang === 'bn' ? 'মুলতুবি / তথ্য বাকি' : 'Pending Verification'}
                  </p>
                  <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                    {pendingCount}
                  </p>
                </div>
              </div>

              <QuickEligibilityTool onProfileSynced={() => void loadEligibility()} />

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
                <section className="lg:col-span-5 rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
                  <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'সংরক্ষিত একাডেমিক প্রোফাইল' : 'Saved Academic Profile'}
                  </h3>

                  <dl className="divide-y divide-[#E2E8F0] dark:divide-[#222222] text-sm">
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'বিভাগ' : 'HSC Group'}
                      </dt>
                      <dd className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {profile?.hscGroup || (lang === 'bn' ? 'নির্বাচিত নয়' : 'Not set')}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#475569] dark:text-[#94A3B8]">SSC GPA</dt>
                      <dd className="font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        {profile?.sscGpa != null ? profile.sscGpa.toFixed(2) : '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#475569] dark:text-[#94A3B8]">HSC GPA</dt>
                      <dd className="font-mono font-semibold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        {profile?.hscGpa != null ? profile.hscGpa.toFixed(2) : '—'}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between py-2.5">
                      <dt className="text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'সেকেন্ড টাইমার' : 'Second Timer'}
                      </dt>
                      <dd className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                        {profile?.isSecondTimer ? (lang === 'bn' ? 'হ্যাঁ' : 'Yes') : lang === 'bn' ? 'না' : 'No'}
                      </dd>
                    </div>
                  </dl>

                  <button
                    type="button"
                    onClick={() => setActiveSection('profile')}
                    className="h-10 w-full rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD] transition-colors"
                  >
                    {lang === 'bn' ? 'একাডেমিক প্রোফাইল আপডেট করুন' : 'Update Academic Profile'}
                  </button>
                </section>

                <section className="lg:col-span-7 rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {tr('categoriesTitle')}
                    </h3>
                    <p className="text-xs text-[#475569] dark:text-[#94A3B8]">
                      {tr('additionalTypesNote')}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {ADMISSION_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setActiveSection('eligibility')}
                        className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-3.5 text-left transition-colors hover:border-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:hover:border-[#26A69A]"
                      >
                        <p className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                          {tr(cat.titleKey)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                          {tr(cat.descKey)}
                        </p>
                      </button>
                    ))}
                  </div>
                </section>
              </div>
            </>
          )}

          {activeSection === 'profile' && (
            <StudentProfileForm
              onSaved={() => {
                void loadEligibility();
              }}
            />
          )}

          {activeSection === 'eligibility' && (
            <StudentEligibilityView
              results={eligibilityResults}
              loading={loadingEligibility}
              onRefresh={() => void loadEligibility()}
              onEditProfile={() => setActiveSection('profile')}
            />
          )}

          {activeSection === 'directory' && (
            <StudentDirectoryView
              institutions={institutions}
              onCheckEligibility={() => setActiveSection('eligibility')}
            />
          )}

          {activeSection === 'recommendations' && (
            <StudentRecommendationsView onGoToEligibility={() => setActiveSection('eligibility')} />
          )}

          {activeSection === 'reports' && <StudentReportsView results={eligibilityResults} />}
        </main>
      </div>
    </div>
  );
}
