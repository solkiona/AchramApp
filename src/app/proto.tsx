// src/app/page.tsx
"use client";

import { useEffect, useState, useRef } from "react"; // Added useRef for WebSocket instance if needed outside state
import { useAuth } from "@/contexts/AuthContext";
import BookingScreen from "@/components/app/screens/BookingScreen";
import AssigningScreen from "@/components/app/screens/AssigningScreen"; // NEW: Import AssigningScreen
import DriverAssignedScreen from "@/components/app/screens/DriverAssignedScreen";
import TripProgressScreen from "@/components/app/screens/TripProgressScreen";
import TripCompleteScreen from "@/components/app/screens/TripCompleteScreen";
import DashboardScreen from "@/components/app/screens/DashboardScreen";
import PassengerDetailsModal from "@/components/app/modals/PassengerDetailsModal";
import OTPModal from "@/components/app/modals/OTPModal";
import ProfileModal from "@/components/app/modals/ProfileModal";
import SignupPromptModal from "@/components/app/modals/SignupPromptModal";
import TripRequestStatusModal from "@/components/app/modals/TripRequestStatusModal";
import DirectionsModal from "@/components/app/modals/DirectionsModal"; // Dynamically imported
import DriverVerificationModal from "@/components/app/modals/DriverVerificationModal";
import PanicModal from "@/components/app/modals/PanicModal";
import RateModal from "@/components/app/modals/RateModal";
import MessageWindowModal from "@/components/app/modals/MessageWindowModal";
import TripUpdateNotification from "@/components/app/ui/TripUpdateNotification";
import BottomNavBar from "@/components/app/ui/BottomNavBar";
import { findNearestAirport, KNOWN_AIRPORTS } from "@/lib/airports";
import ReconnectingWebSocket from 'reconnecting-websocket'; // NEW: Import the library
import { apiClient } from "@/services/apiClient"; // NEW: Import apiClient

// NEW: Define types for trip status if not already defined elsewhere
type TripStatusValue = "searching" | "driver_assigned" | "accepted" | "active" | "completed" | "cancelled" | "driver not found"; // Added "driver not found"
type TripStatus = {
  label: string;
  value: TripStatusValue;
};

// NEW: Define types for the WebSocket message
type WebSocketMessage = {
  event: 'trip:assigned' | 'trip:status:update' | string; // Add other potential events
   any; // This will be the trip object
};

// Types
type ScreenState =
  | "booking"
  | "assigning" // NEW: Add assigning screen state
  | "driver-assigned"
  | "trip-progress"
  | "trip-complete"
  | "dashboard";

type Requirements = {
  luggage: boolean;
  wheelchair: boolean;
  elderly: boolean; // Assuming this maps to has_extra_leg_room
};

type PassengerData = {
  name: string;
  phone: string;
  email: string;
};

// NEW: Define persisted state type including new states
type PersistedState = {
  screen: ScreenState;
  pickup: string;
  destination: string;
  fareEstimate: number | null;
  driver: any; // Consider defining a Driver type
  tripProgress: number;
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  verificationCode: string | null; // NEW: Persist verification code
  // Add other states you want to persist
};

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
      const item = sessionStorage.getItem("achrams_app_state");
      if (item) {
        const parsed = JSON.parse(item) as PersistedState;
        console.log("App state loaded from sessionStorage:", parsed); // Optional: For debugging
        return parsed;
      }
    } catch (e) {
      console.error("Failed to load app state from sessionStorage", e);
    }
  }
  return null;
};

