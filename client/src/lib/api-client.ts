import { clearStoredAuth, readStoredAuth, writeStoredAuth } from '@/lib/auth-storage';
import { trackEvent, AnalyticsEvents } from '@/lib/analytics';

const AUTH_EXPIRED_EVENT = 'dsa_visualizer:session-expired';


const trimSlash = (s: string) => s.replace(/\/$/, '');
type SubmissionRequestBody = { problemId?: string };

function dispatchAuthExpired() {
  globalThis.window?.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
}

function buildRequestInit(opts: JsonOpts, authToken?: string): RequestInit {
  const { json, headers: hdrs, ...rest } = opts;
  const headers = new Headers(hdrs);
  if (json !== undefined) headers.set('Content-Type', 'application/json');
  if (authToken) headers.set('Authorization', `Bearer ${authToken}`);

  const init: RequestInit = {
    ...rest,
    headers,
  };

  if (json !== undefined) {
    init.body = JSON.stringify(json);
  } else if (rest.body !== undefined) {
    init.body = rest.body;
  }

  return init;
}

function shouldRefreshAuth(auth: boolean, storedToken?: string) {
  return auth && !!storedToken && isAccessTokenExpiringSoon(storedToken);
}

function shouldTrackSubmission(path: string, method?: string) {
  return path.includes('/api/Submissions') && method === 'POST';
}

function shouldTrackChatMessage(path: string, method?: string) {
  return path.includes('/api/Chatbot/message') && method === 'POST';
}

function shouldTrackBattleQueue(path: string, method?: string) {
  return path.includes('/api/Battle/queue') && method === 'POST';
}

function getSubmissionProblemId(json: unknown): string | undefined {
  if (!json || typeof json !== 'object') return undefined;
  return (json as SubmissionRequestBody).problemId;
}

function trackApiEvent(path: string, method: string | undefined, json: unknown) {
  if (shouldTrackSubmission(path, method)) {
    trackEvent(AnalyticsEvents.SUBMISSION_CREATED, { problemId: getSubmissionProblemId(json) });
    return;
  }

  if (shouldTrackChatMessage(path, method)) {
    trackEvent(AnalyticsEvents.AI_CHAT_MESSAGE);
    return;
  }

  if (shouldTrackBattleQueue(path, method)) {
    trackEvent(AnalyticsEvents.BATTLE_JOIN_QUEUE);
  }
}

async function fetchWithDevRetry(url: string, init: RequestInit, path: string): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    if (getApiOrigin() || !path.startsWith('/api')) {
      throw new ApiError(0, 'Network error. Check your connection and try again.');
    }

    await new Promise((resolve) => setTimeout(resolve, 700));
    try {
      return await fetch(url, init);
    } catch {
      throw new ApiError(
        0,
        'Cannot reach the API. Make sure the backend is running on port 5258, then try again.',
      );
    }
  }
}

async function handleUnauthorizedResponse(auth: boolean, refresh: () => Promise<boolean>) {
  if (!auth) return false;

  const refreshed = await refresh();
  if (refreshed) return true;

  clearStoredAuth();
  dispatchAuthExpired();
  return false;
}

async function handleExpiredAuth(auth: boolean) {
  if (!auth) return;
  clearStoredAuth();
  dispatchAuthExpired();
}

async function refreshAuthIfNeeded(auth: boolean) {
  if (!auth) return;

  const stored = readStoredAuth();
  if (!shouldRefreshAuth(auth, stored?.accessToken)) return;

  const ok = await refreshStoredAuthToken();
  if (!ok) {
    clearStoredAuth();
    dispatchAuthExpired();
    throw new ApiError(401, 'Session expired. Please sign in again.');
  }
}

async function getApiResponseData<T>(res: Response, auth: boolean): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return (await res.json()) as T;
  }

  await handleExpiredAuth(res.status === 401 && auth);

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
      .replaceAll('-', '+')
      .replaceAll('_', '/')
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
  refreshPromise ??= refreshStoredAuthTokenCore().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

export async function apiJson<T>(path: string, opts: JsonOpts = {}): Promise<T> {
  const { auth = false, json } = opts;
  const storedToken = auth ? readStoredAuth()?.accessToken : undefined;
  const requestInit = buildRequestInit(opts, storedToken);

  const url = resolveApiUrl(path);

  await refreshAuthIfNeeded(auth);
  trackApiEvent(path, opts.method, json);

  let res = await fetchWithDevRetry(url, requestInit, path);

  // On 401 for authenticated requests, try to refresh the token and retry once
  if (res.status === 401 && auth) {
    const refreshed = await handleUnauthorizedResponse(auth, refreshStoredAuthToken);
    if (refreshed) {
      // Retry the original request with the new token
      res = await fetch(url, buildRequestInit(opts, readStoredAuth()?.accessToken));
    }
  }

  return getApiResponseData<T>(res, auth);
}
