'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/lib/api';

interface AuthContextType {
  user: any | null;
  token: string | null; // Potentially still useful if the backend also returns a token alongside the cookie
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null); // Store token if backend provides one
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);


interface LoginResult {
  success: boolean;
  requires2FA?: boolean;
  message?: string; // Add an optional message field for errors
}



  
    
  // const checkAuthStatus = async () => {
  //   console.log("AuthContext: Checking authentication status via API call to /auth/passenger/authenticated...");
  //   // setIsLoading(true); // Don't set loading here if login function already handles it, or manage carefully to avoid conflicts
  //   try {
  //     // Call the authenticated check API using apiClient, indicating it's an auth request relying on cookies
  //     const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); // isAuthRequest = true

  //     if (response.status === 'success') {
  //       console.log("AuthContext: Authentication verified via API call. User is logged in.");
  //       setIsAuthenticated(true);

  //        try {
  //       const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
  //       if (me.status === 'success') setUser(me.data ?? null);
  //     } catch {}
  //     return true;
  //       // Optional: Fetch user details here if needed, or rely on initial state from login
  //       // setUser(response?.data.user);
  //       // setToken(response?.data.token); // Store if returned
  //     } else {
  //       console.log("AuthContext: API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
  //       setIsAuthenticated(false);
  //       setUser(null);
  //       setToken(null);
  //     }
  //   } catch (err: any) {
  //     console.error("AuthContext: Error checking authentication status via API call:", err);
  //     // Consider the user unauthenticated on error
  //     setIsAuthenticated(false);
  //     setUser(null);
  //     setToken(null);
  //   } finally {
  //     setIsLoading(false); // Stop loading state after auth check completes
  //   }
  // };


  // src/contexts/AuthContext.tsx
