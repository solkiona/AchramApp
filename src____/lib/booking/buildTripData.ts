// // src/lib/booking/buildTripData.ts
// import { Requirements, PassengerData, VehicleCategory, BookingData } from "@/types/booking";

// export const buildTripData = (
//   fareEstimate: number | null,
//   pickup: string,
//   destination: string,
//   pickupCoords: [number, number] | null,
//   destinationCoords: [number, number] | null,
//   passengerData: PassengerData,
//   requirements: Requirements,
//   airportId: string,
//   bookAsGuest: boolean,
//   isAuthenticated: boolean,
//   formatPhoneNumber: (input: string) => string,
//   selectedCategory: VehicleCategory | null,
//   numberOfSeats: number,
//   isStrictPreferences: boolean,
//   sourceDomain: string,
// ) => {
//   return {
//     amount: {
//       amount: fareEstimate?.toString() || "0",
//       currency: "NGN",
//     },
//     airport: airportId,
//     ...(bookAsGuest || !isAuthenticated
//       ? {
//           guest_name: passengerData.name,
//           guest_email: passengerData.email,
//           guest_phone: formatPhoneNumber(passengerData.phone),
//         }
//       : {}),
//     has_extra_leg_room: requirements.elderly,
//     has_extra_luggage: requirements.luggage,
//     has_wheel_chair_access: requirements.wheelchair,
//     pickup_address: pickup,
//     pickup_location: pickupCoords,
//     destination_address: destination,
//     destination_location: destinationCoords,
//     // NEW: Booking preferences
//     category: selectedCategory,
//     number_of_seats: numberOfSeats,
//     is_strict_preferences: isStrictPreferences,
//     source_domain: sourceDomain,
//   };
// };


// src/lib/booking/buildTripData.ts
import { Requirements, PassengerData, VehicleCategory } from "@/types/booking";

export interface TripRequestPayload {
  airport: string;
  fare: string; // The breakdown ID from /fares/lookup
  category: VehicleCategory; // e.g., "legacy", "vip"
  pickup_address: string;
  pickup_location: [number, number] | null;
  number_of_seats: number;
  is_strict_preferences: boolean;
  source_domain: string;
  // Guest fields
  guest_name?: string;
  guest_email?: string;
  guest_phone?: string;
  // Requirements
  has_extra_leg_room: boolean;
  has_extra_luggage: boolean;
  has_wheel_chair_access: boolean;
}

export const buildTripData = (
  pickup: string,
  pickupCoords: [number, number] | null,
  passengerData: PassengerData,
  requirements: Requirements,
  airportId: string,
  bookAsGuest: boolean,
  isAuthenticated: boolean,
  formatPhoneNumber: (input: string) => string,
  selectedDestinationFareId: string, // The breakdown ID
  selectedCategory: VehicleCategory,
  numberOfSeats: number,
  isStrictPreferences: boolean,
  sourceDomain: string,
): TripRequestPayload => {
  
  const basePayload: TripRequestPayload = {
    airport: airportId,
    fare: selectedDestinationFareId, // NO MORE amount, destination_address, or destination_location
    category: selectedCategory,
    pickup_address: pickup,
    pickup_location: pickupCoords,
    number_of_seats: numberOfSeats,
    is_strict_preferences: isStrictPreferences,
    source_domain: sourceDomain,
    has_extra_leg_room: requirements.elderly,
    has_extra_luggage: requirements.luggage,
    has_wheel_chair_access: requirements.wheelchair,
  };

  if (bookAsGuest || !isAuthenticated) {
    basePayload.guest_name = passengerData.name;
    basePayload.guest_email = passengerData.email;
    basePayload.guest_phone = formatPhoneNumber(passengerData.phone);
  }

  return basePayload;
};