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


///////////////////////////////////////////////////
//////////////////////////////////////////////////



// 'use client';
// import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
// import { Capacitor } from '@capacitor/core';
// import { SecureStorage } from '@aparajita/capacitor-secure-storage';
// import { apiClient } from '@/lib/api';
// import { useBiometricAuth } from '@/hooks/useBiometricAuth';
// import { setUnauthorizedHandler } from '@/lib/api';
// import { useRouter } from 'next/navigation';

// const isNative = Capacitor.isNativePlatform();

// interface AuthContextType {
//   user: any | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   isBiometricAvailable: boolean | null;
//   isBiometricEnabled: boolean;
//   login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>;
//   checkAuthStatus: () => Promise<boolean>;
//   logout: () => Promise<void>;
//   loginWithBiometric: () => Promise<boolean>;
//   enableBiometricLogin: () => Promise<boolean>;
//   disableBiometricLogin: () => Promise<void>;
//   isBiometricBlocked: boolean;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<any | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [mounted, setMounted] = useState(false);
//   const [isBiometricBlocked, setIsBiometricBlocked] = useState(false);

//   const biometric = useBiometricAuth();

//   useEffect(() => setMounted(true), []);

//   const router = useRouter();

// useEffect(() => {
//   if (!mounted) return;
//   setUnauthorizedHandler(async () => {
//     setUser(null);
//     setToken(null);
//     setIsAuthenticated(false);
//     if (isNative) {
//       await SecureStorage.remove('auth_token');
//       await SecureStorage.remove('refresh_token');
//       await biometric.setRequireFullLogin(true);
//       setIsBiometricBlocked(true);
//     }
//      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
//   });
// }, [mounted, router]);

//  useEffect(() => {
//   if (!mounted) return;

//   if (isNative) {
//     // Native: hydrate token for later use, but do NOT set isAuthenticated
//     biometric.getSecureCredentials().then(c => {
//       if (c.accessToken) setToken(c.accessToken);
//     });
//     biometric.checkAvailability();
//     setIsLoading(false);
//     return;
//   }

//   // Web only: verify httpOnly cookie
//   checkAuthStatus();
// }, [mounted]);


   
//   const checkAuthStatus = useCallback(async () => {
//   // Native must go through BiometricGate, never auto-login via token/cookie
//   if (isNative) {
//     setIsLoading(false);
//     return false;
//   }

//   console.log("AuthContext: Checking authentication status via cookie...");
//   setIsLoading(true);
//   try {
//     const response = await apiClient.get(
//       '/auth/passenger/authenticated',
//       undefined,
//       false,
//       undefined,
//       true
//     );

//     if (response.status === 'success') {
//       setIsAuthenticated(true);
//       // populate user for web
//       try {
//         const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
//         if (me.status === 'success') setUser(me.data ?? null);
//       } catch {}
//       return true;
//     } else {
//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null);
//       return false;
//     }
//   } catch (err) {
//     setIsAuthenticated(false);
//     setUser(null);
//     setToken(null);
//     return false;
//   } finally {
//     setIsLoading(false);
//   }
// }, []);
    
//   const login = useCallback(async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const res = await apiClient.post('/auth/passenger/login', { email, password }, undefined, undefined, true);
//       if (res.status === 'success' && res.data?.token) {
//         console.log(res.data?.token)
//         const access = res.data.token as string;
//         const refresh = res.data.refresh as string | undefined;

//         setToken(access);
//         setIsAuthenticated(true);

//         // Native: store tokens immediately so first profile fetch works
//         if (isNative) {
//           await SecureStorage.set('auth_token', access);
//           if (refresh) await SecureStorage.set('refresh_token', refresh);
//           await biometric.setRequireFullLogin(false);
//           setIsBiometricBlocked(false);
//         }

//         // Fetch profile using the token we just received
//         try {
//           const me = await apiClient.get('/auth/passenger/me', access, false, undefined, true);
//           if (me.status === 'success') setUser(me.data?? null);
//         } catch {}

