import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Calculator,
  Cpu,
  ExternalLink,
  FileText,
  GraduationCap,
  Landmark,
  Layers,
  ShieldCheck,
  Sprout,
  Stethoscope,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ADMISSION_CATEGORIES } from '../data/demoInstitutions';
import type { AdmissionCategoryId, AppRoute, InstitutionRecord } from '../types/domain';
import { calculatePrivateUniversityCost } from '../utils/costEstimator';
import { buildCircularNotifications } from '../utils/circularNotifications';
import { SafeImage } from '../components/common/SafeImage';
import { BrandQuadrantMark } from '../components/common/BrandLogo';
import { UniversityHeaderVisual } from '../components/common/UniversityHeaderVisual';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { NavigationDrawer, type DrawerSectionId } from '../components/layout/NavigationDrawer';
import { Footer } from '../components/layout/Footer';
import { PublicEligibilityCheckerPanel } from '../components/landing/PublicEligibilityCheckerPanel';
import { NotificationsSection } from '../components/landing/NotificationsSection';
import { UniversityRankingSection } from '../components/landing/UniversityRankingSection';
import { BestForUFlow } from '../components/landing/BestForUFlow';
import { AboutSection } from '../components/landing/AboutSection';
import { StudentProfileAndReportSection } from '../components/student/StudentProfileAndReportSection';
import {
  buildLoginUrlWithRedirect,
  getTargetForDrawerSection,
  getTargetForRoute,
  isProtectedFeatureRoute,
  saveRedirectAfterLogin,
} from '../utils/authRedirect';
import studyHallImg from '../assets/images/study_hall_editorial_1794729746373.jpg';

interface LandingPageProps {
  currentRoute?: AppRoute;
  onNavigate: (route: AppRoute | string, anchorId?: string) => void;
  initialFeature?: DrawerSectionId;
  initialProfileTab?: 'profile' | 'report';
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
}

type DirectoryFilterId = AdmissionCategoryId | 'agriculture' | 'all';

const PAGE_SIZE = 18;

const HERO_CATEGORY_CARDS: Array<{
  id: Exclude<DirectoryFilterId, 'all' | 'national'>;
  icon: typeof Landmark;
  titleEn: string;
  titleBn: string;
  cardClass: string;
  activeCardClass: string;
  badgeClass: string;
  iconClass: string;
  delayMs: string;
}> = [
  {
    id: 'public',
    icon: Landmark,
    titleEn: 'Public',
    titleBn: 'পাবলিক',
    cardClass:
      'border-[#BFDBFE] hover:border-[#2563EB] hover:shadow-[0_10px_28px_rgba(37,99,235,0.14)] dark:border-[#222222] dark:hover:border-[#60A5FA]/70 dark:hover:shadow-[0_0_24px_rgba(96,165,250,0.18)]',
    activeCardClass:
      'border-[#1D4ED8] bg-[#EFF6FF] ring-2 ring-[#2563EB]/25 shadow-[0_10px_28px_rgba(37,99,235,0.18)] dark:border-[#60A5FA] dark:bg-[#60A5FA]/10 dark:ring-[#60A5FA]/25',
    badgeClass:
      'border-[#93C5FD] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] shadow-[0_0_16px_rgba(37,99,235,0.16)] dark:border-[#60A5FA]/40 dark:from-[#60A5FA]/20 dark:to-[#3B82F6]/10',
    iconClass: 'text-[#1D4ED8] dark:text-[#60A5FA]',
    delayMs: '0ms',
  },
  {
    id: 'private',
    icon: GraduationCap,
    titleEn: 'Private',
    titleBn: 'প্রাইভেট',
    cardClass:
      'border-[#FECACA] hover:border-[#D32F2F] hover:shadow-[0_10px_28px_rgba(211,47,47,0.14)] dark:border-[#222222] dark:hover:border-[#FF4D4D]/70 dark:hover:shadow-[0_0_24px_rgba(255,77,77,0.18)]',
    activeCardClass:
      'border-[#D32F2F] bg-[#FEF2F2] ring-2 ring-[#D32F2F]/25 shadow-[0_10px_28px_rgba(211,47,47,0.18)] dark:border-[#FF4D4D] dark:bg-[#FF4D4D]/10 dark:ring-[#FF4D4D]/25',
    badgeClass:
      'border-[#FCA5A5] bg-gradient-to-br from-[#FEF2F2] to-[#FEE2E2] shadow-[0_0_16px_rgba(211,47,47,0.16)] dark:border-[#FF4D4D]/40 dark:from-[#FF4D4D]/20 dark:to-[#D32F2F]/10',
    iconClass: 'text-[#D32F2F] dark:text-[#FF4D4D]',
    delayMs: '180ms',
  },
  {
    id: 'engineering',
    icon: Cpu,
    titleEn: 'Engineering',
    titleBn: 'প্রকৌশল',
    cardClass:
      'border-[#FED7AA] hover:border-[#F57C00] hover:shadow-[0_10px_28px_rgba(245,124,0,0.14)] dark:border-[#222222] dark:hover:border-[#FFA726]/70 dark:hover:shadow-[0_0_24px_rgba(255,167,38,0.18)]',
    activeCardClass:
      'border-[#F57C00] bg-[#FFF7ED] ring-2 ring-[#F57C00]/25 shadow-[0_10px_28px_rgba(245,124,0,0.18)] dark:border-[#FFA726] dark:bg-[#FFA726]/10 dark:ring-[#FFA726]/25',
    badgeClass:
      'border-[#FDBA74] bg-gradient-to-br from-[#FFF7ED] to-[#FFEDD5] shadow-[0_0_16px_rgba(245,124,0,0.16)] dark:border-[#FFA726]/40 dark:from-[#FFA726]/20 dark:to-[#F57C00]/10',
    iconClass: 'text-[#E65100] dark:text-[#FFA726]',
    delayMs: '360ms',
  },
  {
    id: 'medical',
    icon: Stethoscope,
    titleEn: 'Medical',
    titleBn: 'মেডিকেল',
    cardClass:
      'border-[#BBF7D0] hover:border-[#388E3C] hover:shadow-[0_10px_28px_rgba(56,142,60,0.14)] dark:border-[#222222] dark:hover:border-[#66BB6A]/70 dark:hover:shadow-[0_0_24px_rgba(102,187,106,0.18)]',
    activeCardClass:
      'border-[#388E3C] bg-[#F0FDF4] ring-2 ring-[#388E3C]/25 shadow-[0_10px_28px_rgba(56,142,60,0.18)] dark:border-[#66BB6A] dark:bg-[#66BB6A]/10 dark:ring-[#66BB6A]/25',
    badgeClass:
      'border-[#86EFAC] bg-gradient-to-br from-[#F0FDF4] to-[#DCFCE7] shadow-[0_0_16px_rgba(56,142,60,0.16)] dark:border-[#66BB6A]/40 dark:from-[#66BB6A]/20 dark:to-[#388E3C]/10',
    iconClass: 'text-[#2E7D32] dark:text-[#66BB6A]',
    delayMs: '540ms',
  },
  {
    id: 'agriculture',
    icon: Sprout,
    titleEn: 'Agriculture',
    titleBn: 'কৃষি',
    cardClass:
      'border-[#99F6E4] hover:border-[#00796B] hover:shadow-[0_10px_28px_rgba(0,121,107,0.14)] dark:border-[#222222] dark:hover:border-[#26A69A]/70 dark:hover:shadow-[0_0_24px_rgba(38,166,154,0.18)]',
    activeCardClass:
      'border-[#00796B] bg-[#F0FDFA] ring-2 ring-[#00796B]/25 shadow-[0_10px_28px_rgba(0,121,107,0.18)] dark:border-[#26A69A] dark:bg-[#26A69A]/10 dark:ring-[#26A69A]/25',
    badgeClass:
      'border-[#5EEAD4] bg-gradient-to-br from-[#F0FDFA] to-[#CCFBF1] shadow-[0_0_16px_rgba(0,121,107,0.16)] dark:border-[#26A69A]/40 dark:from-[#26A69A]/20 dark:to-[#00796B]/10',
    iconClass: 'text-[#00796B] dark:text-[#26A69A]',
    delayMs: '720ms',
  },
  {
    id: 'gst',
    icon: Layers,
    titleEn: 'GST',
    titleBn: 'জিএসটি',
    cardClass:
      'border-[#FDE68A] hover:border-[#D97706] hover:shadow-[0_10px_28px_rgba(217,119,6,0.14)] dark:border-[#222222] dark:hover:border-[#FBBF24]/70 dark:hover:shadow-[0_0_24px_rgba(251,191,36,0.18)]',
    activeCardClass:
      'border-[#D97706] bg-[#FFFBEB] ring-2 ring-[#D97706]/25 shadow-[0_10px_28px_rgba(217,119,6,0.18)] dark:border-[#FBBF24] dark:bg-[#FBBF24]/10 dark:ring-[#FBBF24]/25',
    badgeClass:
      'border-[#FCD34D] bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] shadow-[0_0_16px_rgba(217,119,6,0.16)] dark:border-[#FBBF24]/40 dark:from-[#FBBF24]/20 dark:to-[#D97706]/10',
    iconClass: 'text-[#B45309] dark:text-[#FBBF24]',
    delayMs: '900ms',
  },
];

