const AUTH_TOKEN_STORAGE_KEY = 'du_auth_token';
let inMemoryToken: string | null = null;

export function getStoredAuthToken(): string | null {
  try {
    const tabToken = window.sessionStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (tabToken) {
      inMemoryToken = tabToken;
      return tabToken;
    }
    const stored = window.localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (stored) {
      inMemoryToken = stored;
      return stored;
    }
  } catch {
    // Fallback to in-memory token if storage is restricted
  }
  return inMemoryToken;
}

export function setStoredAuthToken(token: string | null): void {
  inMemoryToken = token;
  try {
    if (token) {
      window.sessionStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
      window.localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
    } else {
      window.sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
      window.localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    }
  } catch {
    // Ignore storage quota or iframe privacy exceptions cleanly
  }
}

export function withAuthTokenUrl(url: string): string {
  const token = getStoredAuthToken();
  if (!token) return url;
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}token=${encodeURIComponent(token)}`;
}

export function apiFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers ?? undefined);
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, {
    ...init,
    credentials: 'include',
    headers,
  });
}

export interface SafeJsonResult<T> {
  data: T | null;
  rawText: string;
  isJson: boolean;
}

export async function parseJsonSafe<T = Record<string, unknown>>(
  res: Response
): Promise<SafeJsonResult<T>> {
  const rawText = await res.text();
  const trimmed = rawText.trim();
  if (!trimmed) {
    return { data: null, rawText, isJson: true };
  }
  try {
    const parsed = JSON.parse(trimmed) as T;
    return { data: parsed, rawText, isJson: true };
  } catch {
    return { data: null, rawText, isJson: false };
  }
}

export function extractApiErrorMessage<T extends { error?: unknown; message?: unknown }>(
  res: Response,
  parsed: SafeJsonResult<T>,
  fallback: string
): string {
  if (parsed.data && typeof parsed.data === 'object') {
    if (typeof parsed.data.error === 'string' && parsed.data.error.trim()) {
      return parsed.data.error;
    }
    if (typeof parsed.data.message === 'string' && parsed.data.message.trim()) {
      return parsed.data.message;
    }
  }
  if (!parsed.isJson) {
    if (res.status === 404) {
      return 'Authentication endpoint not found (404). Please refresh and try again.';
    }
    if (res.status >= 500) {
      return `Authentication server error (HTTP ${res.status}). Please try again shortly.`;
    }
    return `Unexpected response from server (HTTP ${res.status}). Please try again.`;
  }
  return fallback;
}

