// src/app/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import BookingScreen from "@/components/app/screens/BookingScreen";
import AssigningScreen from "@/components/app/screens/AssigningScreen";
import DriverAssignedScreen from "@/components/app/screens/DriverAssignedScreen";
// NEW: Import TripProgressScreen statically
import TripProgressScreen from "@/components/app/screens/TripProgressScreen";
import TripCompleteScreen from "@/components/app/screens/TripCompleteScreen";
// NEW: Import new dashboard-related screens
import TripHistoryScreen from "@/components/app/screens/TripHistoryScreen";
import TripDetailsScreen from "@/components/app/screens/TripDetailsScreen";
import WalletScreen from "@/components/app/screens/WalletScreen";
import SettingsScreen from "@/components/app/screens/SettingsScreen";

// NEW: Import the dashboard screen (assuming it's updated to handle new features)
import DashboardScreen from "@/components/app/screens/DashboardScreen";

// Modals - Dynamically import map-dependent modals like DirectionsModal
import dynamic from "next/dynamic";
const DirectionsModal = dynamic(
  () => import("@/components/app/modals/DirectionsModal"),
  { ssr: false }
);

// Modals - Imported normally
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
// NEW: Import new modals
import Enable2FAModal from "@/components/app/modals/Enable2FAModal";
import Disable2FAModal from "@/components/app/modals/Disable2FAModal";
import UpdateProfileModal from "@/components/app/modals/UpdateProfileModal";
import Image from "next/image";
import { apiClient } from "@/lib/api";

// UI
import TripUpdateNotification from "@/components/app/ui/TripUpdateNotification";
// NEW: Import BottomNavBar
import BottomNavBar from "@/components/app/ui/BottomNavBar";
import { findNearestAirport, KNOWN_AIRPORTS } from "@/lib/airports";
import ReconnectingWebSocket from "reconnecting-websocket";

type TripStatusValue =
  | "searching"
  | "driver_assigned"
  | "accepted"
  | "active"
  | "completed"
  | "cancelled"
  | "driver not found"; // Added "driver not found"

  type TripStatus = {
  label: string;
  value: TripStatusValue;
};

// NEW: Define types for the WebSocket message
type WebSocketMessage = {
  event: "trip:assigned" | "trip:status:update" | string; // Add other potential events
  any; // This will be the trip object
};

// Types
type ScreenState =
  | "booking"
  | "assigning"
  | "driver-assigned"
  | "trip-progress"
  | "trip-complete"
  | "dashboard";
// NEW: Add any new screen states if necessary, though most new features will be modals/screens on top of 'dashboard'

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

// NEW: Define type for the state you want to persist
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
  // NEW: Add other critical states you want to persist across refresh
  // e.g., walletBalance, is2FAEnabled (though these might be fetched fresh from API on load)
  // Add other critical states as needed
}

// NEW: Function to save state to sessionStorage - only runs on client
const saveAppState = (state: PersistedState) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem("achrams_app_state", JSON.stringify(state));
      console.log("App state saved to sessionStorage"); // Optional: For debugging
    } catch (e) {
      console.error("Failed to save app state to sessionStorage", e);
    }
  }
};

// NEW: Function to load state from sessionStorage - only runs on client
const loadAppState = (): PersistedState | null => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const savedStateStr = sessionStorage.getItem("achrams_app_state");
      if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr) as PersistedState;
        console.log("App state loaded from sessionStorage", savedState); // Optional: For debugging
        return savedState;
      }
    } catch (e) {
      console.error("Failed to load app state from sessionStorage", e);
    }
  }
  return null; // Return null if sessionStorage is not available or error occurred
};

