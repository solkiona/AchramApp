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



'use client';
import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { apiClient } from '@/lib/api';
import { useBiometricAuth } from '@/hooks/useBiometricAuth'; // Import our hook

interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  // Existing methods
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  
  // NEW: Biometric methods
  isBiometricAvailable: boolean | null;
  isBiometricEnabled: boolean;
  loginWithBiometric: () => Promise<boolean>;
  enableBiometricLogin: () => Promise<boolean>;
  disableBiometricLogin: () => Promise<void>;
  checkBiometricAvailability: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Initialize biometric hook
  const {
    biometryResult,
    isEnabled: isBiometricEnabled,
    isLoading: isBioLoading,
    checkAvailability,
    authenticate: bioAuthenticate,
    enableBiometricLogin: bioEnable,
    getSecureCredentials,
    disableBiometricLogin: bioDisable,
  } = useBiometricAuth();

  // Check biometric availability on mount
  useEffect(() => {
    checkAvailability();
  }, [checkAvailability]);

  const checkAuthStatus = useCallback(async () => {
    console.log("AuthContext: Checking authentication status via API...");
    try {
      const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true);
      if (response.status === 'success') {
        console.log("AuthContext: Authentication verified.");
        setIsAuthenticated(true);
        setUser(response.data);
        // Don't store token from response if using cookies only
      } else {
        console.log("AuthContext: Not authenticated.");
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (err: any) {
      console.error("AuthContext: Error checking auth status:", err);
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    console.log("AuthContext: Attempting login for:", email);
    setIsLoading(true);
    try {
      const loginResponse = await apiClient.post('/auth/passenger/login', { email, password }, undefined, undefined, true);
      
      if (loginResponse.status === 'success' && loginResponse.data?.token) {
        console.log("AuthContext: Login successful.");
        await new Promise(resolve => setTimeout(resolve, 500));
        await checkAuthStatus();
        
        // If biometrics are enabled, store credentials securely
        if (isBiometricEnabled) {
          await bioEnable(loginResponse.data.token, loginResponse.data.refresh);
        }
        
        return { success: true };
      } else if (loginResponse.status === 'success' && loginResponse.data?.two_factor === true) {
        console.log("AuthContext: 2FA required.");
        setIsLoading(false);
        return { success: true, requires2FA: true };
      } else {
        const errorMessage = loginResponse.details?.non_field_errors?.[0] || loginResponse.message || "Login failed.";
        console.error("AuthContext: Login failed:", errorMessage);
        setIsLoading(false);
        return { success: false, message: errorMessage };
      }
    } catch (err: any) {
      console.error("AuthContext: Login error:", err);
      setIsLoading(false);
      return { success: false, message: "An error occurred during login." };
    }
  };

  const logout = async () => {
    console.log("AuthContext: Logging out...");
    try {
      await apiClient.post('/auth/logout', {}, undefined, undefined, true);
    } catch (err) {
      console.error("AuthContext: Logout API error:", err);
    } finally {
      // Clear all auth state
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      // Clear biometric credentials too
      await bioDisable();
    }
  };

  // NEW: Biometric login method
  const loginWithBiometric = useCallback(async (): Promise<boolean> => {
    console.log("AuthContext: Attempting biometric login...");
    
    // Step 1: Authenticate with biometrics
    const bioResult = await bioAuthenticate();
    if (!bioResult.success) {
      console.log("AuthContext: Biometric authentication failed:", bioResult.error);
      return false;
    }
    
    // Step 2: Retrieve securely stored credentials
    const credentials = await getSecureCredentials();
    if (!credentials.token) {
      console.log("AuthContext: No stored token found for biometric login.");
      return false;
    }
    
    // Step 3: Verify token with backend
    try {
      const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true);
      if (response.status === 'success') {
        console.log("AuthContext: Biometric login verified.");
        setIsAuthenticated(true);
        setUser(response.data);
        return true;
      } else {
        // Token expired/revoked - clear biometric credentials
        console.log("AuthContext: Stored token invalid, clearing biometric login.");
        await bioDisable();
        return false;
      }
    } catch (err) {
      console.error("AuthContext: Error verifying biometric token:", err);
      await bioDisable();
      return false;
    }
  }, [bioAuthenticate, getSecureCredentials, bioDisable]);

  // NEW: Enable biometric login for current session
  const enableBiometricLogin = useCallback(async (): Promise<boolean> => {
    if (!token) {
      console.log("AuthContext: Cannot enable biometrics - no token available.");
      return false;
    }
    return await bioEnable(token);
  }, [token, bioEnable]);

  // NEW: Disable biometric login
  const disableBiometricLogin = useCallback(async (): Promise<void> => {
    await bioDisable();
  }, [bioDisable]);

  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isBioLoading,
    login,
    logout,
    checkAuthStatus,
    // Biometric fields
    isBiometricAvailable: biometryResult?.isAvailable ?? null,
    isBiometricEnabled,
    loginWithBiometric,
    enableBiometricLogin,
    disableBiometricLogin,
    checkBiometricAvailability: checkAvailability,
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