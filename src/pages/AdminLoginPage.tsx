import { useEffect, useState } from 'react';
import { ArrowLeft, Lock, Mail, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import type { AppRoute } from '../types/domain';
import { isValidEmail, isValidPassword, type ValidationErrors } from '../utils/validation';
import { BrandLogo } from '../components/common/BrandLogo';
import { LanguageSwitcher } from '../components/common/LanguageSwitcher';
import { ThemeToggle } from '../components/common/ThemeToggle';

interface AdminLoginPageProps {
  onNavigate: (route: AppRoute) => void;
}

export function AdminLoginPage({ onNavigate }: AdminLoginPageProps) {
  const { lang, tr } = useLanguage();
  const { user, loading: authLoading, loginWithEmailPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!authLoading && user?.accountType === 'admin' && user.adminRole) {
      onNavigate('/admin/dashboard');
    }
  }, [authLoading, user, onNavigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    const errs: ValidationErrors = {};
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'errEmailInvalid';
    }
    if (!password) {
      errs.password = 'errPasswordRequired';
    }
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      await loginWithEmailPassword({ email, password, portal: 'admin' });
      onNavigate('/admin/dashboard');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Administrator sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] flex flex-col text-[#0F172A] dark:text-[#F8FAFC]">
      <header className="border-b border-[#E2E8F0] bg-[#0F172A] dark:border-[#222222] dark:bg-[#0A0A0A]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <BrandLogo inverted onClick={() => onNavigate('/')} />
          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <LanguageSwitcher compact />
            <button
              type="button"
              onClick={() => onNavigate('/')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] whitespace-nowrap shrink-0"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {tr('adminBackHome')}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-md space-y-5">
          <div className="rounded-xl border border-[#E2E8F0] bg-white p-6 sm:p-8 dark:border-[#222222] dark:bg-[#121212] space-y-6 shadow-xl">
            <div className="space-y-1.5">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00796B] dark:text-[#26A69A]">
                <ShieldAlert className="h-4 w-4 text-[#F57C00] dark:text-[#FFA726]" aria-hidden="true" />
                {tr('adminSidebarTitle')}
              </p>
              <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                {tr('adminLoginTitle')}
              </h1>
              <p className="text-sm text-[#475569] dark:text-[#94A3B8]">{tr('adminLoginSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              <div>
                <label htmlFor="admin-email" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5">
                  {tr('fieldEmail')}
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
                  <input
                    id="admin-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@dreamuniversity.edu.bd"
                    className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">{tr(errors.email)}</p>
                )}
              </div>

              <div>
                <label htmlFor="admin-password" className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5">
                  {tr('fieldPassword')}
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]" aria-hidden="true" />
                  <input
                    id="admin-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={tr('fieldPasswordPlaceholder')}
                    className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">{tr(errors.password)}</p>
                )}
              </div>

              {apiError && (
                <div
                  role="alert"
                  className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-3.5 py-2.5 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
                >
                  {apiError}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-lg bg-[#00796B] px-4 text-sm font-semibold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.22)] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
              >
                {submitting
                  ? lang === 'bn'
                    ? 'যাচাই হচ্ছে...'
                    : 'Signing in...'
                  : tr('btnAdminSignIn')}
              </button>
            </form>

            <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8] border-t border-[#E2E8F0] dark:border-[#222222] pt-4">
              {tr('adminSecurityNote')}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
