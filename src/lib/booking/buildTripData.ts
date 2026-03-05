// src/lib/booking/buildTripData.ts
import { Requirements, PassengerData, VehicleCategory, BookingData } from "@/types/booking";

export const buildTripData = (
  fareEstimate: number | null,
  pickup: string,
  destination: string,
  pickupCoords: [number, number] | null,
  destinationCoords: [number, number] | null,
  passengerData: PassengerData,
  requirements: Requirements,
  airportId: string,
  bookAsGuest: boolean,
  isAuthenticated: boolean,
  formatPhoneNumber: (input: string) => string,
  selectedCategory: VehicleCategory | null,
  numberOfSeats: number,
  isStrictPreferences: boolean,
  sourceDomain: string,
) => {
  return {
    amount: {
      amount: fareEstimate?.toString() || "0",
      currency: "NGN",
    },
    airport: airportId,
    ...(bookAsGuest || !isAuthenticated
      ? {
          guest_name: passengerData.name,
          guest_email: passengerData.email,
          guest_phone: formatPhoneNumber(passengerData.phone),
        }
      : {}),
    has_extra_leg_room: requirements.elderly,
    has_extra_luggage: requirements.luggage,
    has_wheel_chair_access: requirements.wheelchair,
    pickup_address: pickup,
    pickup_location: pickupCoords,
    destination_address: destination,
    destination_location: destinationCoords,
    // NEW: Booking preferences
    category: selectedCategory,
    number_of_seats: numberOfSeats,
    is_strict_preferences: isStrictPreferences,
    source_domain: sourceDomain,
  };
};