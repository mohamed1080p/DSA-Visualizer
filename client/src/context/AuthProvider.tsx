import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiJson } from '@/lib/api-client';
import { AuthContext, type UserDTO, type AuthContextValue } from '@/context/auth-context';
import { AUTH_CHANGED_EVENT, clearStoredAuth, readStoredAuth, writeStoredAuth, type StoredAuth } from '@/lib/auth-storage';

function dtoToStored(d: UserDTO): StoredAuth {
  return {
    userId: d.userId,
    email: d.email,
    userName: d.userName,
    displayName: d.displayName,
    accessToken: d.accessToken,
    refreshToken: d.refreshToken,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<StoredAuth | null>(() => readStoredAuth());
  const navigate = useNavigate();

  useEffect(() => {
    const sync = () => setUser(readStoredAuth());
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    // Also sync when the token is silently refreshed by the api-client
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'dsa_visualizer_auth') sync();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const dto = await apiJson<UserDTO>('/api/Auth/login', { method: 'POST', json: { email, password } });
    const s = dtoToStored(dto);
    writeStoredAuth(s);
    setUser(s);
    navigate('/progress', { replace: true });
  }, [navigate]);

  const register = useCallback(
    async (body: { email: string; password: string; userName: string; displayName: string }) => {
      const dto = await apiJson<UserDTO>('/api/Auth/register', { method: 'POST', json: body });
      const s = dtoToStored(dto);
      writeStoredAuth(s);
      setUser(s);
      navigate('/progress', { replace: true });
    },
    [navigate],
  );

  const logout = useCallback(async () => {
    const s = readStoredAuth();
    if (s?.accessToken) {
      try {
        await apiJson('/api/Auth/logout', { method: 'POST', auth: true });
      } catch {
        /* still clear local session */
      }
    }
    clearStoredAuth();
    setUser(null);
    navigate('/', { replace: true });
  }, [navigate]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      login,
      register,
      logout,
      isAuthenticated: !!user?.accessToken,
    }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
