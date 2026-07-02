
// 'use client';
// import { useEffect, useRef, useState, useCallback } from 'react';
// import { Capacitor } from '@capacitor/core';
// import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
// import { Lock } from 'lucide-react';
// import { useAuth } from '@/contexts/AuthContext';

// const isNative = Capacitor.isNativePlatform();

// export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
//   const { isAuthenticated, isBiometricEnabled, loginWithBiometric, isBiometricAvailable, isBiometricBlocked } = useAuth();
//   const [checking, setChecking] = useState(true);
//   const [isPrompting, setIsPrompting] = useState(false);
//   const hasPrompted = useRef(false);

//   const handlePrompt = useCallback(async () => {
//     if (isPrompting || hasPrompted.current) return;
//     hasPrompted.current = true;
//     setIsPrompting(true);

//     try {
//       // timeout wrapper — critical for iOS
//       const ok = await Promise.race([
//         loginWithBiometric(),
//         new Promise<boolean>(r => setTimeout(() => r(false), 3000))
//       ]);

//       if (!ok) {
//         // let user fall through to normal login
//         setChecking(false);
//       }
//     } catch (e) {
//       console.error('Biometric error', e);
//       setChecking(false);
//     } finally {
//       setIsPrompting(false);
//       // if login succeeded, isAuthenticated will flip and we unmount anyway
//       if (!isAuthenticated) setChecking(false);
//     }
//   }, [isPrompting, loginWithBiometric, isAuthenticated]);

//   useEffect(() => {
//     if (!isNative) {
//       setChecking(false);
//       return;
//     }

//     // iOS: use Native resize to avoid the RTIInputSystemClient errors you saw
//     // if (Capacitor.getPlatform() === 'ios') {
//     //   Keyboard.setResizeMode({ mode: KeyboardResize.Native }).catch(() => {});
//     // }

//     if (isAuthenticated) {
//       setChecking(false);
//       return;
//     }

//     if (!isBiometricEnabled || isBiometricBlocked ||!isBiometricAvailable) {
//       setChecking(false);
//       return;
//     }

//     // WAIT for WebView — this is the fix for your freeze
//     const t = setTimeout(() => {
//       handlePrompt();
//     }, 700);

//     return () => clearTimeout(t);
//   }, [isAuthenticated, isBiometricEnabled, isBiometricAvailable, isBiometricBlocked, handlePrompt]);

//   // Reset prompt flag when user logs out
//   useEffect(() => {
//     if (!isAuthenticated) {
//       hasPrompted.current = false;
//     }
//   }, [isAuthenticated]);

//   if (isNative && isBiometricAvailable && checking) {
//     return (
//       <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
//         <Lock className="h-12 w-12 text-emerald-600 animate-pulse" />
//         <p className="text-sm text-gray-600">Unlocking with biometrics…</p>
//       </div>
//     );
//   }

//   if (isNative && isBiometricEnabled &&!isAuthenticated &&!isBiometricBlocked &&!checking) {
//     return (
//       <button
//         onClick={handlePrompt}
//         disabled={isPrompting}
//         className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white active:bg-gray-50 transition"
//       >
//         <Lock className={`h-12 w-12 text-emerald-600 ${isPrompting? 'animate-pulse' : ''}`} />
//         <p className="text-sm text-gray-600">
//           {isPrompting? 'Waiting for biometrics…' : 'Tap to authenticate'}
//         </p>
//         <span className="text-xs text-gray-400">Authenticate to continue</span>
//       </button>
//     );
//   }

//   return <>{children}</>;
// };


'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const isNative = Capacitor.isNativePlatform();
const isAndroid = Capacitor.getPlatform() === 'android';

// Biometric gate is only meaningful on Android native
const isBiometricSupported = isNative && isAndroid;

export const BiometricGate = ({ children }: { children: React.ReactNode }) => {
  const {
    isAuthenticated,
    isBiometricEnabled,
    isBiometricAvailable,
    isBiometricBlocked,
    loginWithBiometric,
  } = useAuth();

  const [checking, setChecking] = useState(true);
  const [isPrompting, setIsPrompting] = useState(false);
  const hasPrompted = useRef(false);

  const handlePrompt = useCallback(async () => {
    if (!isBiometricSupported) return;
    if (isPrompting || hasPrompted.current) return;

    hasPrompted.current = true;
    setIsPrompting(true);

    try {
      const ok = await Promise.race([
        loginWithBiometric(),
        new Promise<boolean>(r => setTimeout(() => r(false), 3000)),
      ]);

      if (!ok) setChecking(false);
    } catch (e) {
      console.error('Biometric error', e);
      setChecking(false);
    } finally {
      setIsPrompting(false);
      if (!isAuthenticated) setChecking(false);
    }
  }, [isPrompting, loginWithBiometric, isAuthenticated]);

  useEffect(() => {
    // Non-native (web) or iOS — skip gate entirely, render children immediately
    if (!isBiometricSupported) {
      setChecking(false);
      return;
    }

    // Android native from here down
    if (isAuthenticated) {
      setChecking(false);
      return;
    }

    if (!isBiometricEnabled || isBiometricBlocked || !isBiometricAvailable) {
      setChecking(false);
      return;
    }

    // Small delay to let WebView fully attach before prompting
    const t = setTimeout(() => handlePrompt(), 700);
    return () => clearTimeout(t);
  }, [isAuthenticated, isBiometricEnabled, isBiometricAvailable, isBiometricBlocked, handlePrompt]);

  // Reset prompt flag on logout so it works next session
  useEffect(() => {
    if (!isAuthenticated) hasPrompted.current = false;
  }, [isAuthenticated]);

  // Android only: show lock screen while checking
  if (isBiometricSupported && isBiometricAvailable && checking) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-white">
        <Lock className="h-12 w-12 text-emerald-600 animate-pulse" />
        <p className="text-sm text-gray-600">Unlocking with biometrics…</p>
      </div>
    );
  }

  // Android only: show tap-to-auth screen
  if (isBiometricSupported && isBiometricEnabled && !isAuthenticated && !isBiometricBlocked && !checking) {
    return (
      <button
        onClick={handlePrompt}
        disabled={isPrompting}
        className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-white active:bg-gray-50 transition"
      >
        <Lock className={`h-12 w-12 text-emerald-600 ${isPrompting ? 'animate-pulse' : ''}`} />
        <p className="text-sm text-gray-600">
          {isPrompting ? 'Waiting for biometrics…' : 'Tap to authenticate'}
        </p>
        <span className="text-xs text-gray-400">Authenticate to continue</span>
      </button>
    );
  }

  // Web, iOS, or unauthenticated without biometric — render children normally
  return <>{children}</>;
};