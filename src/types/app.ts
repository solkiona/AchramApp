export type ScreenState =
  | "booking"
  | "assigning"
  | "driver-assigned"
  | "trip-progress"
  | "trip-complete"
  | "dashboard"
  | "signup-prompt"
  | "login-modal"
  | "profile"
  | "settings";

export interface PersistedState {
  screen: ScreenState | null;
  pickup: string;
  destination: string;
  fareEstimate: number | null;
  driver: any | null;
  tripProgress: number;
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  verificationCode: string | null;
  activeTripId: string | null;
  guestId: string | null;
  bookAsGuest: boolean;
}