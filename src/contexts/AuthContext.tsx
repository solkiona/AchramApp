
'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { apiClient } from '@/lib/api';


interface AuthContextType {
  user: any | null; 
  token: string | null; 
  isAuthenticated: boolean;
  isLoading: boolean; 
  login: (email: string, password: string) => Promise<boolean>; 
  logout: () => void; 
  checkAuthStatus: () => Promise<void>; 
}


const AuthContext = createContext<AuthContextType | undefined>(undefined);


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<any | null>(null); 
  const [token, setToken] = useState<string | null>(null); 
  const [isAuthenticated, setIsAuthenticated] = useState(false); 
  const [isLoading, setIsLoading] = useState(true); 

  
  const checkAuthStatus = async () => {
    console.log("Checking authentication status via API call to /auth/passenger/authenticated...");
    setIsLoading(true); 
    try {
      
      
      
      
      
      
      
      
      const response = await apiClient.get('/auth/passenger/authenticated', undefined, false, undefined, true); 

      if (response.status === 'success') {
        console.log("Authentication verified via API call. User is logged in.");
        
        
        
        
        setIsAuthenticated(true);
        
        
        
        
      } else {
        
        console.log("API responded with non-success status during auth check (likely 401). User is not authenticated.", response);
        setIsAuthenticated(false);
        setUser(null);
        setToken(null); 
      }
    } catch (err) {
      
      console.error("Error checking authentication status via API call:", err);
      
      setIsAuthenticated(false);
      setUser(null);
      setToken(null); 
    } finally {
      
      setIsLoading(false);
    }
  };

  
  const login = async (email: string, password: string): Promise<boolean> => {
    console.log("Attempting login for user:", email);
    try {
      
      
      
      
      const loginResponse = await apiClient.post('/auth/passenger/login', {
        email,
        password,
        
      });

      if (loginResponse.status === 'success' && loginResponse.data && loginResponse.data.token) {
        
        console.log("Login successful via API call. Token received (though cookie is primary auth).");

        
        
        
        
        
        

        
        

        
        await checkAuthStatus(); 
        return true; 
      } else {
        
        console.error("Login API responded with non-success status or missing token/data:", loginResponse);
        
        return false; 
      }
    } catch (err) {
      
      console.error("Error during login API call:", err);
      return false; 
    }
  };

  
  const logout = async () => {
    console.log("Attempting logout...");
    try {
      
      console.log("Logout request sent (or session assumed invalidated). Clearing frontend state.");
      
      setUser(null);
      setToken(null);
      setIsAuthenticated(false)

    } catch (err) {
      
      console.error("Error during logout API call:", err);
      
      
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    }
  };

  
  useEffect(() => {
    console.log("AuthContext: Initializing - Checking authentication status...");
    
    checkAuthStatus();
  }, []); 

  
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




























