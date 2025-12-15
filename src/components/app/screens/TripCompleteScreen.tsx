'use client';

import { Check, MapPin, Star } from 'lucide-react';
import { Driver } from '@/types/passenger';
import ACHRAMFooter from '@/components/app/ui/ACHRAMFooter';
import Image from 'next/image';

type OnDoneHandler = () => void;

interface TripCompleteScreenProps {
  fareEstimate: number | null;
  driver: Driver;
  pickup: string;
  destination: string;
  onRate?: () => void;
  onDone: OnDoneHandler;
}

export default function TripCompleteScreen({
  fareEstimate,
  driver,
  pickup,
  destination,
  onRate,
  onDone,
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

        {/* Driver Info */}
        {driver && (
          <div className="bg-achrams-bg-secondary rounded-xl p-5 mb-6 border border-achrams-border">
            <div className="flex items-center gap-4 mb-5">
              {/* Profile Picture */}
              <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-achrams-border">
                {driver.profile_photo ? (
                  <Image
                    src={driver.profile_photo}
                    alt={driver.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-achrams-primary-solid flex items-center justify-center text-achrams-text-light font-bold">
                    {driver.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              {/* Name & Rating */}
              <div>
                <h3 className="text-lg font-bold text-achrams-text-primary">{driver.name}</h3>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  <span className="font-medium text-achrams-text-primary">
                    {driver.rating || "5.0"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Trip Summary: Pickup + Destination */}
        <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
          <div className="flex items-start gap-3 mb-3">
            <MapPin className="w-4 h-4 text-achrams-primary-solid mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-achrams-text-secondary mb-1">PICKUP</div>
              <div className="font-medium text-achrams-text-primary">{pickup}</div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MapPin className="w-4 h-4 text-achrams-primary-solid mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-xs text-achrams-text-secondary mb-1">DESTINATION</div>
              <div className="font-medium text-achrams-text-primary">{destination}</div>
            </div>
          </div>
        </div>

        {/* Fare */}
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
    onClick={onRate}
    className="w-full py-4 rounded-xl font-semibold mb-3 
      border border-achrams-primary-solid text-achrams-primary-solid 
      bg-white hover:bg-achrams-bg-secondary transition-colors cursor-pointer"
  >
    Rate your ride
  </button>
)}

{/* Done – primary style */}
<button
  onClick={onDone}
  className="w-full py-4 rounded-xl font-semibold 
    bg-achrams-gradient-primary text-achrams-text-light 
    hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
>
  Done
</button>
      </div>

      <ACHRAMFooter />
    </div>
  );
}