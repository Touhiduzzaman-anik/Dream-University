import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  BellRing,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  User,
} from 'lucide-react';
import { useAuth, type OtpChallengeResponse } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { extractApiErrorMessage, parseJsonSafe } from '../lib/authFetch';
import type { AppRoute } from '../types/domain';
import {
  isValidFourDigitOtp,
  isValidPassword,
  parseAndValidateAuthIdentifier,
  validateLoginCredentials,
  validateStudentRegistration,
  type ValidationErrors,
} from '../utils/validation';
import {
  AUTH_GATE_PROMPT_BILINGUAL,
  buildLoginUrlWithRedirect,
  consumeRedirectAfterLogin,
  getRedirectTargetFromSearch,
  getTargetForDrawerSection,
  loadPendingFabAction,
  loadRedirectAfterLogin,
  preserveRedirectOnAuthRoute,
  resolvePostLoginRoute,
  saveRedirectAfterLogin,
  type RedirectTarget,
} from '../utils/authRedirect';
import { BrandLogo } from '../components/common/BrandLogo';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { NavigationDrawer, type DrawerSectionId } from '../components/layout/NavigationDrawer';

function GoogleGIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.51h6.44a5.5 5.5 0 0 1-2.39 3.61v3.01h3.87c2.26-2.08 3.57-5.15 3.57-8.86Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.94-2.91l-3.87-3.01c-1.07.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.27v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.27A7.2 7.2 0 0 1 4.9 12c0-.79.14-1.56.37-2.27v-3.1H1.27A12 12 0 0 0 0 12c0 1.94.46 3.77 1.27 5.37l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.27 6.63l4 3.1C6.22 6.88 8.87 4.77 12 4.77Z"
      />
    </svg>
  );
}

interface StudentAuthPageProps {
  mode: 'login' | 'register' | 'forgot';
  locationSearch?: string;
  onNavigate: (route: AppRoute | string) => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
}

type AuthStep = 'credentials' | 'otp' | 'new_password';

