
// src/components/app/screens/DriverAssignedScreen.tsx
'use client';

import { MapPin, MessageCircle, Phone, X, CheckCircle, Shield } from 'lucide-react'; // Added CheckCircle
import { Driver } from '@/types/passenger';
import { useState, useEffect } from 'react'; // Add useEffect if not already present

// NEW: Define the prop type to include showNotification
interface DriverAssignedScreenProps {
  pickup: string;
  destination: string;
  driver: Driver;
  verificationCode: string; // NEW: Prop for verification code
  onShowDirections: () => void;
  onShowDriverVerification: () => void; // NEW: Handler for verification modal
  onStartTrip: () => void;
  onBack: () => void; // This should setScreen('booking') in page.tsx
  // NEW: Prop to trigger notifications in the parent (page.tsx)
  showNotification: (message: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function DriverAssignedScreen({
  pickup,
  destination,
  driver,
  verificationCode, // NEW: Destructure prop
  onShowDirections,
  onShowDriverVerification, // NEW: Destructure handler
  onStartTrip,
  onBack, // Destructure onBack
  showNotification, // NEW: Destructure the notification function
}: DriverAssignedScreenProps) {
  // NEW: State to track if driver is verified (mock for now)
  const [isVerified, setIsVerified] = useState(false);

  // NEW: Simulate verification after 5 seconds for demo
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerified(true);
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

  // NEW: Handle Cancel Trip click
  const handleCancelTrip = () => {
    // NEW: Show a success notification using the function passed from page.tsx
    showNotification("Trip cancelled successfully", "success");
    // NEW: Navigate back to booking screen immediately after showing the notification
    onBack(); // This calls the function passed from page.tsx which sets the screen state
  };

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col relative">
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">Driver Assigned</h1>
        <button onClick={onBack}>
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-6">
        {/* Trip Details */}
        <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="text-xs text-achrams-text-secondary mb-1">PICKUP</div>
              <div className="font-medium text-achrams-text-primary">{pickup}</div>
            </div>
          </div>
          <div className="ml-3 w-0.5 h-6 bg-achrams-border"></div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2"></div>
            <div className="flex-1">
              <div className="text-xs text-achrams-text-secondary mb-1">DESTINATION</div>
              <div className="font-medium text-achrams-text-primary">{destination}</div>
            </div>
          </div>
        </div>

        {/* Driver Card */}
        <div className="bg-achrams-bg-secondary border border-achrams-border rounded-xl p-6 mb-4">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-2xl font-bold">
              {driver.initials || driver.name?.charAt(0) || 'D'}
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-1 text-achrams-text-primary">{driver.name}</h3>
              <div className="flex items-center gap-1 text-sm text-achrams-text-secondary">
                <span className="font-medium text-achrams-text-primary">{driver.rating}</span>
                <span className="text-achrams-text-secondary">• {driver.trips} trips</span>
              </div>
            </div>
          </div>
          <div className="bg-achrams-bg-primary rounded-lg p-4 mb-4 border border-achrams-border">
            <div className="text-sm text-achrams-text-secondary mb-2">{driver.car_type || "Toyota  Camry"} • {driver.car_color || "Red"}</div>
            <div className="text-3xl font-mono font-bold text-achrams-text-primary">{driver.plate_number || "XYZ-ABJ-14"}</div>
          </div>
          {/* <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
              <MessageCircle className="w-5 h-5" />
              Message
            </button>
            <button className="flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
              <Phone className="w-5 h-5" />
              Call
            </button>
          </div> */}
        </div>

        {/* NEW: Verify Driver Link/Button */}
        {/* <button
          onClick={onShowDriverVerification}
          className="w-full flex items-center justify-center gap-2 py-3 mb-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors"
        >
          {isVerified ? <CheckCircle className="w-5 h-5 text-green-500" /> : <Shield className="w-5 h-5" />}
          {isVerified ? 'Driver Verified' : 'Verify Driver'}
        </button> */}
                <button
          onClick={onShowDriverVerification}
          className={`w-full flex items-center justify-center gap-2 py-3 mb-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors ${
            !isVerified // Apply animation only if NOT verified
              ? 'animate-pulse bg-achrams-primary-solid/10 border-achrams-primary-solid text-achrams-primary-solid' // NEW: Pulsing style
              : '' // No animation if verified
          }`}
        >
          {isVerified ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Shield className="w-5 h-5" /> // Consider changing color dynamically too if needed, e.g., className="w-5 h-5 text-achrams-primary-solid"
          )}
          {isVerified ? 'Driver Verified' : 'Verify Driver'}
        </button>

        <button
          onClick={onShowDirections}
          className="w-full border border-achrams-primary-solid text-achrams-primary-solid bg-transparent py-4 rounded-xl font-semibold mb-3 hover:bg-achrams-bg-secondary transition-colors"
        >
          Get directions to pickup
        </button>
        {/* NEW: Cancel Trip Button */}
        <button
          // onClick={onStartTrip} // REMOVED: Original handler
          onClick={handleCancelTrip} // NEW: Call the cancel handler
          // disabled={!isVerified} // REMOVED: Disable until verified (mock logic) - keeping enabled for demo
          className={`w-full py-4 rounded-xl font-semibold transition-all ${
            // isVerified // REMOVED: Conditional styling based on isVerified
            //   ? 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
            //   : 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
            'bg-red-500 text-achrams-text-light hover:bg-red-600 active:scale-[0.98]' // NEW: Red button for cancel
          }`}
        >
          Cancel trip {/* NEW: Changed text */}
        </button>
      </div>
    </div>
  );
}