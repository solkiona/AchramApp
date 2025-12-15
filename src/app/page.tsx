"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import BookingScreen from "@/components/app/screens/BookingScreen";
import AssigningScreen from "@/components/app/screens/AssigningScreen";
import DriverAssignedScreen from "@/components/app/screens/DriverAssignedScreen";
import TripProgressScreen from "@/components/app/screens/TripProgressScreen";
import TripCompleteScreen from "@/components/app/screens/TripCompleteScreen";
import TripHistoryScreen from "@/components/app/screens/TripHistoryScreen";
import TripDetailsScreen from "@/components/app/screens/TripDetailsScreen";
import WalletScreen from "@/components/app/screens/WalletScreen";
import SettingsScreen from "@/components/app/screens/SettingsScreen";
import DashboardScreen from "@/components/app/screens/DashboardScreen";
import dynamic from "next/dynamic";
const DirectionsModal = dynamic(
  () => import("@/components/app/modals/DirectionsModal"),
  { ssr: false }
);
import PassengerDetailsModal from "@/components/app/modals/PassengerDetailsModal";
import PanicModal from "@/components/app/modals/PanicModal";
import SignupPromptModal from "@/components/app/modals/SignupPromptModal";
import OTPModal from "@/components/app/modals/OTPModal";
import ProfileModal from "@/components/app/modals/ProfileModal";
import CancelModal from "@/components/app/modals/CancelModal";
import RateModal from "@/components/app/modals/RateModal";
import MessageWindowModal from "@/components/app/modals/MessageWindowModal";
import TripRequestStatusModal from "@/components/app/modals/TripRequestStatusModal";
import DriverVerificationModal from "@/components/app/modals/DriverVerificationModal";
import LoginModal from "@/components/app/modals/LoginModal";
import Enable2FAModal from "@/components/app/modals/Enable2FAModal";
import Disable2FAModal from "@/components/app/modals/Disable2FAModal";
import UpdateProfileModal from "@/components/app/modals/UpdateProfileModal";
import Image from "next/image";
import { apiClient } from "@/lib/api";
import TripUpdateNotification from "@/components/app/ui/TripUpdateNotification";
import BottomNavBar from "@/components/app/ui/BottomNavBar";
import { findNearestAirport, KNOWN_AIRPORTS } from "@/lib/airports";
import ReconnectingWebSocket from "reconnecting-websocket";
import { useJsApiLoader } from "@react-google-maps/api";

type TripStatusValue =
  | "searching"
  | "driver_assigned"
  | "accepted"
  | "active"
  | "completed"
  | "cancelled"
  | "driver not found";

type TripStatus = {
  label: string;
  value: TripStatusValue;
};

type WebSocketMessage = {
  event: "trip:assigned" | "trip:status:update" | string;
  data: any;
};

type ScreenState =
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

type Requirements = {
  luggage: boolean;
  wheelchair: boolean;
  elderly: boolean;
};

type PassengerData = {
  name: string;
  phone: string;
  email: string;
};

interface PersistedState {
  screen: ScreenState;
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

const saveAppState = (state: PersistedState) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem("achrams_app_state", JSON.stringify(state));
      console.log("App state saved to sessionStorage", state);
    } catch (e) {
      console.error("Failed to save app state to sessionStorage", e);
    }
  }
};

const loadAppState = (): PersistedState | null => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const savedStateStr = sessionStorage.getItem("achrams_app_state");
      if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr) as PersistedState;
        console.log("App state loaded from sessionStorage", savedState);
        return savedState;
      }
    } catch (e) {
      console.error("Failed to load app state from sessionStorage", e);
    }
  }
  return null;
};

