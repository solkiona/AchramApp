// src/components/app/modals/PassengerDetailsModal.tsx
import { X, Package, Users, Accessibility } from 'lucide-react'; // Added Wheelchair icon
import { useState } from 'react';

interface PassengerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  passengerData: { name: string; phone: string; email: string };
  setPassengerData: (data: any) => void;
  requirements: { luggage: boolean; wheelchair: boolean; elderly: boolean };
  setRequirements: (req: any) => void;
  onRequestRide: () => void;

  isLoading? : boolean;

}

export default function PassengerDetailsModal({
  isOpen,
  onClose,
  passengerData,
  setPassengerData,
  requirements,
  setRequirements,
  onRequestRide,
  isLoading,
}: PassengerDetailsModalProps) {
  const [showRequirements, setShowRequirements] = useState(false);

  if (!isOpen) return null;

  return (
    // Fixed background: use bg-achrams-bg-primary with opacity
    // Ensure it covers the whole screen behind the modal
    <div className=" fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50"> 
      {/* The modal content */}
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border ">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Passenger details</h3>
          <button 
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="space-y-4 mb-6">
          <input
            type="text"
            placeholder="Full name"
            value={passengerData.name}
            onChange={(e) => setPassengerData({ ...passengerData, name: e.target.value })}
            // Apply ACHRAMS styling to input
            className="w-full px-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
          />
          <input
            type="tel"
            placeholder="Phone number"
            value={passengerData.phone}
            onChange={(e) => setPassengerData({ ...passengerData, phone: e.target.value })}
            // Apply ACHRAMS styling to input
            className="w-full px-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
          />
          <input
            type="email"
            placeholder="Email address"
            value={passengerData.email}
            onChange={(e) => setPassengerData({ ...passengerData, email: e.target.value })}
            // Apply ACHRAMS styling to input
            className="w-full px-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
          />
        </div>
        <button
          onClick={() => setShowRequirements(!showRequirements)}
          // Apply ACHRAMS styling to button
          className="w-full flex items-center justify-between py-4 border-t border-b border-achrams-border text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors"
        >
          <span className="font-medium">Special requirements</span>
          {/* Use ChevronDown/Up instead of X for consistency */}
          {showRequirements ? <X className="w-5 h-5" /> : <span className="text-achrams-text-secondary">+ Add</span>}
        </button>
        {showRequirements && (
          <div className="space-y-3 py-4">
            <label className="flex items-center gap-3 p-3 bg-achrams-bg-secondary rounded-xl cursor-pointer border border-achrams-border">
              <input
                type="checkbox"
                checked={requirements.luggage}
                onChange={(e) => setRequirements({ ...requirements, luggage: e.target.checked })}
                className="w-5 h-5 text-achrams-primary-solid rounded focus:ring-achrams-primary-solid focus:ring-offset-0"
              />
              <Package className="w-5 h-5 text-achrams-text-secondary flex-shrink-0" />
              <span className="text-achrams-text-primary">Extra luggage</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-achrams-bg-secondary rounded-xl cursor-pointer border border-achrams-border">
              <input
                type="checkbox"
                checked={requirements.wheelchair}
                onChange={(e) => setRequirements({ ...requirements, wheelchair: e.target.checked })}
                className="w-5 h-5 text-achrams-primary-solid rounded focus:ring-achrams-primary-solid focus:ring-offset-0"
              />
              {/* Replaced emoji with Wheelchair icon */}
              <Accessibility className="w-5 h-5 text-achrams-text-secondary flex-shrink-0" />
              <span className="text-achrams-text-primary">Wheelchair accessible</span>
            </label>
            <label className="flex items-center gap-3 p-3 bg-achrams-bg-secondary rounded-xl cursor-pointer border border-achrams-border">
              <input
                type="checkbox"
                checked={requirements.elderly}
                onChange={(e) => setRequirements({ ...requirements, elderly: e.target.checked })}
                className="w-5 h-5 text-achrams-primary-solid rounded focus:ring-achrams-primary-solid focus:ring-offset-0"
              />
              <Users className="w-5 h-5 text-achrams-text-secondary flex-shrink-0" />
              <span className="text-achrams-text-primary">Elderly passenger</span>
            </label>
          </div>
        )}
        <button
          onClick={onRequestRide}
          disabled={!passengerData.name || !passengerData.phone || !passengerData.email}
          // Apply ACHRAMS gradient button styling
          className={`w-full py-4 rounded-xl font-semibold mt-6 transition-all ${
            passengerData.name && passengerData.phone && passengerData.email
              ? 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]' // Enabled state
              : 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed' // Disabled state
          }`}
        >
          {isLoading ? 'Requesting...': 'Request a ride'}
        </button>
      </div>
    </div>
  );
}