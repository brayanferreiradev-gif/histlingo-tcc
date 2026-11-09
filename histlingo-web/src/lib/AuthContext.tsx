import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { auth, User } from './api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  serverDown: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, teacherCode?: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [serverDown, setServerDown] = useState(false);

  const tryLoadUser = useCallback(async () => {
    if (!auth.isLoggedIn()) {
      setIsLoading(false);
      return;
    }
    try {
      const me = await auth.me();
      setUser(me);
      setServerDown(false);
    } catch (err: any) {
      if (err?.status === 401) {
        auth.logout();
        setUser(null);
        setServerDown(false);
      } else {
        // Server error (503, network) — keep token, show reconnecting UI
        setServerDown(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    tryLoadUser();
  }, [tryLoadUser]);

  // When server is down, retry every 8 seconds via health check
  useEffect(() => {
    if (!serverDown) return;
    const id = setInterval(async () => {
      try {
        // Ping health endpoint — doesn't need a token
        const res = await fetch((import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:3000/api' : '/api')) + '/health', { signal: AbortSignal.timeout(5000) });
        if (res.ok || res.status === 401) {
          // Server is back — reload user if logged in, else go to login
          setServerDown(false);
          if (auth.isLoggedIn()) {
            auth.me().then(me => setUser(me)).catch(() => { auth.logout(); setUser(null); });
          }
        }
      } catch {
        // still down — keep waiting
      }
    }, 8000);
    return () => clearInterval(id);
  }, [serverDown]);

  const login = async (email: string, password: string) => {
    await auth.login(email, password);
    const me = await auth.me();
    setUser(me);
    setServerDown(false);
  };

  const register = async (username: string, email: string, password: string, teacherCode?: string) => {
    await auth.register(username, email, password, teacherCode);
    const me = await auth.me();
    setUser(me);
    setServerDown(false);
  };

  const logout = () => {
    auth.logout();
    setUser(null);
    setServerDown(false);
  };

  const refreshUser = async () => {
    if (!auth.isLoggedIn()) return;
    try {
      const me = await auth.me();
      setUser(me);
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, serverDown, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
