// src/contexts/AuthContext.tsx
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// NEW: Import the updated apiClient
import { apiClient } from '@/lib/api';

// NEW: Define the shape of the auth context state
interface AuthContextType {
  user: any | null; // Replace 'any' with a proper User type if available
  token: string | null; // Store token string if needed for non-API operations or legacy reasons
  isAuthenticated: boolean;
  isLoading: boolean; // NEW: Add loading state for initial auth check
  login: (email: string, password: string) => Promise<boolean>; // NEW: Add login function
  logout: () => void; // NEW: Add logout function
  checkAuthStatus: () => Promise<void>; // NEW: Add function to check status (e.g., on app load, after login/logout)
}

// NEW: Create the context with an undefined default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// NEW: Define the AuthProvider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null); // State for user details
  const [token, setToken] = useState<string | null>(null); // State for token string (if needed)
  const [isAuthenticated, setIsAuthenticated] = useState(false); // State for authentication status
  const [isLoading, setIsLoading] = useState(true); // NEW: State for initial loading check

  // NEW: Function to check authentication status using the API endpoint
  const checkAuthStatus = async () => {
    console.log("Checking authentication status via API call to /auth/passenger/authenticated...");
    setIsLoading(true); // NEW: Set loading state
    try {
      // NEW: Call the API endpoint that verifies the cookie
      // This endpoint requires the httpOnly cookie to be present and valid.
      // We use apiClient.get with isAuthRequest=true to include credentials.
      // We pass a dummy token (or undefined) and isAuthRequest=true.
      // The backend should prioritize the cookie over the header if both are present.
      // The token here is only passed if the backend is designed to check both, but typically for cookie auth, it's not needed in the header.
      // Let's assume the backend prioritizes the cookie when the endpoint is accessed.
      // Therefore, we call it without a specific token for this check, but indicate it's an auth request.
      const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); // isAuthRequest=true

      if (response.status === 'success') {
        console.log("Authentication verified via API call. User is logged in.");
        // NEW: Authentication successful, fetch user details if the response includes them
        // Example: if response.data contains user info like { id, name, email, phone_number, ... }
        // setUser(response.data); // Update user state with data from response if available
        // For now, just assume the check itself confirms login status
        setIsAuthenticated(true);
        // Optionally, if the /authenticated endpoint also returns the token, store it
        // if (response.data?.token) {
        //   setToken(response.data.token);
        // }
      } else {
        // NEW: API responded with non-success status (e.g., 401 Unauthorized)
        console.log("API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null); // Clear any stored token string if present
      }
    } catch (err) {
      // NEW: Network error or API returned an error (e.g., 401 Unauthorized)
      console.error("Error checking authentication status via API call:", err);
      // Treat any error (including 401) as not authenticated
      setIsAuthenticated(false);
      setUser(null);
      setToken(null); // Clear any stored token string if present
    } finally {
      // NEW: Always stop the loading state
      setIsLoading(false);
    }
  };

  // NEW: Function to handle user login
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Attempting login for user:", email);
    try {
      // NEW: Call the login API endpoint
      // Endpoint: POST /auth/passenger/login
      // The response should set the httpOnly cookie.
      // Example request body: { email, password }
      const loginResponse = await apiClient.post('/auth/passenger/login', {
        email,
        password,
        // Add other fields if required by the login endpoint
      });

      if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
        // NEW: Login successful
        console.log("Login successful via API call. Token received (though cookie is primary auth).");

        // NEW: The httpOnly cookie is automatically set by the browser upon receiving the Set-Cookie header.
        // We might still store the token string *locally* if the backend returns it AND it's needed for other non-API operations,
        // or if the /authenticated endpoint doesn't return user details and we need to fetch them separately using the token.
        // However, for *API calls*, the primary mechanism should be the cookie now.
        // If the backend returns user details in the login response, update state here.
        // setUser(loginResponse.data.user); // Example: if user details are returned

        // Store token string locally (optional, depends on backend design)
        // setToken(loginResponse.data.token); // Store token string if needed elsewhere

        // NEW: Check the auth status again to update the context state based on the newly set cookie
        await checkAuthStatus(); // This will call GET /auth/passenger/authenticated which uses the cookie
        return true; // Indicate success
      } else {
        // NEW: Handle API response indicating failure
        console.error("Login API responded with non-success status or missing token/data:", loginResponse);
        // Optionally, return specific error messages from loginResponse.details if needed by the UI
        return false; // Indicate failure
      }
    } catch (err) {
      // NEW: Handle network errors or other exceptions during login
      console.error("Error during login API call:", err);
      return false; // Indicate failure
    }
  };

  // NEW: Function to handle user logout
  const logout = async () => {
    console.log("Attempting logout...");
    try {
      // NEW: Call the logout API endpoint
      // Endpoint: POST /auth/passenger/logout (or similar)
      // The backend should invalidate the session associated with the cookie sent in the request.
      // Example: await apiClient.post('/auth/passenger/logout', {}, undefined, undefined, true); // isAuthRequest=true
      // For now, let's assume the backend has a logout endpoint that requires the cookie.
      // const logoutResponse = await apiClient.post('/auth/passenger/logout', {}, undefined, undefined, true); // isAuthRequest=true

      // NEW: If the backend provides a logout endpoint that requires the cookie, uncomment the call above.
      // If the backend simply expects the cookie to be cleared client-side upon successful login (less common but possible),
      // you might just rely on checkAuthStatus failing after the backend invalidates the session.
      // For this example, let's assume there's a logout endpoint that uses the cookie.
      // const logoutResponse = await apiClient.post('/auth/passenger/logout', {}, undefined, undefined, true);

      // NEW: Assuming the backend endpoint successfully invalidated the session (either via API or implicitly)
      console.log("Logout request sent (or session assumed invalidated). Clearing frontend state.");
      // NEW: Clear frontend state (user, token, auth status)
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);

      // NEW: Optionally, you might want to clear other guest-specific states if the user was logged in.
      // e.g., clear pickup, destination, activeTripId, guestId if they were stored for a previous guest session.
      // This depends on your specific state management in page.tsx or other global state.
      // Example (pseudo-code):
      // clearGuestStates(); // Call a function that resets guest-specific states in your main app state (e.g., page.tsx state)

    } catch (err) {
      // NEW: Handle network errors or other exceptions during logout
      console.error("Error during logout API call:", err);
      // Even if the API call fails, clear the frontend state to prevent accidental use of stale data.
      // The cookie might still be valid on the backend, but the frontend session is cleared.
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  // NEW: Effect to check auth status on initial load (or when the AuthProvider mounts)
  useEffect(() => {
    console.log("AuthContext: Initializing - Checking authentication status...");
    // NEW: Check the auth status when the app starts
    checkAuthStatus();
  }, []); // Empty dependency array means this runs once on mount

  // NEW: Provide the context value
  const contextValue: AuthContextType = {
    user,
    token,
    isAuthenticated,
    isLoading, // NEW: Expose loading state
    login, // NEW: Expose login function
    logout, // NEW: Expose logout function
    checkAuthStatus, // NEW: Expose the function to manually check status if needed elsewhere
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// NEW: Custom hook to consume the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// // src/contexts/AuthContext.tsx
// 'use client';

// import { createContext, useContext, useState, useEffect } from 'react';

// type AuthContextType = {
//   token: string | null;
//   isAuthenticated: boolean;
// };

// const AuthContext = createContext<AuthContextType>({ token: null, isAuthenticated: false });

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const [token, setToken] = useState<string | null>(null);

//   useEffect(() => {
//     const stored = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
//     setToken(stored);
//   }, []);

//   return (
//     <AuthContext.Provider value={{ token, isAuthenticated: !!token }}>
//       {children}
//     </AuthContext.Provider>
//   );
// }

// export const useAuth = () => useContext(AuthContext);