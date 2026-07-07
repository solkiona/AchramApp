// src/types/fares.ts
export interface FareAmount {
  formatted: string;
  currency: string;
  amount: number;
}

export interface FareCategory {
  label: string; // e.g., "Regular", "VIP"
  value: string; // e.g., "legacy", "vip"
}

export interface FareBreakdown {
  id: string; // THIS IS THE NEW "fare" ID FOR THE PAYLOAD
  amount: FareAmount;
  category: FareCategory;
   is_enabled: boolean;
}

export interface FareDestination {
  id: string;
  name: string;
  search_text: string; // Used for client-side fuzzy matching
  map_data: {
    location: {
      type: string;
      geometry: {
        type: string;
        coordinates: [number, number]; // [lng, lat]
      };
      properties: {
        name: string;
        description: string;
      };
    };
  };
  breakdown: FareBreakdown[];
 
}