import type { AppRoute } from '../types/domain';

export type DrawerSectionId =
  | 'home'
  | 'about'
  | 'universities'
  | 'eligibility'
  | 'notifications'
  | 'ranking'
  | 'best-for-u'
  | 'saved-reports'
  | 'profile'
  | 'profile-report';

export interface RedirectTarget {
  route: AppRoute;
  section: DrawerSectionId;
  profileTab?: 'profile' | 'report';
  labelEn: string;
  labelBn: string;
}

export const REDIRECT_AFTER_LOGIN_STORAGE_KEY = 'du_redirect_after_login';

export const AUTH_GATE_PROMPT_EN = 'Please sign in to access this feature';
export const AUTH_GATE_PROMPT_BN = 'এই ফিচারটি ব্যবহার করতে অনুগ্রহ করে লগইন করুন';
export const AUTH_GATE_PROMPT_BILINGUAL = `${AUTH_GATE_PROMPT_EN} / ${AUTH_GATE_PROMPT_BN}`;

const SECTION_TARGETS: Record<Exclude<DrawerSectionId, 'home' | 'about'>, RedirectTarget> = {
  universities: {
    route: '/universities',
    section: 'universities',
    labelEn: 'Universities Directory',
    labelBn: 'বিশ্ববিদ্যালয় ডিরেক্টরি',
  },
  eligibility: {
    route: '/eligibility',
    section: 'eligibility',
    labelEn: 'Eligibility Checker',
    labelBn: 'যোগ্যতা যাচাইকারী',
  },
  ranking: {
    route: '/ranking',
    section: 'ranking',
    labelEn: 'University Ranking',
    labelBn: 'বিশ্ববিদ্যালয় র‍্যাঙ্কিং',
  },
  'best-for-u': {
    route: '/best-for-u',
    section: 'best-for-u',
    labelEn: 'Best for U',
    labelBn: 'আপনার জন্য সেরা (Best for U)',
  },
  notifications: {
    route: '/notifications',
    section: 'notifications',
    labelEn: 'Notifications',
    labelBn: 'নোটিফিকেশন',
  },
  'saved-reports': {
    route: '/reports',
    section: 'saved-reports',
    profileTab: 'report',
    labelEn: 'Saved Reports',
    labelBn: 'সংরক্ষিত রিপোর্ট',
  },
  profile: {
    route: '/profile',
    section: 'profile',
    profileTab: 'profile',
    labelEn: 'My Profile',
    labelBn: 'আমার প্রোফাইল',
  },
  'profile-report': {
    route: '/student/dashboard',
    section: 'profile-report',
    profileTab: 'profile',
    labelEn: 'Academic Profile & Report',
    labelBn: 'একাডেমিক প্রোফাইল ও রিপোর্ট',
  },
};

const ROUTE_TO_TARGET: Partial<Record<AppRoute, RedirectTarget>> = {
  '/universities': SECTION_TARGETS.universities,
  '/eligibility': SECTION_TARGETS.eligibility,
  '/ranking': SECTION_TARGETS.ranking,
  '/best-for-u': SECTION_TARGETS['best-for-u'],
  '/notifications': SECTION_TARGETS.notifications,
  '/reports': SECTION_TARGETS['saved-reports'],
  '/profile': SECTION_TARGETS.profile,
  '/student/dashboard': SECTION_TARGETS['profile-report'],
  '/dashboard': SECTION_TARGETS['profile-report'],
};

export function isProtectedFeatureRoute(route: AppRoute): boolean {
  return Boolean(ROUTE_TO_TARGET[route]);
}

export function getTargetForDrawerSection(section: DrawerSectionId): RedirectTarget | null {
  if (section === 'home' || section === 'about') return null;
  return SECTION_TARGETS[section] ?? null;
}

export function getTargetForRoute(route: AppRoute): RedirectTarget | null {
  return ROUTE_TO_TARGET[route] ?? null;
}

export function saveRedirectAfterLogin(target: RedirectTarget | null): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (!target) {
      window.sessionStorage.removeItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY, JSON.stringify(target));
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

