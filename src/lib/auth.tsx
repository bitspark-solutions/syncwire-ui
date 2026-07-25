'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { authApi, type AuthResult } from './api';

// ---------------------------------------------------------------------------
// Client-side session store.
//
// Tokens live in localStorage (single-user desktop browser scenario). On app
// load we rotate the stored refresh token — that both restores the session
// and validates it server-side in one call. Access tokens are kept in memory
// state and re-derived from that rotation, never trusted stale.
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'syncwire.refreshToken';

export interface SessionUser {
  id: string;
  email: string;
  displayName: string;
}

interface AuthContextValue {
  /** undefined = still restoring, null = signed out */
  user: SessionUser | null | undefined;
  accessToken: string | null;
  register(input: {
    email: string;
    password: string;
    displayName: string;
  }): Promise<void>;
  login(input: { email: string; password: string }): Promise<void>;
  logout(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  const applySession = useCallback((result: AuthResult) => {
    setUser(result.user);
    setAccessToken(result.accessToken);
    setRefreshToken(result.refreshToken);
    localStorage.setItem(STORAGE_KEY, result.refreshToken);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Restore session on first mount by rotating the stored refresh token.
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setUser(null);
      return;
    }
    authApi
      .refresh(stored)
      .then(applySession)
      .catch(() => clearSession());
  }, [applySession, clearSession]);

  const register = useCallback(
    async (input: { email: string; password: string; displayName: string }) => {
      applySession(await authApi.register(input));
    },
    [applySession],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      applySession(await authApi.login(input));
    },
    [applySession],
  );

  const logout = useCallback(async () => {
    if (accessToken && refreshToken) {
      // Best effort — even if the server call fails, drop the local session.
      await authApi.logout(accessToken, refreshToken).catch(() => undefined);
    }
    clearSession();
  }, [accessToken, refreshToken, clearSession]);

  const value = useMemo(
    () => ({ user, accessToken, register, login, logout }),
    [user, accessToken, register, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
