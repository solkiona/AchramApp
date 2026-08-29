import { useState, useEffect } from 'react';
import { X, Share } from 'lucide-react';

export default function IOSInstallBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if running on iOS Safari (not in standalone mode)
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;
    const hasSeenPrompt = localStorage.getItem('achrams_ios_install_dismissed');
    
    if (isIOS && !isInStandaloneMode && !hasSeenPrompt) {
      // Show after a brief delay
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('achrams_ios_install_dismissed', 'true');
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg">
        <div className="max-w-[430px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            <Share className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">
              Tap <span className="font-bold">Share</span> then{' '}
              <span className="font-bold">Add to Home Screen</span> for the full app experience
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="ml-3 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slide-down {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}