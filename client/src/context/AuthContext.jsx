import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

const GUEST_KEY = 'simmer_guest_mode';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);   // null = not signed in
  const [loading, setLoading] = useState(true);
  // guestMode: user explicitly chose "Try it free" without signing in
  const [guestMode, setGuestMode] = useState(() => {
    try { return localStorage.getItem(GUEST_KEY) === 'true'; } catch { return false; }
  });

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'include' })
      .then(r => r.json())
      .then(({ user }) => {
        setUser(user || null);
        // If signed in, clear any stale guest flag
        if (user) {
          try { localStorage.removeItem(GUEST_KEY); } catch {}
          setGuestMode(false);
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const enterGuestMode = () => {
    try { localStorage.setItem(GUEST_KEY, 'true'); } catch {}
    setGuestMode(true);
  };

  const signIn = () => {
    window.location.href = '/auth/google';
  };

  const signOut = async () => {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
    try { localStorage.removeItem(GUEST_KEY); } catch {}
    setUser(null);
    setGuestMode(false);
  };

  return (
    <AuthContext.Provider value={{ user, loading, guestMode, enterGuestMode, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