export default function ACHRAMApp() {
  const { token } = useAuth();

  // NEW: Use a state variable to track if we have checked sessionStorage on the client
  const [hasHydrated, setHasHydrated] = useState(false);

  // NEW: Define state variables without initial values from loadAppState here
  const [screen, setScreen] = useState<ScreenState>("booking"); // Will be set after hydration
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [tripProgress, setTripProgress] = useState<number>(0);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(
    null
  );
  const [destinationCoords, setDestinationCoords] = useState<
    [number, number] | null
  >(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null); // NEW: Store guest ID
  const [activeTripId, setActiveTripId] = useState<string | null>(null); // NEW: Store active trip ID (from booking response)
  // NEW: State for WebSocket connection
  const [webSocketConnection, setWebSocketConnection] =
    useState<ReconnectingWebSocket | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<
    "connecting" | "open" | "closed" | "reconnecting"
  >("closed");
  // NEW: State for polling fallback
  const [pollingIntervalId, setPollingIntervalId] =
    useState<NodeJS.Timeout | null>(null);

  // NEW: State for new dashboard features (these might be fetched from API on load)
  const [walletBalance, setWalletBalance] = useState<number>(0); // NEW: State for wallet balance
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false); // NEW: State for 2FA status
  // const [activeTripId, setActiveTripId] = useState<string | null>(null); // NEW: State for active trip ID (if any)

  // NEW: State for modals (these can be initialized normally)
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showPanic, setShowPanic] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // NEW: Use this state instead of screen === 'signup-prompt'
  const [showOTP, setShowOTP] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // NEW: State for new modals/screens
  const [showTripHistory, setShowTripHistory] = useState(false);
  const [showTripDetails, setShowTripDetails] = useState(false);
  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [showWallet, setShowWallet] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showEnable2FA, setShowEnable2FA] = useState(false);
  const [showDisable2FA, setShowDisable2FA] = useState(false);
  const [showUpdateProfile, setShowUpdateProfile] = useState(false);

  // NEW: State for Login Modal
  const [showLogin, setShowLogin] = useState(false); // NEW: Add state for login modal

  // NEW: State for trip request status modal
  const [tripRequestStatus, setTripRequestStatus] = useState<
    "loading" | "accepted" | "no-driver" | "error" | null
  >(null);
  const [tripRequestError, setTripRequestError] = useState<string | null>(null);

  // NEW: State for driver verification modal
  const [showDriverVerification, setShowDriverVerification] = useState(false);

  // NEW: State for trip update notifications
  const [currentNotification, setCurrentNotification] = useState<{
    message: string;
    type: "info" | "success" | "warning" | "error";
  } | null>(null);

  // NEW: Effect to run only on the client after mount to load state and set initial values
  useEffect(() => {
    // Check if we are on the client
    if (typeof window !== "undefined") {
      const savedState = loadAppState();
      if (savedState) {
        // Set state using the loaded values
        setScreen(savedState.screen);
        setPickup(savedState.pickup);
        setDestination(savedState.destination);
        setFareEstimate(savedState.fareEstimate);
        setDriver(savedState.driver);
        setTripProgress(savedState.tripProgress);
        setPickupCoords(savedState.pickupCoords);
        setDestinationCoords(savedState.destinationCoords);
        setVerificationCode(savedState.verificationCode);
        // NEW: Load other persisted states if added
        // setWalletBalance(savedState.walletBalance); // Example
        // setIs2FAEnabled(savedState.is2FAEnabled); // Example
      } else {
        // Set default initial state based on token
        setScreen(token ? "dashboard" : "booking");
      }
      // Mark as hydrated after loading/saving defaults
      setHasHydrated(true);
    } else {
      // Fallback if somehow this runs on server (shouldn't with 'use client')
      setScreen(token ? "dashboard" : "booking");
      setHasHydrated(true);
    }
  }, [token]); // Depend on token if initial screen logic depends on it

  // NEW: Effect to fetch user profile data (including 2FA status, wallet, active trip) on initial load or token change
  useEffect(() => {
    if (hasHydrated && token) {
      const fetchUserProfile = async () => {
        try {
          // NEW: Call the API to get user profile using apiClient
          // Example: const response = await apiClient.get('/auth/passenger/me');
          // Example structure based on passenger postman DOC.txt:
          // const profileData = response.data.data;
          // setWalletBalance(profileData.profile.wallet.balance.amount);
          // setIs2FAEnabled(profileData.is_2fa_enabled);
          // if (profileData.profile.active_trip) {
          //    setActiveTripId(profileData.profile.active_trip.id);
          //    // Potentially set screen to 'driver-assigned' or 'trip-progress' if active trip exists
          //    // This logic depends on your desired UX for resuming active trips
          // }

          // For now, simulate with mock data after a short delay
          setTimeout(() => {
            setWalletBalance(5000); // Mock balance
            setIs2FAEnabled(false); // Mock 2FA status
            // setActiveTripId(null); // Mock active trip ID - assume no active trip for this example
          }, 500); // Simulate API delay
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          // NEW: Optionally show an error notification
          setCurrentNotification({
            message: "Failed to load profile data.",
            type: "error",
          });
          setTimeout(() => setCurrentNotification(null), 5000);
        }
      };

      fetchUserProfile();
    }
  }, [hasHydrated, token]); // Run when hydrated state is true and token changes

  // NEW: Effect to handle navigation after trip completion and set showSignup
  useEffect(() => {
    if (screen === "trip-complete") {
      // Check if user is authenticated
      if (token) {
        // If authenticated, maybe show rate modal (if not already shown) and then go to dashboard
        // Or, if rating is handled elsewhere, just go to dashboard after a delay or user action
        // For now, let's assume the user can click a button or it happens automatically after a short delay
        // Or, the TripCompleteScreen itself could trigger this.
        // Let's simulate a delay and then transition to dashboard if authenticated.
        // This is just a simulation, the real trigger might be clicking 'Done' in TripCompleteScreen.
        // We'll add a specific state to manage this transition cleanly.
        // Let's assume the TripCompleteScreen has a button that calls a handler passed from page.tsx.
        // For now, let's just add the logic here that *would* happen when the user wants to leave the trip-complete screen.
        // The key is to clear trip data and set screen to dashboard *before* the save effect runs.
      } else {
        // If not authenticated (guest), show signup prompt after a delay
        const timer = setTimeout(() => {
          // NEW: Clear specific trip-related state before navigating to signup
          // Note: This clearing is now handled in the onDone handler in TripCompleteScreen render block
          // We set showSignup here, which triggers the modal.
          setShowSignup(true); // NEW: Trigger the signup modal
        }, 1500); // Delay matches the original effect

        return () => clearTimeout(timer);
      }
    }
  }, [screen, token]); // Depend on screen and token only

  // Data state
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

  // NEW: Function to show notifications
  const showNotification = (
    message: string,
    type: "info" | "success" | "warning" | "error"
  ) => {
    setCurrentNotification({ message, type });
    setTimeout(() => {
      setCurrentNotification(null);
    }, 5000); // Auto-dismiss after 5 seconds
  };

  // NEW: Effect to trigger notifications based on screen changes (simulated)
  useEffect(() => {
    if (screen === "driver-assigned" && driver) {
      // Simulate driver found notification
      showNotification("Driver assigned successfully!", "success");
      // Simulate trip updates after some delay
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
    if (screen === "trip-progress") {
      // Simulate ongoing trip updates
      const timer = setInterval(() => {
        setTripProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            setScreen("trip-complete");
            return 100;
          }
          return prev + 2; // Simulate progress
        });
      }, 1000); // Update every second for simulation

      return () => clearInterval(timer);
    }
  }, [screen, driver]); // Depend on screen and driver

  // NEW: Effect to save state whenever it changes (only runs on client after hydration)
  useEffect(() => {
    if (hasHydrated) {
      // Only save after initial state has been loaded/set
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
        // NEW: Add other states you want to persist
        // walletBalance, // Example - might be fetched fresh from API
        // is2FAEnabled, // Example - might be fetched fresh from API
        // Add other states...
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
    // NEW: Add other states to dependency array if they are included in stateToSave
    // walletBalance,
    // is2FAEnabled,
    hasHydrated, // Include hydration flag to prevent saving before state is loaded
  ]);

  // NEW: Handler passed to SignupPromptModal for successful registration (e.g., open OTP)
  const handleRegistrationSuccess = (email: string) => {
    // For now, simulate OTP verification success and move to dashboard
    // In reality, you'd open OTPModal here
    // setShowOTP(true); // Assuming OTPModal exists and handles verification
    // If OTP verification is successful within OTPModal, it would then trigger navigation to dashboard
    // OR, if registration API directly logs in (less common), update token and screen here.
    // Let's assume it leads to OTP first, then dashboard.
    // For this mock, let's just move to dashboard after "registration"
    setScreen("dashboard");
    setShowSignup(false); // Close signup prompt modal
    // setShowOTP(true); // Uncomment if implementing OTP flow
  };

  // NEW: Handler passed to LoginModal for successful login
  const handleLoginSuccess = () => {
    // The useAuth context should now have the token
    // page.tsx relies on the `token` from useAuth to determine initial screen and rendering logic
    // If token exists, screen should be 'dashboard' (handled by initial load or subsequent logic)
    // Ensure screen is set correctly, maybe explicitly if needed after login
    // setScreen('dashboard'); // Often not needed if initial load logic handles it based on token
    // onClose in LoginModal should be sufficient if screen logic in render is correct
    // No explicit action needed here if state management is correct, just let the parent re-render based on updated token.
    // If token changes and initial screen logic in useEffect isn't catching it, maybe force update screen here.
    // For now, assume token update in context triggers correct re-render.
    // NEW: Optionally refetch profile data after login
    // setHasHydrated(false); // Trigger re-fetch logic in profile effect by resetting hydration state slightly
    // OR, rely on the token change triggering the profile fetch effect naturally.
  };

  // NEW: Handler passed to Enable2FAModal on success
  const handle2FAEnabled = () => {
    setIs2FAEnabled(true); // Update local state
    setShowEnable2FA(false); // Close the modal
    // NEW: Optionally show a success notification
    showNotification(
      "Two-factor authentication enabled successfully!",
      "success"
    );
  };

  // NEW: Handler passed to Disable2FAModal on success
  const handle2FADisabled = () => {
    setIs2FAEnabled(false); // Update local state
    setShowDisable2FA(false); // Close the modal
    // NEW: Optionally show a success notification
    showNotification("Two-factor authentication disabled.", "info");
  };

  // NEW: Handler passed to UpdateProfileModal on success
  const handleProfileUpdated = (updatedData: any) => {
    // Update local passengerData state with the new data
    setPassengerData(updatedData);
    setShowUpdateProfile(false); // Close the modal
    // NEW: Optionally show a success notification
    showNotification("Profile updated successfully!", "success");
  };

  const handleProceed = () => {
    if (fareEstimate && pickup && destination) {
      setShowPassengerDetails(true);
    }
  };

  // src/app/page.tsx

  // Add this helper function inside your component
  const formatPhoneNumber = (input: string): string => {
    // Remove any non-digit characters (like spaces, dashes, parentheses)
    const digitsOnly = input.replace(/\D/g, "");

    // If it starts with '0', remove the '0' and prepend '+234'
    if (digitsOnly.startsWith("0")) {
      return `+234${digitsOnly.slice(1)}`;
    }

    // If it starts with '234', prepend '+'
    if (digitsOnly.startsWith("234")) {
      return `+${digitsOnly}`;
    }

    // If it already starts with '+', return as is
    if (digitsOnly.startsWith("+")) {
      return digitsOnly;
    }

    // If it's a bare number without a country code, assume it's a Nigerian number starting with '0'
    // This is a fallback; ideally, your input validation should enforce a format.
    if (digitsOnly.length === 11) {
      return `+234${digitsOnly.slice(1)}`;
    }

    // If none of the above, return as is (might cause API error)
    return digitsOnly;
  };

  // NEW: Modified handleRequestRide with mock API call simulation and state persistence
  // NEW: Modified handleRequestRide with real API call integration and state persistence
  const handleRequestRide = async () => {
    if (!passengerData.name || !passengerData.phone || !passengerData.email) {
      showNotification("Please fill all passenger details.", "error");
      return;
    }

    if (!pickupCoords || !destinationCoords) {
      showNotification(
        "Pickup and destination locations are required.",
        "error"
      );
      return;
    }

    setShowPassengerDetails(false);
    setTripRequestStatus("loading"); // Shows "Finding a driver..." modal

    try {
      // === Step A: Resolve airport ID ===
      let airportId: string | null = null;

      if (pickup.startsWith("Use my current location")) {
        // Reverse geocode current location → airport
        const nearest = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearest) {
          setTripRequestStatus("error");
          setTripRequestError(
            "You’re outside our service area. Booking not available from this location."
          );
          return;
        }
        airportId = nearest.id;
      } else if (pickup in KNOWN_AIRPORTS) {
        airportId = KNOWN_AIRPORTS[pickup];
      } else {
        // If user typed a custom pickup that isn't a known airport,
        // try reverse geocoding it too
        const nearest = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearest) {
          setTripRequestStatus("error");
          setTripRequestError(
            "Pickup location is not near a supported airport."
          );
          return;
        }
        airportId = nearest.id;
      }

      // === Step B: Prepare request body ===
      const tripData = {
        amount: {
          amount: fareEstimate?.toString() || "0",
          currency: "NGN",
        },
        airport: airportId,
        guest_name: passengerData.name,
        guest_email: passengerData.email,
        guest_phone: formatPhoneNumber(passengerData.phone), // Use the format helper
        has_extra_leg_room: requirements.elderly, // or map as needed
        has_extra_luggage: requirements.luggage,
        has_wheel_chair_access: requirements.wheelchair,
        pickup_address: pickup,
        pickup_location: pickupCoords, // [lng, lat]
        destination_address: destination,
        destination_location: destinationCoords, // [lng, lat]
      };

      console.log("Request Data:", tripData); // Log the object structure, not stringified
      // === Step C: Make API call ===
      const response = await apiClient.post("/trips/guest-booking", tripData);

      console.log("Raw API Response:", response); // Log the full response object from apiClient

      // Check if the API's internal status indicates success (response.status is from API body)
      if (response.status === "success" && response.data) {
        const trip = response.data; // <-- CORRECT: Get the actual trip object from inside the response body
        const extractedGuestId = trip.guest?.id; // Extract guest ID from the response

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

        // Apply the success logic
        setVerificationCode(trip.verification_code || "");
        setActiveTripId(trip.id); // Store the trip ID for potential polling fallback
        setGuestId(extractedGuestId); // Store the guest ID for WebSocket and polling headers

        if (trip.status.value === "searching") {
          setTripRequestStatus(null); // Hide the initial loading modal
          setScreen("assigning"); // Transition to assigning screen

          // NEW: Start WebSocket connection using the guest ID and trip ID
          startWebSocketConnection(extractedGuestId, trip.id);
          // Do NOT start polling here anymore, WebSocket handles updates initially.
        } else if (trip.status.value === "driver_assigned" && trip.driver) {
          // Less likely for guest booking, but handle if it happens immediately
          setDriver(trip.driver);
          setTripRequestStatus(null);
          setScreen("driver-assigned");
          // No need to start WebSocket or polling if driver is already assigned
        } else {
          console.warn("Unexpected trip status after booking:", trip.status);
          setTripRequestStatus("error");
          setTripRequestError(`Unexpected booking state: ${trip.status.label}`);
        }
      } else {
        // If the API's internal status is not "success", treat it as an API error
        console.error(
          "API responded with non-success status or missing data:",
          response
        );
        // Construct error message from the API's response body
        let errorMessage =
          "Failed to book your trip. Server responded unexpectedly.";
        if (response.message) {
          // response.message is from the API body via apiClient
          errorMessage = response.message;
          if (response.details) {
            // response.details is from the API body via apiClient
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
        throw new Error(errorMessage); // This will be caught by the outer catch block
      }
    } catch (err: any) {
      console.error("Guest booking error:", err);
      setTripRequestStatus("error");

      // Construct a more detailed error message based on the error thrown by apiClient
      let errorMessage =
        "Failed to book your trip. Please check your connection and try again.";

      // Check if the error is the one thrown by our apiClient (src/lib/api.ts)
      // apiClient throws `new Error(message)` for non-2xx responses or network issues.
      if (err instanceof Error) {
        // Use the message provided by apiClient's Error object
        errorMessage = err.message;
      } else {
        // If it's not a standard Error object (e.g., if something else threw unexpectedly)
        console.error("Unexpected error type caught:", typeof err, err);
        errorMessage = "An unexpected error occurred during booking.";
      }

      // Set the enhanced error message
      setTripRequestError(errorMessage);
    }
  };

  const startWebSocketConnection = (guestId: string, tripId: string) => {
    if (webSocketConnection) {
      // Close any existing connection before starting a new one
      console.log("Closing existing WebSocket connection.");
      webSocketConnection.close();
      // Note: The onclose handler will fire, potentially starting polling if trip is still active.
      // We might want to prevent that if we are intentionally reconnecting.
      // For now, the logic in onclose checks the screen state or activeTripId to decide.
    }

    // Construct the WebSocket URL using the guest ID
    const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?guest_id=${guestId}`;

    console.log(`Attempting to connect to WebSocket: ${wsUrl}`);

    // Create the ReconnectingWebSocket instance
    const rws = new ReconnectingWebSocket(wsUrl, [], {
      // Optional configuration for ReconnectingWebSocket
      connectionTimeout: 10000, // Timeout for individual connection attempts
      maxRetries: 10, // Maximum number of reconnection attempts (or Number.MAX_VALUE for unlimited)
      maxReconnectionDelay: 10000, // Maximum delay between reconnections
      // Add other options as needed from the library's documentation
    });

    // Set up event handlers
    rws.onopen = () => {
      console.log("WebSocket connection opened.");
      setWebSocketStatus("open");
      // If polling was running as a fallback, stop it now that WS is open
      stopPollingTripStatus();
    };

    rws.onmessage = (event) => {
      try {
        const messageData: WebSocketMessage = JSON.parse(event.data);
        console.log("Received WebSocket message:", messageData);

        const { event: eventType, data: tripData } = messageData;

        // Check if it's a relevant trip update event
        if (eventType === 'trip:assigned' || eventType === 'trip:status:update') {
      // Update UI state based on the received trip data

      // NEW: Check for 'driver not found' status
      if (tripData.status.value === 'driver not found') { // Use the exact string from backend/Postman
        console.log("Driver not found via WebSocket, updating UI.");
        // Stop both WebSocket and polling
        stopWebSocketConnection();
        stopPollingTripStatus();
        // Set status to show 'no-driver' modal
        setTripRequestStatus('no-driver');
        // Optionally set a specific error message
        setTripRequestError(`No drivers available for your trip.`);
        // Do NOT change the screen here, let the modal handle the user interaction.
        // The screen might still be 'assigning', which is okay until the user retries/cancels.
        return; // Exit handler after handling 'driver not found'
      }

      // NEW: Check for 'accepted' OR 'driver_assigned' status when a driver is present
      if ((tripData.status.value === 'accepted' || tripData.status.value === 'driver_assigned') && tripData.driver) {
        // Driver found or assigned!
        console.log(`${tripData.status.label} via WebSocket, updating UI with driver.`);
        setDriver(tripData.driver);
        setScreen('driver-assigned'); // Transition to the driver-assigned screen
        stopWebSocketConnection(); // Stop WebSocket as trip is assigned/accepted
        stopPollingTripStatus(); // Ensure polling is also stopped
        // No need to start polling here, as trip is assigned/accepted.
      } else if (tripData.status.value === 'cancelled' || tripData.status.value === 'completed') {
        // Trip is no longer active, stop polling and handle accordingly
        console.log(`Trip ${tripData.id} is now ${tripData.status.value} via WebSocket.`);
        setTripRequestStatus('error'); // Or a specific status like 'trip-cancelled'
        setTripRequestError(`Trip ${tripData.status.label}.`); // Show status message
        stopWebSocketConnection(); // Stop WebSocket as trip is finished
        stopPollingTripStatus(); // Ensure polling is also stopped
        // No need to start polling here, as trip is finished.
      } else {
        // Handle other statuses if needed, or just log/update state if necessary
        // e.g., update verification code, status label, etc., if relevant
        console.log(`Received trip status update via WebSocket: ${tripData.status.value}`);
        // You might want to update activeTripId if it changed, though unlikely after initial booking
        // setActiveTripId(tripData.id);
        // setVerificationCode(tripData.verification_code || '');
        // setTripStatus(tripData.status); // If you have a separate state for trip status
      }
    } else {
      // Handle other event types if the backend sends them
      console.log(`Received other WebSocket event: ${eventType}`);
    }
  } catch (error) {
    console.error('Error parsing WebSocket message:', error, event.data);
  }
    };

    // Inside startWebSocketConnection setup
rws.onclose = (event) => {
  console.log('WebSocket connection closed:', event.code, event.reason);
  setWebSocketStatus('closed');
  // IMPORTANT: The WebSocket closed. If the trip is *not* in a final state,
  // we need to start the polling fallback.
  // Check current screen or potentially fetch latest status via API first before polling.
  // For now, if screen is still 'assigning' or related to searching/active, and we have an active trip ID, start polling.
  // We'll pass the activeTripId to the polling function.
  // NEW: Only start polling if we are still in an intermediate state and polling isn't already active.
  if (activeTripId && !['driver-assigned', 'completed', 'cancelled', 'driver not found'].includes(screen) && !pollingIntervalId) { // NEW: Check pollingIntervalId
     console.log(`WebSocket closed, starting polling for trip ${activeTripId} as fallback.`);
     startPollingTripStatus(activeTripId);
  } else {
     console.log(`WebSocket closed, but not starting polling. Trip ID: ${activeTripId}, Screen: ${screen}, Polling Active: ${!!pollingIntervalId}`);
     // If screen is a final state, ensure polling is definitely stopped just in case.
     if (['driver-assigned', 'completed', 'cancelled', 'driver not found'].includes(screen)) {
         console.log("Screen indicates final state, ensuring polling is stopped.");
         stopPollingTripStatus(); // NEW: Ensure polling stops if closed event happens after final state
     }
  }
};

    rws.onerror = (error) => {
      console.error("WebSocket error:", error);
      // Error doesn't necessarily mean the connection is closed, but log it.
      // The library handles reconnection attempts.
      // You might want to update a UI status indicator if needed.
      // setWebSocketStatus('reconnecting'); // The library handles this internally, but you can track if desired.
    };

    // Store the connection instance
    setWebSocketConnection(rws);
    setWebSocketStatus("connecting"); // Update status while connecting
  };

  // NEW: Function to stop the WebSocket connection
  const stopWebSocketConnection = () => {
    if (webSocketConnection) {
      console.log("Manually stopping WebSocket connection.");
      webSocketConnection.close(); // This will trigger the onclose handler
      setWebSocketConnection(null);
      setWebSocketStatus("closed");
      stopPollingTripStatus();
    }
  };

  const fetchTripStatus = async (tripId: string) => {
    if (!tripId || !guestId) {
      // Ensure both tripId and guestId are available
      console.warn("fetchTripStatus called without a tripId or guestId");
      return;
    }
    try {
      console.log(
        `Polling trip status for ID: ${tripId} using guestId: ${guestId}`
      );
      // Use apiClient to call GET /trips/{id}
      // The apiClient (from src/lib/api.ts) is designed to add X-Guest-Id header if guestId is provided
      const response = await apiClient.get(`/trips/${tripId}`, true, guestId); // Pass isGuest=true and guestId

      // Remember, apiClient returns the JSON body directly for success
      if (response.status === "success" && response.data) {
        const trip = response.data; // This is the trip object from the API's { status: "...",  {...} }

        console.log(
          `Polled trip status: ${
            trip.status.value
          }, has driver: ${!!trip.driver}`
        );

        // Check the status and handle accordingly
        if (trip.status.value === "driver_assigned" && trip.driver) {
          // Driver found!
          console.log("Driver assigned via polling, updating UI.");
          setDriver(trip.driver);
          setScreen("driver-assigned"); // Transition to the next screen
          stopPollingTripStatus(); // Stop polling
          stopWebSocketConnection(); // Stop WebSocket if it was re-established during polling
        } else if (
          trip.status.value === "cancelled" ||
          trip.status.value === "completed"
        ) {
          // Trip is no longer active, stop polling and handle accordingly
          console.log(
            `Trip ${tripId} is now ${trip.status.value} via polling, stopping polling.`
          );
          setTripRequestStatus("error"); // Or a specific status like 'trip-cancelled'
          setTripRequestError(`Trip ${trip.status.label}.`); // Show status message
          stopPollingTripStatus(); // Stop polling
          stopWebSocketConnection(); // Stop WebSocket if it was re-established during polling
          // You might want to clear trip details and go back to booking or dashboard
        } else {
          // Trip is still searching or in another intermediate state via polling
          console.log(
            `Trip ${tripId} is still ${trip.status.value} via polling.`
          );
          // Continue polling
        }
      } else {
        // Handle API error response (e.g., status not "success"), e.g., trip not found (404)
        console.error(
          "Polling API responded with non-success status or missing ",
          response
        );
        // Decide: Stop polling? Retry? Log and continue?
        // For a 404 (trip not found), it might imply cancellation.
        // For other errors (500, etc.), maybe continue polling briefly.
        // For now, log and continue polling (assuming temporary issue or trip not yet visible).
        // You could add logic here to stop polling after N consecutive errors.
      }
    } catch (err) {
      // Handle network error or apiClient throwing an error
      console.error("Error polling trip status:", err);
      // Decide: Stop polling after a few errors? Or continue? Add retry logic?
      // For now, log and continue polling (assuming temporary network glitch).
      // Optionally, add retry logic or error count here.
    }
  };

  const startPollingTripStatus = (tripId: string) => {
    if (pollingIntervalId) {
      // Clear any existing polling interval to avoid duplicates
      clearInterval(pollingIntervalId);
    }

    console.log(
      `Starting polling for trip ${tripId} every 5 seconds (fallback).`
    );
    const interval = setInterval(() => {
      fetchTripStatus(tripId); // Pass the tripId to the fetch function
    }, 5000); // Poll every 5 seconds

    setPollingIntervalId(interval);
  };

  // NEW: Function to stop polling
  const stopPollingTripStatus = () => {
    if (pollingIntervalId) {
      console.log("Stopping trip status polling.");
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
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

  // NEW: Wait for hydration before rendering main content to avoid SSR/client mismatch
  if (!hasHydrated) {
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
    ); // Or a skeleton loader
  }

  // === Render current screen as main content ===
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
        onProceed={handleProceed}
        setShowPassengerDetails={setShowPassengerDetails}
        passengerData={passengerData}
        setPassengerData={setPassengerData}
        showPassengerDetails={showPassengerDetails}
        requirements={requirements}
        setRequirements={setRequirements}
        setPickupCoords={setPickupCoords} // NEW
        setDestinationCoords={setDestinationCoords} // NEW
      />
    );
  } else if (screen === "assigning") {
    mainContent = <AssigningScreen 
    status={tripRequestStatus}
    />;
  } else if (screen === "driver-assigned") {
    mainContent = (
      <DriverAssignedScreen
        pickup={pickup}
        destination={destination}
        driver={driver}
        verificationCode={verificationCode || ""} // NEW: Pass verification code
        onShowDirections={() => setShowDirections(true)}
        onShowDriverVerification={() => setShowDriverVerification(true)} // NEW: Handler for verification modal
        onStartTrip={handleTripStart}
        onBack={() => setScreen("booking")}
      />
    );
  } else if (screen === "trip-progress") {
    // NEW: Use the statically imported TripProgressScreen
    mainContent = (
      <TripProgressScreen
        driver={driver}
        onPanic={() => setShowPanic(true)}
        onComplete={handleTripComplete}
        pickupCoords={pickupCoords} // NEW: Pass coordinates
        destinationCoords={destinationCoords} // NEW: Pass coordinates
        tripProgress={tripProgress} // NEW: Pass progress
        // Remove canRenderMaps prop as it's no longer needed if using dynamic import for the screen was the main strategy
      />
    );
  } else if (screen === "trip-complete") {
    mainContent = (
      <TripCompleteScreen
        fareEstimate={fareEstimate}
        driver={driver}
        onRate={() => setShowRate(true)}
        onDone={() => {
          // NEW: Clear specific trip-related state before navigating
          setPickup("");
          setDestination("");
          setFareEstimate(null);
          setDriver(null);
          setTripProgress(0);
          setPickupCoords(null);
          setDestinationCoords(null);
          setVerificationCode(null); // NEW: Clear verification code
          // alert('was called');
          setGuestId(null); // NEW: Clear guest ID
          // Stop any potential polling/WebSocket if they were still running due to timing
          stopPollingTripStatus();
          stopWebSocketConnection();
          if (!token) {
            setScreen("dashboard");
          } else {
            // NEW: Instead of setting screen to 'signup-prompt', just set the showSignup state
            setScreen("booking");
            // setShowSignup(true);
          }
        }}
      />
    );
  } else if (screen === "dashboard") {
    // NEW: Render the DashboardScreen component
    mainContent = (
      <DashboardScreen
        passengerData={passengerData}
        walletBalance={walletBalance} // NEW: Pass wallet balance
        is2FAEnabled={is2FAEnabled} // NEW: Pass 2FA status
        onShowProfile={() => setShowProfile(true)}
        onBookNewTrip={() => {
          setScreen("booking");
          setPickup("");
          setDestination("");
          setFareEstimate(null);
          setPickupCoords(null);
          setDestinationCoords(null);
          setDriver(null);
          setTripProgress(0); // NEW: Reset trip progress
          setVerificationCode(null); // NEW: Reset verification code
        }}
        // NEW: Pass handlers for new dashboard features
        onShowTripHistory={() => setShowTripHistory(true)}
        onShowWallet={() => setShowWallet(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowEnable2FA={() => setShowEnable2FA(true)} // NEW: Handler for enabling 2FA
        onShowUpdateProfile={() => setShowUpdateProfile(true)} // NEW: Handler for updating profile
        onBookRide={() => setScreen("booking")}
        onProfile={() => setShowProfile(true)}
        onLogout={() => {}}
      />
    );
  }
  // NEW: Render new screens if their state is active (overlaying the dashboard or other screens if needed)
  // These are rendered *instead of* the main screen content when active.
  else if (showTripHistory) {
    mainContent = (
      <TripHistoryScreen
        onBack={() => setShowTripHistory(false)} // NEW: Handler to go back to dashboard
        onSelectTrip={(tripId) => {
          setSelectedTripId(tripId);
          setShowTripHistory(false); // Close history
          setShowTripDetails(true); // Open details
        }}
      />
    );
  } else if (showTripDetails && selectedTripId) {
    mainContent = (
      <TripDetailsScreen
        tripId={selectedTripId}
        onBack={() => {
          setShowTripDetails(false);
          setSelectedTripId(null); // Clear selected ID
          setShowTripHistory(true); // Optionally go back to history
        }}
      />
    );
  } else if (showWallet) {
    mainContent = (
      <WalletScreen
        balance={walletBalance} // NEW: Pass current balance
        onBack={() => setShowWallet(false)} // NEW: Handler to go back to dashboard
      />
    );
  } else if (showSettings) {
    mainContent = (
      <SettingsScreen
        onBack={() => setShowSettings(false)} // NEW: Handler to go back to dashboard
        onShowProfile={() => {
          setShowSettings(false);
          setShowProfile(true);
        }} // NEW: Navigate to profile from settings
        onShowEnable2FA={() => {
          setShowSettings(false);
          setShowEnable2FA(true);
        }} // NEW: Navigate to 2FA enable from settings
        onShowUpdateProfile={() => {
          setShowSettings(false);
          setShowUpdateProfile(true);
        }} // NEW: Navigate to profile update from settings
        // Add other handlers for settings options (notifications, help, etc.)
      />
    );
  }
  // Note: Removed the 'signup-prompt' screen render block as it's handled by the showSignup state and modal

  // === Return full UI tree including modals and notifications ===
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

          {/* Modals — all rendered as overlays */}
          <PassengerDetailsModal
            isOpen={showPassengerDetails}
            onClose={() => setShowPassengerDetails(false)}
            passengerData={passengerData}
            setPassengerData={setPassengerData}
            requirements={requirements}
            setRequirements={setRequirements}
            onRequestRide={handleRequestRide}
            isLoading={tripRequestStatus === "loading"}
          />

          {/* NEW: Dynamically imported DirectionsModal */}
          {hasHydrated && (
            <DirectionsModal
              isOpen={showDirections}
              onClose={() => setShowDirections(false)}
              pickup={pickup}
              pickupCoords={pickupCoords}
              destination={destination} // NEW
              destinationCoords={destinationCoords} // NEW
            />
          )}

          <PanicModal
            isOpen={showPanic}
            onClose={() => setShowPanic(false)}
            onComplete={() => {
              setShowPanic(false);
              alert("Safety team notified");
            }}
          />

          {!token &&
            showSignup && ( // Ensure it only shows for unauthenticated users
              <SignupPromptModal
                isOpen={showSignup} // Use showSignup state
                passengerData={passengerData}
                onClose={() => setShowSignup(false)} // Close the modal state
                onVerifyEmail={() => setShowOTP(true)} // Keep existing link to OTP
                onRegistrationSuccess={handleRegistrationSuccess} // NEW: Pass success handler
                onOpenLoginModal={() => setShowLogin(true)} // NEW: Pass handler to open login modal
                onSignup={() => {
                  // NEW: Handler for signup button in modal (e.g., navigate to register)
                  setShowSignup(false);
                  // You could navigate to a registration page or open the registration modal here
                  // For now, just close the prompt.
                }}
                onLogin={() => {
                  // NEW: Handler for login button in modal (e.g., open login modal)
                  setShowSignup(false);
                  // You could open a login modal here
                  // For now, just close the prompt.
                }}
                onContinueAsGuest={() => {
                  // NEW: Handler for continue as guest button (e.g., close modal, maybe navigate to dashboard)
                  setShowSignup(false);
                  setScreen("dashboard"); // Example: go to dashboard after trip
                }}
                onRegistrationSuccess={handleRegistrationSuccess} // NEW: Pass registration success handler
              />
            )}

          <OTPModal
            isOpen={showOTP}
            email={passengerData.email}
            onComplete={() => {
              setTimeout(() => {
                setScreen("dashboard");
                setShowOTP(false);
                setShowSignup(false);
              }, 1000);
            }}
            onClose={() => setShowOTP(false)}
          />

          <ProfileModal
            isOpen={showProfile}
            passengerData={passengerData}
            onClose={() => setShowProfile(false)}
            onLogout={() => {
              // Clear saved state on logout
              if (typeof window !== "undefined" && window.sessionStorage) {
                sessionStorage.removeItem("achrams_app_state");
              }
              window.location.href = "/auth/login";
            }}
          />

          {/* NEW: Trip Request Status Modal */}
          <TripRequestStatusModal
            isOpen={!!tripRequestStatus}
            status={tripRequestStatus}
            message={tripRequestError}
            onClose={() => {setTripRequestStatus(null)
              setScreen("booking")
            }}
            onConfirm={() => {
                if (tripRequestStatus === 'no-driver' || tripRequestStatus === 'error') {
                  // NEW: If status is 'no-driver' or 'error', retry the booking process
                  console.log("Retrying booking process...");
                  setTripRequestStatus(null); // Close the modal first
                  // NEW: Call the main booking function again to restart the flow
                  handleRequestRide();
                } else {
                  // For 'loading' or 'accepted' states, just close the modal
                  setTripRequestStatus(null);
                }}}
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
            onLoginSuccess={handleLoginSuccess} // NEW: Pass success handler
          />

          {/* NEW: Modals for dashboard features */}
          {showEnable2FA && (
            <Enable2FAModal
              isOpen={showEnable2FA}
              onClose={() => setShowEnable2FA(false)}
              onSuccess={handle2FAEnabled} // NEW: Pass success handler
            />
          )}
          {showDisable2FA && (
            <Disable2FAModal
              isOpen={showDisable2FA}
              onClose={() => setShowDisable2FA(false)}
              onSuccess={handle2FADisabled} // NEW: Pass success handler
            />
          )}
          {showUpdateProfile && (
            <UpdateProfileModal
              isOpen={showUpdateProfile}
              initialData={passengerData} // Pass current data as initial values
              onClose={() => setShowUpdateProfile(false)}
              onSuccess={handleProfileUpdated} // NEW: Pass success handler
            />
          )}

          {/* Future: Uncomment when implemented */}
          <CancelModal
            isOpen={showCancel}
            onClose={() => setShowCancel(false)}
            onConfirm={() => {}}
          />
          {showRate && (
            <RateModal
              isOpen={showRate}
              onClose={() => setShowRate(false)}
              onRate={handleRateSubmit} // Assuming you have a function to handle API call
              driverName={driver?.name}
              // NEW: Pass the notification setter as setNotification
              setNotification={setCurrentNotification} // Use setCurrentNotification
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
          walletBalance={walletBalance} // Pass balance for potential icon badge
          onHomeClick={() => setScreen("booking")} // Example: Home click books new trip
          onWalletClick={() => setShowWallet(true)} // NEW: Link wallet click
          onSearchClick={() => setShowTripHistory(true)} // Example: Link search to history
          // Add other handlers for new nav items if needed
        />
      )}
    </>
  );
}