export default function ACHRAMApp() {
  // NEW: Use a state variable to track if we have checked sessionStorage on the client
  const [hasHydrated, setHasHydrated] = useState(false);

  // NEW: Define state variables without initial values from loadAppState here
  const [screen, setScreen] = useState<ScreenState>("booking"); // Will be set after hydration
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [tripProgress, setTripProgress] = useState<number>(0);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null); // NEW: State for verification code
  // NEW: State for guest booking specific data
  const [guestId, setGuestId] = useState<string | null>(null); // NEW: Store guest ID
  const [activeTripId, setActiveTripId] = useState<string | null>(null); // NEW: Store active trip ID (from booking response)
  // NEW: State for WebSocket connection
  const [webSocketConnection, setWebSocketConnection] = useState<ReconnectingWebSocket | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<'connecting' | 'open' | 'closed' | 'reconnecting'>('closed');
  // NEW: State for polling fallback
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);

  // Modals - State
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showSignup, setShowSignup] = useState(false); // NEW: Use this state instead of screen === 'signup-prompt'
  const [showDirections, setShowDirections] = useState(false); // NEW: State for directions modal
  const [showDriverVerification, setShowDriverVerification] = useState(false); // NEW: State for verification modal
  const [showPanic, setShowPanic] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [showMessage, setShowMessage] = useState(false);

  // NEW: State for trip request status modal
  const [tripRequestStatus, setTripRequestStatus] = useState<'loading' | 'accepted' | 'no-driver' | 'error' | null>(null);
  const [tripRequestError, setTripRequestError] = useState<string | null>(null);

  // NEW: State for notifications
  const [currentNotification, setCurrentNotification] = useState<{ message: string; type: 'info' | 'success' | 'warning' | 'error' } | null>(null);

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
        setVerificationCode(savedState.verificationCode); // NEW: Load verification code
        // Load other persisted states if added
      }
      // Mark hydration as complete after loading/saving default state
      setHasHydrated(true);
    }
  }, []);

  // NEW: Effect to save state whenever it changes (only runs on client after hydration)
  useEffect(() => {
    if (hasHydrated) { // Only save after initial state has been loaded/set
      const stateToSave: PersistedState = {
        screen,
        pickup,
        destination,
        fareEstimate,
        driver,
        tripProgress,
        pickupCoords,
        destinationCoords,
        verificationCode, // NEW: Persist verification code
        // Persist other states if added
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
    verificationCode, // NEW: Add to dependency array
    hasHydrated, // Include hydration flag to prevent saving before state is loaded
  ]);

  // NEW: Effect to handle active trip resumption and initial profile load
  useEffect(() => {
    const fetchProfileAndCheckActiveTrip = async () => {
      if (hasHydrated && token) { // Only run if hydrated and token exists
        try {
          // Simulate profile fetch (replace with actual API call if needed)
          // Example: const profileData = await apiClient.get('/profile');
          // setWalletBalance(profileData.wallet_balance);
          // setIs2FAEnabled(profileData.is_2fa_enabled);
          // setActiveTripId(profileData.active_trip_id); // Example: get active trip ID from profile

          // For now, simulate with mock data after a short delay
          setTimeout(() => {
            // setWalletBalance(5000); // Mock balance
            // setIs2FAEnabled(false); // Mock 2FA status
            // setActiveTripId(null); // Mock active trip ID - assume no active trip for this example
          }, 500); // Simulate API delay
        } catch (err) {
          console.error("Failed to fetch user profile:", err);
          // NEW: Optionally show an error notification
          setCurrentNotification({ message: 'Failed to load profile data.', type: 'error' });
          setTimeout(() => setCurrentNotification(null), 5000);
        }
      }
    };

    fetchProfileAndCheckActiveTrip();
  }, [token, hasHydrated]); // Depend on token and hydration state

  // NEW: Effect to handle screen-specific logic (e.g., showing signup prompt after trip completion for guests)
  useEffect(() => {
    if (hasHydrated && screen === "trip-complete" && !token) {
      // Delay showing the signup prompt to allow trip completion screen to render first
      const timer = setTimeout(() => {
        setShowSignup(true); // NEW: Trigger the signup modal for guests
      }, 1500); // Delay matches the original effect
      return () => clearTimeout(timer);
    }
  }, [screen, token, hasHydrated]); // Depend on screen, token, and hydration state only

  // NEW: Function to handle OTP verification success (e.g., from OTPModal)
  const handleOTPVerified = () => {
    setShowOTP(false);
    // Logic after OTP verification (e.g., proceed with booking if guest, navigate to dashboard if registered)
    // For guest booking flow, this might just close the OTP modal.
    // For registration flow, it might fetch profile and set token.
    // Assuming guest booking doesn't require OTP for initial request, this might be for login/registration.
    // For the current guest booking flow, this might be less relevant unless OTP is needed for confirmation.
    // Let's assume for now it just closes the modal for a registration scenario.
    // If OTP is needed for guest booking confirmation later, add logic here.
  };

  // NEW: Function to handle profile update success (e.g., from ProfileModal)
  const handleProfileUpdated = () => {
    setShowProfile(false);
    // Optionally, refetch profile data here if needed immediately
  };

  // NEW: Handler passed to SignupPromptModal for successful registration (e.g., open OTP)
  const handleRegistrationSuccess = (email: string) => {
    // Optionally, store the email for OTP verification if needed
    // setCurrentOTPVerificationEmail(email); // If you have such state
    setShowSignup(false); // Close the signup prompt modal
    setShowOTP(true); // Open the OTP modal
  };

  // NEW: Function to show notifications (if not already present)
  const showNotification = (message: string, type: 'info' | 'success' | 'warning' | 'error') => {
    setCurrentNotification({ message, type });
    setTimeout(() => {
      setCurrentNotification(null);
    }, 5000); // Auto-dismiss after 5 seconds
  };

  // NEW: Modified handleRequestRide with real API call integration, WebSocket, and polling fallback
  
  // NEW: Function to establish WebSocket connection
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
    const wsUrl = `wss://api.achrams.com.ng/v1/app?guest_id=${guestId}`;

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
      console.log('WebSocket connection opened.');
      setWebSocketStatus('open');
      // If polling was running as a fallback, stop it now that WS is open
      stopPollingTripStatus();
    };

    rws.onmessage = (event) => {
      try {
        const messageData: WebSocketMessage = JSON.parse(event.data);
        console.log('Received WebSocket message:', messageData);

        const { event: eventType, data: tripData } = messageData;

        // Check if it's a relevant trip update event
        if (eventType === 'trip:assigned' || eventType === 'trip:status:update') {
          // Update UI state based on the received trip data
          if (tripData.status.value === 'driver_assigned' && tripData.driver) {
            console.log("Driver assigned via WebSocket, updating UI.");
            setDriver(tripData.driver);
            setScreen('driver-assigned');
            stopWebSocketConnection(); // Stop WebSocket as trip is assigned
            stopPollingTripStatus(); // Ensure polling is also stopped
            // No need to start polling here, as trip is assigned.
          } else if (tripData.status.value === 'cancelled' || tripData.status.value === 'completed') {
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

    rws.onclose = (event) => {
      console.log('WebSocket connection closed:', event.code, event.reason);
      setWebSocketStatus('closed');
      // IMPORTANT: The WebSocket closed. If the trip is *not* in a final state,
      // we need to start the polling fallback.
      // Check current screen or potentially fetch latest status via API first before polling.
      // For now, if screen is still 'assigning' or related to searching/active, and we have an active trip ID, start polling.
      // We'll pass the activeTripId to the polling function.
      if (activeTripId && !['driver-assigned', 'completed', 'cancelled'].includes(screen)) {
         console.log(`WebSocket closed, starting polling for trip ${activeTripId} as fallback.`);
         startPollingTripStatus(activeTripId);
      }
    };

    rws.onerror = (error) => {
      console.error('WebSocket error:', error);
      // Error doesn't necessarily mean the connection is closed, but log it.
      // The library handles reconnection attempts.
      // You might want to update a UI status indicator if needed.
      // setWebSocketStatus('reconnecting'); // The library handles this internally, but you can track if desired.
    };

    // Store the connection instance
    setWebSocketConnection(rws);
    setWebSocketStatus('connecting'); // Update status while connecting
  };

  // NEW: Function to stop the WebSocket connection
  const stopWebSocketConnection = () => {
    if (webSocketConnection) {
      console.log("Manually stopping WebSocket connection.");
      webSocketConnection.close(); // This will trigger the onclose handler
      setWebSocketConnection(null);
      setWebSocketStatus('closed');
    }
  };

  // NEW: Function to fetch the current trip status using apiClient (for polling fallback)
  const fetchTripStatus = async (tripId: string) => {
    if (!tripId || !guestId) { // Ensure both tripId and guestId are available
      console.warn("fetchTripStatus called without a tripId or guestId");
      return;
    }
    try {
      console.log(`Polling trip status for ID: ${tripId} using guestId: ${guestId}`);
      // Use apiClient to call GET /trips/{id}
      // The apiClient (from src/lib/api.ts) is designed to add X-Guest-Id header if guestId is provided
      const response = await apiClient.get(`/trips/${tripId}`, true, guestId); // Pass isGuest=true and guestId

      // Remember, apiClient returns the JSON body directly for success
      if (response.status === "success" && response.data) {
        const trip = response.data; // This is the trip object from the API's { status: "...",  {...} }

        console.log(`Polled trip status: ${trip.status.value}, has driver: ${!!trip.driver}`);

        // Check the status and handle accordingly
        if (trip.status.value === "driver_assigned" && trip.driver) {
          // Driver found!
          console.log("Driver assigned via polling, updating UI.");
          setDriver(trip.driver);
          setScreen("driver-assigned"); // Transition to the next screen
          stopPollingTripStatus(); // Stop polling
          stopWebSocketConnection(); // Stop WebSocket if it was re-established during polling
        } else if (trip.status.value === "cancelled" || trip.status.value === "completed") {
          // Trip is no longer active, stop polling and handle accordingly
          console.log(`Trip ${tripId} is now ${trip.status.value} via polling, stopping polling.`);
          setTripRequestStatus("error"); // Or a specific status like 'trip-cancelled'
          setTripRequestError(`Trip ${trip.status.label}.`); // Show status message
          stopPollingTripStatus(); // Stop polling
          stopWebSocketConnection(); // Stop WebSocket if it was re-established during polling
          // You might want to clear trip details and go back to booking or dashboard
        } else {
            // Trip is still searching or in another intermediate state via polling
            console.log(`Trip ${tripId} is still ${trip.status.value} via polling.`);
            // Continue polling
        }
      } else {
        // Handle API error response (e.g., status not "success"), e.g., trip not found (404)
        console.error("Polling API responded with non-success status or missing ", response);
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

  // NEW: Function to start polling
  const startPollingTripStatus = (tripId: string) => {
    if (pollingIntervalId) {
      // Clear any existing polling interval to avoid duplicates
      clearInterval(pollingIntervalId);
    }

    console.log(`Starting polling for trip ${tripId} every 5 seconds (fallback).`);
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

  // NEW: Effect to clean up WebSocket and polling when the component unmounts
  useEffect(() => {
    return () => {
      console.log("Cleaning up WebSocket and polling intervals on unmount.");
      stopWebSocketConnection();
      stopPollingTripStatus();
    };
  }, []); // Empty dependency array means this runs on mount and unmount only

  // NEW: Add the phone number formatter helper function inside your component
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
          {/* Loading spinner or placeholder */}
          <div className="w-16 h-16 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  // NEW: Determine main content based on screen state
  let mainContent = null;

  if (screen === "booking") {
    mainContent = (
      <BookingScreen
        pickup={pickup}
        destination={destination}
        fareEstimate={fareEstimate}
        setPickup={setPickup}
        setDestination={setDestination}
        setFareEstimate={setFareEstimate}
        onShowDirections={() => setShowDirections(true)} // NEW: Handler to show directions modal
        onProceed={() => setShowPassengerDetails(true)}
        setPickupCoords={setPickupCoords} // NEW
        setDestinationCoords={setDestinationCoords} // NEW
      />
    );
  } else if (screen === "assigning") { // NEW: Render AssigningScreen
    mainContent = <AssigningScreen />;
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
    mainContent = (
      <TripProgressScreen
        driver={driver}
        onPanic={() => setShowPanic(true)}
        onComplete={handleTripComplete}
        pickupCoords={pickupCoords} // NEW: Pass coordinates
        destinationCoords={destinationCoords} // NEW: Pass coordinates
        tripProgress={tripProgress} // NEW: Pass progress
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
          setActiveTripId(null); // NEW: Clear active trip ID
          setGuestId(null); // NEW: Clear guest ID
          // Stop any potential polling/WebSocket if they were still running due to timing
          stopPollingTripStatus();
          stopWebSocketConnection();
          if (!token) {
            setScreen("dashboard");
          } else {
             // If authenticated, maybe navigate to dashboard or history
             setScreen("dashboard");
          }
        }}
      />
    );
  } else if (screen === "dashboard") {
    mainContent = (
      <DashboardScreen
        onBookRide={() => setScreen("booking")}
        onProfile={() => setShowProfile(true)}
        onLogout={() => {}} // NEW: Placeholder for logout logic
      />
    );
  }

  return (
    <div className="flex flex-col h-screen bg-achrams-bg-primary overflow-hidden">
      {/* NEW: Trip Request Status Modal */}
      <TripRequestStatusModal
        isOpen={!!tripRequestStatus}
        status={tripRequestStatus}
        message={tripRequestError}
        onClose={() => setTripRequestStatus(null)}
        onConfirm={() => {
          if (tripRequestStatus === 'error') {
            setTripRequestStatus(null); // Close error modal
            // Optionally, reset booking flow or allow retry
            // For now, just close the modal.
          }
        }}
      />

      {/* NEW: Notification Display */}
      {currentNotification && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 max-w-xs w-full p-4 rounded-lg shadow-lg ${
          currentNotification.type === 'info' ? 'bg-blue-100 text-blue-800' :
          currentNotification.type === 'success' ? 'bg-green-100 text-green-800' :
          currentNotification.type === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
        } flex items-start gap-2 z-50 animate-fadeInUp`}>
          <div className={`flex-shrink-0 mt-0.5 ${
            currentNotification.type === 'info' ? 'text-blue-500' :
            currentNotification.type === 'success' ? 'text-green-500' :
            currentNotification.type === 'warning' ? 'text-yellow-500' : 'text-red-500'
          }`}>
            {/* Add appropriate icon based on type if needed */}
          </div>
          <div className="flex-1">
            {currentNotification.message}
          </div>
          <button
            onClick={() => setCurrentNotification(null)}
            className="flex-shrink-0 ml-2"
          >
            {/* Add close icon */}
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {mainContent}
      </div>

      {/* Modals */}
      <PassengerDetailsModal
        isOpen={showPassengerDetails}
        passengerData={passengerData}
        setPassengerData={setPassengerData}
        requirements={requirements}
        setRequirements={setRequirements}
        onClose={() => setShowPassengerDetails(false)}
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
          destination={destination}
          destinationCoords={destinationCoords}
        />
      )}
      <DriverVerificationModal
        isOpen={showDriverVerification}
        verificationCode={verificationCode || ""} // Pass the code, default to empty string if null
        onClose={() => setShowDriverVerification(false)}
      />
      <PanicModal
        isOpen={showPanic}
        onClose={() => setShowPanic(false)}
        onComplete={() => {
          setShowPanic(false);
          alert("Safety team notified");
        }}
      />
      {token && ( // Show signup prompt only for unauthenticated users after trip completion
        <>
          <OTPModal
            isOpen={showOTP}
            onClose={() => setShowOTP(false)}
            onComplete={handleOTPVerified} // NEW: Pass the verification handler
          />
          <ProfileModal
            isOpen={showProfile}
            onClose={() => setShowProfile(false)}
            onSuccess={handleProfileUpdated} // NEW: Pass success handler
          />
        </>
      )}
      {!token && showSignup && ( // Ensure it only shows for unauthenticated users
        <SignupPromptModal
          isOpen={showSignup}
          passengerData={passengerData} // Pass collected data
          onClose={() => setShowSignup(false)}
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
      {showRate && (
        <RateModal
          isOpen={showRate}
          onClose={() => setShowRate(false)}
          onRate={handleRateSubmit} // Assuming you have a function to handle API call
        />
      )}
       {showMessage && (
        <MessageWindowModal
          isOpen={showMessage}
          onClose={() => setShowMessage(false)}
          recipientName={driver?.name || "Driver"} // Example: default to "Driver"
        />
      )}

      {/* NEW: Conditionally render BottomNavBar based on screen */}
      {["dashboard", "booking", "trip-progress", "trip-complete"].includes(screen) && (
        <BottomNavBar
          currentScreen={screen}
          onNavigate={(newScreen) => setScreen(newScreen as ScreenState)}
          isAuthenticated={!!token} // Pass auth status if needed by NavBar
        />
      )}
    </div>
  );
}