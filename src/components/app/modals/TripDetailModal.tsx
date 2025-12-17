// src/components/app/modals/TripDetailsModal.tsx (or update TripDetailsScreen.tsx if you prefer)

import { useEffect, useState } from "react";
import { Clock, MapPin, Wallet, Star, User, X, Plane, Loader } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Driver } from "@/types/passenger"; // Assuming this type exists
import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";

// Assuming the same Trip interface from TripHistoryModal, adjusted for rating
interface Trip {
  id: string;
  amount: {
    formatted: string;
    currency: string;
    amount: number;
  };
  status: {
    label: string;
    value: string;
  };
  pickup_address: string;
  destination_address: string;
  verification_code: string;
  rating: { score: number; comment: string } | null; // API shows object, not just number
  map_data?: any; // Or a more specific type
  driver?: Driver;
  created_at: string; // API shows this field
  // Add other fields as needed
}

interface TripDetailsModalProps {
  isOpen: boolean; // NEW: Control visibility
  tripId: string | null; // NEW: Accept trip ID, handle null
  onClose: () => void; // NEW: Handler to close the modal
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export default function TripDetailsModal({
  isOpen,
  tripId,
  onClose, // NEW: Use onClose instead of onBack
  showNotification,
}: TripDetailsModalProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // NEW: Only fetch if modal is open and tripId is provided
    if (!isOpen || !tripId) {
        setTrip(null); // Clear previous data
        setLoading(false);
        setError(null);
        return;
    }

    const fetchTripDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Fetching details for trip ID:", tripId);
        const response = await apiClient.get(`/trips/${tripId}`, undefined , false, undefined , true);
        console.log("Trip details API response:", response);

        if (response.status === "success" && response.data) {
          setTrip(response.data);
        } else {
          console.error("API response was not successful for trip details:", response);
          setError("Failed to fetch trip details.");
          showNotification("Failed to fetch trip details.", "error");
        }
      } catch (err) {
        console.error("Error fetching trip details:", err);
        setError("An error occurred while fetching trip details.");
        showNotification("Failed to fetch trip details. Please check your connection.", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchTripDetails();
  }, [tripId, isOpen, showNotification]); // NEW: Depend on isOpen and tripId

  // NEW: Don't render anything if not open
  if (!isOpen) return null;

  // NEW: Simplified render logic, no conditional return for loading/error inside main return
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center"> {/* NEW: Overlay container */}
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose} // NEW: Close on backdrop click
      />
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md h-[85vh] rounded-t-3xl border-t border-achrams-border shadow-lg overflow-hidden flex flex-col"> {/* NEW: Modal container with height, rounded corners, etc. */}
        {/* Header */}
        <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trip Details</h2>
          <button
            onClick={onClose} // NEW: Close button
            className="text-achrams-text-light hover:text-achrams-text-secondary"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Plane className="w-12 h-12 text-achrams-primary-solid mx-auto mb-4 animate-pulse" />
                <p className="text-achrams-text-secondary">Loading trip details...</p>
              </div>
            </div>
          ) : error || !trip ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center px-6">
                <div className="text-red-500 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                </div>
                <p className="text-achrams-text-secondary mb-4">{error || "Trip details not found."}</p>
                <button
                  onClick={onClose} // NEW: Go back to history or just close on error
                  className="w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Close
                </button>
              </div>
            </div>
          ) : (
            // NEW: Trip details content (same as before, just inside the modal structure)
            <>
              {/* Trip Status Card */}
              <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-achrams-text-primary">Trip Status</h3>
                  <span className={`text-xs px-3 py-1.5 rounded-full font-semibold ${
                    trip.status.value === "completed"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-amber-100 text-amber-800" // Assuming cancelled or other
                  }`}>
                    {trip.status.label}
                  </span>
                </div>
                <p className="text-sm text-achrams-text-secondary">ID: {trip.id}</p>
              </div>

              {/* Driver Info (if available) */}
              {trip.driver && (
                <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
                  <h3 className="font-bold text-lg mb-3 text-achrams-text-primary flex items-center gap-2">
                    <User className="w-5 h-5 text-achrams-text-secondary" />
                    Driver
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-achrams-primary-solid rounded-full flex items-center justify-center text-achrams-text-light font-bold">
                      {trip.driver.name?.charAt(0) || "D"}
                    </div>
                    <div>
                      <p className="font-semibold text-achrams-text-primary">{trip.driver.name}</p>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                        <span className="text-sm text-achrams-text-primary">{trip.driver.rating || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Trip Summary */}
              <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
                <h3 className="font-bold text-lg mb-3 text-achrams-text-primary">Trip Summary</h3>
                <div className="space-y-4">
                  {/* Pickup */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-achrams-primary-solid rounded-full"></div>
                      <div className="text-xs text-achrams-text-secondary mb-1">PICKUP</div>
                    </div>
                    <div className="font-medium text-achrams-text-primary">{trip.pickup_address}</div>
                  </div>

                  {/* Destination */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-achrams-primary-solid rounded-full"></div>
                      <div className="text-xs text-achrams-text-secondary mb-1">DESTINATION</div>
                    </div>
                    <div className="font-medium text-achrams-text-primary">{trip.destination_address}</div>
                  </div>

                  {/* Verification Code (if relevant for completed trips) */}
                  {trip.verification_code && (
                    <div>
                      <div className="text-xs text-achrams-text-secondary mb-1">VERIFICATION CODE</div>
                      <div className="font-mono font-bold text-achrams-text-primary text-lg">{trip.verification_code}</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Fare & Date */}
              <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 border border-achrams-border">
                <h3 className="font-bold text-lg mb-3 text-achrams-text-primary">Fare & Date</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-achrams-text-secondary">Total Fare</span>
                    <span className="text-xl font-bold text-achrams-text-primary">
                      {trip.amount.formatted}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-achrams-border">
                    <span className="text-achrams-text-secondary flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Date & Time
                    </span>
                    <span className="text-achrams-text-primary">
                      {new Date(trip.created_at || '').toLocaleString() || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}