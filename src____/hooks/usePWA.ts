// hooks/usePWA.ts
import { useState, useEffect } from 'react';

export const usePWAPrompt = () => {
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = (window.navigator as any).standalone === true;
    
    if (isIOS && !isStandalone) {
      setShowIOSInstallGuide(true);
    }
  }, []);

  return { showIOSInstallGuide };
};