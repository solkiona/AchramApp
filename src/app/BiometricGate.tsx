// src/components/BiometricGate.tsx
'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
const isNative = Capacitor.isNativePlatform();

export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isBiometricEnabled, loginWithBiometric } = useAuth();
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!isNative || isAuthenticated) {
        setChecking(false);
        return;
      }
      if (isBiometricEnabled) {
        setLocked(true);
        const ok = await loginWithBiometric();
        setLocked(!ok);
      }
      setChecking(false);
    };
    run();
  }, [isAuthenticated, isBiometricEnabled, loginWithBiometric]);

  if (checking) return null;
  if (isNative && locked) {
    return (
      <div className="flex h-screen items-center justify-center">
        <button onClick={() => loginWithBiometric()} className="px-4 py-2 rounded bg-emerald-600 text-white">
          Unlock with Biometrics
        </button>
      </div>
    );
  }
  return <>{children}</>;
};