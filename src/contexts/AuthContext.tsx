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


// src/context/AuthProvider.tsx
'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { apiClient } from '@/lib/api';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';

interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricAvailable: boolean | null;
  isBiometricEnabled: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>;
  logout: () => Promise<void>;
  loginWithBiometric: () => Promise<boolean>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const biometric = useBiometricAuth();

  useEffect(() => setMounted(true), []);

  // Hydrate token from secure storage on first mount
  useEffect(() => {
    if (!mounted) return;
    biometric.getSecureCredentials().then(c => {
      if (c.accessToken) setToken(c.accessToken);
    });
    biometric.checkAvailability();
  }, [mounted, biometric]);

  const refreshAccessToken = useCallback(async (refreshToken: string) => {
    try {
      const res = await apiClient.post('/auth/refresh', { refresh: refreshToken });
      if (res.status === 'success' && res.data?.token) {
        setToken(res.data.token);
        await biometric.updateStoredAccessToken(res.data.token);
        return res.data.token as string;
      }
    } catch (e) {
      console.error('refresh failed', e);
    }
    return null;
  }, [biometric]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.post('/auth/passenger/login', { email, password });
      if (res.status === 'success' && res.data?.token) {
        setToken(res.data.token);
        setUser(res.data.user?? null);
        setIsAuthenticated(true);
        setIsLoading(false);
        return { success: true };
      }
      if (res.status === 'success' && res.data?.two_factor) {
        setIsLoading(false);
        return { success: true, requires2FA: true };
      }
      setIsLoading(false);
      return { success: false, message: res.message || 'Login failed' };
    } catch (e) {
      setIsLoading(false);
      return { success: false, message: 'Login error' };
    }
  };

  const logout = async () => {
    try { await apiClient.post('/auth/logout', {}); } catch {}
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    await biometric.disableBiometricLogin();
  };

  const loginWithBiometric = useCallback(async () => {
    const auth = await biometric.authenticate();
    if (!auth.success) return false;

    const creds = await biometric.getSecureCredentials();
    if (!creds.accessToken) return false;

    setToken(creds.accessToken);
    setIsAuthenticated(true);

    // Optionally fetch user profile
    try {
      const me = await apiClient.get('/auth/passenger/me');
      if (me.status === 'success') setUser(me.data);
    } catch {}

    return true;
  }, [biometric]);

  const enableBiometricLogin = useCallback(async () => {
    // Ensure we have a token in memory, hydrate if needed
    let t = token;
    if (!t) {
      const creds = await biometric.getSecureCredentials();
      t = creds.accessToken;
      if (t) setToken(t);
    }
    if (!t) return false;

    const creds = await biometric.getSecureCredentials();
    return await biometric.enableBiometricLogin(t, creds.refreshToken?? undefined);
  }, [token, biometric]);

  const disableBiometricLogin = useCallback(async () => {
    await biometric.disableBiometricLogin();
  }, [biometric]);

  // If we have a token but no user, try to load profile once
  useEffect(() => {
    if (token &&!user && isAuthenticated) {
      apiClient.get('/auth/passenger/me').then(r => {
        if (r.status === 'success') setUser(r.data);
      }).catch(() => {});
    }
  }, [token, user, isAuthenticated]);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    isBiometricAvailable: mounted? (biometric.biometryResult?.isAvailable?? null) : null,
    isBiometricEnabled: mounted? biometric.isEnabled : false,
    login,
    logout,
    loginWithBiometric,
    enableBiometricLogin,
    disableBiometricLogin,
  }), [user, token, isAuthenticated, isLoading, mounted, biometric.biometryResult, biometric.isEnabled, loginWithBiometric, enableBiometricLogin, disableBiometricLogin]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};