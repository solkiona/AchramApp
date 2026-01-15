// src/lib/airports.ts
import { apiClient } from '@/services/apiClient';
import { normalizeApiError } from "@/lib/errors/normalizeApiError";

export interface Airport {
  id: string;
  name: string;
  codename: string;
  map_data: any; 
  is_active: boolean; 
}
export const findNearestAirport = async (
  latitude: number,
  longitude: number
): Promise<Airport[] | null> => {
  try {

    // Please not that I had to swap longitude for latitude, this was done for a reason. The api useGeolocation makes use of latitude and longitude, but the backend uses longitude and latitude
    const response = await apiClient.get(`/v1/airports/by-location/?lon=${longitude}&lat=${latitude}`);
    console.log('{latitude, longitude}', {latitude, longitude})
    console.log("API Response for airports by location:", response); 
    if (response.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
      return response.data.data; 
    }
    console.log("No airports found near coordinates:", longitude, latitude); 
    return null;
  } catch (err) {
    console.error('Failed to find airport by location:', err);
    throw new Error(normalizeApiError(err)[0]);
  }
};


export const KNOWN_AIRPORTS: Record<string, string> = {
  'Murtala Muhammed Int\'l Airport (LOS)': '0199de42-10b4-7f53-b670-42f107897a1d',

};