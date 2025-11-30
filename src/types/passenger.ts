// src/types/passenger.ts

export interface Passenger {
  id: string;
  name: string;
  initials: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  profile_photo?: string;
  is_2fa_enabled: boolean;
  verified_at?: string;
  last_login?: string;
  created_at: string;
  updated_at: string;
  profile: {
    status: { label: string; value: string };
    wallet: {
      balance: {
        formatted: string;
        currency: string;
        amount: number;
      };
    };
    active_trip: Trip | null;
  };
}


export interface PassengerAccount {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  is_2fa_enabled: boolean;
  profile?: {
    wallet?: {
      balance: {
        formatted: string;
        amount: number;
        currency: string;
      };
    };
  };
}


export interface Trip {
  id: string;
  amount: Money;
  status: Status;
  pickup_address: string;
  destination_address: string;
  verification_code: string;
  rating: Rating | null;
  map_ MapData;
  driver: Driver | null;
  guest?: Guest;
}

export interface Money {
  formatted: string;
  currency: string;
  amount: number;
}

export interface Status {
  label: string;
  value: string;
}

export interface Rating {
  score: number;
  comment: string;
}

export interface MapData {
  pickup_location: GeoFeature;
  destination_location: GeoFeature;
}

export interface GeoFeature {
  type: 'Feature';
  geometry: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  properties: {
    name: string;
    description: string;
  };
}

export interface Driver {
  id: string;
  name: string;
  details: {
    
    car_type: string;
    car_color: string;
    car_photo?: string;
    plate_number: string;
  }
  profile_photo?: string;
  has_extra_leg_room: boolean;
  has_extra_trunk_space: boolean;
  has_wheel_chair_access: boolean;
  rating: string;
}

export interface Guest {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  expires_at: string;
  url: string;
}

export interface AuthResponse {
  token: string;
}

export interface ApiResponse<T = unknown> {
  status: 'success' | 'error';
  message: string;
   T;
}