import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/lib/auth-storage';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';


const trimSlash = (s: string) => s.replace(/\/$/, '');

/** Backend origin in production (e.g. https://api.example.com). In dev, leave unset so requests use /api and Vite proxy. */
export function getApiOrigin(): string {
  return trimSlash(import.meta.env.VITE_API_BASE_URL ?? '');
}

export function resolveApiUrl(path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  const origin = getApiOrigin();
  return origin ? `${origin}${p}` : p;
}

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type JsonOpts = RequestInit & { auth?: boolean; json?: unknown };

/** Prevents concurrent refresh attempts — only one refresh at a time. */
let refreshPromise: Promise<boolean> | null = null;

function isAccessTokenExpiringSoon(token: string, skewSeconds = 30) {
  try {
    const [, payload] = token.split('.');
    if (!payload) return true;
    const normalizedPayload = payload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(payload.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(normalizedPayload)) as { exp?: number };
    if (!parsed.exp) return true;
    return parsed.exp * 1000 <= Date.now() + skewSeconds * 1000;
  } catch {
    return true;
  }
}

/**
 * Attempt to refresh the access token using the stored refresh token.
 * Returns true if the token was successfully refreshed, false otherwise.
 */
async function refreshStoredAuthTokenCore(): Promise<boolean> {
  const stored = readStoredAuth();
  if (!stored?.refreshToken || !stored?.accessToken) return false;

  try {
    const url = resolveApiUrl('/api/Auth/refresh-token');
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: stored.accessToken,
        refreshToken: stored.refreshToken,
      }),
    });

    if (!res.ok) return false;

    const dto = (await res.json()) as {
      userId?: string;
      accessToken: string;
      refreshToken: string;
      email: string;
      userName: string;
      displayName: string;
    };

    writeStoredAuth({
      userId: dto.userId ?? stored.userId,
      accessToken: dto.accessToken,
      refreshToken: dto.refreshToken,
      email: dto.email,
      userName: dto.userName,
      displayName: dto.displayName,
    });
    return true;
  } catch {
    return false;
  }
}

export async function refreshStoredAuthToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = refreshStoredAuthTokenCore().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function apiJson<T>(path: string, opts: JsonOpts = {}): Promise<T> {
  const { auth, json, headers: hdrs, ...rest } = opts;

  function buildInit(): RequestInit {
    const headers = new Headers(hdrs);
    if (json !== undefined) headers.set('Content-Type', 'application/json');
    if (auth) {
      const t = readStoredAuth()?.accessToken;
      if (t) headers.set('Authorization', `Bearer ${t}`);
    }
    return {
      ...rest,
      headers,
      body: json !== undefined ? JSON.stringify(json) : rest.body,
    };
  }

  const url = resolveApiUrl(path);

  // If this request requires auth, proactively refresh if token is expiring soon
  if (auth) {
    const stored = readStoredAuth();
    if (stored?.accessToken && isAccessTokenExpiringSoon(stored.accessToken)) {
      const ok = await refreshStoredAuthToken();
      if (!ok) {
        clearStoredAuth();
        window.dispatchEvent(new Event('algoscope:session-expired'));
        throw new ApiError(401, 'Session expired. Please sign in again.');
      }
    }
  }

  if (path.includes('/api/Submissions') && opts.method === 'POST') {
    trackEvent(AnalyticsEvents.SUBMISSION_CREATED, { problemId: (json as any)?.problemId });
  } else if (path.includes('/api/Chatbot/message') && opts.method === 'POST') {
    trackEvent(AnalyticsEvents.AI_CHAT_MESSAGE);
  } else if (path.includes('/api/Battle/queue') && opts.method === 'POST') {
    trackEvent(AnalyticsEvents.BATTLE_JOIN_QUEUE);
  }


  let res: Response;
  try {
    res = await fetch(url, buildInit());
  } catch {
    if (!getApiOrigin() && path.startsWith('/api')) {
      await new Promise((resolve) => setTimeout(resolve, 700));
      try {
        res = await fetch(url, buildInit());
      } catch {
        throw new ApiError(
          0,
          'Cannot reach the API. Make sure the backend is running on port 5258, then try again.',
        );
      }
    } else {
      throw new ApiError(0, 'Network error. Check your connection and try again.');
    }
  }

  // On 401 for authenticated requests, try to refresh the token and retry once
  if (res.status === 401 && auth) {
    const refreshed = await refreshStoredAuthToken();
    if (refreshed) {
      // Retry the original request with the new token
      res = await fetch(url, buildInit());
    } else {
      clearStoredAuth();
      window.dispatchEvent(new Event('algoscope:session-expired'));
    }
  }

  if (!res.ok) {
    if (res.status === 401 && auth) {
      clearStoredAuth();
      window.dispatchEvent(new Event('algoscope:session-expired'));
    }
    let message = res.statusText;
    try {
      const body = (await res.json()) as { message?: string; Message?: string };
      message = body.message ?? body.Message ?? message;
    } catch {
      /* ignore */
    }
    if ((res.status === 502 || res.status === 503) && !getApiOrigin()) {
      message =
        'Cannot reach the API (dev proxy). Start the backend on port 5258, e.g. `dotnet run --project DSA-Visualizer --urls http://localhost:5258`, then refresh this page.';
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