export default function ACHRAMApp() {
  const { token, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [hasHydrated, setHasHydrated] = useState(false);
  const [screen, setScreen] = useState<ScreenState | null>(null);
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [fareIsFlatRate, setFareIsFlatRate] = useState<boolean | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [tripProgress, setTripProgress] = useState<number>(0);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(
    null
  );
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(
    null
  );
  const [pickupCodename, setPickupCodename] = useState<string | undefined>(
    undefined
  );
  const [destinationCoords, setDestinationCoords] = useState<
    [number, number] | null
  >(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [webSocketConnection, setWebSocketConnection] =
    useState<ReconnectingWebSocket | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<
    "connecting" | "open" | "closed" | "reconnecting"
  >("closed");
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);
  const [bookAsGuest, setBookAsGuest] = useState(false);
  const activeTripIdRef = useRef(activeTripId);
  const activeGuestIdRef = useRef(guestId);
  const screenRef = useRef(screen);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  // const pollingIntervalIdRef = useRef(pollingIntervalId);

  useEffect(() => {
    activeTripIdRef.current = activeTripId;
  }, [activeTripId]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    pollingIntervalRef.current = pollingIntervalId;
  }, [pollingIntervalId]);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showPanic, setShowPanic] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [signupDataForOtp, setSignupDataForOtp] =
    useState<PassengerData | null>(null);
  const [signupPasswordForOtp, setSignupPasswordForOtp] = useState<string>("");
  const [initialOtpCountdown, setInitialOtpCountdown] = useState<number>(0);
  const [showProfile, setShowProfile] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showTripHistory, setShowTripHistory] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEnable2FA, setShowEnable2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [tripRequestStatus, setTripRequestStatus] = useState<
    "loading" | "accepted" | "no-driver" | "error" | null
  >(null);
  const [tripRequestError, setTripRequestError] = useState<string | null>(null);
  const [showDriverVerification, setShowDriverVerification] = useState(false);
  const [resetBookingKey, setResetBookingKey] = useState(0);
  const [currentNotification, setCurrentNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);
  const [pickupId, setPickupId] = useState<string | null>(null);

  // New state for initialization status
  const [initComplete, setInitComplete] = useState(false);

  // Refs for current state
  const currentAuthStatusRef = useRef(isAuthenticated);
  const currentTokenRef = useRef(token);

  useEffect(() => {
    currentAuthStatusRef.current = isAuthenticated;
    currentTokenRef.current = token;
  }, [isAuthenticated, token]);

  const preserveBookingContext = () => {
    console.log("Clearing trip data but preserving booking context for retry");
    console.log(
      "Inside preserve booking context, I am setting guest Id to null"
    );

    setActiveTripId(null);
    setGuestId(null);
    setDriver(null);
    setVerificationCode(null);
    setTripProgress(0);
    setFareEstimate(null);

    if (typeof window !== "undefined" && window.sessionStorage) {
      const currentState = loadAppState();
      if (currentState) {
        saveAppState({
          ...currentState,
          activeTripId: null,
          guestId: null,
          driver: null,
          verificationCode: null,
          tripProgress: 0,
          screen: "booking", // ✅ Go back to booking screen
        });
      }
    }

    setScreen("booking"); // ✅ Show booking screen
  };


  const initializeAppState = useCallback(async () => {
  if (!hasHydrated || isAuthLoading) {
    console.log("initializeAppState: Waiting for hydration or auth loading to complete.");
    return;
  }

  console.log("Initializing app state after hydration and auth check...");

  // Load persisted state (includes screen, trip data, guestId, activeTripId, bookAsGuest flag)
  const savedState = loadAppState();

  // Load persisted trip data (pickup, destination, passenger details, requirements)
  const savedTripDataStr = sessionStorage.getItem("tripData");
  let savedTripData = null;
  if (savedTripDataStr) {
    try {
      savedTripData = JSON.parse(savedTripDataStr);
      console.log("Restored tripData from sessionStorage:", savedTripData);
    } catch (e) {
      console.error("Failed to parse tripData from sessionStorage:", e);
      // Optionally clear corrupted data
      sessionStorage.removeItem("tripData");
    }
  }

  // --- Restore State from savedTripData (if available) ---
  if (savedTripData) {
    setPickup(savedTripData.pickup_address || "");
    setDestination(savedTripData.destination_address || "");
    setFareEstimate(parseFloat(savedTripData.amount?.amount) || null);
    setPickupCoords(savedTripData.pickup_location || null);
    setDestinationCoords(savedTripData.destination_location || null);
    setRequirements({
      luggage: savedTripData.has_extra_luggage || false,
      wheelchair: savedTripData.has_wheel_chair_access || false,
      elderly: savedTripData.has_extra_leg_room || false,
    });
    // Only restore passenger data if it's present in the saved data (relevant for guest/booking-as-guest)
    if (savedTripData.guest_name || savedTripData.guest_email || savedTripData.guest_phone) {
      setPassengerData({
        name: savedTripData.guest_name || passengerData.name, // Fallback to existing state
        phone: savedTripData.guest_phone || passengerData.phone,
        email: savedTripData.guest_email || passengerData.email,
      });
    }
  }

  // --- Determine Booking Mode and Restore Session --- 
  if (savedState) {
    // Restore the booking mode flag from the saved state
    setBookAsGuest(savedState.bookAsGuest || false);

    // Scenario 1: Authenticated User with Active Trip
    if (isAuthenticated) {
      console.log("User is authenticated, checking for stored active trip ID...");
      if (savedState.activeTripId) {
        console.log("Found stored active trip ID for authenticated user:", savedState.activeTripId);
        setActiveTripId(savedState.activeTripId);

        try {
          // Determine the correct API call based on the saved booking mode (bookAsGuest flag)
          let response;
          if (savedState.bookAsGuest) {
            console.log("Initializing as authenticated user who booked as guest. Fetching trip via guest endpoint with guestId:", savedState.guestId);

            setGuestId(savedState.guestId || null);

             // Ensure guest ID is cleared for authenticated users (unless they booked as guest)
            if (!savedState.guestId) {
              throw new Error("bookAsGuest is true but guestId is missing from saved state.");
            }
            // Use guest endpoint with guestId, but isGuest=true flag
            response = await apiClient.get(
              `/trips/${savedState.guestId}`, // Use guestId to identify the trip session
              undefined, // token (not directly used for guest calls, cookie handles auth if needed, but guestId takes precedence here)
              true,      // isGuest = true (CRITICAL: Uses X-Guest-Id header)
              savedState.guestId // guestId (CRITICAL: Passed as the guest identifier)
            );
          } else {

            setGuestId(null)

            console.log("Initializing as authenticated user who booked normally. Fetching trip via auth endpoint with tripId:", savedState.activeTripId);
            // Use authenticated endpoint with tripId, isAuthRequest=true flag
            response = await apiClient.get(
              `/trips/${savedState.activeTripId}`, // Use the specific tripId
              undefined,      // token (not directly needed, cookie handles auth)
              false,          // isGuest = false
              undefined,      // guestId (not needed for auth)
              true            // isAuthRequest = true (CRITICAL: enables cookie)
            );
          }

          if (response.status === "success" && response.data) {
            const trip = response.data;
            console.log("Fetched trip status for user (booked as guest?", !!savedState.bookAsGuest, "):", trip);
            
            // Set up trip state based on fetched data (common for both modes)
            setDriver(trip.driver || null);
            setPickup(trip.pickup_address || "");
            
            console.log("Setting Pickup address: ", pickup,destinationCoords, verificationCode, trip.pickup_address)
            setDestination(trip.destination_address || "");
            setFareEstimate(trip.amount?.amount ? parseFloat(trip.amount.amount) : null);
            setPickupCoords(trip.map_data.pickup_location.geometry.coordinates || null);
            console.log("Pickup coords", pickupCoords)
            setDestinationCoords(trip.map_data.destination_location.geometry.coordinates|| null);
            setVerificationCode(trip.verification_code || null);
            setTripProgress(trip.progress || 0);

            // Determine screen based on fetched trip status (common logic)


             if (savedState.bookAsGuest && savedState.guestId && savedState.activeTripId) {
                 console.log("Resuming WebSocket for authenticated user who booked as guest.");
                 startWebSocketConnection(savedState.guestId, savedState.activeTripId); // Use guest connection logic
              } else if (savedState.activeTripId) { // For normal auth booking
                 console.log("Resuming WebSocket for authenticated user who booked normally.");
                 startWebSocketConnectionForAuthUser(savedState.activeTripId); // Use auth connection logic
              }

            if (["searching"].includes(trip.status.value)) {
              setScreen("assigning");
              // Start WebSocket based on the booking mode stored in savedState
             
            }  else if (trip.status.value === "accepted"){
              console.log("Resuming WebSocket for authenticated user who booked normally.");
              // startWebSocketConnectionForAuthUser(savedState.activeTripId);
              setScreen("driver-assigned");
            }
            else if (trip.status.value === "driver not found"){
              console.log('Setting screen to assigning due to driver not found.');
                setScreen("assigning"); // Or maybe "booking"? Depends on UX
                stopWebSocketConnection();
                stopPollingTripStatus();
                setTripRequestStatus("no-driver");
                setTripRequestError(`No drivers available for your trip.`);
            }
            else if (trip.status.value === "active") {
              // console.log("Resuming WebSocket for authenticated user who booked normally.");
              // startWebSocketConnectionForAuthUser(savedState.activeTripId);
              setScreen("trip-progress");
            } else if (trip.status.value === "completed") {
              setScreen("trip-complete");
            } else if (trip.status.value === "cancelled") {
              console.log("Stored trip was cancelled, clearing ID and going to dashboard.");
              setActiveTripId(null);
              if (typeof window !== "undefined" && window.sessionStorage) {
                  // Clear trip-specific data
                  sessionStorage.removeItem("tripData");
                  // Optionally clear general app state if trip completion means session end
                  // saveAppState({ ...savedState, activeTripId: null, guestId: null, screen: "dashboard" });
              }
              setScreen("dashboard");
            } else {
              console.warn("Unexpected trip status for user (booked as guest?", !!savedState.bookAsGuest, "):", trip.status);
              setScreen("dashboard"); // Default fallback
            }
          } else {
            console.error("Error or trip not found when fetching user's trip (booked as guest?", !!savedState.bookAsGuest, "):", response);
            // Clear the stored trip ID as it's no longer valid
            setActiveTripId(null);
            sessionStorage.removeItem("tripData");
            setScreen("dashboard");
          }
        } catch (error) {
          console.error("Error fetching user's trip status (booked as guest?", !!savedState.bookAsGuest, "):", error);
          setActiveTripId(null);
          sessionStorage.removeItem("tripData");
          setScreen("dashboard");
        }
      } else {
        // No stored active trip ID for authenticated user, go to dashboard
        console.log("No stored active trip ID for authenticated user, going to dashboard...");
        setScreen("dashboard");
      }
     

    } else { // Scenario 2 & 3: Guest User (including authenticated user who booked as guest)
      console.log("User is not authenticated OR was booking as guest, restoring guest session...");
      console.log('Guest ID from session:', savedState.guestId);

      // Check if the guest has an active trip in progress using guestId endpoint
      if (savedState.guestId) {
        console.log("Attempting to verify guest trip status for guest ID:", savedState.guestId);
        try {
          // Use the guest-specific endpoint: /trips/{guestId}
          const response = await apiClient.get(
            `/trips/${savedState.guestId}`, // Use guestId for guest status check
            undefined, // token (not needed for guest flow)
            true,      // isGuest = true (CRITICAL: Uses X-Guest-Id header)
            savedState.guestId // guestId (CRITICAL: Passed as the guest identifier)
          );

          if (response.status === "success" && response.data) {
            const trip = response.data;
            console.log('Guest trip status fetch was successful: ', response.data);

            // Update activeTripId from the fetched trip data (in case it changed or was set during booking)
            setActiveTripId(trip.id);
            // Ensure guestId is set from the saved state
            setGuestId(savedState.guestId);

            // Set up trip state based on fetched data (common for guest modes)
            setDriver(trip.driver || null);
            setPickup(trip.pickup_address || "");
            setDestination(trip.destination_address || "");
            setFareEstimate(trip.amount?.amount ? parseFloat(trip.amount.amount) : null);
            console.log('setting pickupcoords from refresh request', trip.pickup_location)
            setPickupCoords(trip.map_data.pickup_location.geometry.coordinates || null);
            console.log("Pickup coords", pickupCoords)
            setDestinationCoords(trip.map_data.destination_location.geometry.coordinates|| null);
            setVerificationCode(trip.verification_code || null);
            setTripProgress(trip.progress || 0);

            // Determine screen based on fetched trip status (common logic for guest modes)
             if (trip.status.value === "searching") {
                setScreen("assigning");
                startWebSocketConnection(savedState.guestId, trip.id); // Start guest WebSocket
              } else if (trip.status.value === "driver not found") {
                console.log('Setting screen to assigning due to driver not found.');
                setScreen("assigning"); // Or maybe "booking"? Depends on UX
                stopWebSocketConnection();
                stopPollingTripStatus();
                setTripRequestStatus("no-driver");
                setTripRequestError(`No drivers available for your trip.`);
                // Consider preserving booking context if needed
                // preserveBookingContext();
              } else if (["accepted", "driver_assigned"].includes(trip.status.value)) {
                setScreen("driver-assigned");
                startWebSocketConnection(savedState.guestId, trip.id); // Start guest WebSocket
              } else if (trip.status.value === "active") {
                setScreen("trip-progress");
                startWebSocketConnection(savedState.guestId, trip.id); // Start guest WebSocket
              } else if (trip.status.value === "completed") {
                setScreen("trip-complete");
                // Optional: preserveBookingContext(); // If relevant after completion
              } else if (trip.status.value === "cancelled") {
                // Clear storage and go back to booking
                preserveBookingContext(); // This function should clear trip IDs and guest ID
              } else {
                // Unknown status, go to dashboard
                console.log("Setting screen to dashboard due to unknown trip status.");
                setScreen("dashboard");
              }
          } else {
            // Trip not found or error for guest
            console.log("Trip not found or error for guest ID, going to booking. Response:", response);
            setScreen("booking");
            preserveBookingContext(); // Clear trip IDs and guest ID
          }
        } catch (error) {
          console.error("Error verifying guest trip status:", error);
          setScreen("booking");
          preserveBookingContext(); // Clear trip IDs and guest ID
        }
      } else {
        // No active trip ID or guest ID in storage for guest mode
        console.log("No stored guest trip data, going to booking");
        setScreen("booking");
      }
    }
  } else { // Scenario 4: No saved state at all
    // No saved state, go to booking or dashboard based on auth status
    console.log("No saved state found.");
    if (isAuthenticated) {
      console.log("user is authenticated, so let us take him to dashboard")
      setScreen("dashboard");
    } else {
      setScreen("booking");
    }
    // Reset bookAsGuest flag if there's no saved state indicating it was set
    setBookAsGuest(false);
  }

  // Mark initialization as complete
  setInitComplete(true);

}, [hasHydrated, isAuthLoading, isAuthenticated, token]); // Dependency array

  // Function to initialize the app state after hydration
  // const initializeAppState = useCallback(async () => {
  //   // Wait for both hydration AND auth status loading to complete
  //   if (!hasHydrated || isAuthLoading) {
  //     console.log(
  //       "initializeAppState: Waiting for hydration or auth loading to complete."
  //     );
  //     return;
  //   }

  //   console.log("Initializing app state after hydration and auth check...");

  //   // Load persisted state
  //   const savedState = loadAppState();

  //   const savedTripData = sessionStorage.getItem("tripData");
  //   if (savedTripData) {
  //     const parsedTripData = JSON.parse(savedTripData);
  //     console.log("Restored tripData from sessionStorage:", parsedTripData);

  //     // Restore tripData into state
  //     setPickup(parsedTripData.pickup_address);
  //     setDestination(parsedTripData.destination_address);
  //     setFareEstimate(parseFloat(parsedTripData.amount.amount));
  //     setPickupCoords(parsedTripData.pickup_location);
  //     setDestinationCoords(parsedTripData.destination_location);
  //     setRequirements({
  //       luggage: parsedTripData.has_extra_luggage,
  //       wheelchair: parsedTripData.has_wheel_chair_access,
  //       elderly: parsedTripData.has_extra_leg_room,
  //     });
  //     setPassengerData({
  //       name: parsedTripData.guest_name,
  //       phone: parsedTripData.guest_phone,
  //       email: parsedTripData.guest_email,
  //     });

  //     // If the user was on the "assigning" screen, restore the screen state
  //     if (savedState && savedState.screen === "assigning") {
  //       setScreen("assigning");
  //       setTripRequestStatus("loading");

  //       // Start WebSocket or polling based on the trip status
  //       if (isAuthenticated && savedState.activeTripId) {
  //         console.log(
  //           "Resuming WebSocket connection for authenticated user..."
  //         );
  //         startWebSocketConnectionForAuthUser(savedState.activeTripId);
  //       } else if (savedState.guestId && savedState.activeTripId) {
  //         console.log("Resuming WebSocket connection for guest user...");
  //         startWebSocketConnection(savedState.guestId, savedState.activeTripId);
  //       } else {
  //         console.warn(
  //           "No active trip ID or guest ID found, cannot resume WebSocket."
  //         );
  //       }
  //     }
  //   }

  //   if (isAuthenticated) {
  //     // Authenticated user flow
  //     console.log(
  //       "User is authenticated, checking for stored active trip ID..."
  //     );

  //     // Check if there's a stored active trip ID for the authenticated user
  //     // NOTE: For authenticated users, ideally, the backend session tracks active trips,
  //     // but we can still check frontend storage if it was set during a previous authenticated session.
  //     // However, clearing storage on login/logout is often preferred for auth users.
  //     // Let's assume for now that if an authenticated user refreshes mid-trip,
  //     // the activeTripId might be in storage (though this requires careful coordination during login).
  //     // For simplicity and security, let's assume the backend state (via cookie) is the source of truth,
  //     // and we don't store trip IDs for auth users persistently unless explicitly needed for resume.
  //     // If the user was mid-trip and refreshed, the backend session should ideally indicate this.
  //     // For now, let's stick to checking storage, but acknowledge it might be cleared on login in AuthContext.
  //     // The key is that `isAuthenticated` is true here, so we use the authenticated API endpoint.

  //     // Let's check if storage *was* loaded *and* contained an activeTripId
  //     if (savedState && savedState.activeTripId) {
  //       console.log(
  //         "Found stored active trip ID for authenticated user:",
  //         savedState.activeTripId
  //       );
  //       setActiveTripId(savedState.activeTripId); // Restore the active trip ID from storage
  //       setBookAsGuest(savedState.bookAsGuest || false);

  //       try {
  //         // Fetch the status of the specific trip ID using the authenticated endpoint
  //         const response = await apiClient.get(
  //           `/trips/${savedState.activeTripId}`, // Use the specific tripId
  //           undefined, // token (not directly needed, cookie handles auth)
  //           false, // isGuest = false
  //           undefined, // guestId (not needed for auth)
  //           true // isAuthRequest = true (CRITICAL: enables cookie)
  //         );

  //         if (response.status === "success" && response.data) {
  //           const trip = response.data;
  //           console.log("Fetched trip status for authenticated user:", trip);

  //           // Set up trip state based on fetched data
  //           setDriver(trip.driver || null);
  //           setPickup(trip.pickup_address || "");
  //           setDestination(trip.destination_address || "");
  //           setFareEstimate(
  //             trip.amount?.amount ? parseFloat(trip.amount.amount) : null
  //           );
  //           setPickupCoords(trip.pickup_location || null);
  //           setDestinationCoords(trip.destination_location || null);
  //           setVerificationCode(trip.verification_code || null);
  //           setTripProgress(trip.progress || 0); // Ensure tripProgress is updated

  //           // Determine screen based on fetched trip status
  //           if (
  //             ["searching", "driver_assigned", "accepted"].includes(
  //               trip.status.value
  //             )
  //           ) {
  //             setScreen("assigning");
  //             // Start WebSocket for authenticated user using the specific tripId
  //             startWebSocketConnectionForAuthUser(savedState.activeTripId);
  //           } else if (trip.status.value === "active") {
  //             setScreen("trip-progress");
  //           } else if (trip.status.value === "completed") {
  //             setScreen("trip-complete");
  //             //  preserveBookingContext()
  //           } else if (trip.status.value === "cancelled") {
  //             // Trip was cancelled, clear the stored ID and go to booking/dashboard
  //             console.log(
  //               "Stored trip was cancelled, clearing ID and going to dashboard."
  //             );
  //             setActiveTripId(null);
  //             // Optionally clear storage if this trip completion means session end for this trip

  //             sessionStorage.removeItem("tripData");

  //             if (typeof window !== "undefined" && window.sessionStorage) {
  //               const stateToKeep = { ...savedState, activeTripId: null }; // Keep other state but clear trip ID
  //               saveAppState(stateToKeep);
  //             }
  //             console.log("setting screen to dashboard one");
  //             setScreen("dashboard");
  //           } else {
  //             // Unknown or unexpected status, maybe go to dashboard
  //             console.warn(
  //               "Unexpected trip status for authenticated user:",
  //               trip.status
  //             );
  //             console.log("setting screen to dashboard two");

  //             setScreen("dashboard");
  //           }
  //         } else {
  //           // Trip not found or error response
  //           console.error(
  //             "Error or trip not found when fetching authenticated user's trip:",
  //             response
  //           );
  //           // Clear the stored trip ID as it's no longer valid
  //           setActiveTripId(null);
  //           sessionStorage.removeItem("tripData");
  //           // Optionally clear storage if this trip completion means session end for this trip
  //           if (typeof window !== "undefined" && window.sessionStorage) {
  //             const stateToKeep = { ...savedState, activeTripId: null }; // Keep other state but clear trip ID
  //             saveAppState(stateToKeep);
  //           }
  //           console.log("setting screen to dashboard three");
  //           setScreen("dashboard");
  //         }
  //       } catch (error) {
  //         console.error(
  //           "Error fetching authenticated user's trip status:",
  //           error
  //         );
  //         // Clear the stored trip ID as it might be invalid
  //         setActiveTripId(null);
  //         sessionStorage.removeItem("tripData");
  //         // Optionally clear storage if this trip completion means session end for this trip
  //         if (typeof window !== "undefined" && window.sessionStorage) {
  //           const stateToKeep = { ...savedState, activeTripId: null }; // Keep other state but clear trip ID
  //           saveAppState(stateToKeep);
  //         }
  //         console.log("setting screen to dashboard four");
  //         setScreen("dashboard");
  //       }
  //     } else {
  //       // No stored active trip ID for authenticated user, go to dashboard
  //       console.log(
  //         "No stored active trip ID for authenticated user, going to dashboard..."
  //       );
  //       setScreen("dashboard");
  //     }
  //     // Clear guest ID for authenticated users (shouldn't be set, but just in case)
  //     setGuestId(null);
  //   } else {
  //     // Guest user flow (remains as previously corrected)
  //     console.log("User is not authenticated, restoring guest session...");
  //     console.log("guest id from session", savedState?.guestId);

  //     if (savedState) {
  //       console.log("Navigating to saved screen state ", savedState.screen);

  //       console.log("savedstate pickupaddress", savedState.pickup);
  //       // Restore guest session data
  //       //setScreen(savedState.screen);
  //       // setPickup(savedState.pickup || "");
  //       // setDestination(savedState.destination || "");
  //       // setFareEstimate(savedState.fareEstimate || null);
  //       // setTripProgress(savedState.tripProgress || 0);
  //       // setPickupCoords(savedState.pickupCoords || null);
  //       // setDestinationCoords(savedState.destinationCoords || null);
  //       // setVerificationCode(savedState.verificationCode || null);

  //       // setActiveTripId(savedState.activeTripId || null);
  //       // setGuestId(savedState.guestId || null);

  //       // Check if the guest has an active trip in progress using guestId endpoint
  //       if (savedState.guestId) {
  //         console.log("A guest id exits", savedState.guestId);
  //         try {
  //           // Use the guest-specific endpoint: /trips/{guestId}
  //           const response = await apiClient.get(
  //             `/trips/${savedState.guestId}`, // Use guestId for guest status check
  //             undefined, // token (not needed for guest flow)
  //             true, // isGuest = true
  //             savedState.guestId // guestId
  //           );

  //           if (response.status === "success" && response.data) {
  //             const trip = response.data;
  //             // Update activeTripId from the fetched trip data (in case it changed)
  //             setActiveTripId(trip.id);
  //             // Start WebSocket for guest user using guestId
  //             startWebSocketConnection(savedState.guestId, trip.id);

  //             console.log(
  //               "Guest Data retrieved to verify why I am getting a reference error",
  //               response.data
  //             );

  //             setGuestId(savedState.guestId);
  //             setDriver(trip.driver || null);
  //             setPickup(trip.pickup_address || "");
  //             setDestination(trip.destination_address || "");
  //             setFareEstimate(
  //               trip.amount?.amount ? parseFloat(trip.amount.amount) : null
  //             );
  //             setPickupCoords(trip.pickup_location || null);
  //             setDestinationCoords(trip.destination_location || null);
  //             setVerificationCode(trip.verification_code || null);
  //             setTripProgress(trip.progress || 0); // Ensure
  //             console.log("Active trip Id reset", trip.id, activeTripId);
  //             console.log("Pickup address now ", pickup);
  //             console.log("pickup location", pickupCoords);

  //             console.log("Trip status fetch was sucessful: ", response.data);

  //             if (trip.status.value === "searching") {
  //               setScreen("assigning");
  //             } else if (trip.status.value === "driver not found") {
  //               console.log("setting screen to assigning");

  //               stopWebSocketConnection();
  //               stopPollingTripStatus();
  //               setTripRequestStatus("no-driver");
  //               setTripRequestError(`No drivers available for your trip.`);
  //               // setScreen("assigning");

  //               preserveBookingContext();
  //             } else if (trip.status.value === "accepted") {
  //               //setDriver(trip.driver);
  //               console.log("Active Trip Id: ", activeTripId);
  //               setScreen("driver-assigned");
  //               // stopPollingTripStatus();
  //               console.log("stopPollingTripStatus was just called");
  //             } else if (trip.status.value === "active") {
  //               console.log(
  //                 "trip status is active setting screen to trip-progress, active trip id is: ",
  //                 activeTripId
  //               );
  //               //setDriver(trip.driver);
  //               setScreen("trip-progress");
  //             } else if (trip.status.value === "completed") {
  //               setScreen("trip-complete");
  //               // preserveBookingContext();
  //             } else if (trip.status.value === "cancelled") {
  //               // Clear storage and go back to booking
  //               preserveBookingContext();
  //             } else {
  //               // Unknown status, go to dashboard
  //               console.log("setting screen to dashboard five");
  //               setScreen("dashboard");
  //             }
  //           } else {
  //             // Trip not found or error, clear storage and go to booking
  //             console.log("Trip not found for guest, going to booking");
  //             setScreen("booking");
  //             preserveBookingContext();
  //           }
  //         } catch (error) {
  //           console.error("Error verifying guest trip status:", error);
  //           setScreen("booking");
  //           preserveBookingContext();
  //         }
  //       } else {
  //         // No active trip ID or guest ID in storage, go to booking
  //         console.log("No stored guest trip data, going to booking");
  //         setScreen("booking");
  //       }
  //     } else {
  //       // No saved state, go to booking
  //       console.log("No saved state found, going to booking");
  //       setScreen("booking");
  //     }
  //   }

  //   setInitComplete(true);
  // }, [hasHydrated, isAuthLoading, isAuthenticated, token]); // Add isAuthLoading to dependency

  // Initialize app state after hydration AND auth loading is complete
  useEffect(() => {
    // This effect now runs when hydration or auth loading state changes
    // It will call initializeAppState which checks both flags internally
    initializeAppState();
  }, [initializeAppState]); // Depend only on the function itself

  // // Initialize app state after hydration
  // useEffect(() => {
  //   if (hasHydrated && !initComplete) {
  //     initializeAppState();
  //   }
  // }, [hasHydrated, initComplete, initializeAppState]);

  // Hydration effect
  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasHydrated(true);
    }
  }, []);

  // Fetch user profile when authenticated
  useEffect(() => {
    if (hasHydrated && token) {
      const fetchUserProfile = async () => {
        try {
          setTimeout(() => {
            setWalletBalance(5000);
            setIs2FAEnabled(false);
          }, 500);
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          setCurrentNotification({
            message: "Failed to load profile data.",
            type: "error",
          });
          setTimeout(() => setCurrentNotification(null), 5000);
        }
      };
      fetchUserProfile();
    }
  }, [hasHydrated, token]);

  // Handle trip completion
  useEffect(() => {
    if (screen === "trip-complete") {
      if (isAuthenticated) {
        // Authenticated user completes trip
        console.log("user is authenticated no need to prompt signup")
      } else {
        const timer = setTimeout(() => {
          setShowSignup(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [screen]);

  const [passengerData, setPassengerData] = useState<PassengerData>({
    name: "",
    phone: "",
    email: "",
  });

  const [requirements, setRequirements] = useState<Requirements>({
    luggage: false,
    wheelchair: false,
    elderly: false,
  });

  const showNotification = (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => {
    setCurrentNotification({ message, type });
    setTimeout(() => {
      setCurrentNotification(null);
    }, 5000);
  };

  useEffect(() => {
    if (screen === "driver-assigned" && driver) {
      showNotification("Driver assigned successfully!", "success");
      const timer1 = setTimeout(
        () => showNotification("Driver is 7 mins from pickup location", "info"),
        3000
      );
      const timer2 = setTimeout(
        () =>
          showNotification("Driver has arrived at pickup location", "success"),
        10000
      );
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [screen, driver]);

  // Save app state whenever it changes (only after hydration)
  useEffect(() => {
    if (hasHydrated && screen !== null) {
      const stateToSave: PersistedState = {
        screen,
        pickup,
        destination,
        fareEstimate,
        driver,
        tripProgress,
        pickupCoords,
        destinationCoords,
        verificationCode,
        activeTripId,
        guestId,
        bookAsGuest,
      };
      saveAppState(stateToSave);
    }
  }, [
    screen,
    pickup,
    destination,
    fareEstimate,
    driver,
    tripProgress,
    pickupCoords,
    destinationCoords,
    verificationCode,
    activeTripId,
    guestId,
    bookAsGuest,
    hasHydrated,
  ]);

  const handleRegistrationSuccess = (email: string) => {
    console.log("setting screen to dashboard six");
    setScreen("dashboard");
    setShowSignup(false);
  };

  const handleLoginSuccess = () => {
    console.log(
      "login successful, Authcontext should update. Screen will update via useEffect"
    );
    showNotification("Welcome Back!", "success");
  };

  const handleLogoutSuccess = () => {
    console.log(
      "Logout successful, Authcontext should update. Screen will update via useEffect"
    );
    showNotification("You have been logged out.", "info");

    preserveBookingContext();
  };

  const handle2FAEnabled = () => {
    setIs2FAEnabled(true);
    setShowEnable2FA(false);
    showNotification(
      "Two-factor authentication enabled successfully!",
      "success"
    );
  };

  const handle2FADisabled = () => {
    setIs2FAEnabled(false);
    setShowDisable2FA(false);
    showNotification("Two-factor authentication disabled.", "info");
  };

  const handleProfileUpdated = (updatedData: any) => {
    setPassengerData(updatedData);
    setShowUpdateProfile(false);
    showNotification("Profile updated successfully!", "success");
  };

  const handleProceed = () => {
    if (fareEstimate && pickup && destination) {
      setShowPassengerDetails(true);
    }
  };

  const formatPhoneNumber = (input: string): string => {
    const digitsOnly = input.replace(/\D/g, "");
    if (digitsOnly.startsWith("0")) {
      return `+234${digitsOnly.slice(1)}`;
    }
    if (digitsOnly.startsWith("234")) {
      return `+${digitsOnly}`;
    }
    if (digitsOnly.startsWith("+")) {
      return digitsOnly;
    }
    if (digitsOnly.length === 11) {
      return `+234${digitsOnly.slice(1)}`;
    }
    return digitsOnly;
  };

  const handleRequestRide = async () => {
   

    // Check if tripData exists in sessionStorage
    let tripData: any = null;
    if (typeof window !== "undefined" && window.sessionStorage) {
      const savedTripData = sessionStorage.getItem("tripData");
      if (savedTripData) {
        tripData = JSON.parse(savedTripData);
        console.log("Using existing tripData from sessionStorage:", tripData);
      }
    }

    // If tripData exists, skip validation and use it directly
    if (!tripData) {
      // Validate passenger details
      if (bookAsGuest || !isAuthenticated) {
        if (
          !passengerData.name ||
          !passengerData.phone ||
          !passengerData.email
        ) {
          showNotification("Please fill all passenger details.", "error");
          return;
        }
      }

      // Validate pickup and destination locations
      if (!pickupCoords || !destinationCoords) {
        showNotification(
          "Pickup and destination locations are required.",
          "error"
        );
        return;
      }

      // Build tripData if it doesn't exist in sessionStorage
      let airportId: string | null = null;
      if (pickup.startsWith("Use my current location")) {
        const nearestAirports = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearestAirports || !nearestAirports.length) {
          setTripRequestStatus("error");
          setTripRequestError(
            "You're outside our service area. Booking not available from this location."
          );
          return;
        }
        const selectedAirport = nearestAirports.find(
          (apt) => apt.name === pickup
        );
        if (!selectedAirport) {
          console.error(
            "Selected pickup name does not match any fetched airport:",
            pickup,
            nearestAirports
          );
          setTripRequestStatus("error");
          setTripRequestError(
            "Could not confirm selected pickup location. Please try again."
          );
          return;
        }
        airportId = selectedAirport.id;
      } else if (pickup in KNOWN_AIRPORTS) {
        airportId = KNOWN_AIRPORTS[pickup];
      } else {
        const nearestAirports = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearestAirports || !nearestAirports.length) {
          setTripRequestStatus("error");
          setTripRequestError(
            "Pickup location is not near a supported airport."
          );
          return;
        }
        const selectedAirport = nearestAirports.find(
          (apt) => apt.name === pickup
        );
        if (selectedAirport) {
          airportId = selectedAirport.id;
        } else {
          console.warn(
            "Typed pickup name did not match any fetched airport name, using first result.",
            pickup,
            nearestAirports
          );
          airportId = nearestAirports[0].id;
        }
      }

      if (!airportId) {
        console.error("Airport ID not available for booking.");
        showNotification(
          "Failed to confirm pickup location. Please try again.",
          "error"
        );
        return;
      }

      tripData = {
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
      };

      console.log("Request Data:", tripData);

      // Persist tripData to sessionStorage
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem("tripData", JSON.stringify(tripData));
        console.log("Trip data saved to sessionStorage:", tripData);
      }
    }

    // Proceed with the ride request
    setShowPassengerDetails(false);
    setTripRequestStatus("loading");

    try {
      let response;
      if (!bookAsGuest && isAuthenticated) {
        console.log("Booking as an authenticated user");
        response = await apiClient.post(
          "/trips",
          tripData,
          undefined,
          undefined,
          true
        );
      } else {
        // Guest user - use guest booking endpoint
        response = await apiClient.post("/trips/guest-booking", tripData);
      }

      console.log("Raw API Response:", response);

      if (response.status === "success" && response.data) {
        const trip = response.data;

        if (bookAsGuest || !isAuthenticated) {
          // Guest user
          const extractedGuestId = trip.guest?.id;
          if (!extractedGuestId) {
            console.error(
              "Guest ID not found in booking response, cannot start WebSocket."
            );
            setTripRequestStatus("error");
            setTripRequestError(
              "Failed to get guest session. Booking cancelled."
            );
            return;
          }

          console.log("Trip data received:", trip);
          console.log("Guest ID received:", extractedGuestId);

          setVerificationCode(trip.verification_code || "");
          setActiveTripId(trip.id);
          setGuestId(extractedGuestId);

          if (trip.status.value === "searching") {
            setTripRequestStatus(null);
            setScreen("assigning");
            startWebSocketConnection(extractedGuestId, trip.id);
          } else if (trip.status.value === "driver_assigned" && trip.driver) {
            setDriver(trip.driver);
            setTripRequestStatus(null);
            setScreen("driver-assigned");
          } else {
            console.warn("Unexpected trip status after booking:", trip.status);
            setTripRequestStatus("error");
            setTripRequestError(
              `Unexpected booking state: ${trip.status.label}`
            );
          }
        } else {
          // Authenticated user
          console.log("Trip data received:", trip);

          setVerificationCode(trip.verification_code || "");
          setActiveTripId(trip.id);

          if (trip.status.value === "searching") {
            setTripRequestStatus(null);
            setScreen("assigning");
            startWebSocketConnectionForAuthUser(trip.id);
          } else if (trip.status.value === "driver_assigned" && trip.driver) {
            setDriver(trip.driver);
            setTripRequestStatus(null);
            setScreen("driver-assigned");
          } else {
            console.warn("Unexpected trip status after booking:", trip.status);
            setTripRequestStatus("error");
            setTripRequestError(
              `Unexpected booking state: ${trip.status.label}`
            );
          }
        }
      } else {
        console.error(
          "API responded with non-success status or missing data:",
          response
        );
        throw new Error(
          "Failed to book your trip. Server responded unexpectedly."
        );
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      setTripRequestStatus("error");
      setTripRequestError(
        "Failed to book your trip. Please check your connection and try again."
      );
    }
  };

  const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } =
    useJsApiLoader({
      id: "google-map-script",
      googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      libraries: ["places"],
    });

  if (googleMapsLoadError) {
    console.error("Failed to load Google Maps API:", googleMapsLoadError);
    return <div>Error loading Google Maps.</div>;
  }

  const handleShowLocationModal = () => {
    setShowLocationModal(true);
  };

  const handleLocationModalClose = () => {
    setShowLocationModal(false);
  };

  const handleGrantLocationAccess = () => {
    console.log(
      "location access granted button clicked in modal. The BookingScreen will handle the requestPermission call"
    );
  };

  // WebSocket connection for authenticated users
  const startWebSocketConnectionForAuthUser = (tripId: string) => {
    if (webSocketConnection) {
      console.log("Closing existing WebSocket connection.");
      webSocketConnection.close();
    }

    const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?trip_id=${tripId}`;
    console.log(
      `Attempting to connect to WebSocket for authenticated user: ${wsUrl}`
    );

    const rws = new ReconnectingWebSocket(wsUrl, [], {
      connectionTimeout: 10000,
      maxRetries: 10,
      maxReconnectionDelay: 10000,
    });

    rws.onopen = () => {
      console.log("WebSocket connection opened for authenticated user.");
      setWebSocketStatus("open");
      stopPollingTripStatus();
    };

    rws.onmessage = (event) => {
      try {
        const messageData: WebSocketMessage = JSON.parse(event.data);
        console.log("Received WebSocket message in page.tsx:", messageData);
        const { event: eventType, data: tripData } = messageData;

        if (
          eventType === "trip:assigned" ||
          eventType === "trip:status:update"
        ) {
          if (tripData.status.value === "driver not found") {
            console.log(
              "Driver not found via WebSocket (page.tsx), updating UI."
            );
            stopWebSocketConnection();
            stopPollingTripStatus();
            setTripRequestStatus("no-driver");
            setTripRequestError(`No drivers available for your trip.`);
            return;
          }
          if (
            (tripData.status.value === "accepted" ||
              tripData.status.value === "driver_assigned") &&
            tripData.driver
          ) {
            console.log(
              `${tripData.status.label} via WebSocket (page.tsx), updating UI with driver.`
            );
            setDriver(tripData.driver);
            console.log("Active Trip Id: ", activeTripId);
            setScreen("driver-assigned");
            stopPollingTripStatus();
            console.log("stopPollingTripStatus was just called");
          } else if (tripData.status.value === "active") {
            console.log(
              `Trip started (status: ${tripData.status.label}) via WebSocket (page.tsx), transitioning to trip-progress.`
            );
            setScreen("trip-progress");
          } else if (
            tripData.status.value === "cancelled" ||
            tripData.status.value === "completed"
          ) {
            console.log(
              `Trip ${tripData.id} is now ${tripData.status.value} via WebSocket (page.tsx).`
            );
            stopWebSocketConnection();
            stopPollingTripStatus();
            setTripProgress(0);
            setVerificationCode(null);
            if (tripData.status.value === "completed") {
              setScreen("trip-complete");
              showNotification("Trip completed successfully", "info");
              // preserveBookingContext()
            } else if (tripData.status.value === "cancelled") {
              showNotification("Trip was cancelled successfully", "info");
              setScreen("booking");
              setDriver(null);
              preserveBookingContext();
            }
          } else {
            console.log(
              `Received trip status update via WebSocket (page.tsx): ${tripData.status.value}`
            );
          }
        }
        if (eventType === "trip:location:driver") {
          const coords = tripData?.map_data?.location?.coordinates; // [lng, lat]
          if (Array.isArray(coords) && coords.length === 2) {
            setDriver((prevDriver: any) => {
              if (!prevDriver) return null;
              return {
                ...prevDriver,
                location: coords,
              };
            });
            console.log("Driver location updated via WebSocket:", coords);
          } else {
            console.warn("Invalid driver location data received:", coords);
          }
          return;
        } else {
          console.log(
            `Received other WebSocket event (page.tsx): ${eventType}`
          );
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message in page.tsx:",
          error,
          event.data
        );
      }
    };

    rws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      const currentTripId = activeTripIdRef.current;
      const currentScreen = screenRef.current;
      const currentPollingId = pollingIntervalRef.current;

      setWebSocketStatus("closed");

      if (
        currentTripId &&
        ![
          "driver-assigned",
          "completed",
          "cancelled",
          "driver not found",
        ].includes(currentScreen) &&
        !currentPollingId
      ) {
        console.log(
          `WebSocket closed unexpectedly while screen is '${currentScreen}', starting polling for trip ${currentTripId} as fallback.`
        );
        startPollingTripStatus(currentTripId, guestId);
      } else {
        console.log(
          `WebSocket closed, but not starting polling. Trip ID: ${currentTripId}, Screen: ${currentScreen}, Polling Active: ${!!currentPollingId}`
        );
        if (
          [
            "driver-assigned",
            "completed",
            "cancelled",
            "driver not found",
          ].includes(currentScreen)
        ) {
          console.log(
            "Screen indicates final state or driver-assigned (post-cancellation), ensuring polling is stopped."
          );
          stopPollingTripStatus();
        }
      }
    };

    rws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWebSocketConnection(rws);
    setWebSocketStatus("connecting");
  };

  // WebSocket connection for guests
  const startWebSocketConnection = (guestId: string, tripId: string) => {
    if (webSocketConnection) {
      console.log("Closing existing WebSocket connection.");
      webSocketConnection.close();
    }

    const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?guest_id=${guestId}`;
    console.log(`Attempting to connect to WebSocket for guest: ${wsUrl}`);

    const rws = new ReconnectingWebSocket(wsUrl, [], {
      connectionTimeout: 10000,
      maxRetries: 10,
      maxReconnectionDelay: 10000,
    });

    rws.onopen = () => {
      console.log("WebSocket connection opened for guest.");
      setWebSocketStatus("open");
      stopPollingTripStatus();
    };

    rws.onmessage = (event) => {
      try {
        const messageData: WebSocketMessage = JSON.parse(event.data);
        console.log("Received WebSocket message in page.tsx:", messageData);
        const { event: eventType, data: tripData } = messageData;

        if (
          eventType === "trip:assigned" ||
          eventType === "trip:status:update"
        ) {
          if (tripData.status.value === "driver not found") {
            console.log(
              "Driver not found via WebSocket (page.tsx), updating UI."
            );
            stopWebSocketConnection();
            stopPollingTripStatus();
            setTripRequestStatus("no-driver");
            setTripRequestError(`No drivers available for your trip.`);
            return;
          }
          if (
            (tripData.status.value === "accepted" ||
              tripData.status.value === "driver_assigned") &&
            tripData.driver
          ) {
            console.log(
              `${tripData.status.label} via WebSocket (page.tsx), updating UI with driver.`
            );
            setDriver(tripData.driver);
            console.log("Active Trip Id: ", activeTripId);
            setScreen("driver-assigned");
            stopPollingTripStatus();
            console.log("stopPollingTripStatus was just called");
          } else if (tripData.status.value === "active") {
            console.log(
              `Trip started (status: ${tripData.status.label}) via WebSocket (page.tsx), transitioning to trip-progress.`
            );
            setScreen("trip-progress");
          } else if (
            tripData.status.value === "cancelled" ||
            tripData.status.value === "completed"
          ) {
            console.log(
              `Trip ${tripData.id} is now ${tripData.status.value} via WebSocket (page.tsx).`
            );
            stopWebSocketConnection();
            stopPollingTripStatus();
            
            setTripProgress(0);
            setVerificationCode(null);
            if (tripData.status.value === "completed") {
              setScreen("trip-complete");
              showNotification("Trip completed successfully", "info");
              // setGuestId(null)
              // setActiveTripId(null)
            } else if (tripData.status.value === "cancelled") {
              showNotification("Trip was cancelled successfully", "info");
              setDriver(null);
              setScreen("booking");
              preserveBookingContext();
            }
          } else {
            console.log(
              `Received trip status update via WebSocket (page.tsx): ${tripData.status.value}`
            );
          }
        }
        if (eventType === "trip:location:driver") {
          const coords = tripData?.map_data?.location?.coordinates; // [lng, lat]
          if (Array.isArray(coords) && coords.length === 2) {
            setDriver((prevDriver: any) => {
              if (!prevDriver) return null;
              return {
                ...prevDriver,
                location: coords,
              };
            });
            console.log("Driver location updated via WebSocket:", coords);
          } else {
            console.warn("Invalid driver location data received:", coords);
          }
          return;
        } else {
          console.log(
            `Received other WebSocket event (page.tsx): ${eventType}`
          );
        }
      } catch (error) {
        console.error(
          "Error parsing WebSocket message in page.tsx:",
          error,
          event.data
        );
      }
    };

    rws.onclose = (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      const currentTripId = activeTripIdRef.current;
      const currentGuestId = activeGuestIdRef.current;
      const currentScreen = screenRef.current;
      const currentPollingId = pollingIntervalRef.current;

      setWebSocketStatus("closed");

      if (
        currentTripId &&
        ![
          "driver-assigned",
          "completed",
          "cancelled",
          "driver not found",
        ].includes(currentScreen) &&
        !currentPollingId
      ) {
        console.log(
          `WebSocket closed unexpectedly while screen is '${currentScreen}', starting polling for trip ${currentTripId} as fallback.`
        );
        startPollingTripStatus(currentTripId, guestId);
      } else {
        console.log(
          `WebSocket closed, but not starting polling. Trip ID: ${currentTripId}, Screen: ${currentScreen}, Polling Active: ${!!currentPollingId}`
        );
        if (
          [
            "driver-assigned",
            "completed",
            "cancelled",
            "driver not found",
          ].includes(currentScreen)
        ) {
          console.log(
            "Screen indicates final state or driver-assigned (post-cancellation), ensuring polling is stopped."
          );
          stopPollingTripStatus();
        }
      }
    };

    rws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    setWebSocketConnection(rws);
    setWebSocketStatus("connecting");
  };

  const stopWebSocketConnection = () => {
    if (webSocketConnection) {
      stopPollingTripStatus();
      console.log("Manually stopping WebSocket connection.");
      webSocketConnection.close();
      setWebSocketConnection(null);
      setWebSocketStatus("closed");
    }
  };

  const fetchTripStatus = async (tripId: string, guestId: string) => {
    if (!tripId) {
      console.warn("fetchTripStatus called without a tripId");
      return;
    }

    try {
      console.log(`Polling trip status for ID: ${tripId}`);

      let response;
      if (isAuthenticated && token) {
        // Authenticated user - use trip endpoint
        response = await apiClient.get(
          `/trips/${tripId}`,
          undefined,
          false,
          undefined,
          true
        );
      } else {
        // Guest user - use guest trip endpoint with guestId
        if (!guestId) {
          console.warn("fetchTripStatus called without guestId for guest user");
          stopPollingTripStatus();
          return;
        }

        console.log("Guest Id in polling function", guestId);
        response = await apiClient.get(
          `/trips/${guestId}`,
          undefined,
          true,
          guestId
        );
      }

      if (response.status === "success" && response.data) {
        const trip = response.data;
        console.log(
          `Polled trip status: ${trip.status.value}, has driver: !!${trip.driver}`
        );

        const terminalStates = ["driver not found", "cancelled", "completed"];

        if (terminalStates.includes(trip.status.value)) {
          console.log(
            `🛑 Terminal state reached: ${trip.status.value}. STOPPING POLLING.`
          );
          stopPollingTripStatus();
          stopWebSocketConnection();

          if (trip.status.value === "driver not found") {
            setTripRequestStatus("no-driver");
            setTripRequestError("No drivers available for your trip.");
          } else if (trip.status.value === "completed") {
            showNotification("Trip Completed", "success");
            setScreen("trip-complete");
          } else if (trip.status.value === "cancelled") {
            showNotification("Trip was cancelled", "info");
            setScreen("booking");
          }

          return; // ⚠️ CRITICAL: Exit immediately
        }

        // ✅ DRIVER ASSIGNED - Stop polling
        if (
          (trip.status.value === "accepted" ||
            trip.status.value === "driver_assigned") &&
          trip.driver
        ) {
          console.log("✅ Driver assigned via polling. STOPPING POLLING.");
          stopPollingTripStatus();
          //stopWebSocketConnection();
          setDriver(trip.driver);
          setScreen("driver-assigned");
          return; // ⚠️ CRITICAL: Exit immediately
        }

        // ✅ ACTIVE TRIP - Update screen but continue polling
        if (trip.status.value === "active") {
          console.log("🚗 Trip is active, updating screen");
          setScreen("trip-progress");
          // Don't return - continue polling
        }

        // ✅ For "searching" state, just log and continue
        console.log(`⏳ Trip still searching. Continuing to poll.`);
      } else {
        console.error("❌ Polling API error:", response);
      }
    } catch (err) {
      console.error("❌ Error polling trip status:", err);
    }
  };

  const startPollingTripStatus = (tripId: string, guestId: string) => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }

    console.log(
      `Starting polling for trip ${tripId} every 20 seconds (fallback).`
    );

    const interval = setInterval(() => {
      fetchTripStatus(tripId, guestId);
    }, 20000);

    pollingIntervalRef.current = interval;
    setPollingIntervalId(interval);
  };

  const stopPollingTripStatus = () => {
    if (pollingIntervalRef.current) {
      console.log(
        `Stopping trip status polling. with interval ID: ${pollingIntervalRef.current}`
      );
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
      setPollingIntervalId(null);
    } else {
      console.log(
        "stopPollingTripStatus called but no active polling interval found"
      );
    }
  };

  useEffect(() => {
    return () => {
      console.log("Cleaning up WebSocket and polling intervals on unmount.");
      stopWebSocketConnection();
      stopPollingTripStatus();
    };
  }, []);

  const handleTripStart = () => {
    setScreen("trip-progress");
  };

  const handleRateSubmit = () => {
    setScreen("trip-complete");
  };

  const handleTripComplete = () => {
    setScreen("trip-complete");
  };

  const cancelTrip = async (reason: string) => {
    console.log("Active Trip Id: ", activeTripId);
    if (!activeTripId) {
      console.error(
        "Cannot cancel trip: activeTripId is missing (is null, undefined, or empty string)."
      );
      console.log("Current activeTripId state:", activeTripId);
      console.log("Current screen state:", screen);
      console.log("Current tripRequestStatus:", tripRequestStatus);
      showNotification("Unable to cancel trip. No active trip found.", "error");
      setShowCancel(false);
      return;
    }

    const locationToUse = pickupCoords;
    const addressToUse = pickup;

    if (!locationToUse || !addressToUse) {
      console.error(
        "Cannot cancel trip: Missing pickup coordinates or address for cancellation payload."
      );
      console.log("Current pickupCoords state:", pickupCoords);
      console.log("Current pickup state:", pickup);
      showNotification(
        "Unable to cancel trip. Missing location data.",
        "error"
      );
      setShowCancel(false);
      return;
    }

    try {
      const cancelRequestBody = {
        reason: reason,
        location: [locationToUse[0], locationToUse[1]],
        address: addressToUse,
      };

      console.log(
        "Cancelling trip with ID:",
        activeTripId,
        "and payload:",
        cancelRequestBody
      );

      let response;
      if (!bookAsGuest && isAuthenticated) {
        // Authenticated user - use trip cancel endpoint
        response = await apiClient.post(
          `/trips/${activeTripId}/cancel`,
          cancelRequestBody,
          undefined,
          undefined,
          true
        );
      } else {
        // Guest user - use guest cancel endpoint with guestId
        if (!guestId) {
          console.error("Cannot cancel trip: guestId is missing.");
          console.log("Current guestId state:", guestId);
          showNotification("Unable to cancel trip. Session expired.", "error");
          setShowCancel(false);
          return;
        }

        console.log("Guest Id: ", guestId);
        response = await apiClient.post(
          `/trips/${guestId}/cancel`,
          cancelRequestBody,
          undefined,
          guestId
        );
      }

      if (response.status === "success" && response.data) {
        console.log("Trip cancelled successfully:", response.data);
        showNotification("Trip cancelled successfully.", "success");
        stopWebSocketConnection();
        stopPollingTripStatus();
        setDriver(null);
        setActiveTripId(null);
        if (!isAuthenticated) {
          // Only clear guestId for guest users
          setGuestId(null);
        }
        setPickup("");
        setDestination("");
        setFareEstimate(null);
        setTripProgress(0);
        setPickupCoords(null);
        setDestinationCoords(null);
        setVerificationCode(null);
        setDriverLocation(null);
        setScreen("booking");
      } else {
        console.error(
          "Trip cancellation API responded with non-success status or missing data:",
          response
        );
        let errorMessage =
          "Failed to cancel your trip. Server responded unexpectedly.";
        if (response.message) {
          errorMessage = response.message;
          if (response.details) {
            const fieldErrors = [];
            for (const [field, messages] of Object.entries(response.details)) {
              if (Array.isArray(messages)) {
                fieldErrors.push(`${field}: ${messages.join(", ")}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage += ` Details: ${fieldErrors.join("; ")}`;
            }
          }
        }
        showNotification(errorMessage, "error");
      }
    } catch (err: any) {
      console.error("Error cancelling trip:", err);
      let errorMessage =
        "Failed to cancel your trip. Please check your connection and try again.";
      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        console.error("Unexpected error type caught:", typeof err, err);
        errorMessage = "An unexpected error occurred during cancellation.";
      }
      showNotification(errorMessage, "error");
    } finally {
      setShowCancel(false);
    }
  };

  const handleSignupInitiateSuccess = (
    data: { name: string; email: string; phone: string; password: string },
    countdown: number
  ) => {
    const { name, email, phone, password } = data;
    const signupData = { name, email, phone };
    setSignupDataForOtp(signupData);
    setPassengerData({ name, phone, email });
    console.log("setting passenger data:", { name, email, phone });
    setSignupPasswordForOtp(password);
    setInitialOtpCountdown(countdown);
    setShowSignup(false); // Close signup modal
    setShowOTP(true);
  };

  const handleResendOtp = async (data: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<number> => {
    console.log("Resending OTP for email:", data.email);
    try {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || "User";
      const lastName = nameParts.slice(1).join(" ") || "";
      const response = await apiClient.post(
        "/auth/passenger/onboard/initiate",
        {
          email: data.email,
          phone_number: data.phone, // Use the phone from the stored signup data
          first_name: firstName, // Use the parsed name from the stored signup data
          last_name: lastName,
          password: data.password, // Use the password stored during signup
        }
      );
      console.log("Resend OTP Response:", response);
      if (response.status === "success" && response.data?.countdown) {
        // Return the new countdown received from the API
        console.log("New OTP sent, new countdown:", response.data.countdown);
        showNotification("New OTP sent, new countdown", "info");
        return response.data.countdown;
      } else {
        // Handle potential API error responses that still have status 200
        const errorMessage =
          response.message || "Failed to resend OTP. Please try again.";
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Resend OTP Error:", err);
      let errorMessage = "An unexpected error occurred while resending OTP.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      // Re-throw the error so the OTPModal can catch it and display it
      throw new Error(errorMessage);
    }
  };

  const handleCancelConfirmed = (
    reason: string,
    location?: [number, number],
    address?: string
  ) => {
    cancelTrip(reason);
  };

  if (!hasHydrated || isAuthLoading || !initComplete) {
    return (
      <div className="flex items-center justify-center h-screen w-full bg-white animate-fadeIn">
        <div className="relative">
          {/* Soft pulsing glow */}
          <div className="absolute inset-0 rounded-2xl bg-achrams-gradient-primary opacity-40 blur-xl animate-pulse"></div>
          {/* Main Logo Container */}
          <div className="w-16 h-16 bg-achrams-gradient-primary rounded-2xl flex items-center justify-center shadow-xl animate-scaleIn relative overflow-hidden">
            {/* Subtle rotating light sweep */}
            <div className="absolute inset-0 bg-white/20 animate-sweep pointer-events-none"></div>
            <Image
              src="/images/logo.png"
              alt="ACHRAMS Logo"
              width={30}
              height={30}
              className="object-contain animate-popIn"
            />
          </div>
        </div>
      </div>
    );
  }

  let mainContent = null;
  if (screen === "booking") {
    mainContent = (
      <BookingScreen
        pickup={pickup}
        setPickup={setPickup}
        destination={destination}
        setDestination={setDestination}
        fareEstimate={fareEstimate}
        setFareEstimate={setFareEstimate}
        fareIsFlatRate={fareIsFlatRate}
        setFareIsFlatRate={setFareIsFlatRate}
        isGoogleMapsLoaded={isGoogleMapsLoaded}
        googleMapsLoadError={googleMapsLoadError}
        onProceed={handleProceed}
        setShowPassengerDetails={setShowPassengerDetails}
        passengerData={passengerData}
        setPassengerData={setPassengerData}
        showPassengerDetails={showPassengerDetails}
        requirements={requirements}
        setRequirements={setRequirements}
        setPickupCoords={setPickupCoords}
        setDestinationCoords={setDestinationCoords}
        tripRequestStatus={tripRequestStatus}
        resetKey={resetBookingKey}
        setPickupId={setPickupId}
        setPickupCodename={setPickupCodename}
        onShowLogin={() => setShowLogin(true)}
        showNotification={showNotification}
        isAuthenticated={isAuthenticated}
      />
    );
  } else if (screen === "assigning") {
    mainContent = <AssigningScreen status={tripRequestStatus} />;
  } else if (screen === "driver-assigned") {
    mainContent = (
      <DriverAssignedScreen
        pickup={pickup}
        destination={destination}
        driver={driver}
        verificationCode={verificationCode || ""}
        onShowDirections={() => setShowDirections(true)}
        onShowDriverVerification={() => setShowDriverVerification(true)}
        onStartTrip={handleTripStart}
        onBack={() => setScreen("booking")}
        showNotification={showNotification}
        onCancelTrip={() => setShowCancel(true)}
      />
    );
  } else if (screen === "trip-progress") {
    mainContent = (
      <TripProgressScreen
        driver={driver}
        onPanic={() => setShowPanic(true)}
        onComplete={handleTripComplete}
        pickupCoords={pickupCoords}
        destinationCoords={destinationCoords}
        tripProgress={tripProgress}
        isGoogleMapsLoaded={isGoogleMapsLoaded}
        googleMapsLoadError={googleMapsLoadError}
        guestId={guestId}
        
      />
    );
  } else if (screen === "trip-complete") {
    mainContent = (
      <TripCompleteScreen
        fareEstimate={fareEstimate}
        driver={driver}
        pickup={pickup}
        destination={destination}
        onRate={() => setShowRate(true)}
        onDone={() => {
          setResetBookingKey((prev) => prev + 1);
          setPickup("");
          setDestination("");
          setFareEstimate(null);
          setDriver(null);
          setTripProgress(0);
          setPickupCoords(null);
          setDestinationCoords(null);
          setVerificationCode(null);
          if (!isAuthenticated) {
            setGuestId(null);
          }
          stopPollingTripStatus();
          stopWebSocketConnection();
          // setDriverLiveLocation(null);
          if (isAuthenticated) {
            console.log("setting screen to dashboard seven");
            setScreen("dashboard");
          } else {
            setScreen("booking");
          }
        }}
      />
    );
  } else if (screen === "dashboard") {
    mainContent = (
      <DashboardScreen
        passengerData={passengerData}
        walletBalance={walletBalance}
        is2FAEnabled={is2FAEnabled}
        onShowProfile={() => setShowProfile(true)}
        onBookNewTrip={() => {
          setScreen("booking");
          setPickup("");
          setDestination("");
          setFareEstimate(null);
          setPickupCoords(null);
          setDestinationCoords(null);
          setDriver(null);
          setTripProgress(0);
          setVerificationCode(null);
        }}
        onShowTripHistory={() => setShowTripHistory(true)}
        onShowWallet={() => setShowWallet(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowEnable2FA={() => setShowEnable2FA(true)}
        onShowUpdateProfile={() => setShowUpdateProfile(true)}
        onBookRide={() => setScreen("booking")}
        onProfile={() => setShowProfile(true)}
        onLogout={() => {}}
      />
    );
  } else if (showTripHistory) {
    mainContent = (
      <TripHistoryScreen
        onBack={() => setShowTripHistory(false)}
        onSelectTrip={(tripId) => {
          setSelectedTripId(tripId);
          setShowTripHistory(false);
          setShowTripDetails(true);
        }}
      />
    );
  } else if (showTripDetails && selectedTripId) {
    mainContent = (
      <TripDetailsScreen
        tripId={selectedTripId}
        onBack={() => {
          setShowTripDetails(false);
          setSelectedTripId(null);
          setShowTripHistory(true);
        }}
      />
    );
  } else if (showWallet) {
    mainContent = (
      <WalletScreen
        balance={walletBalance}
        onBack={() => setShowWallet(false)}
      />
    );
  } else if (showSettings) {
    mainContent = (
      <SettingsScreen
        onBack={() => setShowSettings(false)}
        onShowProfile={() => {
          setShowSettings(false);
          setShowProfile(true);
        }}
        onShowEnable2FA={() => {
          setShowSettings(false);
          setShowEnable2FA(true);
        }}
        onShowUpdateProfile={() => {
          setShowSettings(false);
          setShowUpdateProfile(true);
        }}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center">
        <div
          className="
  min-h-screen h-dvh
  w-full max-w-[430px] mx-auto
  bg-white
  flex flex-col
  /* Critical for header/body/footer layouts */
  text-sm
  antialiased
  [font-feature-settings:'ss01']
"
        >
          {/* NEW: Render notification if available */}
          {currentNotification && (
            <TripUpdateNotification
              message={currentNotification.message}
              type={currentNotification.type}
              onDismiss={() => setCurrentNotification(null)}
            />
          )}
          {mainContent}
          {/* Modals - all rendered as overlays */}
          <PassengerDetailsModal
            isOpen={showPassengerDetails}
            onClose={() => setShowPassengerDetails(false)}
            passengerData={passengerData}
            setPassengerData={setPassengerData}
            requirements={requirements}
            setRequirements={setRequirements}
            onRequestRide={handleRequestRide}
            isLoading={tripRequestStatus === "loading"}
            isAuthenticated={isAuthenticated}
            setBookAsGuest={setBookAsGuest}
            bookAsGuest={bookAsGuest}
          />
          {/* NEW: Dynamically imported DirectionsModal */}
          {hasHydrated && (
            <DirectionsModal
              isOpen={showDirections}
              onClose={() => setShowDirections(false)}
              pickup={pickup}
              pickupCoords={pickupCoords}
              destination={destination}
              destinationCoords={destinationCoords}
              isGoogleMapsLoaded={isGoogleMapsLoaded}
              googleMapsLoadError={googleMapsLoadError}
            />
          )}
          <PanicModal
            isOpen={showPanic}
            onClose={() => setShowPanic(false)}
            onComplete={() => {
              setShowPanic(false);
              alert("Safety team notified");
            }}
            guestId={(isAuthenticated && !bookAsGuest )? null : guestId}
            currentLocationAddress={pickup}
            currentLocationCoords={pickupCoords || [0, 0]}
            tripId={activeTripId || ""}
            isAuthenticated={isAuthenticated}
            bookAsGuest={bookAsGuest}
          />
          {!token && showSignup && (
            <SignupPromptModal
              isOpen={showSignup}
              passengerData={passengerData}
              onClose={() => setShowSignup(false)}
              // NEW: Store the countdown received from SignupPromptModal
              onVerifyEmail={handleSignupInitiateSuccess}
              onRegistrationSuccess={handleRegistrationSuccess}
              onOpenLoginModal={() => setShowLogin(true)}
              onSignup={() => {
                setShowSignup(false);
              }}
              onLogin={() => {
                setShowSignup(false);
              }}
              onContinueAsGuest={() => {
                setShowSignup(false);
                setScreen("dashboard");
              }}
            />
          )}
          <OTPModal
            isOpen={showOTP}
            // NEW: Pass the stored countdown value
            initialOtpCountdown={initialOtpCountdown}
            initialSignupData={{
              ...passengerData,
              password: signupPasswordForOtp,
            }}
            onComplete={() => {
              setScreen("dashboard");
              setShowOTP(false);
              setSignupPasswordForOtp("");
            }}
            onClose={() => {
              console.log("onclose button was clicked");
              setShowOTP(false);
              setSignupPasswordForOtp("");
            }}
            onResendOtp={handleResendOtp} // Pass the stored password
          />
          <ProfileModal
            isOpen={showProfile}
            passengerData={passengerData}
            onClose={() => setShowProfile(false)}
            onLogout={() => {
              preserveBookingContext();
              window.location.href = "/auth/login";
            }}
          />
          {/* NEW: Trip Request Status Modal */}
          <TripRequestStatusModal
            isOpen={!!tripRequestStatus}
            status={tripRequestStatus}
            message={tripRequestError}
            onClose={() => {
              setTripRequestStatus(null);
              setScreen("booking");
              // Clear tripData from sessionStorage
              if (typeof window !== "undefined" && window.sessionStorage) {
                console.log("Clearing TripData in session");
                preserveBookingContext()
                sessionStorage.removeItem("tripData");
                console.log("Cleared tripData from sessionStorage.");
              }
            }}
            onConfirm={() => {
              if (
                tripRequestStatus === "no-driver" ||
                tripRequestStatus === "error"
              ) {
                console.log("Retrying booking process...");
                setTripRequestStatus(null);
                handleRequestRide();
              } else {
                setTripRequestStatus(null);
              }
            }}
          />
          {/* NEW: Driver Verification Modal */}
          <DriverVerificationModal
            isOpen={showDriverVerification}
            securityCode={verificationCode || ""}
            onClose={() => setShowDriverVerification(false)}
          />
          {/* NEW: Login Modal */}
          <LoginModal
            isOpen={showLogin}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
            onShowSignupPrompt={() => {
              setShowSignup(true);
              setShowLogin(false);
            }}
          />
          {/* NEW: Modals for dashboard features */}
          {showEnable2FA && (
            <Enable2FAModal
              isOpen={showEnable2FA}
              onClose={() => setShowEnable2FA(false)}
              onSuccess={handle2FAEnabled}
            />
          )}
          {showDisable2FA && (
            <Disable2FAModal
              isOpen={showDisable2FA}
              onClose={() => setShowDisable2FA(false)}
              onSuccess={handle2FADisabled}
            />
          )}
          {showUpdateProfile && (
            <UpdateProfileModal
              isOpen={showUpdateProfile}
              initialData={passengerData}
              onClose={() => setShowUpdateProfile(false)}
              onSuccess={handleProfileUpdated}
            />
          )}
          {/* Future: Uncomment when implemented */}
          <CancelModal
            isOpen={showCancel}
            onClose={() => setShowCancel(false)}
            onConfirm={handleCancelConfirmed}
            pickupAddress={pickup}
          />
          {showRate && (
            <RateModal
              isOpen={showRate}
              onClose={() => setShowRate(false)}
              onRate={handleRateSubmit}
              driverName={driver?.name}
              setNotification={setCurrentNotification}
              tripId={activeTripId}
              guestId={(isAuthenticated && !bookAsGuest) ? null : guestId}
              bookAsGuest={bookAsGuest}
              isAuthenticated={isAuthenticated}
            />
          )}
          <MessageWindowModal
            isOpen={showMessage}
            onClose={() => setShowMessage(false)}
            recipientName={driver?.name || "Driver"}
          />
        </div>
      </div>
      {/* NEW: Bottom Navigation Bar - Rendered only on dashboard screen */}
      {screen === "dashboard" && (
        <BottomNavBar
          onProfileClick={() => setShowProfile(true)}
          walletBalance={walletBalance}
          onHomeClick={() => setScreen("booking")}
          onWalletClick={() => setShowWallet(true)}
          onSearchClick={() => setShowTripHistory(true)}
        />
      )}
    </>
  );
}
