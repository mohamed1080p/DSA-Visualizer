import { createContext } from 'react';
import type { StoredAuth } from '@/lib/auth-storage';

export type UserDTO = {
  userId?: string;
  email: string;
  userName: string;
  displayName: string;
  accessToken: string;
  refreshToken: string;
};

export type AuthContextValue = {
  user: StoredAuth | null;
  login: (email: string, password: string) => Promise<void>;
  register: (body: { email: string; password: string; userName: string; displayName: string }) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