//         setIsLoading(false);
//         return { success: true };
//       }
//       if (res.status === 'success' && res.data?.two_factor) {
//         setIsLoading(false);
//         return { success: true, requires2FA: true };
//       }
//       setIsLoading(false);
//       return { success: false, message: res.message || 'Login failed' };
//     } catch {
//       setIsLoading(false);
//       return { success: false, message: 'Login error' };
//     }
//   }, []);

//   const logout = useCallback(async () => {
//     try { await apiClient.post('/auth/logout', {}, token ?? undefined, undefined, true); } catch {}
//     setUser(null);
//     setToken(null);
//     setIsAuthenticated(false);
//     if (isNative) {
//       await biometric.disableBiometricLogin();
//       await SecureStorage.remove('auth_token');
//       await SecureStorage.remove('refresh_token');
//     }
//   }, [biometric]);

//   // const loginWithBiometric = useCallback(async () => {
//   //   if (!isNative) return false;
//   //   const auth = await biometric.authenticate();
//   //   if (!auth.success) return false;

//   //   const creds = await biometric.getSecureCredentials();
//   //   if (!creds.accessToken) return false;

//   //   setToken(creds.accessToken);
//   //   setIsAuthenticated(true);

//   //   try {
//   //     const me = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
//   //     if (me.status === 'success') setUser(me.data?? null);
//   //   } catch {}
//   //   return true;
//   // }, [biometric]);

//   const loginWithBiometric = useCallback(async () => {
//   if (!isNative) return false;

//   // Check if full login is required before even prompting biometric
//   const requiresFull = await biometric.getRequireFullLogin();
//   if (requiresFull) {

//     setIsBiometricBlocked(true);
//     return false;
  
//   }

//   const creds = await biometric.getSecureCredentials();
//   if (!creds.accessToken) return false;

//   // Validate token BEFORE prompting biometric
//   try {
//     const check = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
//     if (check.status !== 'success') {
//       await biometric.setRequireFullLogin(true);
//       await biometric.disableBiometricLogin();
//       return false;
//     }
//   } catch {
//     await biometric.setRequireFullLogin(true);
//     await biometric.disableBiometricLogin();
//     return false;
//   }

//   // Token is valid — NOW prompt biometric
//   const auth = await biometric.authenticate();
//   if (!auth.success) return false;

//   setToken(creds.accessToken);
//   setIsAuthenticated(true);
//   try {
//     const me = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
//     if (me.status === 'success') setUser(me.data ?? null);
//   } catch {}
//   return true;
// }, [biometric]);

//   const enableBiometricLogin = useCallback(async () => {
//     if (!isNative) return false;
//     let t = token;
//     if (!t) {
//       const creds = await biometric.getSecureCredentials();
//       t = creds.accessToken;
//       if (t) setToken(t);
//     }
//     if (!t) return false;
//     const creds = await biometric.getSecureCredentials();
//     const ok = await biometric.enableBiometricLogin(t, creds.refreshToken?? undefined);
//     return ok;
//   }, [token, biometric]);

//   const disableBiometricLogin = useCallback(async () => {
//     if (isNative) await biometric.disableBiometricLogin();
//   }, [biometric]);

//   useEffect(() => {
//     setIsLoading(false);
//   }, []);

//   const isBiometricAvailable = isNative && mounted? (biometric.biometryResult?.isAvailable?? null) : null;
//   const isBiometricEnabled = isNative && mounted? biometric.isEnabled : false;

//   const value = useMemo(() => ({
//     user,
//     token,
//     isAuthenticated,
//     isLoading,
//     isBiometricAvailable,
//     isBiometricEnabled,
//     isBiometricBlocked,
//     checkAuthStatus,
//     login,
//     logout,
//     loginWithBiometric,
//     enableBiometricLogin,
//     disableBiometricLogin,
    
//   }), [user, token, isAuthenticated, isLoading, isBiometricAvailable, isBiometricEnabled,isBiometricBlocked, checkAuthStatus,login, logout, loginWithBiometric, enableBiometricLogin, disableBiometricLogin]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };


