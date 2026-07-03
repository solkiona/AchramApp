// 'use client';

// import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
// import { apiClient } from '@/lib/api';

// interface AuthContextType {
//   user: any | null;
//   token: string | null; // Potentially still useful if the backend also returns a token alongside the cookie
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   login: (email: string, password: string) => Promise<boolean>;
//   logout: () => void;
//   checkAuthStatus: () => Promise<void>;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<any | null>(null);
//   const [token, setToken] = useState<string | null>(null); // Store token if backend provides one
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);


// interface LoginResult {
//   success: boolean;
//   requires2FA?: boolean;
//   message?: string; // Add an optional message field for errors
// }


//   const checkAuthStatus = async () => {
//     console.log("AuthContext: Checking authentication status via API call to /auth/passenger/authenticated...");
//     // setIsLoading(true); // Don't set loading here if login function already handles it, or manage carefully to avoid conflicts
//     try {
//       // Call the authenticated check API using apiClient, indicating it's an auth request relying on cookies
//       const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); // isAuthRequest = true

//       if (response.status === 'success') {
//         console.log("AuthContext: Authentication verified via API call. User is logged in.");
//         setIsAuthenticated(true);
//         // Optional: Fetch user details here if needed, or rely on initial state from login
//         // setUser(response.data.user);
//         // setToken(response.data.token); // Store if returned
//       } else {
//         console.log("AuthContext: API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
//         setIsAuthenticated(false);
//         setUser(null);
//         setToken(null);
//       }
//     } catch (err: any) {
//       console.error("AuthContext: Error checking authentication status via API call:", err);
//       // Consider the user unauthenticated on error
//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null);
//     } finally {
//       setIsLoading(false); // Stop loading state after auth check completes
//     }
//   };

//   const login = async (email: string, password: string): Promise<LoginResult> => { // Change return type to Promise<LoginResult>
//   console.log("AuthContext: Attempting login for user:", email);
//   setIsLoading(true);
//   try {
//     const loginResponse = await apiClient.post('/auth/passenger/login', {
//       email,
//       password,
//     }, undefined, undefined, true);

//     console.log("AuthContext: Login API Response:", loginResponse);

//     if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
//       console.log("AuthContext: Login successful via API call. Token received (though cookie is primary auth).");
//       await new Promise(resolve => setTimeout(resolve, 500));
//       await checkAuthStatus();
//       return { success: true }; // Return success object
//     } else if(loginResponse.status === 'success' && loginResponse.data?.two_factor === true){
//       console.log("Authcontext: login successful, but 2FA verification is required");
//       setIsLoading(false);
//       return {success: true, requires2FA: true};
//     }
    
//     else {
//       // NEW: Extract error message from API response
//       let errorMessage = "Login failed. Please try again."; // Default message
//       if (loginResponse.message) {
//           errorMessage = loginResponse.message; // Use top-level message if available
//       } 
      
//       if (loginResponse.details && loginResponse.details.non_field_errors && Array.isArray(loginResponse.details.non_field_errors)) {
//           // Attempt to get the first specific error from details
//           const specificError = loginResponse.details.non_field_errors[0];
//           if (specificError) {
//               errorMessage = specificError;
//           }
//       }
//       // NEW: Use the extracted or default error message
//       console.error("AuthContext: Login API responded with non-success status or missing token/data:", loginResponse);
//       setIsLoading(false);
//       // Do NOT call showNotification here, let the caller (page.tsx) handle it
//       return { success: false, message: errorMessage }; // Return failure object with message
//     }
//   } catch (err: any) {
//     console.error("AuthContext: Error during login API call:", err);
//     setIsLoading(false);
//     // NEW: Provide a generic error message for network/other errors
//     return { success: false, message: "An error occurred during login. Please check your connection." };
//   }
// };
//   const logout = async () => {
//     console.log("AuthContext: Attempting logout...");
//     try {
//       // If there's a backend logout endpoint, call it.
//       // await apiClient.post('/auth/logout', {}, token, undefined, true); // Example, if needed
//       console.log("AuthContext: Logout request sent (or session assumed invalidated by server). Clearing frontend state.");
//       // Clear context state
//       setUser(null);
//       setToken(null);
//       setIsAuthenticated(false);
//     } catch (err) {
//       console.error("AuthContext: Error during logout API call:", err);
//       // Clear frontend state anyway on error
//       setUser(null);
//       setToken(null);
//       setIsAuthenticated(false);
//     }
//   };

