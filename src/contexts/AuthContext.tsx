'use client';
import { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { Capacitor } from '@capacitor/core';
// import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Preferences } from '@capacitor/preferences';
import { apiClient, setUnauthorizedHandler, setMemoryToken, signalBootComplete } from '@/lib/api';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import  {useApiErrorHandler} from '@/lib/errors/apiErrorHandler';



const isNative = Capacitor.isNativePlatform();
const platform = Capacitor.getPlatform();
const isAndroid = platform === 'android';

// Biometric is ONLY available on Android native
const isBiometricSupported = isNative //&& isAndroid;

interface AuthContextType {
  user: any | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isBiometricAvailable: boolean | null;
  isBiometricEnabled: boolean;
  isBiometricBlocked: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; requires2FA?: boolean; message?: string }>;
  checkAuthStatus: () => Promise<boolean>;
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
  const [isBiometricBlocked, setIsBiometricBlocked] = useState(false);
   const { fieldErrors, generalError, handleApiError} = useApiErrorHandler();

  const biometric = useBiometricAuth();

  useEffect(() => setMounted(true), []);

  // Unauthorized handler
  useEffect(() => {
    if (!mounted) return;
    setUnauthorizedHandler(async () => {

      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
      setMemoryToken(null); // Clear memory cache

      if (!isNative && typeof window !== 'undefined'){
        localStorage.removeItem('achrams_passenger_token');
      }


      if (isNative) {
        try {
          // await SecureStorage.remove('auth_token');
          // await SecureStorage.remove('refresh_token');
          await Preferences.remove({
            key: 'auth_token',
          })
          await Preferences.remove({
            key: 'refresh_token'
          })

        } catch (e) {
          console.warn('Failed to clear tokens on unauthorized:', e);
        }

        if (isBiometricSupported) {
          try {
            await biometric.setRequireFullLogin(true);
            setIsBiometricBlocked(true);
          } catch (e) {
            console.warn('Failed to set require full login:', e);
          }
        }
      }

      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    });
  }, [mounted, biometric]);

  // Boot-time hydration
  useEffect(() => {
    if (!mounted) return;

    if (isNative) {
      (async () => {
        try {
          // Timeout wrapper to prevent iOS Keychain from hanging the app forever
          // const stored = await Promise.race([
          //   SecureStorage.get('auth_token'),
          //   new Promise<null>((_, reject) => setTimeout(() => reject(new Error('Keychain timeout')), 3000))
          // ]);
          
          // // @aparajita/capacitor-secure-storage returns the value directly (string)
          // const accessToken = typeof stored === 'string' ? stored : null;

          const { value } = await Preferences.get({
              key: 'auth_token',
            });

            const accessToken = value;

          if (accessToken) {
            setMemoryToken(accessToken); // Update memory cache
            setToken(accessToken);

            if (!isNative) {
              setIsAuthenticated(true);
            } else {
              // Android
              const { value } = await Preferences.get({
                key: "biometric_enabled",
              });

              if (value !== "true") {
                // Biometrics not enabled, so log the user in normally
                setIsAuthenticated(true);
              }
              // Otherwise, BiometricGate will handle authentication
            }
          }
        } catch (e) {
          console.warn('Failed to read stored token on boot:', e);
        } finally {
          // ALWAYS signal boot complete, even if it timed out
          signalBootComplete(); 
        }

        // Only check biometric availability on Android
        if (isBiometricSupported) {
          try {
            await biometric.checkAvailability();
          } catch (e) {
            console.warn('checkAvailability failed:', e);
          }
        }

        setIsLoading(false);
      })();
      return;
    }

    // Web: verify via httpOnly cookie &  localStorage fallback
    // FIX: Web doesn't need to wait for Keychain, so signal boot complete IMMEDIATELY
    // before making the API call to prevent deadlocks.
    if (!isNative) {
      const storedToken = typeof window !== 'undefined' ? localStorage.getItem('achrams_passenger_token'): null;
      if (storedToken) {
        setMemoryToken(storedToken);
        setToken(storedToken);
      }
    }
    signalBootComplete(); 
    checkAuthStatus();
  }, [mounted]);

  
  const checkAuthStatus = useCallback(async () => {
    // Web doesn't need a boot lock, but just in case:
    if (!isNative) signalBootComplete();

    if (isNative) {
      setIsLoading(false);
      return false;
    }

    setIsLoading(true);
    try {
      const response = await apiClient.get(
        '/auth/passenger/authenticated',
        undefined, false, undefined, true
      );

      if (response.status === 'success') {
        setIsAuthenticated(true);
        try {
          const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
          if (me.status === 'success') setUser(me.data ?? null);
        } catch {}
        return true;
      }

      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      return false;
    } catch {
      setIsAuthenticated(false);
      setUser(null);
      setToken(null);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
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
          if (!res.data?.token) {
            setIsLoading(false);
            return { success: false, message: 'No token returned' };
          }

          const access = res.data.token as string;
          const refresh = res.data.refresh as string | undefined;

          // Update React state & memory cache immediately — release the UI before any Keychain work
          setMemoryToken(access); 
          setToken(access);
          setIsAuthenticated(true);
          setIsBiometricBlocked(false);
          setIsLoading(false);

          // Keychain writes fully detached — never block the tap handler
          Promise.resolve().then(async () => {
            try {
              // await SecureStorage.set('auth_token', access);
              await Preferences.set({
              key: 'auth_token',
              value: access,
              })
              if (refresh) {
              // await SecureStorage.set('refresh_token', refresh);
              await Preferences.set({
              key: 'refresh_token',
              value: refresh,
              })
              
              }

              if (isBiometricSupported) {
                await biometric.setRequireFullLogin(false);
              }
            } catch (e) {
              console.warn('Background token storage failed:', e);
            }
          });

          // Profile fetch also detached
          Promise.resolve().then(async () => {
            try {
              const me = await apiClient.get('/auth/passenger/me', access, false, undefined, true);
              if (me.status === 'success') setUser(me.data ?? null);
            } catch {}
          });

          return { success: true };
        } else {
          // Web: cookie already set by server

          const webToken = res.data?.token as string | undefined;
          if(webToken) {
            setMemoryToken(webToken);
            setToken(webToken);
            if (typeof window !== 'undefined'){
              localStorage.setItem('achrams_passenger_token', webToken);
            }
          }

          setIsAuthenticated(true);
          setIsLoading(false);

          Promise.resolve().then(async () => {
            try {
              const me = await apiClient.get('/auth/passenger/me', undefined, false, undefined, true);
              if (me.status === 'success') setUser(me.data ?? null);
            } catch {}
          });

          return { success: true };
        }
      }

      setIsLoading(false);
      console.log("Res: ", res);
      const parsedErrorMessage = handleApiError(res);
      return { success: false, message: parsedErrorMessage || generalError || res.message || 'Login failed' };
    } catch {
      setIsLoading(false);
      return { success: false, message: 'Login error' };
    }
  }, [biometric]);

  const logout = useCallback(async () => {
    try {
      await apiClient.post('/auth/logout', {}, token ?? undefined, undefined, true);
    } catch {}

    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setMemoryToken(null); // Clear memory cache

    if(!isNative && typeof window !== 'undefined'){
      localStorage.removeItem('achrams_passenger_token');
    }

    if (isNative) {
      try {
        // await SecureStorage.remove('auth_token');
        await Preferences.remove({
        key: 'auth_token'}
        )
        // await SecureStorage.remove('refresh_token');
        await Preferences.remove({
        key: 'refresh_token'
        })
      } catch (e) {
        console.warn('Failed to clear tokens on logout:', e);
      }

      if (isBiometricSupported) {
        try {
          await biometric.disableBiometricLogin();
        } catch (e) {
          console.warn('Failed to disable biometric login:', e);
        }
      }
    }
  }, [token, biometric]);

  // Biometric login — Android only, returns false immediately on iOS
  const loginWithBiometric = useCallback(async () => {
    if (!isBiometricSupported) return false;

    const requiresFull = await biometric.getRequireFullLogin();
    if (requiresFull) {
      setIsBiometricBlocked(true);
      return false;
    }

    const creds = await biometric.getSecureCredentials();
    if (!creds.accessToken) return false;

    // Validate token before prompting biometric
    try {
      const check = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
      if (check.status !== 'success') {
        await biometric.setRequireFullLogin(true);
        await biometric.disableBiometricLogin();
        return false;
      }
    } catch {
      await biometric.setRequireFullLogin(true);
      await biometric.disableBiometricLogin();
      return false;
    }

    // Token valid — NOW prompt biometric
    const auth = await biometric.authenticate();
    if (!auth.success) return false;

    setMemoryToken(creds.accessToken); // Update memory cache
    setToken(creds.accessToken);
    setIsAuthenticated(true);

    try {
      const me = await apiClient.get('/auth/passenger/me', creds.accessToken, false, undefined, true);
      if (me.status === 'success') setUser(me.data ?? null);
    } catch {}

    return true;
  }, [biometric]);

  // Enable biometric — Android only
  const enableBiometricLogin = useCallback(async () => {
    if (!isBiometricSupported) return false;

    let t = token;
    if (!t) {
      const creds = await biometric.getSecureCredentials();
      t = creds.accessToken;
      if (t) { 
        setToken(t); 
        setMemoryToken(t); // Update memory cache
      }
    }
    if (!t) return false;

    const creds = await biometric.getSecureCredentials();
    return biometric.enableBiometricLogin(t, creds.refreshToken ?? undefined);
  }, [token, biometric]);

  // Disable biometric — Android only
  const disableBiometricLogin = useCallback(async () => {
    if (isBiometricSupported) await biometric.disableBiometricLogin();
  }, [biometric]);

  // Biometric availability — null on iOS (feature doesn't exist there)
  const isBiometricAvailable = isBiometricSupported && mounted
    ? (biometric.biometryResult?.isAvailable ?? null)
    : null;

  const isBiometricEnabled = isBiometricSupported && mounted
    ? biometric.isEnabled
    : false;

  const value = useMemo(() => ({
    user,
    token,
    isAuthenticated,
    isLoading,
    isBiometricAvailable,
    isBiometricEnabled,
    isBiometricBlocked,
    checkAuthStatus,
    login,
    logout,
    loginWithBiometric,
    enableBiometricLogin,
    disableBiometricLogin,
  }), [
    user, token, isAuthenticated, isLoading,
    isBiometricAvailable, isBiometricEnabled, isBiometricBlocked,
    checkAuthStatus, login, logout, loginWithBiometric,
    enableBiometricLogin, disableBiometricLogin,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};









