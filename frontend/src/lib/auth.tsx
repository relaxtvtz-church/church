import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, ApiError } from './api';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role?: string;
}

interface AuthContextValue {
  admin: AdminUser | null;
  loading: boolean;
  login: (identifier: string, password: string, remember?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api<{ admin: AdminUser }>('/auth/me');
      setAdmin(data.admin);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) setAdmin(null);
      else throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh().catch(() => setLoading(false));
    const signOut = () => setAdmin(null);
    window.addEventListener('api:unauthorized', signOut);
    return () => window.removeEventListener('api:unauthorized', signOut);
  }, [refresh]);

  const login = useCallback(async (identifier: string, password: string, remember = false) => {
    const data = await api<{ admin: AdminUser }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password, remember }),
    });
    setAdmin(data.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setAdmin(null);
    }
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    await api('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, login, logout, changePassword, refresh }),
    [admin, loading, login, logout, changePassword, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
