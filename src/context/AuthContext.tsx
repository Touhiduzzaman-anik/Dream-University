import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import {
  apiFetch,
  extractApiErrorMessage,
  parseJsonSafe,
  setStoredAuthToken,
} from '../lib/authFetch';
import type { AuthUser, StudentProfileRecord } from '../types/domain';

export interface OtpChallengeResponse {
  challengeId: number;
  identifier: string;
  identifierType: 'email' | 'phone';
  purpose: 'register' | 'reset_password';
  maskedDestination: string;
  expiresInSeconds: number;
  resendCooldownSeconds: number;
  sentVia: 'email' | 'sms' | 'demo';
  demoOtp: string | null;
  deliveryChannel: 'smtp_email' | 'webhook_email' | 'webhook_sms' | 'demo';
}

interface AuthContextValue {
  user: AuthUser | null;
  profile: StudentProfileRecord | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  setProfile: (profile: StudentProfileRecord | null) => void;
  refreshSession: () => Promise<AuthUser | null>;
  loginWithEmailPassword: (input: {
    email?: string;
    identifier?: string;
    password: string;
    portal: 'student' | 'admin';
  }) => Promise<AuthUser>;
  requestStudentOtp: (input: {
    identifier: string;
    purpose: 'register' | 'reset_password';
    fullName?: string;
    password?: string;
  }) => Promise<OtpChallengeResponse>;
  verifyStudentOtp: (input: {
    challengeId: number;
    identifier: string;
    purpose: 'register' | 'reset_password';
    otp: string;
  }) => Promise<{ user?: AuthUser; verified?: boolean; challengeId?: number }>;
  loginWithGoogle: (portal: 'student' | 'admin') => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<StudentProfileRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async (): Promise<AuthUser | null> => {
    try {
      const res = await apiFetch('/api/auth/me');
      if (!res.ok) {
        setStoredAuthToken(null);
        setUser(null);
        setProfile(null);
        return null;
      }
      const parsed = await parseJsonSafe<{
        user?: AuthUser | null;
        profile?: StudentProfileRecord | null;
      }>(res);
      if (!parsed.isJson || !parsed.data?.user) {
        setStoredAuthToken(null);
        setUser(null);
        setProfile(null);
        return null;
      }
      setUser(parsed.data.user);
      setProfile(parsed.data.profile ?? null);
      return parsed.data.user;
    } catch {
      setUser(null);
      setProfile(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const loginWithEmailPassword = async (input: {
    email?: string;
    identifier?: string;
    password: string;
    portal: 'student' | 'admin';
  }): Promise<AuthUser> => {
    const endpoint = input.portal === 'admin' ? '/api/auth/admin/login' : '/api/auth/login';
    const payload =
      input.portal === 'admin'
        ? { email: input.email ?? input.identifier ?? '', password: input.password }
        : { identifier: input.identifier ?? input.email ?? '', password: input.password };
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const parsed = await parseJsonSafe<{
      token?: string;
      user?: AuthUser;
      error?: string;
      message?: string;
    }>(res);
    if (!res.ok || !parsed.isJson || !parsed.data?.user) {
      throw new Error(extractApiErrorMessage(res, parsed, 'Login failed.'));
    }
    if (parsed.data.token) {
      setStoredAuthToken(parsed.data.token);
    }
    setUser(parsed.data.user);
    await refreshSession();
    return parsed.data.user;
  };

  const requestStudentOtp = async (input: {
    identifier: string;
    purpose: 'register' | 'reset_password';
    fullName?: string;
    password?: string;
  }): Promise<OtpChallengeResponse> => {
    const res = await fetch('/api/auth/request-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const parsed = await parseJsonSafe<OtpChallengeResponse & { error?: string; message?: string }>(
      res
    );
    if (!res.ok || !parsed.isJson || !parsed.data) {
      throw new Error(extractApiErrorMessage(res, parsed, 'Unable to send 4-digit OTP.'));
    }
    return parsed.data;
  };

  const verifyStudentOtp = async (input: {
    challengeId: number;
    identifier: string;
    purpose: 'register' | 'reset_password';
    otp: string;
  }): Promise<{ user?: AuthUser; verified?: boolean; challengeId?: number }> => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(input),
    });
    const parsed = await parseJsonSafe<{
      token?: string;
      user?: AuthUser;
      verified?: boolean;
      challengeId?: number;
      error?: string;
      message?: string;
    }>(res);
    if (!res.ok || !parsed.isJson || !parsed.data) {
      throw new Error(extractApiErrorMessage(res, parsed, 'OTP verification failed.'));
    }
    if (parsed.data.token && parsed.data.user) {
      setStoredAuthToken(parsed.data.token);
      setUser(parsed.data.user);
      await refreshSession();
    }
    return parsed.data;
  };

  const loginWithGoogle = async (portal: 'student' | 'admin'): Promise<AuthUser> => {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const idToken = await result.user.getIdToken();

    const res = await fetch('/api/auth/firebase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${idToken}`,
      },
      credentials: 'include',
      body: JSON.stringify({ portal }),
    });
    const parsed = await parseJsonSafe<{
      token?: string;
      user?: AuthUser;
      error?: string;
      message?: string;
    }>(res);
    if (!res.ok || !parsed.isJson || !parsed.data?.user) {
      await signOut(auth).catch(() => undefined);
      throw new Error(extractApiErrorMessage(res, parsed, 'Google authentication rejected.'));
    }
    if (parsed.data.token) {
      setStoredAuthToken(parsed.data.token);
    }
    setUser(parsed.data.user);
    await refreshSession();
    return parsed.data.user;
  };

  const logout = async () => {
    setStoredAuthToken(null);
    await signOut(auth).catch(() => undefined);
    await apiFetch('/api/auth/logout', { method: 'POST' }).catch(() => undefined);
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        setUser,
        setProfile,
        refreshSession,
        loginWithEmailPassword,
        requestStudentOtp,
        verifyStudentOtp,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
