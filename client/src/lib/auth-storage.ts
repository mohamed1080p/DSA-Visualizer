export type StoredAuth = {
  userId?: string;
  accessToken: string;
  refreshToken: string;
  email: string;
  userName: string;
  displayName: string;
};

const KEY = 'dsa_visualizer_auth';
export const AUTH_CHANGED_EVENT = 'dsa_visualizer:auth-changed';

function notifyAuthChanged() {
  window.dispatchEvent(new Event(AUTH_CHANGED_EVENT));
}

export function readStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const v = JSON.parse(raw) as StoredAuth;
    if (!v?.accessToken || !v?.email) return null;
    return v;
  } catch {
    return null;
  }
}

export function writeStoredAuth(v: StoredAuth) {
  localStorage.setItem(KEY, JSON.stringify(v));
  notifyAuthChanged();
}

export function clearStoredAuth() {
  localStorage.removeItem(KEY);
  notifyAuthChanged();
}