export function StudentAuthPage({
  mode,
  locationSearch,
  onNavigate,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
}: StudentAuthPageProps) {
  const { lang, tr } = useLanguage();
  const {
    user,
    loading: authLoading,
    loginWithEmailPassword,
    requestStudentOtp,
    verifyStudentOtp,
    loginWithGoogle,
  } = useAuth();
  const effectiveSearch =
    locationSearch ?? (typeof window !== 'undefined' ? window.location.search : '');

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState<RedirectTarget | null>(
    () => loadRedirectAfterLogin() ?? getRedirectTargetFromSearch(effectiveSearch)
  );

  useEffect(() => {
    const queryTarget = getRedirectTargetFromSearch(effectiveSearch);
    const storedTarget = loadRedirectAfterLogin();
    if (queryTarget) {
      saveRedirectAfterLogin(queryTarget);
      setPendingRedirect(queryTarget);
    } else {
      setPendingRedirect(storedTarget);
    }
  }, [effectiveSearch, mode]);

  const getPostLoginDestination = (): AppRoute => {
    const nextRoute = resolvePostLoginRoute(effectiveSearch);
    if (nextRoute) return nextRoute;
    const pendingFab = loadPendingFabAction();
    if (pendingFab) return pendingFab.returnRoute || '/';
    return '/student/dashboard';
  };

  useEffect(() => {
    if (authLoading || !user) return;
    if (user.accountType === 'admin' && user.adminRole) {
      consumeRedirectAfterLogin();
      onNavigate('/admin/dashboard');
      return;
    }
    if (user.accountType === 'student') {
      const nextRoute = resolvePostLoginRoute(effectiveSearch);
      if (nextRoute) {
        onNavigate(nextRoute);
        return;
      }
      const pendingFab = loadPendingFabAction();
      if (pendingFab) {
        onNavigate(pendingFab.returnRoute || '/');
        return;
      }
      onNavigate('/student/dashboard');
    }
  }, [authLoading, user, onNavigate, effectiveSearch]);

  const [step, setStep] = useState<AuthStep>('credentials');
  const [fullName, setFullName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: 4-Digit OTP state
  const [challenge, setChallenge] = useState<OtpChallengeResponse | null>(null);
  const [otpDigits, setOtpDigits] = useState<[string, string, string, string]>(['', '', '', '']);
  const [resendSeconds, setResendSeconds] = useState(0);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  // Step 3 (Forgot Password only): Set & Confirm New Password
  const [verifiedChallengeId, setVerifiedChallengeId] = useState<number | null>(null);
  const [verifiedOtpCode, setVerifiedOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [errors, setErrors] = useState<ValidationErrors>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setStep('credentials');
    setChallenge(null);
    setOtpDigits(['', '', '', '']);
    setResendSeconds(0);
    setVerifiedChallengeId(null);
    setVerifiedOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
    setErrors({});
    setApiError(null);
  }, [mode]);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  useEffect(() => {
    if (step === 'otp') {
      window.setTimeout(() => otpRefs.current[0]?.focus(), 40);
    }
  }, [step]);

  const resetAllMessages = () => {
    setErrors({});
    setFeedback(null);
    setApiError(null);
  };

  const otpJoined = otpDigits.join('');

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (digitsOnly.length > 1) {
      const next: [string, string, string, string] = ['', '', '', ''];
      for (let i = 0; i < 4; i++) {
        next[i] = digitsOnly[i] ?? '';
      }
      setOtpDigits(next);
      const nextFocus = Math.min(3, digitsOnly.length);
      otpRefs.current[nextFocus]?.focus();
      return;
    }

    const updated: [string, string, string, string] = [...otpDigits] as [
      string,
      string,
      string,
      string,
    ];
    updated[index] = digitsOnly;
    setOtpDigits(updated);
    if (digitsOnly && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4);
    if (!pasted) return;
    e.preventDefault();
    const next: [string, string, string, string] = ['', '', '', ''];
    for (let i = 0; i < 4; i++) {
      next[i] = pasted[i] ?? '';
    }
    setOtpDigits(next);
    otpRefs.current[Math.min(3, pasted.length - 1)]?.focus();
  };

  const requestOtpChallenge = async () => {
    const purpose: 'register' | 'reset_password' =
      mode === 'register' ? 'register' : 'reset_password';
    const res = await requestStudentOtp({
      identifier: identifier.trim(),
      purpose,
      ...(mode === 'register' ? { fullName: fullName.trim(), password } : {}),
    });
    setChallenge(res);
    setOtpDigits(['', '', '', '']);
    setResendSeconds(res.resendCooldownSeconds || 60);
    setStep('otp');
  };

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllMessages();

    if (mode === 'login') {
      const errs = validateLoginCredentials({ identifier, password });
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSubmitting(true);
      try {
        const loggedInUser = await loginWithEmailPassword({
          identifier: identifier.trim(),
          password,
          portal: 'student',
        });
        if (loggedInUser.accountType === 'admin' && loggedInUser.adminRole) {
          consumeRedirectAfterLogin();
          onNavigate('/admin/dashboard');
          return;
        }
        onNavigate(getPostLoginDestination());
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'Unable to sign in.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    if (mode === 'register') {
      const errs = validateStudentRegistration({ fullName, identifier, password });
      setErrors(errs);
      if (Object.keys(errs).length > 0) return;

      setSubmitting(true);
      try {
        await requestOtpChallenge();
      } catch (err: unknown) {
        setApiError(err instanceof Error ? err.message : 'Unable to initiate registration.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    // Forgot password Step 1
    const parsed = parseAndValidateAuthIdentifier(identifier);
    if (parsed.ok === false) {
      setErrors({ identifier: parsed.error });
      return;
    }

    setSubmitting(true);
    try {
      await requestOtpChallenge();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Unable to send 4-digit OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllMessages();
    if (!challenge) return;

    if (!isValidFourDigitOtp(otpJoined)) {
      setErrors({ otp: 'errOtpInvalid' });
      return;
    }

    setSubmitting(true);
    try {
      const purpose: 'register' | 'reset_password' =
        mode === 'register' ? 'register' : 'reset_password';
      const result = await verifyStudentOtp({
        challengeId: challenge.challengeId,
        identifier: challenge.identifier,
        purpose,
        otp: otpJoined,
      });

      if (mode === 'forgot') {
        setVerifiedChallengeId(result.challengeId ?? challenge.challengeId);
        setVerifiedOtpCode(otpJoined);
        setStep('new_password');
        return;
      }

      onNavigate(getPostLoginDestination());
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Invalid or expired 4-digit OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendSeconds > 0 || submitting) return;
    resetAllMessages();
    setSubmitting(true);
    try {
      await requestOtpChallenge();
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Unable to resend 4-digit OTP.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    resetAllMessages();

    const nextErrors: ValidationErrors = {};
    if (!isValidPassword(newPassword)) {
      nextErrors.password = 'errPasswordShort';
    }
    if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword =
        lang === 'bn' ? 'পাসওয়ার্ড দুটি মিলছে না।' : 'Passwords do not match.';
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !challenge || !verifiedChallengeId) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          challengeId: verifiedChallengeId,
          identifier: challenge.identifier,
          otp: verifiedOtpCode,
          newPassword,
          confirmPassword,
        }),
      });
      const parsed = await parseJsonSafe<{ error?: string; message?: string }>(res);
      if (!res.ok || !parsed.isJson) {
        throw new Error(extractApiErrorMessage(res, parsed, 'Failed to update password.'));
      }
      setFeedback(
        lang === 'bn'
          ? 'পাসওয়ার্ড সফলভাবে পরিবর্তন হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।'
          : parsed.data?.message || 'Password updated! Please sign in with your new password.'
      );
      setStep('credentials');
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setChallenge(null);
      setOtpDigits(['', '', '', '']);
      onNavigate('/login');
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setApiError(null);
    setFeedback(null);
    setSubmitting(true);
    try {
      await loginWithGoogle('student');
      onNavigate(getPostLoginDestination());
    } catch (err: unknown) {
      setApiError(err instanceof Error ? err.message : 'Google Sign-In failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDrawerFeatureClick = (sec: DrawerSectionId) => {
    if (sec === 'home') {
      onNavigate('/');
      return;
    }
    if (sec === 'about') {
      onNavigate('/about');
      return;
    }
    const target = getTargetForDrawerSection(sec);
    if (!user || user.accountType !== 'student') {
      if (target) {
        saveRedirectAfterLogin(target);
        setPendingRedirect(target);
        setFeedback(null);
        onNavigate(buildLoginUrlWithRedirect(target.route));
        return;
      }
      onNavigate('/login');
      return;
    }
    onNavigate(target ? target.route : '/student/dashboard');
  };

  const parsedPreview = identifier.trim() ? parseAndValidateAuthIdentifier(identifier) : null;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#050505] text-[#0F172A] dark:text-[#F8FAFC] flex flex-col">
      <PublicNavbar
        onOpenDrawer={() => setDrawerOpen(true)}
        onLogoClick={() => onNavigate('/')}
        onNavigate={onNavigate}
        onOpenProfileSection={(tab) => onNavigate(tab === 'report' ? '/reports' : '/profile')}
        searchQuery={searchQuery}
        onSearchChange={(q) => onSearchChange?.(q)}
        onSearchSubmit={(q) => (onSearchSubmit ? onSearchSubmit(q) : onNavigate('/'))}
      />

      <NavigationDrawer
        open={drawerOpen}
        activeSection="home"
        activeNotificationCount={0}
        onClose={() => setDrawerOpen(false)}
        onSelectSection={handleDrawerFeatureClick}
        onNavigate={onNavigate}
      />

      <main className="flex-1 flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-md space-y-5">
          {pendingRedirect && (
            <div
              role="note"
              data-testid="auth-redirect-notice"
              className="rounded-xl border border-[#F57C00]/35 bg-[#F57C00]/10 p-4 text-xs font-semibold text-[#E65100] dark:border-[#FFA726]/35 dark:bg-[#FFA726]/12 dark:text-[#FFA726] space-y-1"
            >
              <p>{AUTH_GATE_PROMPT_BILINGUAL}</p>
              <p className="text-[11px] font-medium text-[#475569] dark:text-[#94A3B8]">
                {lang === 'bn'
                  ? `লগইন করার পর স্বয়ংক্রিয়ভাবে "${pendingRedirect.labelBn}" খোলা হবে।`
                  : `You will be redirected to "${pendingRedirect.labelEn}" right after signing in.`}
              </p>
            </div>
          )}
          {/* Real Email/SMS Sent Confirmation (no on-screen demo OTP) */}
          {step === 'otp' && challenge && !challenge.demoOtp && challenge.sentVia !== 'demo' && (
            <div
              role="status"
              data-testid="real-otp-sent-notice"
              className="rounded-xl border border-[#388E3C]/35 bg-[#388E3C]/10 p-4 text-[#0F172A] shadow-xs dark:border-[#66BB6A]/35 dark:bg-[#66BB6A]/12 dark:text-[#F8FAFC]"
            >
              <div className="flex items-start gap-3">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#388E3C] text-white dark:bg-[#66BB6A] dark:text-[#050505]">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="space-y-0.5">
                  <p className="text-xs font-bold text-[#2E7D32] dark:text-[#66BB6A]">
                    {challenge.sentVia === 'email'
                      ? lang === 'bn'
                        ? 'ইমেইলে ভেরিফিকেশন কোড পাঠানো হয়েছে'
                        : 'Verification Code Sent'
                      : lang === 'bn'
                        ? 'মোবাইলে ভেরিফিকেশন কোড পাঠানো হয়েছে'
                        : 'SMS Verification Code Sent'}
                  </p>
                  <p className="text-xs text-[#475569] dark:text-[#94A3B8] leading-relaxed">
                    {challenge.sentVia === 'email'
                      ? lang === 'bn'
                        ? 'আমরা আপনার ইমেইল ইনবক্সে ৪-অঙ্কের ভেরিফিকেশন কোড পাঠিয়েছি।'
                        : 'We sent a 4-digit verification code to your email inbox.'
                      : lang === 'bn'
                        ? `আমরা আপনার ${challenge.maskedDestination} নম্বরে ৪-অঙ্কের ভেরিফিকেশন কোড পাঠিয়েছি।`
                        : `We sent a 4-digit verification code to ${challenge.maskedDestination}.`}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Demo OTP Notification Toast Banner only when no email/SMS provider is configured */}
          {step === 'otp' && challenge?.demoOtp && (
            <div
              role="status"
              data-testid="demo-otp-toast"
              className="rounded-xl border border-[#00796B]/40 bg-[#0F172A] p-4 text-[#F8FAFC] shadow-lg dark:border-[#26A69A]/45 dark:bg-[#121212]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00796B]/25 text-[#26A69A]">
                    <BellRing className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-[#26A69A]">
                      {lang === 'bn' ? 'ওটিপি ডেলিভারি নোটিফিকেশন' : 'Demo OTP Delivery Notification'}
                    </p>
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      {lang === 'bn'
                        ? `${challenge.maskedDestination} ঠিকানায় ৪-অঙ্কের কোড পাঠানো হয়েছে`
                        : `4-digit code sent to ${challenge.maskedDestination}`}
                    </p>
                  </div>
                </div>
                <span
                  data-testid="demo-otp-code"
                  className="rounded-lg border border-[#26A69A]/45 bg-[#050505] px-3 py-1 font-mono text-lg font-extrabold tracking-[0.2em] text-[#66BB6A] tabular-nums"
                >
                  {challenge.demoOtp}
                </span>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-[#E2E8F0] bg-white p-6 sm:p-8 shadow-sm dark:border-[#222222] dark:bg-[#121212] space-y-6">
            {/* Top Brand Logo + Portal Heading & Subtitle */}
            <div className="space-y-4">
              <BrandLogo onClick={() => onNavigate('/')} />

              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h1 className="font-display text-2xl font-bold tracking-tight text-[#0F172A] dark:text-[#F8FAFC]">
                    {step === 'otp'
                      ? lang === 'bn'
                        ? '৪-অঙ্কের ওটিপি যাচাই করুন'
                        : 'Verify 4-Digit OTP'
                      : step === 'new_password'
                      ? lang === 'bn'
                        ? 'নতুন পাসওয়ার্ড সেট করুন'
                        : 'Set New Password'
                      : mode === 'login'
                      ? lang === 'bn'
                        ? 'স্বাগতম, ড্রীম ইউনিভার্সিটিতে'
                        : 'Hi, Welcome to Dream University'
                      : mode === 'register'
                      ? lang === 'bn'
                        ? 'নতুন শিক্ষার্থী অ্যাকাউন্ট তৈরি করুন'
                        : 'Create Student Account'
                      : tr('authForgotTitle')}
                  </h1>
                  {mode === 'forgot' && (
                    <span className="rounded-md bg-[#F8FAFC] border border-[#E2E8F0] px-2 py-0.5 text-[11px] font-semibold text-[#475569] dark:bg-[#0A0A0A] dark:border-[#222222] dark:text-[#94A3B8] shrink-0">
                      {step === 'credentials' ? 'Step 1/3' : step === 'otp' ? 'Step 2/3' : 'Step 3/3'}
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#475569] dark:text-[#94A3B8]">
                  {step === 'otp' && challenge
                    ? challenge.sentVia === 'email' && !challenge.demoOtp
                      ? lang === 'bn'
                        ? 'আমরা আপনার ইমেইল ইনবক্সে ৪-অঙ্কের ভেরিফিকেশন কোড পাঠিয়েছি।'
                        : 'We sent a 4-digit verification code to your email inbox.'
                      : lang === 'bn'
                        ? `${challenge.maskedDestination} ঠিকানায় পাঠানো ৪-অঙ্কের কোডটি নিচে লিখুন।`
                        : `Enter the 4-digit verification code sent to ${challenge.maskedDestination}.`
                    : step === 'new_password'
                    ? lang === 'bn'
                      ? 'ওটিপি যাচাই সম্পন্ন হয়েছে। আপনার অ্যাকাউন্টের জন্য নতুন পাসওয়ার্ড দিন।'
                      : 'OTP verified. Choose and confirm a new password (minimum 8 characters).'
                    : mode === 'login'
                    ? lang === 'bn'
                      ? 'আপনার অ্যাকাউন্টে লগ-ইন করতে নিচের তথ্য দিন'
                      : 'Enter your details to log in to your account'
                    : mode === 'register'
                    ? tr('authRegisterSubtitle')
                    : tr('authForgotSubtitle')}
                </p>
              </div>
            </div>

            {/* STEP 1: Unified Email/BD Mobile + Password */}
            {step === 'credentials' && (
              <form onSubmit={handleCredentialsSubmit} noValidate className="space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-fullname"
                      className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5"
                    >
                      {tr('fieldFullName')}
                    </label>
                    <div className="relative">
                      <User
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-fullname"
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={tr('fieldFullNamePlaceholder')}
                        className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                      />
                    </div>
                    {errors.fullName && (
                      <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">
                        {tr(errors.fullName)}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <label
                      htmlFor="auth-identifier"
                      className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]"
                    >
                      {lang === 'bn'
                        ? 'ইমেইল ঠিকানা অথবা মোবাইল নম্বর'
                        : 'Email Address or Mobile Number'}
                    </label>
                    {parsedPreview?.ok && (
                      <span className="inline-flex items-center gap-1 rounded bg-[#388E3C]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#2E7D32] dark:bg-[#66BB6A]/15 dark:text-[#66BB6A]">
                        <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                        {parsedPreview.identifierType === 'phone' ? 'BD Mobile' : 'Email'}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    {parsedPreview?.ok && parsedPreview.identifierType === 'phone' ? (
                      <Smartphone
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#388E3C] dark:text-[#66BB6A]"
                        aria-hidden="true"
                      />
                    ) : (
                      <Mail
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                        aria-hidden="true"
                      />
                    )}
                    <input
                      id="auth-identifier"
                      type="text"
                      autoComplete="username"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={
                        lang === 'bn'
                          ? 'name@gmail.com অথবা 017XXXXXXXX'
                          : 'name@gmail.com or 017XXXXXXXX'
                      }
                      className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                    />
                  </div>
                  {errors.identifier && (
                    <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">{errors.identifier}</p>
                  )}
                </div>

                {(mode === 'login' || mode === 'register') && (
                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5"
                    >
                      {tr('fieldPassword')}
                    </label>
                    <div className="relative">
                      <Lock
                        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                        aria-hidden="true"
                      />
                      <input
                        id="auth-password"
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={tr('fieldPasswordPlaceholder')}
                        className="h-11 w-full rounded-xl border border-[#E2E8F0] bg-white pl-9 pr-10 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" aria-hidden="true" />
                        ) : (
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">
                        {tr(errors.password)}
                      </p>
                    )}
                    {mode === 'login' && (
                      <div className="mt-1.5 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            resetAllMessages();
                            onNavigate(preserveRedirectOnAuthRoute('/forgot-password', effectiveSearch));
                          }}
                          className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                        >
                          {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot your password?'}
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {apiError && (
                  <div
                    role="alert"
                    className="rounded-lg border border-[#D32F2F]/35 bg-[#D32F2F]/10 px-3.5 py-2.5 text-xs font-medium text-[#D32F2F] dark:border-[#FF4D4D]/40 dark:bg-[#FF4D4D]/12 dark:text-[#FF4D4D]"
                  >
                    {apiError}
                  </div>
                )}

                {feedback && (
                  <div
                    role="status"
                    className="rounded-lg border border-[#388E3C]/35 bg-[#388E3C]/10 px-3.5 py-2.5 text-xs font-medium text-[#2E7D32] dark:border-[#66BB6A]/40 dark:bg-[#66BB6A]/12 dark:text-[#66BB6A]"
                  >
                    {feedback}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="h-11 w-full rounded-xl bg-[#00796B] px-4 text-sm font-bold text-white transition-all hover:bg-[#00695C] hover:shadow-[0_4px_14px_rgba(245,124,0,0.24)] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
                >
                  {submitting
                    ? mode === 'login'
                      ? lang === 'bn'
                        ? 'লগ-ইন হচ্ছে...'
                        : 'Logging in...'
                      : lang === 'bn'
                        ? 'ওটিপি পাঠানো হচ্ছে...'
                        : 'Sending 4-digit OTP...'
                    : mode === 'login'
                      ? lang === 'bn'
                        ? 'লগ-ইন'
                        : 'Log in'
                      : mode === 'register'
                        ? lang === 'bn'
                          ? '৪-অঙ্কের যাচাইকরণ ওটিপি পাঠান'
                          : 'Send 4-Digit Verification OTP'
                        : tr('btnSendOtp')}
                </button>
              </form>
            )}

            {/* STEP 2: 4-Box 4-Digit OTP Verification */}
            {step === 'otp' && challenge && (
              <form onSubmit={handleVerifyOtpSubmit} noValidate className="space-y-5">
                <div className="rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-2.5 text-xs text-[#475569] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#94A3B8] flex items-center justify-between gap-2">
                  <span className="truncate font-medium">
                    {challenge.identifierType === 'phone' ? 'BD Mobile: ' : 'Email: '}
                    <strong className="text-[#0F172A] dark:text-[#F8FAFC]">
                      {challenge.maskedDestination}
                    </strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      resetAllMessages();
                      setStep('credentials');
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline shrink-0"
                  >
                    <ArrowLeft className="h-3 w-3" aria-hidden="true" />
                    {lang === 'bn' ? 'পরিবর্তন' : 'Change'}
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-2.5">
                    {tr('fieldOtp')}
                  </label>
                  <div className="grid grid-cols-4 gap-3" role="group" aria-label="4-digit OTP">
                    {[0, 1, 2, 3].map((idx) => (
                      <input
                        key={idx}
                        ref={(el) => {
                          otpRefs.current[idx] = el;
                        }}
                        id={`otp-digit-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        aria-label={`OTP digit ${idx + 1}`}
                        value={otpDigits[idx]}
                        onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        onPaste={handleOtpPaste}
                        className="h-14 w-full rounded-xl border-2 border-[#E2E8F0] bg-white text-center font-mono text-2xl font-bold tabular-nums text-[#0F172A] focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:focus:border-[#26A69A]"
                      />
                    ))}
                  </div>
                  {errors.otp && (
                    <p className="mt-2 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">{tr(errors.otp)}</p>
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
                  className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#00796B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {submitting
                      ? lang === 'bn'
                        ? 'যাচাই হচ্ছে...'
                        : 'Verifying...'
                      : mode === 'forgot'
                      ? tr('btnVerifyReset')
                      : lang === 'bn'
                      ? '৪-অঙ্কের ওটিপি যাচাই ও প্রবেশ করুন'
                      : 'Verify 4-Digit OTP & Continue'}
                  </span>
                </button>

                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn' ? 'কোড পাননি?' : "Didn't receive the code?"}
                  </span>
                  <button
                    type="button"
                    disabled={resendSeconds > 0 || submitting}
                    onClick={() => void handleResendOtp()}
                    className="inline-flex items-center gap-1.5 font-semibold text-[#00796B] hover:underline disabled:cursor-not-allowed disabled:text-[#475569]/50 dark:text-[#26A69A] dark:disabled:text-[#94A3B8]/40"
                  >
                    <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                    {resendSeconds > 0
                      ? lang === 'bn'
                        ? `পুনরায় পাঠান (${resendSeconds} সেকেন্ড)`
                        : `Resend OTP in ${resendSeconds}s`
                      : lang === 'bn'
                      ? 'পুনরায় ৪-অঙ্কের ওটিপি পাঠান'
                      : 'Resend 4-Digit OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3 (Forgot Password only): Set & Confirm New Password */}
            {step === 'new_password' && mode === 'forgot' && (
              <form onSubmit={handleResetPasswordSubmit} noValidate className="space-y-4">
                <div>
                  <label
                    htmlFor="auth-new-password"
                    className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5"
                  >
                    {tr('fieldNewPassword')}
                  </label>
                  <div className="relative">
                    <KeyRound
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                      aria-hidden="true"
                    />
                    <input
                      id="auth-new-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder={tr('fieldPasswordPlaceholder')}
                      className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-10 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((prev) => !prev)}
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-[#475569] hover:text-[#0F172A] dark:text-[#94A3B8] dark:hover:text-[#F8FAFC]"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-4 w-4" aria-hidden="true" />
                      ) : (
                        <Eye className="h-4 w-4" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">
                      {tr(errors.password)}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1.5"
                  >
                    {lang === 'bn' ? 'নতুন পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm New Password'}
                  </label>
                  <div className="relative">
                    <Lock
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#475569] dark:text-[#94A3B8]"
                      aria-hidden="true"
                    />
                    <input
                      id="auth-confirm-password"
                      type={showNewPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={
                        lang === 'bn' ? 'আবার নতুন পাসওয়ার্ড দিন' : 'Re-enter new password'
                      }
                      className="h-11 w-full rounded-lg border border-[#E2E8F0] bg-white pl-9 pr-3 text-sm text-[#0F172A] placeholder:text-[#475569]/60 focus:border-[#00796B] focus:outline-none focus:ring-2 focus:ring-[#00796B]/20 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:placeholder:text-[#94A3B8]/60 dark:focus:border-[#26A69A]"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-xs text-[#D32F2F] dark:text-[#FF4D4D]">
                      {errors.confirmPassword}
                    </p>
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
                  className="h-11 w-full rounded-lg bg-[#00796B] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#00695C] disabled:opacity-60 dark:bg-[#26A69A] dark:text-[#050505] dark:hover:bg-[#2BBBAD]"
                >
                  {submitting
                    ? lang === 'bn'
                      ? 'আপডেট হচ্ছে...'
                      : 'Updating password...'
                    : lang === 'bn'
                    ? 'নতুন পাসওয়ার্ড সংরক্ষণ করুন'
                    : 'Update Password'}
                </button>
              </form>
            )}

            {/* Login Footer: "First time using this site" -> Create new account */}
            {mode === 'login' && step === 'credentials' && (
              <div className="border-t border-[#E2E8F0] pt-5 space-y-3 dark:border-[#222222]">
                <div className="space-y-1">
                  <h3 className="font-sans text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                    {lang === 'bn' ? 'প্রথমবার এই সাইট ব্যবহার করছেন' : 'First time using this site'}
                  </h3>
                  <p className="text-xs leading-relaxed text-[#475569] dark:text-[#94A3B8]">
                    {lang === 'bn'
                      ? 'এই সাইটের সম্পূর্ণ সুবিধা পেতে প্রথমে আপনাকে একটি নতুন অ্যাকাউন্ট তৈরি করতে হবে।'
                      : 'For full access to this site, you first need to create an account.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetAllMessages();
                    onNavigate(preserveRedirectOnAuthRoute('/register', effectiveSearch));
                  }}
                  className="inline-flex h-11 w-full items-center justify-center rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:text-[#00796B] hover:bg-[#F8FAFC] dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A] dark:hover:text-[#26A69A]"
                >
                  {lang === 'bn' ? 'নতুন অ্যাকাউন্ট তৈরি করুন' : 'Create new account'}
                </button>
              </div>
            )}

            {/* Register View: "or" Divider + Continue with Google + Back to Log in Link */}
            {mode === 'register' && (
              <div className="space-y-4">
                {step === 'credentials' && (
                  <>
                    <div className="relative flex items-center justify-center">
                      <div className="w-full border-t border-[#E2E8F0] dark:border-[#222222]" />
                      <span className="bg-white px-3 text-xs font-medium text-[#475569] dark:bg-[#121212] dark:text-[#94A3B8]">
                        {lang === 'bn' ? 'অথবা' : 'or'}
                      </span>
                      <div className="w-full border-t border-[#E2E8F0] dark:border-[#222222]" />
                    </div>

                    <button
                      type="button"
                      disabled={submitting}
                      onClick={handleGoogleSignIn}
                      className="inline-flex h-11 w-full items-center justify-center gap-2.5 rounded-xl border border-[#E2E8F0] bg-white px-4 text-sm font-semibold text-[#0F172A] transition-colors hover:border-[#00796B] hover:bg-[#F8FAFC] disabled:opacity-60 dark:border-[#222222] dark:bg-[#0A0A0A] dark:text-[#F8FAFC] dark:hover:border-[#26A69A]"
                    >
                      <GoogleGIcon />
                      <span>{lang === 'bn' ? 'গুগল দিয়ে চালিয়ে যান' : 'Continue with Google'}</span>
                    </button>
                  </>
                )}

                <p className="pt-1 text-center text-xs text-[#475569] dark:text-[#94A3B8]">
                  {lang === 'bn' ? 'ইতিমধ্যেই অ্যাকাউন্ট আছে? ' : 'Already have an account? '}
                  <button
                    type="button"
                    onClick={() => {
                      resetAllMessages();
                      onNavigate(preserveRedirectOnAuthRoute('/login', effectiveSearch));
                    }}
                    className="font-semibold text-[#00796B] hover:underline dark:text-[#26A69A]"
                  >
                    {lang === 'bn' ? 'লগ-ইন করুন' : 'Log in'}
                  </button>
                </p>
              </div>
            )}

            {mode === 'forgot' && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    resetAllMessages();
                    onNavigate(preserveRedirectOnAuthRoute('/login', effectiveSearch));
                  }}
                  className="text-xs font-semibold text-[#00796B] dark:text-[#26A69A] hover:underline"
                >
                  {tr('linkBackToLogin')}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