// src/contexts/AuthContext.tsx
// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { Capacitor } from '@capacitor/core';
import { apiClient } from '@/lib/api';

// Types
interface LoginResult {
  success: boolean;
  requires2FA?: boolean;
  message?: string;
}

interface AuthContextType {
  // Core auth state
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Core methods
  login: (email: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;

  // Biometric fields (only available on native)
  isBiometricAvailable: boolean | null;
  isBiometricEnabled: boolean;
  isBiometricLoading: boolean;
  isBiometricBlocked: boolean; // ← NEW: Track when biometric login should be blocked
  loginWithBiometric: () => Promise<boolean>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
  checkBiometricAvailability: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Core auth state
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Biometric state (lazy-loaded)
  const [biometricModule, setBiometricModule] = useState<any>(null);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isBiometricBlocked, setIsBiometricBlocked] = useState(false); // ← NEW
  const [biometryResult, setBiometryResult] = useState<any>(null);

  // Mount check (prevents SSR issues)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Lazy-load biometric hook ONLY on native platforms AFTER mount
  useEffect(() => {
    if (!mounted || !Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const loadBiometric = async () => {
      try {
        const mod = await import('@/hooks/useBiometricAuth');
        if (!cancelled) {
          const hook = mod.useBiometricAuth();
          setBiometricModule({
            checkAvailability: hook.checkAvailability,
            authenticate: hook.authenticate,
            enableBiometricLogin: hook.enableBiometricLogin,
            disableBiometricLogin: hook.disableBiometricLogin,
            getSecureCredentials: hook.getSecureCredentials,
            setRequireFullLogin: hook.setRequireFullLogin, // ← NEW: For blocking logic
            getRequireFullLogin: hook.getRequireFullLogin, // ← NEW: For blocking logic
          });
          // Initial biometric check
          const available = await hook.checkAvailability().catch(() => false);
          if (!cancelled) {
            setBiometryResult({ isAvailable: available });
            const enabled = await hook.getSecureCredentials?.().then(c => c.enabled).catch(() => false);
            setIsBiometricEnabled(enabled);
            // Check if full login is required (token expired, etc.)
            const requiresFull = await hook.getRequireFullLogin?.().catch(() => true);
            if (!cancelled) setIsBiometricBlocked(requiresFull);
          }
        }
      } catch (err) {
        console.warn('Failed to load biometric module:', err);
      }
    };
    loadBiometric();
    return () => { cancelled = true; };
  }, [mounted]);

  // Check auth status via API (web: cookie, native: defer to biometric)
  const checkAuthStatus = useCallback(async () => {
    console.log('AuthContext: Checking authentication status via API...');
    setIsLoading(true);
    try {
      const response = await apiClient.get(
        '/auth/passenger/authenticated',
        undefined,
        false,
        undefined,
        true // isAuthRequest = true (uses cookie)
      );
      if (response.status === 'success') {
        console.log('AuthContext: Authentication verified.');
        setIsAuthenticated(true);
        setUser(response.data);
        // On native: if we have a stored token, ensure biometric isn't blocked
        if (Capacitor.isNativePlatform() && biometricModule && token) {
          await biometricModule.setRequireFullLogin?.(false).catch(() => {});
          setIsBiometricBlocked(false);
        }
      } else {
        console.log('AuthContext: Not authenticated.');
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
        // On native: block biometric login if auth failed
        if (Capacitor.isNativePlatform() && biometricModule) {
          await biometricModule.setRequireFullLogin?.(true).catch(() => {});
          setIsBiometricBlocked(true);
        }
      }
    } catch (err: any) {
      console.error('AuthContext: Error checking auth status:', err);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      // On native: block biometric login on error
      if (Capacitor.isNativePlatform() && biometricModule) {
        await biometricModule.setRequireFullLogin?.(true).catch(() => {});
        setIsBiometricBlocked(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [biometricModule, token]);

  // Initial auth check (web only; native defers to biometric flow)
  useEffect(() => {
    if (!mounted) return;
    if (!Capacitor.isNativePlatform()) {
      checkAuthStatus();
    } else {
      // Native: try to hydrate token from secure storage first
      const hydrateNativeToken = async () => {
        try {
          const creds = await biometricModule?.getSecureCredentials?.().catch(() => ({ accessToken: null }));
          if (creds?.accessToken) {
            setToken(creds.accessToken);
            // Verify token is still valid before allowing biometric login
            try {
              const check = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
              if (check.status === 'success') {
                setIsAuthenticated(true);
                setUser(check.data);
                await biometricModule?.setRequireFullLogin?.(false).catch(() => {});
                setIsBiometricBlocked(false);
              } else {
                await biometricModule?.setRequireFullLogin?.(true).catch(() => {});
                setIsBiometricBlocked(true);
              }
            } catch {
              await biometricModule?.setRequireFullLogin?.(true).catch(() => {});
              setIsBiometricBlocked(true);
            }
          }
        } catch {
          setIsBiometricBlocked(true);
        } finally {
          setIsLoading(false);
        }
      };
      hydrateNativeToken();
    }
  }, [mounted, checkAuthStatus, biometricModule]);

  // Login with email/password
  const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
    console.log('AuthContext: Attempting login for:', email);
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/passenger/login', { email, password }, undefined, undefined, true);
      
      if (res.status === 'success' && res.data?.token) {
        console.log('AuthContext: Login successful.');
        const access = res.data.token as string;
        const refresh = res.data.refresh as string | undefined;
        
        // ← CRITICAL: Set token state immediately so UI updates
        setToken(access);
        setIsAuthenticated(true);
        
        // Native: store tokens securely AND unblock biometric
        if (Capacitor.isNativePlatform() && biometricModule) {
          try {
            const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
            await SecureStorage.set('auth_token', access);
            if (refresh) await SecureStorage.set('refresh_token', refresh);
            await biometricModule.setRequireFullLogin?.(false).catch(() => {});
            setIsBiometricBlocked(false);
          } catch (err) {
            console.warn('Failed to store token securely:', err);
          }
        }
        
        // Fetch profile
        try {
          const me = await apiClient.get('/auth/passenger/me', access, false, undefined, true);
          if (me.status === 'success') setUser(me.data ?? null);
        } catch {}
        
        return { success: true };
      }
      
      if (res.status === 'success' && res.data?.two_factor) {
        setIsLoading(false);
        return { success: true, requires2FA: true };
      }
      
      return { success: false, message: res.message || 'Login failed' };
    } catch {
      return { success: false, message: 'Login error' };
    } finally {
      setIsLoading(false);
    }
  }, [biometricModule]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {}, token ?? undefined, undefined, true);
    } catch {}
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear biometric credentials on native AND block future biometric login
    if (Capacitor.isNativePlatform() && biometricModule) {
      try {
        const { SecureStorage } = await import('@aparajita/capacitor-secure-storage');
        await SecureStorage.remove('auth_token');
        await SecureStorage.remove('refresh_token');
        await biometricModule.disableBiometricLogin?.();
        await biometricModule.setRequireFullLogin?.(true).catch(() => {});
        setIsBiometricBlocked(true);
      } catch (err) {
        console.warn('Logout cleanup failed:', err);
      }
    }
  }, [token, biometricModule]);

  // Biometric login (native only) - respects isBiometricBlocked
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !biometricModule) return false;
    
    // ← NEW: Check if biometric is blocked BEFORE prompting
    if (isBiometricBlocked) {
      console.log('AuthContext: Biometric login blocked, requiring full login');
      return false;
    }
    
    try {
      // Get stored credentials
      const creds = await biometricModule.getSecureCredentials?.().catch(() => ({ accessToken: null }));
      if (!creds?.accessToken) return false;

      // Validate token BEFORE prompting biometric
      try {
        const check = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
        if (check.status !== 'success') {
          await biometricModule.setRequireFullLogin?.(true).catch(() => {});
          await biometricModule.disableBiometricLogin?.().catch(() => {});
          setIsBiometricBlocked(true);
          return false;
        }
      } catch {
        await biometricModule.setRequireFullLogin?.(true).catch(() => {});
        await biometricModule.disableBiometricLogin?.().catch(() => {});
        setIsBiometricBlocked(true);
        return false;
      }

      // Token is valid — NOW prompt biometric
      setIsBiometricLoading(true);
      const auth = await Promise.race([
        biometricModule.authenticate?.(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Biometric timeout')), 10000))
      ]).catch(() => ({ success: false }));
      
      if (!auth?.success) {
        setIsBiometricLoading(false);
        return false;
      }

      // Success — update auth state
      setToken(creds.accessToken);
      setIsAuthenticated(true);
      try {
        const me = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
        if (me.status === 'success') setUser(me.data ?? null);
      } catch {}
      
      setIsBiometricLoading(false);
      return true;
    } catch (err) {
      console.warn('Biometric login failed:', err);
      setIsBiometricLoading(false);
      return false;
    }
  }, [biometricModule, isBiometricBlocked]);

  // Enable biometric login for current session
  const enableBiometricLogin = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !biometricModule) return false;
    
    let t = token;
    if (!t) {
      const creds = await biometricModule.getSecureCredentials?.().catch(() => ({ accessToken: null }));
      t = creds?.accessToken;
      if (t) setToken(t);
    }
    if (!t) return false;
    
    try {
      setIsBiometricLoading(true);
      const creds = await biometricModule.getSecureCredentials?.().catch(() => ({ refreshToken: null }));
      const ok = await biometricModule.enableBiometricLogin?.(t, creds?.refreshToken).catch(() => false);
      if (ok) {
        setIsBiometricEnabled(true);
        await biometricModule.setRequireFullLogin?.(false).catch(() => {});
        setIsBiometricBlocked(false);
      }
      return ok;
    } catch {
      return false;
    } finally {
      setIsBiometricLoading(false);
    }
  }, [token, biometricModule]);

  // Disable biometric login
  const disableBiometricLogin = useCallback(async (): Promise<void> => {
    if (!Capacitor.isNativePlatform() || !biometricModule) return;
    try {
      await biometricModule.disableBiometricLogin?.();
      await biometricModule.setRequireFullLogin?.(true).catch(() => {});
      setIsBiometricEnabled(false);
      setIsBiometricBlocked(true);
    } catch (err) {
      console.warn('Failed to disable biometric login:', err);
    }
  }, [biometricModule]);

  // Check biometric availability (native only)
  const checkBiometricAvailability = useCallback(async (): Promise<boolean> => {
    if (!Capacitor.isNativePlatform() || !biometricModule) return false;
    try {
      setIsBiometricLoading(true);
      const result = await Promise.race([
        biometricModule.checkAvailability?.(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Biometric check timeout')), 5000))
      ]).catch(() => false);
      setBiometryResult({ isAvailable: result });
      return result;
    } catch {
      return false;
    } finally {
      setIsBiometricLoading(false);
    }
  }, [biometricModule]);

  // Computed values
  const isBiometricAvailable = useMemo(() => 
    (mounted && Capacitor.isNativePlatform() && biometryResult?.isAvailable) ?? null
  , [mounted, biometryResult]);

  // Context value
  const contextValue = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
    // Biometric fields
    isBiometricAvailable,
    isBiometricEnabled,
    isBiometricLoading,
    isBiometricBlocked, // ← NEW: Expose to components
    loginWithBiometric,
    enableBiometricLogin,
    disableBiometricLogin,
    checkBiometricAvailability,
  }), [
    user, token, isAuthenticated, isLoading,
    isBiometricAvailable, isBiometricEnabled, isBiometricLoading, isBiometricBlocked,
    login, logout, checkAuthStatus,
    loginWithBiometric, enableBiometricLogin, disableBiometricLogin, checkBiometricAvailability
  ]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};