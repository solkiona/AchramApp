export type Requirements = {
  luggage: boolean;
  wheelchair: boolean;
  elderly: boolean;
};


export type PassengerData = {
  name: string;
  phone: string;
  email: string;
};

export type VehicleCategory = 'vip' | 'legacy' | 'e_hailing' | 'smart_ride' | 'ev';

export type BookingData = {
  numberOfSeats: number;
  isStrictPreferences: boolean;
  sourceDomain: string;
  category: VehicleCategory | null;
}