import { useState, useCallback } from 'react';
import {
  BiometricAuth,
  CheckBiometryResult,
  BiometryError,
  BiometryErrorType,
  AuthenticateOptions,
  BiometryType
} from '@aparajita/capacitor-biometric-auth';
import { SecureStorage } from '@aparajita/capacitor-secure-storage';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometryType?: BiometryType;
}

export const useBiometricAuth = () => {
  const [biometryResult, setBiometryResult] = useState<CheckBiometryResult | null>(null);
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await BiometricAuth.checkBiometry();
      console.log('BIO: checkBiometry', JSON.stringify(result));
      setBiometryResult(result);

      const enabled = await SecureStorage.get('biometric_enabled');
      console.log('BIO: biometric_enabled =', enabled);
      setIsEnabled(enabled === 'true');
      return result.isAvailable;
    } catch (e) {
      console.error('BIO: checkAvailability error', e);
      setBiometryResult(null);
      setIsEnabled(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback(async (): Promise<BiometricResult> => {
    setIsLoading(true);
    try {
      const options: AuthenticateOptions = {
        reason: 'Authenticate to securely access your ACHRAMS account',
        cancelTitle: 'Cancel',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Use Passcode',
        androidTitle: 'ACHRAMS Security',
        androidSubtitle: 'Verify your identity',
        androidConfirmationRequired: false,
      };

      await BiometricAuth.authenticate(options);
      console.log('BIO: authenticate success');
      return { success: true, biometryType: biometryResult?.biometryType };
    } catch (error: unknown) {
      console.error('BIO: authenticate error', error);
      if (error instanceof BiometryError) {
        const errorMap: Record<BiometryErrorType, string> = {
          [BiometryErrorType.userCancel]: 'Cancelled by user',
          [BiometryErrorType.systemCancel]: 'Authentication interrupted',
          [BiometryErrorType.biometryLockout]: 'Too many attempts. Try again later.',
          [BiometryErrorType.biometryNotAvailable]: 'Biometrics not available on this device',
          [BiometryErrorType.biometryNotEnrolled]: 'No biometrics enrolled. Please set up in device settings.',
          [BiometryErrorType.passcodeNotSet]: 'Device passcode not set. Please enable in settings.',
          [BiometryErrorType.authenticationFailed]: 'Authentication failed. Please try again.',
          [BiometryErrorType.userFallback]: 'User chose to use fallback method',
          [BiometryErrorType.noDeviceCredential]: 'No device credential available',
          [BiometryErrorType.invalidContext]: 'Invalid authentication context',
          [BiometryErrorType.notInteractive]: 'Authentication not interactive',
          [BiometryErrorType.appCancel]: 'Authentication cancelled by app',
          [BiometryErrorType.none]: 'Unknown error',
        };
        return {
          success: false,
          error: errorMap[error.code] || error.message || 'Authentication failed',
          biometryType: biometryResult?.biometryType
        };
      }
      return {
        success: false,
        error: error instanceof Error? error.message : 'Authentication failed',
        biometryType: biometryResult?.biometryType
      };
    } finally {
      setIsLoading(false);
    }
  }, [biometryResult]);

  const enableBiometricLogin = useCallback(async (token: string, refreshToken?: string) => {
    try {
      console.log('BIO: enableBiometricLogin start');
      await SecureStorage.set('auth_token', token);
      if (refreshToken) {
        await SecureStorage.set('refresh_token', refreshToken);
      }
      await SecureStorage.set('biometric_enabled', 'true');
      setIsEnabled(true);
      console.log('BIO: enableBiometricLogin success');
      return true;
    } catch (e) {
      console.error('BIO: enableBiometricLogin error', e);
      return false;
    }
  }, []);

  const getSecureCredentials = useCallback(async () => {
    try {
      const [token, refreshToken, enabled] = await Promise.all([
        SecureStorage.get('auth_token'),
        SecureStorage.get('refresh_token'),
        SecureStorage.get('biometric_enabled')
      ]);
      return {
        token: token as string | null,
        refreshToken: refreshToken as string | null,
        enabled: enabled === 'true'
      };
    } catch (e) {
      console.error('BIO: getSecureCredentials error', e);
      return { token: null, refreshToken: null, enabled: false };
    }
  }, []);

  const disableBiometricLogin = useCallback(async () => {
    try {
      console.log('BIO: disableBiometricLogin');
      await Promise.all([
        SecureStorage.remove('auth_token'),
        SecureStorage.remove('refresh_token'),
        SecureStorage.set('biometric_enabled', 'false')
      ]);
      setIsEnabled(false);
      return true;
    } catch (e) {
      console.error('BIO: disableBiometricLogin error', e);
      return false;
    }
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
  };
};