//   // Effect to check auth status on initial load
//   useEffect(() => {
//     console.log("AuthContext: Initializing - Checking authentication status...");
//     checkAuthStatus(); // Initial check on mount
//   }, []); // Empty dependency array means this runs once on mount

//   const contextValue: AuthContextType = {
//     user,
//     token,
//     isAuthenticated,
//     isLoading,
//     login,
//     logout,
//     checkAuthStatus,
//   };

//   return (
//     <AuthContext.Provider value={contextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };


// src/contexts/AuthContext.tsx
'use client';
import {
  createContext, useContext, useState, useEffect,
  useCallback, useMemo, ReactNode
} from 'react';
import { Capacitor } from '@capacitor/core';
import { apiClient, setUnauthorizedHandler } from '@/lib/api';

const isNative = Capacitor.isNativePlatform();

interface LoginResult {
  success: boolean;
  requires2FA?: boolean;
  message?: string;
}

interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]                   = useState<any | null>(null);
  const [token, setToken]                 = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading]         = useState(true);
  const [mounted, setMounted]             = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    setUnauthorizedHandler(async () => {
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });
  }, [mounted]);

  const checkAuthStatus = useCallback(async () => {
    // Native: no cookie to check — auth lives in token state only
    if (isNative) {
      setIsLoading(false);
      return;
    }

    console.log('[Auth] Checking cookie session...');
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        '/auth/passenger/authenticated',
        undefined, false, undefined, true
      );

      if (response.status === 'success') {
        setIsAuthenticated(true);
        try {
          const me = await apiClient.get(
            '/auth/passenger/me',
            undefined, false, undefined, true
          );
          if (me.status === 'success') setUser(me.data ?? null);
        } catch {}
      } else {
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('[Auth] checkAuthStatus error:', err);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Boot hydration
  useEffect(() => {
    if (!mounted) return;
    // Native: no SecureStorage, no Keychain — user logs in fresh per session
    // Web: verify existing cookie session
    if (isNative) {
      setIsLoading(false);
      return;
    }
    checkAuthStatus();
  }, [mounted]);

  const login = useCallback(async (
    email: string, password: string
  ): Promise<LoginResult> => {
    console.log('[Auth] Attempting login...');
    setIsLoading(true);

    try {
      const res = await apiClient.post(
        '/auth/passenger/login',
        { email, password },
        undefined, undefined, true
      );

      if (res.status === 'success' && res.data?.two_factor) {
        setIsLoading(false);
        return { success: true, requires2FA: true };
      }

      if (res.status === 'success') {
        if (isNative) {
          // Native: must have token in response body
          if (!res.data?.token) {
            setIsLoading(false);
            return { success: false, message: 'No token returned from server' };
          }

          const access = res.data.token as string;

          // Set state immediately — no Keychain, no native calls, no blocking
          setToken(access);
          setIsAuthenticated(true);
          setIsLoading(false);

          // Profile fetch detached — never blocks login flow
          Promise.resolve().then(async () => {
            try {
              const me = await apiClient.get(
                '/auth/passenger/me',
                access, false, undefined, true
              );
              if (me.status === 'success') setUser(me.data ?? null);
            } catch {}
          });

          return { success: true };

        } else {
          // Web: server already set httpOnly cookie — just update state
          setIsAuthenticated(true);
          setIsLoading(false);

          Promise.resolve().then(async () => {
            try {
              const me = await apiClient.get(
                '/auth/passenger/me',
                undefined, false, undefined, true
              );
              if (me.status === 'success') setUser(me.data ?? null);
            } catch {}
          });

          return { success: true };
        }
      }

      // Error response from server
      const errorMessage =
        res.details?.non_field_errors?.[0] ??
        res.message ??
        'Login failed. Please try again.';

      setIsLoading(false);
      return { success: false, message: errorMessage };

    } catch (err) {
      console.error('[Auth] Login error:', err);
      setIsLoading(false);
      return { success: false, message: 'Network error. Please check your connection.' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {}, token ?? undefined, undefined, true);
    } catch {}
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  }, [token]);

  const value = useMemo(() => ({
    user, token, isAuthenticated, isLoading,
    login, logout, checkAuthStatus,
  }), [user, token, isAuthenticated, isLoading, login, logout, checkAuthStatus]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
























