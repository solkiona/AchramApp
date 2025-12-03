// // src/lib/airports.ts
// import { apiClient } from '@/services/apiClient';

// export interface Airport {
//   id: string;
//   name: string;
//   codename: string;
//   map_data: any; // or define GeoJSON type if needed
// }

// // Reverse geocode coords → nearest ACHRAMS airport
// export const findNearestAirport = async (
//   longitude: number,
//   latitude: number
// ): Promise<Airport | null> => {
//   try {
//     const response = await apiClient.get(`/v1/airports/by-location/?lon=${longitude}&lat=${latitude}`);
//     if (response.data?.data?.length > 0) {
//       return response.data.data[0]; // assume first is nearest
//     }
//     return null;
//   } catch (err) {
//     console.error('Failed to find airport by location:', err);
//     return null;
//   }
// };

// // Map known airport name → UUID (for when user selects from list)
// export const KNOWN_AIRPORTS: Record<string, string> = {
//   'Murtala Muhammed Int\'l Airport (LOS)': '0199de42-10b4-7f53-b670-42f107897a1d',
//   // Add others as needed from /choices or /airports list
// };


// src/lib/airports.ts
import { apiClient } from '@/services/apiClient';

export interface Airport {
  id: string;
  name: string;
  codename: string;
  map_data: any; // or define GeoJSON type if needed
  is_active: boolean; // Add this based on the API response structure
}

// Reverse geocode coords → nearest ACHRAMS airport(s)
// Returns an array of airports found, or null if none or on error.
export const findNearestAirport = async (
  longitude: number,
  latitude: number
): Promise<Airport[] | null> => {
  try {
    const response = await apiClient.get(`/v1/airports/by-location/?lon=${longitude}&lat=${latitude}`);
    console.log("API Response for airports by location:", response); // Optional: For debugging
    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data; // Return the full array of airports
    }
    console.log("No airports found near coordinates:", longitude, latitude); // Optional: For debugging
    return null;
  } catch (err) {
    console.error('Failed to find airport by location:', err);
    return null;
  }
};

// Map known airport name → UUID (for when user selects from list)
export const KNOWN_AIRPORTS: Record<string, string> = {
  'Murtala Muhammed Int\'l Airport (LOS)': '0199de42-10b4-7f53-b670-42f107897a1d',
  // Add others as needed from /choices or /airports list
};