// src/components/app/screens/TripCompleteScreen.tsx
'use client';

import { Check } from 'lucide-react';
import { Driver } from '@/types/passenger';
import ACHRAMFooter from '@/components/app/ui/ACHRAMFooter';

// NEW: Define the type for the onDone prop
type OnDoneHandler = () => void;

interface TripCompleteScreenProps {
  fareEstimate: number | null;
  driver: Driver;
  onRate?: () => void;
  // NEW: Add onDone prop
  onDone: OnDoneHandler;
}

export default function TripCompleteScreen({
  fareEstimate,
  driver,
  onRate,
  onDone, // NEW: Destructure the onDone prop
}: TripCompleteScreenProps) {
  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4">
        <h1 className="text-xl font-bold">Trip completed</h1>
      </div>
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-achrams-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-achrams-border">
            <Check className="w-10 h-10 text-achrams-primary-solid" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-achrams-text-primary">You've arrived!</h2>
          <p className="text-achrams-text-secondary">How was your trip?</p>
        </div>

        <div className="bg-achrams-bg-secondary rounded-xl p-6 mb-6 border border-achrams-border">
          <div className="flex justify-between items-center mb-4">
            <span className="text-achrams-text-secondary">Total Fare</span>
            <span className="text-3xl font-bold text-achrams-text-primary">
              ₦{fareEstimate?.toLocaleString() || '0'}
            </span>
          </div>
          <div className="text-sm text-achrams-text-secondary">Paid via Cash</div>
        </div>

        {onRate && (
          <button
            onClick={onRate} // Keep existing rate button
            className="w-full py-4 rounded-xl font-semibold mb-3 bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Rate your ride
          </button>
        )}

        {/* NEW: Button that triggers the onDone handler passed from page.tsx */}
        <button
          onClick={onDone} // NEW: Call the onDone function passed as a prop
          className="w-full py-4 rounded-xl font-semibold bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98] transition-all"
        >
          Done
        </button>
      </div>
      <ACHRAMFooter />
    </div>
  );
}