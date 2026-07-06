import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { api, type ApiUser } from '@/lib/api';

const STORAGE_KEY = 'rtj_user';

// Login form values name="김수" + team=100 bypass real signup entirely and
// jump straight to the super-admin screen — see RUN_TO_JESUS_기능정리_v1.md §7.
const SUPER_ADMIN_NAME = '김수';
const SUPER_ADMIN_TEAM = 100;

type AuthValue = {
  user: ApiUser | null;
  loading: boolean;
  /** Returns 'superadmin' for the special-case credentials without touching the users table. */
  login: (name: string, teamId: number) => Promise<ApiUser | 'superadmin'>;
  updateUser: (patch: { name?: string; team_id?: number }) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY);
        if (saved) {
          const cached: ApiUser = JSON.parse(saved);
          const fresh = await api.login({ person_id: cached.person_id, name: cached.name, team_id: cached.team_id });
          setUser(fresh);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
        }
      } catch {
        // offline or server hiccup on cold start — fall back to no session rather than blocking
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (name: string, teamId: number) => {
    if (name.trim() === SUPER_ADMIN_NAME && teamId === SUPER_ADMIN_TEAM) {
      return 'superadmin' as const;
    }
    const fresh = await api.login({ name: name.trim(), team_id: teamId });
    setUser(fresh);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    return fresh;
  };

  const updateUser = async (patch: { name?: string; team_id?: number }) => {
    if (!user) return;
    const fresh = await api.updateUser(user.person_id, patch);
    setUser(fresh);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, updateUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
