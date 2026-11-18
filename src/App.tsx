import { useEffect, useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import type { AppRoute } from './types/domain';
import { LandingPage } from './pages/LandingPage';
import { StudentAuthPage } from './pages/StudentAuthPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardLayout } from './pages/AdminDashboardLayout';
import { FloatingActionBubble } from './components/common/FloatingActionBubble';

function normalizeRoute(pathnameOrUrl: string): AppRoute {
  const cleanPath = pathnameOrUrl.split('?')[0].split('#')[0];
  switch (cleanPath) {
    case '/about':
    case '/universities':
    case '/eligibility':
    case '/notifications':
    case '/ranking':
    case '/best-for-u':
    case '/reports':
    case '/profile':
    case '/login':
    case '/register':
    case '/forgot-password':
    case '/admin/login':
    case '/student/dashboard':
    case '/admin/dashboard':
      return cleanPath;
    case '/dashboard':
      return '/student/dashboard';
    case '/admin':
      return '/admin/dashboard';
    default:
      return '/';
  }
}

function AppRouter() {
  const [route, setRoute] = useState<AppRoute>(() => normalizeRoute(window.location.pathname));
  const [locationSearch, setLocationSearch] = useState<string>(() => window.location.search);
  const [navbarSearchQuery, setNavbarSearchQuery] = useState('');

  useEffect(() => {
    const handlePopState = () => {
      setRoute(normalizeRoute(window.location.pathname));
      setLocationSearch(window.location.search);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (nextRoute: string, anchorId?: string) => {
    const [rawPath, rawQuery] = nextRoute.split('?');
    const canonicalRoute = normalizeRoute(rawPath);
    const nextSearch = rawQuery ? `?${rawQuery}` : '';
    const nextUrl = `${canonicalRoute}${nextSearch}`;
    const currentFullUrl = `${window.location.pathname}${window.location.search}`;
    if (currentFullUrl !== nextUrl) {
      window.history.pushState({}, '', nextUrl);
      setRoute(canonicalRoute);
      setLocationSearch(nextSearch);
    }

    if (anchorId) {
      window.setTimeout(() => {
        if (anchorId === 'top') {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          document.getElementById(anchorId)?.scrollIntoView({ behavior: 'smooth' });
        }
      }, 40);
    } else {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleSearchSubmitFromAuth = (query: string) => {
    setNavbarSearchQuery(query);
    navigate('/', 'universities');
  };

  let pageView: React.ReactNode;
  switch (route) {
    case '/login':
      pageView = (
        <StudentAuthPage
          mode="login"
          locationSearch={locationSearch}
          onNavigate={navigate}
          searchQuery={navbarSearchQuery}
          onSearchChange={setNavbarSearchQuery}
          onSearchSubmit={handleSearchSubmitFromAuth}
        />
      );
      break;
    case '/register':
      pageView = (
        <StudentAuthPage
          mode="register"
          locationSearch={locationSearch}
          onNavigate={navigate}
          searchQuery={navbarSearchQuery}
          onSearchChange={setNavbarSearchQuery}
          onSearchSubmit={handleSearchSubmitFromAuth}
        />
      );
      break;
    case '/forgot-password':
      pageView = (
        <StudentAuthPage
          mode="forgot"
          locationSearch={locationSearch}
          onNavigate={navigate}
          searchQuery={navbarSearchQuery}
          onSearchChange={setNavbarSearchQuery}
          onSearchSubmit={handleSearchSubmitFromAuth}
        />
      );
      break;
    case '/admin/login':
      pageView = <AdminLoginPage onNavigate={navigate} />;
      break;
    case '/admin/dashboard':
    case '/admin':
      pageView = <AdminDashboardLayout onNavigate={navigate} />;
      break;
    case '/about':
    case '/universities':
    case '/eligibility':
    case '/notifications':
    case '/ranking':
    case '/best-for-u':
    case '/reports':
    case '/profile':
    case '/student/dashboard':
    case '/dashboard':
    case '/':
    default:
      pageView = (
        <LandingPage
          currentRoute={route}
          onNavigate={navigate}
          searchQuery={navbarSearchQuery}
          onSearchChange={setNavbarSearchQuery}
        />
      );
      break;
  }

  const isAdminRoute = route.startsWith('/admin');

  return (
    <>
      {pageView}
      {!isAdminRoute && <FloatingActionBubble currentRoute={route} onNavigate={navigate} />}
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AppRouter />
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
