import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  fetchCurrentUser,
  login as loginRequest,
  logout as logoutRequest,
  signup as signupRequest,
} from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // The JWT lives in an httpOnly cookie, invisible to JS, so the only way
    // to know whether a session already exists (e.g. after a page refresh)
    // is to ask the server. A rejection here just means "logged out" — not
    // an error to surface anywhere.
    fetchCurrentUser()
      .then((data) => {
        if (!cancelled) setUser(data);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === 'admin',
      signup: (credentials) => signupRequest(credentials).then((data) => {
        setUser(data);
        return data;
      }),
      login: (credentials) => loginRequest(credentials).then((data) => {
        setUser(data);
        return data;
      }),
      logout: () =>
        logoutRequest()
          .catch(() => {})
          .finally(() => setUser(null)),
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
