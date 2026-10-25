import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, tokenStore } from '../lib/api.js';

const GUEST_KEY = 'lockin_guest';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(() => localStorage.getItem(GUEST_KEY) === '1');
  const [loading, setLoading] = useState(() => Boolean(tokenStore.get()));

  // Restore a logged-in session from a stored token
  useEffect(() => {
    if (!tokenStore.get()) return;
    api('/auth/me')
      .then(({ user }) => setUser(user))
      .catch(() => tokenStore.clear())
      .finally(() => setLoading(false));
  }, []);

  const handleAuth = useCallback(({ token, user }) => {
    tokenStore.set(token);
    localStorage.removeItem(GUEST_KEY);
    setIsGuest(false);
    setUser(user);
  }, []);

  const login = useCallback(
    async (email, password) => handleAuth(await api('/auth/login', { method: 'POST', body: { email, password } })),
    [handleAuth],
  );

  const signup = useCallback(
    async (email, password) => handleAuth(await api('/auth/signup', { method: 'POST', body: { email, password } })),
    [handleAuth],
  );

  const continueAsGuest = useCallback(() => {
    tokenStore.clear();
    localStorage.setItem(GUEST_KEY, '1');
    setUser(null);
    setIsGuest(true);
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    localStorage.removeItem(GUEST_KEY);
    setUser(null);
    setIsGuest(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isGuest,
      loading,
      isAuthenticated: Boolean(user) || isGuest,
      login,
      signup,
      continueAsGuest,
      logout,
    }),
    [user, isGuest, loading, login, signup, continueAsGuest, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
