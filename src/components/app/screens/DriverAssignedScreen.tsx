
// src/components/app/screens/DriverAssignedScreen.tsx
"use client";

import {
  MapPin,
  MessageCircle,
  Phone,
  X,
  CheckCircle,
  Shield,
  Star,
} from "lucide-react";
import { Driver } from "@/types/passenger";
import { useState, useEffect } from "react";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
import Image from "next/image";

interface DriverAssignedScreenProps {
  pickup: string;
  destination: string;
  driver: Driver;
  verificationCode: string;
  onShowDirections: () => void;
  onShowDriverVerification: () => void;
  onStartTrip: () => void;
  onBack: () => void;
  showNotification: (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => void;
  onCancelTrip: () => void;
}

export default function DriverAssignedScreen({
  pickup,
  destination,
  driver,
  verificationCode,
  onShowDirections,
  onShowDriverVerification,
  onStartTrip,
  onBack,
  showNotification,
  onCancelTrip,
}: DriverAssignedScreenProps) {
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVerified(true), 5000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col relative">
      {driver ? (
        <>
          {/* Header */}
          <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Driver Assigned</h1>
            <button onClick={onBack} className="text-achrams-text-light">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {/* Trip Summary */}
            <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2"></div>
                <div>
                  <div className="text-xs text-achrams-text-secondary mb-1">PICKUP</div>
                  <div className="font-medium text-achrams-text-primary">{pickup}</div>
                </div>
              </div>
              <div className="ml-3 w-0.5 h-6 bg-achrams-border"></div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2"></div>
                <div>
                  <div className="text-xs text-achrams-text-secondary mb-1">DESTINATION</div>
                  <div className="font-medium text-achrams-text-primary">{destination}</div>
                </div>
              </div>
            </div>

            {/* Driver Card */}
            <div className="bg-achrams-bg-secondary border border-achrams-border rounded-xl p-5 mb-4">
              {/* Profile Header */}
              <div className="flex items-center gap-4 mb-5">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-achrams-border">
                  {driver.profile_photo ? (
                    <Image
                      src={driver.profile_photo}
                      alt={driver.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-achrams-primary-solid flex items-center justify-center text-achrams-text-light font-bold text-lg">
                      {driver.name.charAt(0)}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-achrams-text-primary">{driver.name}</h3>
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-medium text-achrams-text-primary">{driver.rating || "5.0"}</span>
                    {/* Optional: Add trip count if available */}
                    {/* <span className="text-achrams-text-secondary ml-1">• 120 trips</span> */}
                  </div>
                </div>
              </div>

              {/* Car Photo (if available) */}
              {driver.car_photo && (
                <div className="mb-4 rounded-lg overflow-hidden border border-achrams-border">
                  <div className="relative w-full h-32">
                    <Image
                      src={driver.car_photo}
                      alt={`${driver.car_type} - ${driver.car_color}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Car Details */}
              <div className="bg-achrams-bg-primary rounded-lg p-4 mb-4 border border-achrams-border">
                <div className="text-sm text-achrams-text-secondary mb-1">
                  {driver.car_type || "Vehicle"} • {driver.car_color || "Color"}
                </div>
                <div className="text-2xl font-mono font-bold text-achrams-text-primary">
                  {driver.plate_number || "—"}
                </div>
              </div>

              {/* Action Buttons (Optional) */}
              {/* 
              <div className="grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
                <button className="flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
                  <Phone className="w-5 h-5" />
                  Call
                </button>
              </div>
              */}
            </div>

            {/* Verify Driver */}
            <button
              onClick={onShowDriverVerification}
              className={`w-full flex items-center justify-center gap-2 py-3 mb-3 rounded-xl font-medium transition-colors ${
                isVerified
                  ? "bg-green-100 text-green-800 border border-green-300"
                  : "bg-achrams-primary-solid/10 border border-achrams-primary-solid text-achrams-primary-solid animate-pulse"
              }`}
            >
              {isVerified ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
              {isVerified ? "Verify Your Driver" : "Verify Your Driver"}
            </button>

            {/* Directions & Actions */}
            <button
              onClick={onShowDirections}
              className="w-full border border-achrams-primary-solid text-achrams-primary-solid bg-transparent py-4 rounded-xl font-semibold mb-3 hover:bg-achrams-bg-secondary transition-colors"
            >
              Get directions to pickup
            </button>

            <button
              onClick={onCancelTrip}
              className="w-full py-4 rounded-xl font-semibold bg-red-500 text-white hover:bg-red-600 active:scale-[0.98] transition-all"
            >
              Cancel trip
            </button>
          </div>

          <ACHRAMFooter />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-achrams-text-secondary">Loading driver info...</p>
        </div>
      )}
    </div>
  );
}

