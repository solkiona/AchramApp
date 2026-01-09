// app/trips/transit/[guestId]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import Image from 'next/image';
import ACHRAMApp from '@/components/app/ACHRAMApp';

/**
 * Transit Link Page
 * 
 * This page handles deep links for guest users to access their trips across devices.
 * Backend generates links like: /trips/transit/{guestId}
 * 
 * Flow:
 * 1. Extract guestId from URL params
 * 2. Store in achrams_app_state (existing state structure)
 * 3. Redirect to main app
 * 4. Main app's initializeAppState picks up the guestId and restores trip
 */
export default function TransitLinkPage() {
  const params = useParams();
  const router = useRouter();
  const guestId = params.guestId as string;
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Validate guestId exists
    if (!guestId || typeof guestId !== 'string') {
      console.error('Invalid or missing guestId in transit link');
      setError('Invalid trip link. Please check the URL and try again.');
      return;
    }

    // Basic validation: guestId should be a non-empty string
    // We don't validate specific format since backend may use different ID patterns
    if (guestId.trim().length === 0) {
      console.error('GuestId is empty:', guestId);
      setError('Invalid trip link format. Please check the URL.');
      return;
    }

    console.log('Transit link accessed with guestId:', guestId);

    try {
      // Create state object following existing achrams_app_state structure
      const transitState = {
        screen: null, // Will be determined after fetching trip in main app
        pickup: '',
        destination: '',
        fareEstimate: null,
        driver: null,
        tripProgress: 0,
        pickupCoords: null,
        destinationCoords: null,
        verificationCode: null,
        activeTripId: null, // Will be populated after fetch
        guestId: guestId, //  The extracted guestId from URL
        bookAsGuest: true, // They're accessing an existing guest trip, not booking as guest
      };

      // Store in sessionStorage using existing state key
      sessionStorage.setItem('achrams_app_state', JSON.stringify(transitState));
      console.log('Saved transit guestId to achrams_app_state:', transitState);

      // Small delay to ensure sessionStorage write completes
      // setTimeout(() => {
      //   console.log('Redirecting to main app to restore trip session...');
      //   router.replace('/'); // Redirect to main app
      // }, 100);
      

    } catch (err) {
      console.error('Error saving transit state to sessionStorage:', err);
      setError('Failed to process trip link. Please try again.');
    }
  }, [guestId, router]);

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 px-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-xl font-bold text-gray-900">Invalid Trip Link</h1>
            <p className="text-gray-600 leading-relaxed">{error}</p>
            <button
              onClick={() => router.push('/')}
              className="mt-4 w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 px-6 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all"
            >
              Go to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <ACHRAMApp />

  
  // Loading state (default)
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="flex flex-col items-center gap-6">
        {/* Animated Logo Container */}
        <div className="relative">
          {/* Glow Effect */}
          <div 
            className="absolute -inset-4 rounded-full bg-emerald-500 opacity-20 blur-lg"
            style={{
              animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }}
          />
          
          {/* Logo Card */}
          <div className="relative w-20 h-20 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg overflow-hidden">
            {/* Animated Gradient Sweep */}
            <div 
              className="absolute inset-0"
              style={{
                background: 'linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.2) 50%, transparent 60%)',
                animation: 'sweep 2s linear infinite',
              }}
            />
            
            {/* Logo Image */}
            <Image
              src="/images/logo.png"
              alt="ACHRAMS Logo"
              width={40}
              height={40}
              className="object-contain relative z-10"
              priority
            />
          </div>
        </div>
        
        {/* Loading State */}
        <div className="flex flex-col items-center gap-3">
          {/* <Loader2 className="w-10 h-10 text-emerald-600 animate-spin" /> */}
          <h2 className="text-gray-900 font-bold text-xl">Loading Your Trip</h2>
          <p className="text-gray-600 text-sm">Please wait a moment...</p>
        </div>

        {/* Progress Indicator */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full"
            style={{
              animation: 'loadingBar 1.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>

      {/* Custom CSS Animations */}
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { 
            opacity: 0.2; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.4; 
            transform: scale(1.05); 
          }
        }
        
        @keyframes sweep {
          0% { 
            transform: translateX(-100%) skewX(-25deg); 
          }
          100% { 
            transform: translateX(200%) skewX(-25deg); 
          }
        }
        
        @keyframes loadingBar {
          0% { 
            width: 0%; 
            margin-left: 0%; 
          }
          50% { 
            width: 70%; 
            margin-left: 0%; 
          }
          100% { 
            width: 0%; 
            margin-left: 100%; 
          }
        }
      `}</style>
    </div>
  );
}