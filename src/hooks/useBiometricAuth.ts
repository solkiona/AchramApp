// src/hooks/useBiometricAuth.ts
import { useState, useCallback } from 'react';
import {
  BiometricAuth,
  CheckBiometryResult,
  BiometryError,
  BiometryErrorType,
  AuthenticateOptions,
  BiometryType
} from '@aparajita/capacitor-biometric-auth';
// import { SecureStorage } from '@aparajita/capacitor-secure-storage';
import { Preferences } from '@capacitor/preferences';

import { Capacitor } from '@capacitor/core';

const isNative = Capacitor.isNativePlatform();

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: BiometryType;
}

const KEYS = {
  access: 'auth_token',
  refresh: 'refresh_token',
  enabled: 'biometric_enabled',
  requireFullLogin: 'require_full_login',

};

export const useBiometricAuth = () => {
  const [biometryResult, setBiometryResult] = useState<CheckBiometryResult | null>(null);
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkAvailability = useCallback(async () => {
    setIsLoading(true);
      if (!isNative) {
    setBiometryResult(null);
    setIsEnabled(false);
    return false;
  }

    try {
      const result = await BiometricAuth.checkBiometry();
      setBiometryResult(result);
      // const enabled = await SecureStorage.get(KEYS.enabled);
      // setIsEnabled(enabled === 'true');
      const { value } = await Preferences.get({
        key: KEYS.enabled,
      });

      setIsEnabled(value === 'true');
      return result.isAvailable;
    } catch (e) {
      console.error('BIO checkAvailability error', e);
      setBiometryResult(null);
      setIsEnabled(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<BiometricResult> => {
    setIsLoading(true);
    if (!isNative) return { success: false, error: 'Not supported on web' };
    try {
      await BiometricAuth.authenticate({
        reason: 'Unlock ACHRAMS',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'ACHRAMS Security',
        androidSubtitle: 'Verify your identity',
        androidConfirmationRequired: false,
      });
      return { success: true, biometryType: biometryResult?.biometryType };
    } catch (e) {
      console.error('BIO authenticate error', e);
      if (e instanceof BiometryError) {
        const map: Record<BiometryErrorType, string> = {
          [BiometryErrorType.userCancel]: 'Cancelled',
          [BiometryErrorType.systemCancel]: 'Interrupted',
          [BiometryErrorType.biometryLockout]: 'Too many attempts',
          [BiometryErrorType.biometryNotAvailable]: 'Not available',
          [BiometryErrorType.biometryNotEnrolled]: 'Not enrolled',
          [BiometryErrorType.passcodeNotSet]: 'Passcode not set',
          [BiometryErrorType.authenticationFailed]: 'Failed',
          [BiometryErrorType.userFallback]: 'Fallback chosen',
          [BiometryErrorType.noDeviceCredential]: 'No device credential',
          [BiometryErrorType.invalidContext]: 'Invalid context',
          [BiometryErrorType.notInteractive]: 'Not interactive',
          [BiometryErrorType.appCancel]: 'Cancelled by app',
          [BiometryErrorType.none]: 'Unknown error',
        };
        return { success: false, error: map[e.code] || e.message };
      }
      return { success: false, error: e instanceof Error? e.message : 'Failed' };
    } finally {
      setIsLoading(false);
    }
  }, [biometryResult]);

  const enableBiometricLogin = useCallback(async (accessToken: string, refreshToken?: string) => {
     if (!isNative) return false;
     
    try {
      // await SecureStorage.set(KEYS.access, accessToken);
      // if (refreshToken) await SecureStorage.set(KEYS.refresh, refreshToken);
      // await SecureStorage.set(KEYS.enabled, 'true');
      await Preferences.set({
        key: KEYS.access,
        value: accessToken,
      });

      if (refreshToken) {
        await Preferences.set({
          key: KEYS.refresh,
          value: refreshToken,
        });
      }

      await Preferences.set({
        key: KEYS.enabled,
        value: 'true',
      });

      setIsEnabled(true);
      return true;
    } catch (e) {
      console.error('BIO enable error', e);
      return false;
    }
  }, []);

  const getSecureCredentials = useCallback(async () => {
    try {
      // const [access, refresh, enabled] = await Promise.all([
      //   SecureStorage.get(KEYS.access),
      //   SecureStorage.get(KEYS.refresh),
      //   SecureStorage.get(KEYS.enabled),
      // ]);
      // return {
      //   accessToken: access as string | null,
      //   refreshToken: refresh as string | null,
      //   enabled: enabled === 'true',
      // };

      const [access, refresh, enabled] = await Promise.all([
        Preferences.get({ key: KEYS.access }),
        Preferences.get({ key: KEYS.refresh }),
        Preferences.get({ key: KEYS.enabled }),
      ]);

      return {
        accessToken: access.value,
        refreshToken: refresh.value,
        enabled: enabled.value === 'true',
      };

    } catch (e) {
      console.error('BIO getCredentials error', e);
      return { accessToken: null, refreshToken: null, enabled: false };
    }
  }, []);

  const disableBiometricLogin = useCallback(async () => {
    try {
      await Promise.all([
        // SecureStorage.remove(KEYS.access),
        // SecureStorage.remove(KEYS.refresh),
        // SecureStorage.set(KEYS.enabled, 'false'),
        Preferences.remove({
          key: KEYS.access
        }),
        Preferences.remove({
          key: KEYS.refresh
        }),
        Preferences.set({
          key: KEYS.enabled,
          value: 'false'
        })
      ]);
      setIsEnabled(false);
      return true;
    } catch (e) {
      console.error('BIO disable error', e);
      return false;
    }
  }, []);

  const updateStoredAccessToken = useCallback(async (accessToken: string) => {
    // await SecureStorage.set(KEYS.access, accessToken);
    await Preferences.set({
      key: KEYS.access ,
      value: accessToken,
    })
  }, []);

  const setRequireFullLogin = useCallback(async (value: boolean) => {
  // await SecureStorage.set(KEYS.requireFullLogin, value ? 'true' : 'false');

  await Preferences.set({
    key: KEYS.requireFullLogin,
    value: value ? 'true' : 'false',
  })

}, []);

const getRequireFullLogin = useCallback(async () => {
  // const val = await SecureStorage.get(KEYS.requireFullLogin);
  // return val === 'true';

  const { value } = await Preferences.get({
  key: KEYS.requireFullLogin,
});

return value === 'true';

}, []);

  return {
    biometryResult,
    isEnabled,
    isLoading,
    checkAvailability,
    authenticate,
    enableBiometricLogin,
    getSecureCredentials,
    disableBiometricLogin,
    updateStoredAccessToken,
    setRequireFullLogin,
    getRequireFullLogin,
  };
};