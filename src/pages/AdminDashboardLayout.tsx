import { useCallback, useEffect, useState } from 'react';
import {
  Award,
  Building2,
  ClipboardCheck,
  FileSearch,
  FileUp,
  History,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  ShieldCheck,
  UserCog,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { apiFetch, parseJsonSafe } from '../lib/authFetch';
import { canAccessAdminSection } from '../server/adminRbac';
import type {
  AdminCircularRecord,
  AdminOverviewStats,
  AdminSectionId,
  AppRoute,
  AuditLogRecord,
  HelpSettingsRecord,
  InstitutionRecord,
  UserAccountRecord,
} from '../types/domain';
import { DEFAULT_HELP_SETTINGS, normalizeHelpSettingsRecord } from '../utils/helpSettings';
import { BrandLogo } from '../components/common/BrandLogo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { AdminInstitutionsView } from '../components/admin/AdminInstitutionsView';
import { AdminCircularsAndVerificationView } from '../components/admin/AdminCircularsAndVerificationView';
import { AdminRankingsView, type AdminRankingRecord } from '../components/admin/AdminRankingsView';
import { AdminHelpSettingsView } from '../components/admin/AdminHelpSettingsView';
import {
  AdminAuditLogsView,
  AdminManageAdminsView,
  AdminUsersView,
  type StudentAnalyticsSummary,
} from '../components/admin/AdminUsersAndAuditView';

interface AdminDashboardLayoutProps {
  onNavigate: (route: AppRoute) => void;
}

export function AdminDashboardLayout({ onNavigate }: AdminDashboardLayoutProps) {
  const { lang, tr } = useLanguage();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeSection, setActiveSection] = useState<AdminSectionId>('overview');
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const [stats, setStats] = useState<AdminOverviewStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<AuditLogRecord[]>([]);
  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [rankings, setRankings] = useState<AdminRankingRecord[]>([]);
  const [circulars, setCirculars] = useState<AdminCircularRecord[]>([]);
  const [users, setUsers] = useState<UserAccountRecord[]>([]);
  const [studentAnalytics, setStudentAnalytics] = useState<StudentAnalyticsSummary | null>(null);
  const [admins, setAdmins] = useState<UserAccountRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [helpSettings, setHelpSettings] = useState<HelpSettingsRecord>(DEFAULT_HELP_SETTINGS);
  const [loadingData, setLoadingData] = useState(false);

  const adminRole = user?.accountType === 'admin' ? user.adminRole : null;

  const loadAdminWorkspace = useCallback(async () => {
    if (!adminRole) return;
    setLoadingData(true);
    try {
      const requests: Array<Promise<void>> = [
        apiFetch('/api/admin/overview').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setStats(d.stats);
            setRecentActivities(d.recentActivities ?? []);
          }
        }),
        apiFetch('/api/admin/institutions').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setInstitutions(d.institutions ?? []);
          }
        }),
        apiFetch('/api/admin/rankings').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setRankings(d.rankings ?? []);
          }
        }),
        apiFetch('/api/admin/circulars').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setCirculars(d.circulars ?? []);
          }
        }),
        apiFetch('/api/admin/users').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setUsers(d.users ?? []);
            setStudentAnalytics(d.analytics ?? null);
          }
        }),
        apiFetch('/api/admin/audit-logs').then(async (r) => {
          if (r.ok) {
            const d = await r.json();
            setAuditLogs(d.logs ?? []);
          }
        }),
        apiFetch('/api/admin/help-settings').then(async (r) => {
          if (r.ok) {
            const parsed = await parseJsonSafe<{ settings?: HelpSettingsRecord }>(r);
            if (parsed.data?.settings) {
              setHelpSettings(normalizeHelpSettingsRecord(parsed.data.settings));
            }
          }
        }),
      ];

      if (adminRole === 'super_admin') {
        requests.push(
          apiFetch('/api/admin/admins').then(async (r) => {
            if (r.ok) {
              const d = await r.json();
              setAdmins(d.admins ?? []);
            }
          })
        );
      } else {
        setAdmins([]);
      }

      await Promise.all(requests);
    } finally {
      setLoadingData(false);
    }
  }, [adminRole]);

  useEffect(() => {
    if (!authLoading && (!user || user.accountType !== 'admin' || !user.adminRole)) {
      onNavigate('/admin/login');
    }
  }, [authLoading, user, onNavigate]);

  useEffect(() => {
    if (adminRole) {
      void loadAdminWorkspace();
    }
  }, [adminRole, loadAdminWorkspace]);

  // If a regular admin somehow lands on manage_admins, redirect safely to overview
  useEffect(() => {
    if (adminRole && !canAccessAdminSection(adminRole, activeSection)) {
      setActiveSection('overview');
    }
  }, [adminRole, activeSection]);

  if (authLoading || !user || user.accountType !== 'admin' || !adminRole) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] flex items-center justify-center p-6">
        <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
          {lang === 'bn' ? 'অ্যাডমিন সেশন যাচাই হচ্ছে...' : 'Verifying administrator session...'}
        </p>
      </div>
    );
  }

  const roleLabel = adminRole === 'super_admin' ? tr('roleSuperAdmin') : tr('roleAdmin');

  const navItems: Array<{
    id: AdminSectionId;
    label: string;
    icon: typeof LayoutDashboard;
  }> = [
    { id: 'overview', label: tr('adminMenuOverview'), icon: LayoutDashboard },
    { id: 'institutions', label: tr('adminMenuInstitutions'), icon: Building2 },
    { id: 'rankings', label: tr('adminMenuRankings'), icon: Award },
    { id: 'circulars', label: tr('adminMenuCirculars'), icon: FileUp },
    { id: 'verification', label: tr('adminMenuVerification'), icon: FileSearch },
    { id: 'publications', label: tr('adminMenuPublications'), icon: ClipboardCheck },
    { id: 'users', label: tr('adminMenuUsers'), icon: Users },
    ...(adminRole === 'super_admin'
      ? [{ id: 'manage_admins' as AdminSectionId, label: tr('adminMenuManageAdmins'), icon: UserCog }]
      : []),
    { id: 'help_support', label: tr('adminMenuHelpSupport'), icon: LifeBuoy },
    { id: 'audit', label: tr('adminMenuAudit'), icon: History },
  ];

  const activeNav = navItems.find((item) => item.id === activeSection) ?? navItems[0];
  const isPermitted = canAccessAdminSection(adminRole, activeSection);

  const statCards = [
    {
      label: lang === 'bn' ? 'মোট প্রতিষ্ঠান' : 'Total Institutions',
      value: stats?.totalInstitutions ?? institutions.length,
    },
    {
      label: tr('statTotalUniversities'),
      value: stats?.universitiesExcludingMedical ?? 0,
    },
    { label: tr('statTotalCirculars'), value: stats?.uploadedCirculars ?? circulars.length },
    { label: tr('statRegisteredStudents'), value: stats?.registeredStudents ?? 0 },
    { label: tr('statPendingReviews'), value: stats?.pendingReviews ?? 0 },
    { label: tr('statActiveSessions'), value: stats?.activeSessions ?? 0 },
    { label: tr('statExpiredCirculars'), value: stats?.expiredCirculars ?? 0 },
  ];

  const handleSelectSection = (id: AdminSectionId) => {
    setActiveSection(id);
    setMobileDrawerOpen(false);
  };

  const handleSignOut = async () => {
    await logout();
    onNavigate('/admin/login');
  };

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between bg-[#0F172A] text-[#F8FAFC] dark:bg-[#0A0A0A] dark:border-r dark:border-[#222222] p-4">
      <div className="space-y-6">
        <div className="px-2 pt-1">
          <BrandLogo inverted onClick={() => onNavigate('/')} />
          <p className="mt-2 text-xs font-medium text-[#26A69A]">{tr('adminSidebarTitle')}</p>
        </div>

        <nav aria-label="Admin dashboard navigation" className="space-y-1">
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
          <p className="text-[11px] font-mono text-[#FFA726] truncate">{roleLabel}</p>
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
      <aside className="hidden lg:block lg:w-[264px] lg:shrink-0 lg:sticky lg:top-0 lg:h-screen">
        {sidebarContent}
      </aside>

      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
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
        <header className="sticky top-0 z-30 border-b border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#0A0A0A]">
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
                  {tr('adminSidebarTitle')}
                </span>
                <span className="text-[#94A3B8] dark:text-[#475569] hidden sm:inline">/</span>
                <span className="font-sans font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {activeNav.label}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <span className="hidden sm:inline-flex items-center gap-1.5 rounded-md border border-[#F57C00]/35 bg-[#F57C00]/10 px-2.5 py-1 text-xs font-semibold text-[#E65100] dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 dark:text-[#FFA726]">
                <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
                {roleLabel}
              </span>
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
          {!isPermitted ? (
            <section className="rounded-xl border border-[#F57C00]/35 bg-[#F57C00]/10 p-6 dark:border-[#FFA726]/40 dark:bg-[#FFA726]/12 space-y-3">
              <h2 className="font-display text-xl font-bold tracking-tight text-[#E65100] dark:text-[#FFA726]">
                {lang === 'bn' ? 'অনুমতি সীমাবদ্ধ (RBAC)' : 'Restricted by Role Permissions (RBAC)'}
              </h2>
              <p className="text-sm text-[#0F172A] dark:text-[#F8FAFC]">
                {lang === 'bn'
                  ? `আপনার বর্তমান ভূমিকা (${roleLabel}) এই মডিউলটি ব্যবহার করার জন্য অনুমোদিত নয়।`
                  : `Your authenticated role (${roleLabel}) does not have authorization for this module.`}
              </p>
              <button
                type="button"
                onClick={() => setActiveSection('overview')}
                className="inline-flex h-9 items-center rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505]"
              >
                {tr('adminMenuOverview')}
              </button>
            </section>
          ) : activeSection === 'overview' ? (
            <>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {statCards.slice(0, 4).map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] space-y-1.5"
                    >
                      <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        {stat.label}
                      </p>
                      <p className="font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        {loadingData ? '—' : stat.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {statCards.slice(4).map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-xl border border-[#E2E8F0] bg-white p-5 dark:border-[#222222] dark:bg-[#121212] space-y-1.5"
                    >
                      <p className="text-xs font-medium text-[#475569] dark:text-[#94A3B8]">
                        {stat.label}
                      </p>
                      <p className="font-mono text-2xl font-bold tabular-nums text-[#0F172A] dark:text-[#F8FAFC]">
                        {loadingData ? '—' : stat.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-2">
                <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  {lang === 'bn' ? 'সক্রিয় ভূমিকা ও অনুমতি' : `Active Role Scope — ${roleLabel}`}
                </h3>
                {adminRole === 'super_admin' ? (
                  <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? 'সুপার অ্যাডমিন (.env মালিক): টিম অ্যাডমিন যুক্ত/বাতিল/অপসারণসহ সার্কুলার, বিশ্ববিদ্যালয় তথ্য, র‍্যাঙ্কিং এবং অ্যানালিটিক্সের পূর্ণ নিয়ন্ত্রণ।'
                      : 'Super Admin (.env Owner): Full control across Manage Admins (invite, revoke, or remove team admins), admission circulars, university records, rankings, student analytics, and audit logs.'}
                  </p>
                ) : (
                  <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? 'টিম অ্যাডমিন: ভর্তি সার্কুলার প্রকাশ/সম্পাদনা, বিশ্ববিদ্যালয় ও র‍্যাঙ্কিং হালনাগাদ এবং শিক্ষার্থী অ্যানালিটিক্স দেখার পূর্ণ অনুমতি। প্রতিটি পরিবর্তনে আপনার নাম সংরক্ষিত হবে।'
                      : 'Admin (Team Member): Authorized to publish/edit admission circulars, update university records and rankings, and view student analytics. Every update automatically records your name/email attribution.'}
                  </p>
                )}
              </section>

              <section className="rounded-xl border border-[#E2E8F0] bg-white p-6 dark:border-[#222222] dark:bg-[#121212] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-sans text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'সাম্প্রতিক কার্যক্রম (অডিট ট্রেইল)' : 'Recent Audit Activity'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setActiveSection('verification')}
                    className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                  >
                    {lang === 'bn' ? 'ভেরিফিকেশন ওয়ার্কস্পেস →' : 'Open PDF Verification →'}
                  </button>
                </div>

                {recentActivities.length === 0 ? (
                  <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? 'এখনো কোনো অডিট কার্যক্রম রেকর্ড হয়নি।'
                      : 'No admin audit events recorded yet.'}
                  </p>
                ) : (
                  <ul className="divide-y divide-[#E2E8F0] dark:divide-[#222222] text-xs">
                    {recentActivities.slice(0, 8).map((act) => {
                      const updatedBy =
                        typeof act.details?.updatedBy === 'string' ? act.details.updatedBy : null;
                      return (
                        <li
                          key={act.id}
                          className="flex flex-col gap-1 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <span className="font-mono font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {act.action}
                            </span>{' '}
                            <span className="text-[#475569] dark:text-[#94A3B8]">
                              · {act.entityType} #{act.entityId} ({updatedBy || act.actorEmail})
                            </span>
                          </div>
                          <span className="font-mono text-[11px] text-[#475569] dark:text-[#94A3B8]">
                            {new Date(act.createdAt).toLocaleString()}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            </>
          ) : activeSection === 'institutions' ? (
            <AdminInstitutionsView
              institutions={institutions}
              adminRole={adminRole}
              onRefresh={loadAdminWorkspace}
            />
          ) : activeSection === 'rankings' ? (
            <AdminRankingsView
              rankings={rankings}
              adminRole={adminRole}
              onRefresh={loadAdminWorkspace}
            />
          ) : activeSection === 'circulars' ||
            activeSection === 'verification' ||
            activeSection === 'publications' ? (
            <AdminCircularsAndVerificationView
              mode={activeSection}
              adminRole={adminRole}
              institutions={institutions}
              circulars={circulars}
              onRefresh={loadAdminWorkspace}
            />
          ) : activeSection === 'users' ? (
            <AdminUsersView
              users={users}
              analytics={studentAnalytics}
              onRefresh={loadAdminWorkspace}
            />
          ) : activeSection === 'manage_admins' && adminRole === 'super_admin' ? (
            <AdminManageAdminsView
              adminRole={adminRole}
              currentUserId={user.id}
              admins={admins}
              onRefresh={loadAdminWorkspace}
            />
          ) : activeSection === 'help_support' ? (
            <AdminHelpSettingsView
              initialSettings={helpSettings}
              onRefresh={loadAdminWorkspace}
              onSettingsUpdated={setHelpSettings}
            />
          ) : (
            <AdminAuditLogsView logs={auditLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