export function loadRedirectAfterLogin(): RedirectTarget | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(REDIRECT_AFTER_LOGIN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RedirectTarget>;
    if (!parsed || typeof parsed.route !== 'string' || typeof parsed.section !== 'string') {
      return null;
    }
    return {
      route: parsed.route as AppRoute,
      section: parsed.section as DrawerSectionId,
      profileTab: parsed.profileTab === 'report' ? 'report' : parsed.profileTab === 'profile' ? 'profile' : undefined,
      labelEn: parsed.labelEn || 'Requested Feature',
      labelBn: parsed.labelBn || 'নির্বাচিত ফিচার',
    };
  } catch {
    return null;
  }
}

export function consumeRedirectAfterLogin(): RedirectTarget | null {
  const existing = loadRedirectAfterLogin();
  saveRedirectAfterLogin(null);
  return existing;
}

export type FabActionId = 'whatsapp' | 'career-finder';

export interface PendingFabAction {
  action: FabActionId;
  returnRoute?: AppRoute;
}

export const FAB_ACTION_STORAGE_KEY = 'du_pending_fab_action';

const FAB_ACTION_LABELS: Record<FabActionId, { labelEn: string; labelBn: string }> = {
  whatsapp: {
    labelEn: 'Contact with Us (WhatsApp)',
    labelBn: 'হোয়াটসঅ্যাপে যোগাযোগ',
  },
  'career-finder': {
    labelEn: 'Career & Subject Finder',
    labelBn: 'বিষয় ও ক্যারিয়ার গাইড',
  },
};

export function getFabActionLabel(action: FabActionId): { labelEn: string; labelBn: string } {
  return FAB_ACTION_LABELS[action];
}

export function savePendingFabAction(pending: PendingFabAction | null): void {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (!pending) {
      window.sessionStorage.removeItem(FAB_ACTION_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(FAB_ACTION_STORAGE_KEY, JSON.stringify(pending));
  } catch {
    // Ignore storage quota or sandbox restrictions
  }
}

export function loadPendingFabAction(): PendingFabAction | null {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    const raw = window.sessionStorage.getItem(FAB_ACTION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingFabAction>;
    if (parsed?.action !== 'whatsapp' && parsed?.action !== 'career-finder') {
      return null;
    }
    return {
      action: parsed.action,
      returnRoute: parsed.returnRoute,
    };
  } catch {
    return null;
  }
}

export function consumePendingFabAction(): PendingFabAction | null {
  const existing = loadPendingFabAction();
  savePendingFabAction(null);
  return existing;
}

const ALLOWED_REDIRECT_ROUTES = new Set<AppRoute>([
  '/',
  '/about',
  '/universities',
  '/eligibility',
  '/notifications',
  '/ranking',
  '/best-for-u',
  '/reports',
  '/profile',
  '/student/dashboard',
  '/dashboard',
]);

export function getRedirectRouteFromSearch(search: string): AppRoute | null {
  if (!search) return null;
  try {
    const query = search.startsWith('?') ? search : `?${search}`;
    const raw = new URLSearchParams(query).get('redirect');
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) {
      return null;
    }
    const cleanPath = raw.split('?')[0].split('#')[0];
    const normalized = (cleanPath === '/dashboard' ? '/student/dashboard' : cleanPath) as AppRoute;
    return ALLOWED_REDIRECT_ROUTES.has(normalized) ? normalized : null;
  } catch {
    return null;
  }
}

export function getRedirectTargetFromSearch(search: string): RedirectTarget | null {
  const route = getRedirectRouteFromSearch(search);
  return route ? getTargetForRoute(route) : null;
}

export function buildLoginUrlWithRedirect(targetRoute?: AppRoute | null): string {
  if (!targetRoute) return '/login';
  const normalized = (targetRoute === '/dashboard' ? '/student/dashboard' : targetRoute) as AppRoute;
  if (!ALLOWED_REDIRECT_ROUTES.has(normalized)) {
    return '/login';
  }
  return `/login?redirect=${normalized}`;
}

export function preserveRedirectOnAuthRoute(
  authRoute: Extract<AppRoute, '/login' | '/register' | '/forgot-password'>,
  search: string
): string {
  const redirectRoute = getRedirectRouteFromSearch(search);
  return redirectRoute ? `${authRoute}?redirect=${redirectRoute}` : authRoute;
}

export function resolvePostLoginRoute(search: string): AppRoute | null {
  const stored = consumeRedirectAfterLogin();
  if (stored?.route && ALLOWED_REDIRECT_ROUTES.has(stored.route)) {
    return stored.route === '/dashboard' ? '/student/dashboard' : stored.route;
  }
  return getRedirectRouteFromSearch(search);
}