function matchesDirectoryFilter(inst: InstitutionRecord, filterId: DirectoryFilterId): boolean {
  if (filterId === 'all') return true;
  if (filterId === 'agriculture') {
    const typeLower = inst.institutionType.toLowerCase();
    const nameLower = inst.nameEn.toLowerCase();
    return (
      typeLower.includes('agricultural') ||
      nameLower.includes('agricultural') ||
      nameLower.includes('veterinary')
    );
  }
  return inst.category === filterId;
}

export function LandingPage({
  currentRoute = '/',
  onNavigate,
  initialFeature = 'home',
  initialProfileTab = 'profile',
  searchQuery: controlledSearchQuery,
  onSearchChange: controlledOnSearchChange,
}: LandingPageProps) {
  const { lang, tr } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isStudentLoggedIn = !authLoading && user?.accountType === 'student';

  const [institutions, setInstitutions] = useState<InstitutionRecord[]>([]);
  const [loadingInsts, setLoadingInsts] = useState(true);
  const [internalSearchQuery, setInternalSearchQuery] = useState('');
  const searchQuery = controlledSearchQuery ?? internalSearchQuery;
  const setSearchQuery = (next: string) => {
    if (controlledOnSearchChange) {
      controlledOnSearchChange(next);
    } else {
      setInternalSearchQuery(next);
    }
  };
  const [selectedCategory, setSelectedCategory] = useState<DirectoryFilterId>('all');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<DrawerSectionId>(() =>
    currentRoute === '/about'
      ? 'about'
      : isProtectedFeatureRoute(currentRoute)
        ? 'home'
        : initialFeature
  );
  const [profileReportTab, setProfileReportTab] = useState<'profile' | 'report'>(initialProfileTab);

  const [selectedInstitution, setSelectedInstitution] = useState<InstitutionRecord | null>(null);
  const [showPdfPreview, setShowPdfPreview] = useState(false);
  const [waiverPercent, setWaiverPercent] = useState(0);
  const [semesters, setSemesters] = useState(8);

  // Strict route & session guard: redirect unauthenticated visitors directly to /login?redirect=...
  useEffect(() => {
    const routeTarget = getTargetForRoute(currentRoute);
    if (!routeTarget) {
      if (currentRoute === '/about') {
        setActiveFeature('about');
      } else if (currentRoute === '/') {
        setActiveFeature('home');
      }
      return;
    }

    if (authLoading) {
      setActiveFeature('home');
      return;
    }

    if (user?.accountType !== 'student') {
      setActiveFeature('home');
      saveRedirectAfterLogin(routeTarget);
      onNavigate(buildLoginUrlWithRedirect(routeTarget.route));
      return;
    }

    if (routeTarget.profileTab) {
      setProfileReportTab(routeTarget.profileTab);
    }
    setActiveFeature(routeTarget.section);
  }, [currentRoute, authLoading, user, onNavigate]);

  useEffect(() => {
    let active = true;
    fetch('/api/institutions')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to load'))))
      .then((data: { institutions: InstitutionRecord[] }) => {
        if (active && Array.isArray(data.institutions)) {
          setInstitutions(data.institutions);
        }
      })
      .catch(() => {
        // Keep empty state gracefully if unreachable
      })
      .finally(() => {
        if (active) setLoadingInsts(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const activeNotificationCount = useMemo(
    () => buildCircularNotifications(institutions).filter((n) => n.urgency !== 'expired').length,
    [institutions]
  );

  const filteredInstitutions = useMemo(() => {
    const normalized = searchQuery.trim().toLowerCase();
    return institutions.filter((inst) => {
      if (!matchesDirectoryFilter(inst, selectedCategory)) return false;
      if (!normalized) return true;
      return (
        inst.code.toLowerCase().includes(normalized) ||
        inst.nameEn.toLowerCase().includes(normalized) ||
        inst.nameBn.toLowerCase().includes(normalized) ||
        inst.city.toLowerCase().includes(normalized) ||
        inst.locationEn.toLowerCase().includes(normalized) ||
        inst.institutionType.toLowerCase().includes(normalized) ||
        inst.programsEn.some((p) => p.toLowerCase().includes(normalized)) ||
        inst.programsBn.some((p) => p.toLowerCase().includes(normalized))
      );
    });
  }, [institutions, searchQuery, selectedCategory]);

  const visibleInstitutions = filteredInstitutions.slice(0, visibleCount);

  const handleSelectFeature = (section: DrawerSectionId) => {
    if (section === 'home') {
      setActiveFeature('home');
      if (window.location.pathname !== '/') {
        onNavigate('/');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    if (section === 'about') {
      setActiveFeature('about');
      if (window.location.pathname !== '/about') {
        onNavigate('/about');
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return;
    }

    const target = getTargetForDrawerSection(section);
    if (!isStudentLoggedIn) {
      setDrawerOpen(false);
      if (target) {
        saveRedirectAfterLogin(target);
      }
      onNavigate(buildLoginUrlWithRedirect(target?.route));
      return;
    }

    if (target) {
      if (target.profileTab) {
        setProfileReportTab(target.profileTab);
      }
      setActiveFeature(target.section);
      if (window.location.pathname !== target.route) {
        onNavigate(target.route);
      }
    }
    window.setTimeout(() => {
      document.getElementById('dedicated-feature-view')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleOpenProfileSection = (tab: 'profile' | 'report') => {
    handleSelectFeature(tab === 'report' ? 'saved-reports' : 'profile');
  };

  const handleAfterSignOut = () => {
    saveRedirectAfterLogin(null);
    setActiveFeature('home');
    onNavigate('/');
  };

  const scrollToDirectory = () => {
    setActiveFeature('home');
    window.setTimeout(() => {
      document.getElementById('universities')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 40);
  };

  const handleCategoryCardClick = (catId: DirectoryFilterId) => {
    setSelectedCategory((prev) => (prev === catId ? 'all' : catId));
    setVisibleCount(PAGE_SIZE);
    scrollToDirectory();
  };

  const handleInspectByCode = (code: string) => {
    const found = institutions.find((i) => i.code === code);
    if (found) {
      openModal(found);
    } else {
      setSearchQuery(code);
      handleSelectFeature('universities');
    }
  };

  const openModal = (inst: InstitutionRecord) => {
    setSelectedInstitution(inst);
    setShowPdfPreview(false);
    setWaiverPercent(0);
    setSemesters(8);
  };

  const modalCostEstimate =
    selectedInstitution?.perCreditFeeBdt && selectedInstitution?.totalCredits
      ? calculatePrivateUniversityCost({
          perCreditFeeBdt: selectedInstitution.perCreditFeeBdt,
          totalCredits: selectedInstitution.totalCredits,
          semesterFeeBdt: selectedInstitution.semesterFeeBdt ?? 0,
          semesters,
          admissionFeeBdt: selectedInstitution.admissionFeeBdt ?? 0,
          waiverPercent,
        })
      : null;

  return (
    <div id="top" className="min-h-screen flex flex-col bg-[#F8FAFC] text-[#0F172A] dark:bg-[#050505] dark:text-[#F8FAFC]">
      <PublicNavbar
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogoClick={() => handleSelectFeature('home')}
        onNavigate={onNavigate}
        onOpenProfileSection={handleOpenProfileSection}
        onAfterSignOut={handleAfterSignOut}
        searchQuery={searchQuery}
        onSearchChange={(value) => {
          setSearchQuery(value);
          setVisibleCount(PAGE_SIZE);
        }}
        onSearchSubmit={(value) => {
          setSearchQuery(value);
          setVisibleCount(PAGE_SIZE);
          setActiveFeature('home');
          if (window.location.pathname !== '/') {
            onNavigate('/', 'universities');
          } else {
            window.setTimeout(() => {
              document
                .getElementById('universities')
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 40);
          }
        }}
        institutions={institutions}
        showQuickResultsDropdown={activeFeature !== 'home'}
        onSelectQuickInstitution={openModal}
      />

      <NavigationDrawer
        open={drawerOpen}
        activeSection={activeFeature}
        activeNotificationCount={activeNotificationCount}
        onClose={() => setDrawerOpen(false)}
        onSelectSection={handleSelectFeature}
        onNavigate={onNavigate}
        onAfterSignOut={handleAfterSignOut}
      />

      <main className="flex-1">
        {/* Public About Page vs Public Home Overview vs Authenticated Inner Feature Views */}
        {activeFeature === 'about' ? (
          <AboutSection
            onBackToHome={() => handleSelectFeature('home')}
            onNavigate={onNavigate}
          />
        ) : activeFeature === 'home' || !isStudentLoggedIn ? (
          <>
            {/* Minimal Centered Hero Header (Animated Quadrilateral Logo + "Dream University" Title Only) + 6 Category Cards */}
            <section className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 sm:pt-14 lg:px-8">
              <div className="flex flex-col items-center text-center">
                <div
                  data-testid="hero-quadrilateral-logo"
                  className="group relative inline-flex items-center justify-center animate-quad-float"
                >
                  {/* Soft multi-brand glowing aura behind tilted-diamond frame */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -inset-3 rounded-3xl bg-gradient-to-tr from-[#00796B]/25 via-[#F57C00]/20 to-[#D32F2F]/25 blur-lg opacity-85 transition-opacity duration-300 group-hover:opacity-100 dark:from-[#26A69A]/30 dark:via-[#FFA726]/20 dark:to-[#FF4D4D]/25"
                  />

                  {/* Tilted-diamond / geometric 4-sided glassmorphic quadrilateral frame */}
                  <div className="relative flex h-20 w-20 sm:h-24 sm:w-24 rotate-45 items-center justify-center overflow-hidden rounded-2xl border border-[#00796B]/45 bg-white/95 backdrop-blur-md transition-transform duration-500 ease-out group-hover:rotate-[54deg] group-hover:scale-105 animate-quad-glow dark:border-[#26A69A]/50 dark:bg-[#121212]/90">
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#00796B]/10 via-transparent to-[#F57C00]/10 dark:from-[#26A69A]/15 dark:to-[#FFA726]/10"
                    />
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute -inset-y-4 -left-10 w-8 rotate-12 bg-white/50 blur-[2px] transition-transform duration-700 ease-out group-hover:translate-x-36 dark:bg-[#26A69A]/20"
                    />
                    <BrandQuadrantMark
                      className="relative z-10 h-11 w-11 sm:h-14 sm:w-14 -rotate-45 transition-transform duration-500 ease-out group-hover:-rotate-[54deg]"
                    />
                  </div>
                </div>

                <h1 className="mt-7 font-display text-3xl font-extrabold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-4xl lg:text-5xl">
                  {tr('brandName')}
                </h1>

                <p className="font-sans max-w-2xl mx-auto mt-3 mb-8 text-sm md:text-base leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn'
                    ? 'বাংলাদেশের উচ্চশিক্ষা ভর্তির সম্পূর্ণ ডিজিটাল প্ল্যাটফর্ম। দেশের সকল সরকারি, বেসরকারি, ইঞ্জিনিয়ারিং, মেডিকেল, কৃষি ও জিএসটি গুচ্ছ বিশ্ববিদ্যালয়ের তথ্য জানুন, এসএসসি ও এইচএসসি ফলাফল অনুযায়ী নিজের যোগ্যতা যাচাই করুন, চলমান ভর্তি সার্কুলার দেখুন এবং ক্যারিয়ার অ্যাসেসমেন্টের মাধ্যমে সঠিক বিষয় নির্বাচন করুন।'
                    : 'Your all-in-one admission companion for higher education in Bangladesh. Explore verified Public, Private, Engineering, Medical, Agriculture, and GST institutions, check instant SSC & HSC unit eligibility, track live admission circulars, compare tuition budgets, and discover your ideal subject through our smart career assessment.'}
                </p>
              </div>

              <div
                data-testid="hero-category-grid"
                className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
              >
                {HERO_CATEGORY_CARDS.map((cat) => {
                  const Icon = cat.icon;
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      data-testid={`hero-category-card-${cat.id}`}
                      onClick={() => handleCategoryCardClick(cat.id)}
                      aria-pressed={isActive}
                      className={`group flex flex-col items-center justify-center gap-3.5 rounded-2xl border bg-white/95 px-4 py-6 text-center backdrop-blur-md transition-all duration-300 hover:-translate-y-1 dark:bg-[#121212] ${
                        isActive ? cat.activeCardClass : cat.cardClass
                      }`}
                    >
                      <span
                        style={{ animationDelay: cat.delayMs }}
                        className={`inline-flex h-12 w-12 items-center justify-center rounded-xl border transition-all duration-300 animate-cat-float group-hover:scale-110 group-hover:rotate-3 ${cat.badgeClass}`}
                      >
                        <Icon className={`h-5 w-5 ${cat.iconClass}`} aria-hidden="true" />
                      </span>
                      <span className="font-sans text-sm sm:text-base font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                        {lang === 'bn' ? cat.titleBn : cat.titleEn}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Universities Directory Section */}
            <section id="universities" className="scroll-mt-20 mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-5 mb-8">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-2xl space-y-1.5">
                    <p className="text-xs font-semibold tracking-wider text-[#00796B] dark:text-[#26A69A] uppercase">
                      {lang === 'bn' ? 'বাংলাদেশ উচ্চশিক্ষা ডিরেক্টরি' : 'Admission Directory'}
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
                      {lang === 'bn' ? 'বাংলাদেশের স্বীকৃত বিশ্ববিদ্যালয় ও কলেজসমূহ' : 'Universities & Colleges Across Bangladesh'}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                      {lang === 'bn'
                        ? 'প্রতিষ্ঠার সাল, বিভাগ, প্রোগ্রাম, টিউশন খরচ ও অফিশিয়াল সার্কুলার পিডিএফসহ সরাসরি ডেটাবেস থেকে পরিচালিত।'
                        : 'Explore UGC-approved Public, Private, Engineering, Medical, GST, and National University institutions with verified rules and tuition details.'}
                    </p>
                  </div>

                  {!loadingInsts && (
                    <p className="font-mono text-xs font-semibold tabular-nums text-[#475569] dark:text-[#94A3B8] shrink-0">
                      {lang === 'bn'
                        ? `দেখানো হচ্ছে ${visibleInstitutions.length} / ${filteredInstitutions.length}টি প্রতিষ্ঠান`
                        : `Showing ${visibleInstitutions.length} of ${filteredInstitutions.length} institutions`}
                    </p>
                  )}
                </div>

                {/* Category Filter Bar */}
                <div className="flex flex-wrap items-center gap-3">
                  <div
                    role="group"
                    aria-label="Filter institutions by category"
                    className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white p-1.5 w-fit max-w-full overflow-x-auto dark:border-[#222222] dark:bg-[#121212]"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        setVisibleCount(PAGE_SIZE);
                      }}
                      aria-pressed={selectedCategory === 'all'}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === 'all'
                          ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                          : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {tr('allCategoriesFilter')}
                    </button>
                    {ADMISSION_CATEGORIES.map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat.id);
                          setVisibleCount(PAGE_SIZE);
                        }}
                        aria-pressed={selectedCategory === cat.id}
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          selectedCategory === cat.id
                            ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                            : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                        }`}
                      >
                        {tr(cat.titleKey)}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('agriculture');
                        setVisibleCount(PAGE_SIZE);
                      }}
                      aria-pressed={selectedCategory === 'agriculture'}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === 'agriculture'
                          ? 'bg-[#388E3C] text-white dark:bg-[#66BB6A] dark:text-[#050505]'
                          : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {lang === 'bn' ? 'কৃষি বিশ্ববিদ্যালয়' : 'Agriculture'}
                    </button>
                  </div>
                </div>
              </div>

              {loadingInsts ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <div
                      key={idx}
                      className="h-72 animate-pulse rounded-xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212]"
                    />
                  ))}
                </div>
              ) : filteredInstitutions.length === 0 ? (
                <div className="rounded-xl border border-[#E2E8F0] bg-white p-10 text-center space-y-4 dark:border-[#222222] dark:bg-[#121212]">
                  <p className="text-sm text-[#475569] dark:text-[#94A3B8]">{tr('noSearchResults')}</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('all');
                      setVisibleCount(PAGE_SIZE);
                    }}
                    className="inline-flex h-10 items-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
                  >
                    {tr('clearFiltersBtn')}
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {visibleInstitutions.map((inst) => {
                      const hasVerified = inst.verifiedRules.length > 0;
                      const primaryCircular = inst.publishedCirculars[0];
                      return (
                        <article
                          key={inst.id}
                          className="flex flex-col justify-between overflow-hidden rounded-xl border-[1.5px] border-[#A13D2D] bg-white transition-all hover:shadow-md hover:border-[#8A3224] dark:border-[#A13D2D] dark:bg-[#121212] dark:hover:border-[#8A3224]"
                        >
                          <div>
                            <div className="h-40 w-full overflow-hidden border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A]">
                              <UniversityHeaderVisual
                                imageUrl={inst.imageUrl}
                                alt={lang === 'bn' ? inst.imageAltBn : inst.imageAltEn}
                                code={inst.code}
                                name={lang === 'bn' ? inst.nameBn : inst.nameEn}
                                city={inst.city}
                                establishedYear={inst.establishedYear}
                                category={inst.category}
                                institutionType={lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}
                                lang={lang}
                              />
                            </div>

                            <div className="p-4 space-y-2">
                              <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                                <span className="font-mono font-semibold text-[#00796B] dark:text-[#26A69A]">
                                  {inst.code}
                                </span>
                                <span aria-hidden="true">•</span>
                                <span className="truncate">
                                  {lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}
                                </span>
                                <span aria-hidden="true">•</span>
                                <span className="truncate">{inst.city}</span>
                                {inst.establishedYear && (
                                  <>
                                    <span aria-hidden="true">•</span>
                                    <span className="tabular-nums shrink-0">
                                      {lang === 'bn' ? `স্থাপিত ${inst.establishedYear}` : `Est. ${inst.establishedYear}`}
                                    </span>
                                  </>
                                )}
                              </div>

                              <h3 className="font-sans text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug line-clamp-2">
                                {lang === 'bn' ? inst.nameBn : inst.nameEn}
                              </h3>

                              <p className="line-clamp-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                                {lang === 'bn' ? inst.shortNoteBn : inst.shortNoteEn}
                              </p>

                              {inst.institutionType === 'Medical College' && (
                                <p className="text-[11px] font-semibold text-[#D32F2F] dark:text-[#FF4D4D]">
                                  {tr('medicalCollegeClarification')}
                                </p>
                              )}

                              <div className="pt-2 border-t border-[#E2E8F0] dark:border-[#222222] text-xs text-[#475569] dark:text-[#94A3B8] space-y-1">
                                <p className="line-clamp-1">
                                  <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                                    {lang === 'bn' ? 'প্রোগ্রাম:' : 'Programs:'}
                                  </span>{' '}
                                  {(lang === 'bn' ? inst.programsBn : inst.programsEn).join(', ')}
                                </p>
                                {inst.estimatedTotalCostBdt && (
                                  <p className="tabular-nums text-[11px] font-medium text-[#E65100] dark:text-[#FFA726] truncate">
                                    {lang === 'bn' ? 'আনুমানিক মোট খরচ:' : 'Est. Total Cost:'} BDT{' '}
                                    {inst.estimatedTotalCostBdt.toLocaleString()}
                                  </p>
                                )}
                                {hasVerified && (
                                  <p className="text-[11px] text-[#388E3C] dark:text-[#66BB6A] font-medium truncate">
                                    {lang === 'bn'
                                      ? `যাচাইকৃত সার্কুলার (${primaryCircular?.session ?? ''})`
                                      : `Verified Official Rule (${primaryCircular?.session ?? ''})`}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Single Clean Action: View Details Only */}
                          <div className="mx-4 mb-4 pt-3 border-t border-[#E2E8F0] dark:border-[#222222]">
                            <button
                              type="button"
                              onClick={() => openModal(inst)}
                              className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] hover:bg-[#00796B]/5 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A] dark:hover:bg-[#26A69A]/10"
                            >
                              {tr('viewDetailsBtn')}
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>

                  {visibleCount < filteredInstitutions.length && (
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                        className="inline-flex h-11 items-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
                      >
                        {lang === 'bn'
                          ? `আরও ১৮টি দেখুন (${filteredInstitutions.length - visibleCount}টি বাকি)`
                          : `Show More (+${Math.min(PAGE_SIZE, filteredInstitutions.length - visibleCount)})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleCount(filteredInstitutions.length)}
                        className="inline-flex h-11 items-center rounded-xl bg-[#00796B] px-5 text-xs font-semibold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.22)] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
                      >
                        {lang === 'bn'
                          ? `সব ${filteredInstitutions.length}টি দেখুন`
                          : `Show All (${filteredInstitutions.length})`}
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Platform Integrity / About Section (No Duplicate Feature Buttons) */}
            <section id="about" className="scroll-mt-20 mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8">
              <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white dark:border-[#222222] dark:bg-[#121212]">
                <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
                  <div className="lg:col-span-5 bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                    <SafeImage
                      src={studyHallImg}
                      alt={tr('aiPreviewImageAlt')}
                      fallbackTitle={tr('aboutTitle')}
                      className="h-64 w-full object-cover lg:h-full"
                    />
                  </div>
                  <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center space-y-4">
                    <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider text-[#00796B] dark:text-[#26A69A] uppercase">
                      <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                      {tr('aboutEyebrow')}
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC] sm:text-3xl">
                      {tr('aboutTitle')}
                    </h2>
                    <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8] sm:text-base">
                      {tr('aboutBody')}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          user?.accountType === 'student'
                            ? handleOpenProfileSection('profile')
                            : onNavigate('/login')
                        }
                        className="inline-flex h-10 items-center rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.22)] dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
                      >
                        {user?.accountType === 'student'
                          ? lang === 'bn'
                            ? 'আমার একাডেমিক প্রোফাইল ও রিপোর্ট'
                            : 'My Academic Profile & Report'
                          : tr('navLogin')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* Authenticated Inner Feature Views */
          <section
            id="dedicated-feature-view"
            className="scroll-mt-20 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6"
          >
            <div className="flex items-center justify-between gap-4 border-b border-[#E2E8F0] pb-4 dark:border-[#222222]">
              <button
                type="button"
                onClick={() => handleSelectFeature('home')}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-white px-3.5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
              >
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {lang === 'bn' ? 'হোম ওভারভিউতে ফিরুন' : 'Back to Home Overview'}
              </button>
            </div>

            {activeFeature === 'universities' && (
              <div id="universities-directory" className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold tracking-wider text-[#00796B] dark:text-[#26A69A] uppercase">
                      {lang === 'bn' ? 'বাংলাদেশ উচ্চশিক্ষা ডিরেক্টরি' : 'Admission Directory'}
                    </p>
                    <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                      {lang === 'bn' ? 'বাংলাদেশের স্বীকৃত বিশ্ববিদ্যালয় ও কলেজসমূহ' : 'Universities Directory'}
                    </h2>
                  </div>
                  <p className="font-mono text-xs font-semibold tabular-nums text-[#475569] dark:text-[#94A3B8] shrink-0">
                    {lang === 'bn'
                      ? `দেখানো হচ্ছে ${visibleInstitutions.length} / ${filteredInstitutions.length}টি প্রতিষ্ঠান`
                      : `Showing ${visibleInstitutions.length} of ${filteredInstitutions.length} institutions`}
                  </p>
                </div>

                <div
                  role="group"
                  aria-label="Filter directory institutions by category"
                  className="flex flex-wrap lg:flex-nowrap items-center gap-1.5 rounded-xl border border-[#E2E8F0] bg-white p-1.5 w-fit max-w-full overflow-x-auto dark:border-[#222222] dark:bg-[#121212]"
                >
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setVisibleCount(PAGE_SIZE);
                    }}
                    aria-pressed={selectedCategory === 'all'}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      selectedCategory === 'all'
                        ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                        : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                    }`}
                  >
                    {tr('allCategoriesFilter')}
                  </button>
                  {ADMISSION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setVisibleCount(PAGE_SIZE);
                      }}
                      aria-pressed={selectedCategory === cat.id}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-[#00796B] text-white dark:bg-[#26A69A] dark:text-[#050505]'
                          : 'text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {tr(cat.titleKey)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {visibleInstitutions.map((inst) => (
                    <article
                      key={inst.id}
                      className="flex flex-col justify-between overflow-hidden rounded-xl border-[1.5px] border-[#A13D2D] bg-white transition-all hover:shadow-md hover:border-[#8A3224] dark:border-[#A13D2D] dark:bg-[#121212] dark:hover:border-[#8A3224]"
                    >
                      <div>
                        <div className="h-40 w-full overflow-hidden border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A]">
                          <UniversityHeaderVisual
                            imageUrl={inst.imageUrl}
                            alt={lang === 'bn' ? inst.imageAltBn : inst.imageAltEn}
                            code={inst.code}
                            name={lang === 'bn' ? inst.nameBn : inst.nameEn}
                            city={inst.city}
                            establishedYear={inst.establishedYear}
                            category={inst.category}
                            institutionType={lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}
                            lang={lang}
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                            <span className="font-mono font-bold text-[#00796B] dark:text-[#26A69A]">
                              {inst.code}
                            </span>
                            <span aria-hidden="true">•</span>
                            <span className="truncate">{lang === 'bn' ? inst.institutionTypeBn : inst.institutionType}</span>
                            <span aria-hidden="true">•</span>
                            <span className="truncate">{inst.city}</span>
                            {inst.establishedYear && (
                              <>
                                <span aria-hidden="true">•</span>
                                <span className="tabular-nums shrink-0">
                                  {lang === 'bn' ? `স্থাপিত ${inst.establishedYear}` : `Est. ${inst.establishedYear}`}
                                </span>
                              </>
                            )}
                          </div>
                          <h3 className="font-sans text-lg font-bold text-[#0F172A] dark:text-[#F8FAFC] leading-snug line-clamp-2">
                            {lang === 'bn' ? inst.nameBn : inst.nameEn}
                          </h3>
                          <p className="line-clamp-2 text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                            {lang === 'bn' ? inst.shortNoteBn : inst.shortNoteEn}
                          </p>
                          <p className="line-clamp-1 pt-1.5 border-t border-[#E2E8F0] dark:border-[#222222] text-xs text-[#475569] dark:text-[#94A3B8]">
                            <span className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                              {lang === 'bn' ? 'প্রোগ্রাম:' : 'Programs:'}
                            </span>{' '}
                            {(lang === 'bn' ? inst.programsBn : inst.programsEn).join(', ')}
                          </p>
                        </div>
                      </div>
                      <div className="mx-4 mb-4 pt-3 border-t border-[#E2E8F0] dark:border-[#222222]">
                        <button
                          type="button"
                          onClick={() => openModal(inst)}
                          className="inline-flex h-9 w-full items-center justify-center rounded-lg border border-[#E2E8F0] bg-white px-4 text-xs font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] hover:bg-[#00796B]/5 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
                        >
                          {tr('viewDetailsBtn')}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {visibleCount < filteredInstitutions.length && (
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                      className="inline-flex h-10 items-center rounded-xl border border-[#E2E8F0] bg-white px-5 text-xs font-semibold text-[#0F172A] hover:border-[#00796B] hover:text-[#00796B] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
                    >
                      {lang === 'bn'
                        ? `আরও ১৮টি দেখুন`
                        : `Show More (+${Math.min(PAGE_SIZE, filteredInstitutions.length - visibleCount)})`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisibleCount(filteredInstitutions.length)}
                      className="inline-flex h-10 items-center rounded-xl bg-[#00796B] px-5 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505]"
                    >
                      {lang === 'bn' ? `সব ${filteredInstitutions.length}টি দেখুন` : `Show All (${filteredInstitutions.length})`}
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeFeature === 'eligibility' && (
              <div id="eligibility-checker">
                <PublicEligibilityCheckerPanel
                  onNavigate={onNavigate}
                  onOpenSavedReport={() => handleSelectFeature('saved-reports')}
                />
              </div>
            )}

            {activeFeature === 'notifications' && (
              <div id="notifications">
                <NotificationsSection institutions={institutions} />
              </div>
            )}

            {activeFeature === 'ranking' && (
              <div id="rankings">
                <UniversityRankingSection onSelectInstitutionCode={handleInspectByCode} />
              </div>
            )}

            {activeFeature === 'best-for-u' && (
              <div id="best-for-u">
                <BestForUFlow
                  onNavigate={onNavigate}
                  onOpenSavedReport={() => handleSelectFeature('saved-reports')}
                />
              </div>
            )}

            {(activeFeature === 'profile-report' ||
              activeFeature === 'profile' ||
              activeFeature === 'saved-reports') && (
              <div id="profile-report">
                <StudentProfileAndReportSection
                  activeTab={profileReportTab}
                  onTabChange={(tab) => {
                    setProfileReportTab(tab);
                    onNavigate(tab === 'report' ? '/reports' : '/profile');
                  }}
                />
              </div>
            )}
          </section>
        )}
      </main>

      <Footer onNavigate={onNavigate} />

      {/* Institution Detail Modal with Profile, Cost Estimator & Official PDF Viewer */}
      {selectedInstitution && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="inst-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#050505]/80 p-4 overflow-y-auto"
        >
          <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-xl dark:border-[#222222] dark:bg-[#121212] my-auto max-h-[90vh] flex flex-col">
            <div className="aspect-[16/8] w-full shrink-0 overflow-hidden border-b border-[#E2E8F0] bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A]">
              <UniversityHeaderVisual
                imageUrl={selectedInstitution.imageUrl}
                alt={lang === 'bn' ? selectedInstitution.imageAltBn : selectedInstitution.imageAltEn}
                code={selectedInstitution.code}
                name={lang === 'bn' ? selectedInstitution.nameBn : selectedInstitution.nameEn}
                city={selectedInstitution.city}
                establishedYear={selectedInstitution.establishedYear}
                category={selectedInstitution.category}
                institutionType={
                  lang === 'bn'
                    ? selectedInstitution.institutionTypeBn
                    : selectedInstitution.institutionType
                }
                lang={lang}
              />
            </div>

            <div className="p-6 space-y-5 overflow-y-auto">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
                    {selectedInstitution.code} ·{' '}
                    {lang === 'bn'
                      ? selectedInstitution.institutionTypeBn
                      : selectedInstitution.institutionType}
                    {selectedInstitution.establishedYear
                      ? ` · ${lang === 'bn' ? 'স্থাপিত' : 'Est.'} ${selectedInstitution.establishedYear}`
                      : ''}
                  </p>
                  <h3
                    id="inst-dialog-title"
                    className="mt-1 font-sans text-xl font-bold text-[#0F172A] dark:text-[#F8FAFC]"
                  >
                    {lang === 'bn' ? selectedInstitution.nameBn : selectedInstitution.nameEn}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInstitution(null)}
                  aria-label="Close modal"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2E8F0] text-[#475569] hover:bg-[#F8FAFC] hover:text-[#0F172A] dark:border-[#222222] dark:text-[#94A3B8] dark:hover:bg-[#0A0A0A] dark:hover:text-[#F8FAFC]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>

              <p className="text-sm leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn' ? selectedInstitution.shortNoteBn : selectedInstitution.shortNoteEn}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-[#475569] dark:text-[#94A3B8]">
                <p>
                  <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'অবস্থান:' : 'Location:'}
                  </strong>{' '}
                  {lang === 'bn' ? selectedInstitution.locationBn : selectedInstitution.locationEn}
                </p>
                <p>
                  <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'প্রোগ্রাম:' : 'Programs:'}
                  </strong>{' '}
                  {(lang === 'bn'
                    ? selectedInstitution.programsBn
                    : selectedInstitution.programsEn
                  ).join(', ')}
                </p>
              </div>

              {selectedInstitution.verifiedRules.length > 0 && (
                <div className="rounded-lg border border-[#388E3C]/30 bg-[#388E3C]/10 p-4 dark:border-[#66BB6A]/35 dark:bg-[#66BB6A]/10 space-y-2">
                  <p className="text-xs font-semibold text-[#2E7D32] dark:text-[#66BB6A]">
                    {lang === 'bn' ? 'প্রকাশিত ও যাচাইকৃত ভর্তি নীতিমালা' : 'Published & Verified Admission Rules'}
                  </p>
                  {selectedInstitution.verifiedRules.map((rule) => (
                    <div key={rule.id} className="text-xs text-[#0F172A] dark:text-[#F8FAFC] space-y-1">
                      <p className="font-semibold">{rule.programName}</p>
                      <p className="tabular-nums text-[#475569] dark:text-[#94A3B8]">
                        SSC &ge; {rule.minSscGpa?.toFixed(2) ?? '—'} · HSC &ge;{' '}
                        {rule.minHscGpa?.toFixed(2) ?? '—'} · Combined &ge;{' '}
                        {rule.minCombinedGpa?.toFixed(2) ?? '—'} ·{' '}
                        {rule.allowsSecondTimer
                          ? lang === 'bn'
                            ? 'সেকেন্ড টাইমার অনুমোদিত'
                            : 'Second Timer Allowed'
                          : lang === 'bn'
                          ? 'সেকেন্ড টাইমার অনুমোদিত নয়'
                          : 'First Timer Only'}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {modalCostEstimate && selectedInstitution.perCreditFeeBdt && (
                <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 dark:border-[#222222] dark:bg-[#0A0A0A] space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      <Calculator className="h-4 w-4 text-[#00796B] dark:text-[#26A69A]" aria-hidden="true" />
                      {lang === 'bn' ? 'বেসরকারি টিউশন খরচ ক্যালকুলেটর' : 'Private Tuition Cost Estimator'}
                    </p>
                    <span className="font-mono text-xs font-bold text-[#00796B] dark:text-[#26A69A] tabular-nums">
                      BDT {modalCostEstimate.estimatedTotalBdt.toLocaleString()}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <label className="space-y-1">
                      <span className="text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? `বৃত্তি / ওয়েভার (${waiverPercent}%)` : `Tuition Waiver (${waiverPercent}%)`}
                      </span>
                      <input
                        type="range"
                        min={0}
                        max={50}
                        step={5}
                        value={waiverPercent}
                        onChange={(e) => setWaiverPercent(Number(e.target.value))}
                        className="w-full accent-[#00796B] dark:accent-[#26A69A]"
                      />
                    </label>
                    <label className="space-y-1">
                      <span className="text-[#475569] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'মোট সেমিস্টার' : 'Total Semesters'}
                      </span>
                      <select
                        value={semesters}
                        onChange={(e) => setSemesters(Number(e.target.value))}
                        className="h-8 w-full rounded border border-[#E2E8F0] bg-white px-2 text-xs text-[#0F172A] dark:border-[#222222] dark:bg-[#121212] dark:text-[#F8FAFC]"
                      >
                        <option value={8}>8 Semesters</option>
                        <option value={12}>12 Trimesters</option>
                      </select>
                    </label>
                  </div>
                  <p className="text-[11px] text-[#475569] dark:text-[#94A3B8] tabular-nums">
                    BDT {selectedInstitution.perCreditFeeBdt.toLocaleString()}/credit ×{' '}
                    {selectedInstitution.totalCredits} credits + semester & admission fees ≈ BDT{' '}
                    {modalCostEstimate.estimatedPerSemesterBdt.toLocaleString()}/semester
                  </p>
                </div>
              )}

              {selectedInstitution.publishedCirculars[0] && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowPdfPreview((p) => !p)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                  >
                    <FileText className="h-4 w-4" aria-hidden="true" />
                    {showPdfPreview
                      ? lang === 'bn'
                        ? 'অফিশিয়াল পিডিএফ লুকান'
                        : 'Hide Official Circular PDF'
                      : lang === 'bn'
                      ? 'অফিশিয়াল সার্কুলার পিডিএফ দেখুন'
                      : 'View Official Circular PDF'}
                  </button>

                  {showPdfPreview && (
                    <div className="rounded-lg border border-[#E2E8F0] dark:border-[#222222] overflow-hidden bg-[#F8FAFC] dark:bg-[#0A0A0A]">
                      <iframe
                        title={`${selectedInstitution.code} Official Circular PDF`}
                        src={`/api/circulars/${selectedInstitution.publishedCirculars[0].id}/pdf`}
                        className="h-72 w-full"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#E2E8F0] dark:border-[#222222]">
                <a
                  href={selectedInstitution.officialWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                >
                  {lang === 'bn' ? 'অফিশিয়াল ওয়েবসাইট ভিজিট করুন' : 'Official University Website'}
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedInstitution(null)}
                  className="inline-flex h-9 items-center rounded-lg bg-[#00796B] px-4 text-xs font-semibold text-white hover:bg-[#00695C] dark:bg-[#26A69A] dark:text-[#050505]"
                >
                  {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
