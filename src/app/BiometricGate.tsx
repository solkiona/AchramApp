'use client';
import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const isNative = Capacitor.isNativePlatform();

export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBiometricEnabled, loginWithBiometric , isBiometricAvailable} = useAuth();
  const [checking, setChecking] = useState(true);
  const hasPrompted = useRef(false);

  useEffect(() => {
    if (!isNative) {
      setChecking(false);
      return;
    }
    if (isAuthenticated) {
      setChecking(false);
      return;
    }
    if (isBiometricEnabled &&!hasPrompted.current) {
      hasPrompted.current = true;
      loginWithBiometric().finally(() => setChecking(false));
    } else {
      setChecking(false);
    }
  }, [isAuthenticated, isBiometricEnabled, loginWithBiometric]);

  if (isBiometricAvailable && checking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
        <Lock className="h-12 w-12 text-emerald-600 animate-pulse" />
        <p className="text-sm text-gray-600">Unlocking with biometrics…</p>
      </div>
    );
  }

  // If native, biometrics enabled, but still not authenticated, keep lock screen
  // The system prompt is already shown by loginWithBiometric, we just wait
  if (isNative && isBiometricEnabled &&!isAuthenticated) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
        <Lock className="h-12 w-12 text-emerald-600" />
        <p className="text-sm text-gray-600">Authenticate to continue</p>
      </div>
    );
  }

  return <>{children}</>;
};