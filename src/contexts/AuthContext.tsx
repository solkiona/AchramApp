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
  message?: string; // Add an optional message field for errors
}



  
    
  const checkAuthStatus = async () => {
    console.log("AuthContext: Checking authentication status via API call to /auth/passenger/authenticated...");
    // setIsLoading(true); // Don't set loading here if login function already handles it, or manage carefully to avoid conflicts
    try {
      // Call the authenticated check API using apiClient, indicating it's an auth request relying on cookies
      const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); // isAuthRequest = true

      if (response.status === 'success') {
        console.log("AuthContext: Authentication verified via API call. User is logged in.");
        setIsAuthenticated(true);
        // Optional: Fetch user details here if needed, or rely on initial state from login
        // setUser(response.data.user);
        // setToken(response.data.token); // Store if returned
      } else {
        console.log("AuthContext: API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null);
      }
    } catch (err: any) {
      console.error("AuthContext: Error checking authentication status via API call:", err);
      // Consider the user unauthenticated on error
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false); // Stop loading state after auth check completes
    }
  };

  // const login = async (email: string, password: string): Promise<boolean> => {
  //   console.log("AuthContext: Attempting login for user:", email);
  //   setIsLoading(true); // Set loading state at the start of login
  //   try {
  //     // Call the login API using apiClient
  //     const loginResponse = await apiClient.post('/auth/passenger/login', {
  //       email,
  //       password,
  //     }, undefined, undefined, true);

  //     console.log("AuthContext: Login API Response:", loginResponse);

  //     if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
  //       console.log("AuthContext: Login successful via API call. Token received (though cookie is primary auth).");
  //       // Store the token if the backend returns one (might be for other purposes)
  //       // setToken(loginResponse.data.token);
  //       // The backend should have set the httpOnly cookie here.
  //       // Now, check the auth status using the cookie to update context state.
  //       await new Promise(resolve => setTimeout(resolve, 500));
  //       await checkAuthStatus(); // This will call the authenticated endpoint and update context
  //       return true; // Indicate success
  //     } else {

        
  //       console.error("AuthContext: Login API responded with non-success status or missing token/data:", loginResponse);
  //       setIsLoading(false); // Ensure loading is stopped on failure
  //       return false; // Indicate failure
  //     }
  //   } catch (err: any) {
  //     console.error("AuthContext: Error during login API call:", err);
  //     setIsLoading(false); // Ensure loading is stopped on error
  //     return false; // Indicate failure
  //   }
  //   // Note: The loading state is managed by setIsLoading in this function and the checkAuthStatus function called within.
  //   // Be careful not to conflict with the initial useEffect loading state.
  // };

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
    } else {
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



// 'use client';

// import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// import { apiClient } from '@/lib/api';


// interface AuthContextType {
//   user: any | null; 
//   token: string | null; 
//   isAuthenticated: boolean;
//   isLoading: boolean; 
//   login: (email: string, password: string) => Promise<boolean>; 
//   logout: () => void; 
//   checkAuthStatus: () => Promise<void>; 
// }


// const AuthContext = createContext<AuthContextType | undefined>(undefined);


// export const AuthProvider = ({ children }: { children: ReactNode }) => {
//   const [user, setUser] = useState<any | null>(null); 
//   const [token, setToken] = useState<string | null>(null); 
//   const [isAuthenticated, setIsAuthenticated] = useState(false); 
//   const [isLoading, setIsLoading] = useState(true); 
//   const [count, setCount] = useState(0);
  
//   const checkAuthStatus = async () => {
//     console.log("Checking authentication status via API call to /auth/passenger/authenticated...");
//     setIsLoading(true); 
//     try {
      
      
//       const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); 

//       if (response.status === 'success') {
//         console.log("Authentication verified via API call. User is logged in.");
        
//         setIsAuthenticated(true);
        
//       } else {
        
//         console.log("API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
//         setIsAuthenticated(false);
//         setUser(null);
//         setToken(null); 
//       }
//     } catch (err) {
      
//       console.error("Error checking authentication status via API call:", err);
      
//       setIsAuthenticated(false);
//       setUser(null);
//       setToken(null); 
//     } finally {
      
//       setIsLoading(false);
//     }
//   };

  
//   const login = async (email: string, password: string): Promise<boolean> => {
//     console.log("Attempting login for user with email:", email);
//     try {
      
      
//       const loginResponse = await apiClient.post('/auth/passenger/login', {
//         email,
//         password,
        
//       });

//       if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
        
//         console.log("Login successful via API call. Token received (though cookie is primary auth).");

//         setCount((prev) => prev + 1)
//         await checkAuthStatus(); 
//         console.log(`Login attempt number ${count} made`);
//         return true; 
//       } else {
        
//         console.error("Login API responded with non-success status or missing token/data:", loginResponse);
        
//         return false; 
//       }
//     } catch (err) {
      
//       console.error("Error during login API call:", err);
//       return false; 
//     }
//   };

  
//   const logout = async () => {
//     console.log("Attempting logout...");
//     try {
      
//       console.log("Logout request sent (or session assumed invalidated). Clearing frontend state.");
      
//       setUser(null);
//       setToken(null);
//       setIsAuthenticated(false)

//     } catch (err) {
      
//       console.error("Error during logout API call:", err);
      
      
//       setUser(null);
//       setToken(null);
//       setIsAuthenticated(false);
//     }
//   };

  
//   useEffect(() => {
//     console.log("AuthContext: Initializing - Checking authentication status...");
    
//     checkAuthStatus();
//   }, []); 

  
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




























