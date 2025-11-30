// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect } from 'react';

type AuthContextType = {
  token: string | null;
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextType>({ token: null, isAuthenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    setToken(stored);
  }, []);

  return (
    <AuthContext.Provider value={{ token, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);