const checkAuthStatus = async () => {
  console.log("🔍 [Auth] Starting checkAuthStatus...");
  setIsLoading(true);
  try {
    console.log("🔍 [Auth] Calling API...");
    const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true);
    console.log("🔍 [Auth] API responded:", response.status);
    
    if (response.status === 'success') {
      console.log("AuthContext: Authentication verified via API call. User is logged in.");
      setIsAuthenticated(true);
      try {
        const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
        if (me.status === 'success') setUser(me.data ?? null);
      } catch {}
    } else {
      console.log("AuthContext: API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    }
  } catch (err: any) {
    console.error("🔍 [Auth] Error checking authentication status:", err);
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  } finally {
    console.log("🔍 [Auth] Setting isLoading to false");
    setIsLoading(false); 
  }
};


  const login = async (email: string, password: string): Promise<LoginResult> => { // Change return type to Promise<LoginResult>
  console.log("AuthContext: Attempting login for user:", email);
  setIsLoading(true);
  try {
    const loginResponse = await apiClient.post('/auth/passenger/login', {
      email,
      password,
    }, undefined, undefined, true);

    console.log("AuthContext: Login API Response:", loginResponse);

    if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
      console.log("AuthContext: Login successful via API call. Token received (though cookie is primary auth).");
      await new Promise(resolve => setTimeout(resolve, 500));
      await checkAuthStatus();
      return { success: true }; // Return success object
    } else if(loginResponse.status === 'success' && loginResponse.data?.two_factor === true){
      console.log("Authcontext: login successful, but 2FA verification is required");
      setIsLoading(false);
      return {success: true, requires2FA: true};
    }
    
    else {
      // NEW: Extract error message from API response
      let errorMessage = "Login failed. Please try again."; // Default message
      if (loginResponse.message) {
          errorMessage = loginResponse.message; // Use top-level message if available
      } 
      
      if (loginResponse.details && loginResponse.details.non_field_errors && Array.isArray(loginResponse.details.non_field_errors)) {
          // Attempt to get the first specific error from details
          const specificError = loginResponse.details.non_field_errors[0];
          if (specificError) {
              errorMessage = specificError;
          }
      }
      // NEW: Use the extracted or default error message
      console.error("AuthContext: Login API responded with non-success status or missing token/data:", loginResponse);
      setIsLoading(false);
      // Do NOT call showNotification here, let the caller (page.tsx) handle it
      return { success: false, message: errorMessage }; // Return failure object with message
    }
  } catch (err: any) {
    console.error("AuthContext: Error during login API call:", err);
    setIsLoading(false);
    // NEW: Provide a generic error message for network/other errors
    return { success: false, message: "An error occurred during login. Please check your connection." };
  }
};
  const logout = async () => {
    console.log("AuthContext: Attempting logout...");
    try {
      // If there's a backend logout endpoint, call it.
      // await apiClient.post('/auth/logout', {}, token, undefined, true); // Example, if needed
      console.log("AuthContext: Logout request sent (or session assumed invalidated by server). Clearing frontend state.");
      // Clear context state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error("AuthContext: Error during logout API call:", err);
      // Clear frontend state anyway on error
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  // Effect to check auth status on initial load
  useEffect(() => {
    console.log("AuthContext: Initializing - Checking authentication status...");
    checkAuthStatus(); // Initial check on mount
  }, []); // Empty dependency array means this runs once on mount

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading,
    login,
    logout,
    checkAuthStatus,
  };

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

 
// // useEffect(() => {
// //   if (!mounted) return;

// //   if (isNative) {
// //     // Native: hydrate token for later use, but do NOT set isAuthenticated
// //     biometric.getSecureCredentials().then(c => {
// //       if (c.accessToken) setToken(c.accessToken);
// //     });
// //     biometric.checkAvailability();
// //     setIsLoading(false);
// //     return;
// //   }

// //   // Web only: verify httpOnly cookie
// //   checkAuthStatus();
// // }, [mounted]);



// useEffect(() => {
//   if (!mounted) return;

//   if (isNative) {
//     let cancelled = false;

//     const withTimeout = <T,>(p: Promise<T>, ms = 5000): Promise<T> =>
//       Promise.race([
//         p,
//         new Promise<T>((_, reject) =>
//           setTimeout(() => reject(new Error('native call timed out')), ms)
//         ),
//       ]);

//     (async () => {
//       try {
//         // sequential, not parallel — avoids concurrent Keychain/LAContext access on iOS
//         const c = await withTimeout(biometric.getSecureCredentials());
//         if (!cancelled && c.accessToken) setToken(c.accessToken);
//       } catch (e) {
//         console.warn('getSecureCredentials failed/timed out', e);
//       }

//       try {
//         await withTimeout(biometric.checkAvailability());
//       } catch (e) {
//         console.warn('checkAvailability failed/timed out', e);
//       } finally {
//         if (!cancelled) setIsLoading(false);
//       }
//     })();

//     return () => { cancelled = true; };
//   }

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




//////////////////////////
/////////////////////////


// 'use client';
// import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
// import { Capacitor } from '@capacitor/core';
// import { SecureStorage } from '@aparajita/capacitor-secure-storage';
// import { apiClient } from '@/lib/api';
// import { useBiometricAuth } from '@/hooks/useBiometricAuth';
// import { setUnauthorizedHandler } from '@/lib/api';
// import { useRouter } from 'next/navigation';

// const isNative = Capacitor.isNativePlatform();
// const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'
// const isAndroid = platform === 'android';
// const isIos = platform === 'ios';

// // Biometric is ONLY available on Android native
// // iOS native uses token-based auth without biometric layer
// const isBiometricSupported = isNative && isAndroid;

// interface AuthContextType {
//   user: any | null;
//   token: string | null;
//   isAuthenticated: boolean;
//   isLoading: boolean;
//   isBiometricAvailable: boolean | null;
//   isBiometricEnabled: boolean;
//   isBiometricBlocked: boolean;
//   login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>;
//   checkAuthStatus: () => Promise<boolean>;
//   logout: () => Promise<void>;
//   loginWithBiometric: () => Promise<boolean>;
//   enableBiometricLogin: () => Promise<boolean>;
//   disableBiometricLogin: () => Promise<void>;
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
//   const router = useRouter();

//   useEffect(() => setMounted(true), []);

//   // Unauthorized handler
//   useEffect(() => {
//     if (!mounted) return;
//     setUnauthorizedHandler(async () => {
//       setUser(null);
//       setToken(null);
//       setIsAuthenticated(false);

//       if (isNative) {
//         await SecureStorage.remove('auth_token');
//         await SecureStorage.remove('refresh_token');

//         // Only block biometric on Android (it doesn't exist on iOS)
//         if (isBiometricSupported) {
//           await biometric.setRequireFullLogin(true);
//           setIsBiometricBlocked(true);
//         }
//       }

//       window.dispatchEvent(new CustomEvent('auth:unauthorized'));
//     });
//   }, [mounted]);

//   // Boot-time hydration
//   useEffect(() => {
//     if (!mounted) return;

//     if (isNative) {
//       (async () => {
//         try {
//           // Simple Keychain read — no biometric, no LAContext, safe on iOS
//           const stored = await SecureStorage.get('auth_token');
//           const accessToken = stored?.value ?? null;
//           if (accessToken) setToken(accessToken);
//         } catch (e) {
//           console.warn('Failed to read stored token on boot:', e);
//         }

//         // Only check biometric availability on Android
//         if (isBiometricSupported) {
//           try {
//             await biometric.checkAvailability();
//           } catch (e) {
//             console.warn('checkAvailability failed:', e);
//           }
//         }

//         setIsLoading(false);
//       })();
//       return;
//     }

//     // Web: verify via httpOnly cookie
//     checkAuthStatus();
//   }, [mounted]);

//   const checkAuthStatus = useCallback(async () => {
//     if (isNative) {
//       setIsLoading(false);
//       return false;
//     }

//     setIsLoading(true);
//     try {
//       const response = await apiClient.get(
//         '/auth/passenger/authenticated',
//         undefined, false, undefined, true
//       );

//       if (response.status === 'success') {
//         setIsAuthenticated(true);
//         try {
//           const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
//           if (me.status === 'success') setUser(me.data ?? null);
//         } catch {}
//         return true;
//       }

//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null);
//       return false;
//     } catch {
//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null);
//       return false;
//     } finally {
//       setIsLoading(false);
//     }
//   }, []);

//   const login = useCallback(async (email: string, password: string) => {
//     setIsLoading(true);
//     try {
//       const res = await apiClient.post(
//         '/auth/passenger/login',
//         { email, password },
//         undefined, undefined, true
//       );

//       if (res.status === 'success' && res.data?.two_factor) {
//         setIsLoading(false);
//         return { success: true, requires2FA: true };
//       }

//       if (res.status === 'success') {
//         if (isNative) {
//           // Native (both iOS and Android) — token based, no cookie
//           if (!res.data?.token) {
//             setIsLoading(false);
//             return { success: false, message: 'No token returned' };
//           }

//           const access = res.data.token as string;
//           const refresh = res.data.refresh as string | undefined;

//           // Update React state immediately — release the UI before any Keychain work
//           setToken(access);
//           setIsAuthenticated(true);
//           setIsBiometricBlocked(false);
//           setIsLoading(false);

//           // Keychain writes fully detached — never block the tap handler
//           Promise.resolve().then(async () => {
//             try {
//               await SecureStorage.set('auth_token', access);
//               if (refresh) await SecureStorage.set('refresh_token', refresh);

//               // Only touch biometric flags on Android
//               if (isBiometricSupported) {
//                 await biometric.setRequireFullLogin(false);
//               }
//             } catch (e) {
//               console.warn('Background token storage failed:', e);
//             }
//           });

//           // Profile fetch also detached
//           Promise.resolve().then(async () => {
//             try {
//               const me = await apiClient.get('/auth/passenger/me', access, false, undefined, true);
//               if (me.status === 'success') setUser(me.data ?? null);
//             } catch {}
//           });

//           return { success: true };

//         } else {
//           // Web: cookie already set by server
//           setIsAuthenticated(true);
//           setIsLoading(false);

//           Promise.resolve().then(async () => {
//             try {
//               const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
//               if (me.status === 'success') setUser(me.data ?? null);
//             } catch {}
//           });

//           return { success: true };
//         }
//       }

//       setIsLoading(false);
//       return { success: false, message: res.message || 'Login failed' };
//     } catch {
//       setIsLoading(false);
//       return { success: false, message: 'Login error' };
//     }
//   }, [biometric]);

//   const logout = useCallback(async () => {
//     try {
//       await apiClient.post('/auth/logout', {}, token ?? undefined, undefined, true);
//     } catch {}

//     setUser(null);
//     setToken(null);
//     setIsAuthenticated(false);

//     if (isNative) {
//       await SecureStorage.remove('auth_token');
//       await SecureStorage.remove('refresh_token');

//       // Only clean up biometric state on Android
//       if (isBiometricSupported) {
//         await biometric.disableBiometricLogin();
//       }
//     }
//   }, [token, biometric]);

//   // Biometric login — Android only, returns false immediately on iOS
//   const loginWithBiometric = useCallback(async () => {
//     if (!isBiometricSupported) return false;

//     const requiresFull = await biometric.getRequireFullLogin();
//     if (requiresFull) {
//       setIsBiometricBlocked(true);
//       return false;
//     }

//     const creds = await biometric.getSecureCredentials();
//     if (!creds.accessToken) return false;

//     // Validate token before prompting biometric
//     try {
//       const check = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
//       if (check.status !== 'success') {
//         await biometric.setRequireFullLogin(true);
//         await biometric.disableBiometricLogin();
//         return false;
//       }
//     } catch {
//       await biometric.setRequireFullLogin(true);
//       await biometric.disableBiometricLogin();
//       return false;
//     }

//     // Token valid — NOW prompt biometric
//     const auth = await biometric.authenticate();
//     if (!auth.success) return false;

//     setToken(creds.accessToken);
//     setIsAuthenticated(true);

//     try {
//       const me = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
//       if (me.status === 'success') setUser(me.data ?? null);
//     } catch {}

//     return true;
//   }, [biometric]);

//   // Enable biometric — Android only
//   const enableBiometricLogin = useCallback(async () => {
//     if (!isBiometricSupported) return false;

//     let t = token;
//     if (!t) {
//       const creds = await biometric.getSecureCredentials();
//       t = creds.accessToken;
//       if (t) setToken(t);
//     }
//     if (!t) return false;

//     const creds = await biometric.getSecureCredentials();
//     return biometric.enableBiometricLogin(t, creds.refreshToken ?? undefined);
//   }, [token, biometric]);

//   // Disable biometric — Android only
//   const disableBiometricLogin = useCallback(async () => {
//     if (isBiometricSupported) await biometric.disableBiometricLogin();
//   }, [biometric]);

//   // Biometric availability — null on iOS (feature doesn't exist there)
//   const isBiometricAvailable = isBiometricSupported && mounted
//     ? (biometric.biometryResult?.isAvailable ?? null)
//     : null;

//   const isBiometricEnabled = isBiometricSupported && mounted
//     ? biometric.isEnabled
//     : false;

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
//   }), [
//     user, token, isAuthenticated, isLoading,
//     isBiometricAvailable, isBiometricEnabled, isBiometricBlocked,
//     checkAuthStatus, login, logout, loginWithBiometric,
//     enableBiometricLogin, disableBiometricLogin,
//   ]);

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
// };

// export const useAuth = () => {
//   const ctx = useContext(AuthContext);
//   if (!ctx) throw new Error('useAuth must be used within AuthProvider');
//   return ctx;
// };





////////////////////////////////
///////////////////////////////

