"use client";

import { useEffect, useState, useRef } from "react";
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
  any;
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
}

const saveAppState = (state: PersistedState) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem("achrams_app_state", JSON.stringify(state));
      console.log("App state saved to sessionStorage");
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

  const activeTripIdRef = useRef(activeTripId);
  const screenRef = useRef(screen);
  const pollingIntervalIdRef = useRef(pollingIntervalId);

  useEffect(() => {
    activeTripIdRef.current = activeTripId;
  }, [activeTripId]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    pollingIntervalIdRef.current = pollingIntervalId;
  }, [pollingIntervalId]);

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showPanic, setShowPanic] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [signupDataForOtp, setSignupDataForOtp] = useState<PassengerData | null>(null);
  const [signupPasswordForOtp, setSignupPasswordForOtp] = useState<string>('');
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





  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedState = loadAppState();
      let didLoadFromStorage = false;
      if (savedState) {
        try {
          setScreen(savedState.screen);
          setPickup(savedState.pickup || " ");
          setDestination(savedState.destination || " ");
          setFareEstimate(savedState.fareEstimate || null);
          setTripProgress(savedState.tripProgress || 0);
          setPickupCoords(savedState.pickupCoords || null);
          setDestinationCoords(savedState.destinationCoords);
          setVerificationCode(savedState.verificationCode || null);
          setActiveTripId(savedState.activeTripId || null);
          setGuestId(savedState.guestId || null);
          didLoadFromStorage = true;
        } catch (e) {
          console.error("Failed to load app state from sessionStorage:", e);
        }
      }

      const loadedScreen = didLoadFromStorage
        ? savedState?.screen || null
        : null;

      setHasHydrated(true);
    }
  }, []);
  const initialLoadedScreenRef = useRef<ScreenState | null>(null);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }

    console.log(
      "Checking if connection needs restart. Current screen:",
      screen,
      "Current activeTripId:",
      activeTripId,
      "Current guestId:",
      guestId
    );

    console.log(
      "Checking if connection needs restart. Current screen:",
      screen,
      "Current activeTripId:",
      activeTripId,
      "Current guestId:",
      guestId
    );

    const screensRequiringConnection: ScreenState[] = [
      "assigning",
      "driver-assigned",
      "trip-progress",
    ];
    if (screensRequiringConnection.includes(screen)) {
      if (activeTripId && guestId) {
        console.log(
          `Screen ${screen} requires connection. Attempting to restart WebSocket with guestId: ${guestId}, tripId: ${activeTripId}`
        );
        startWebSocketConnection(guestId, activeTripId);
      } else {
        console.warn(
          `Screen ${screen} requires connection, but activeTripId (${activeTripId}) or guestId (${guestId}) is missing. Cannot restart connection.`
        );
      }
    } else {
      console.log(
        `Screen ${screen} does not require connection. Ensuring WebSocket and polling are stopped.`
      );
      stopWebSocketConnection();
      stopPollingTripStatus();
    }

    const savedState = loadAppState();
    const wasStateLoaded = !!savedState;
    const loadedScreen = wasStateLoaded ? savedState.screen : null;

    console.log(
      "Hydration and Auth check complete. isAuthenticated:",
      isAuthenticated
    );
    console.log("Was state loaded from storage?", wasStateLoaded);
    console.log("Loaded screen was:", loadedScreen);

    const sessionScreens: ScreenState[] = [
      "assigning",
      "driver-assigned",
      "trip-progress",
      "trip-complete",
    ];

    const guestScreens: ScreenState[] = ["booking"];

    if (wasStateLoaded && loadedScreen) {
      console.log(
        `State was loaded from storage with screen: ${loadedScreen}. Preserving loaded state.`
      );
      return;
    }

    if (isAuthLoading) {
      console.log(
        "Authentication is still loading, keeping screen as null or showing a loader."
      );
      return () => {};
    }

    if (isAuthenticated) {
      console.log(
        "No state loaded, user is authenticated, setting screen to 'dashboard'."
      );
      setScreen("dashboard");
    } else {
      console.log(
        "No state loaded, user is not authenticated, setting screen to 'booking'."
      );
      setScreen("booking");
    }
  }, [hasHydrated, isAuthenticated, isAuthLoading]);

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
  useEffect(() => {
    if (screen === "trip-complete") {
      if (token) {
      } else {
        const timer = setTimeout(() => {
          setShowSignup(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [screen, token]);


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
    // if (screen === "trip-progress") {
    //   const timer = setInterval(() => {
    //     setTripProgress((prev) => {
    //       if (prev >= 100) {
    //         clearInterval(timer);
    //         return 100;
    //       }
    //       return prev + 2;
    //     });
    //   }, 1000);
    //   return () => clearInterval(timer);
    // }
  }, [screen, driver]);
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
    hasHydrated,
  ]);

  const handleRegistrationSuccess = (email: string) => {
    setScreen("dashboard");
    setShowSignup(false);
  };

  const handleLoginSuccess = () => {
    console.log(
      "login successful, Authcontext should update. Screen will update via useEffect"
    );
    showNotification("Welcome Back!", "success");
    // setScreen('dashboard')
  };

  const handleLogoutSuccess = () => {
    console.log(
      "Logout successful, Authcontext should update. Screen will update via useEffect"
    );

    showNotification("You have been logged out.", "info");
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
    setTripRequestStatus("loading");
    try {
      let airportId: string | null = null;

      if (pickup.startsWith("Use my current location")) {
        const nearestAirports = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );

        if (!nearestAirports || !nearestAirports.length) {
          setTripRequestStatus("error");
          setTripRequestError(
            "You’re outside our service area. Booking not available from this location."
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

      if (!pickupId) {
        console.error("Airport ID not available for booking.");
        showNotification(
          "Failed to confirm pickup location. Please try again,",
          "error"
        );
        return;
      }

      const tripData = {
        amount: {
          amount: fareEstimate?.toString() || "0",
          currency: "NGN",
        },
        airport: pickupId,
        guest_name: passengerData.name,
        guest_email: passengerData.email,
        guest_phone: formatPhoneNumber(passengerData.phone),
        has_extra_leg_room: requirements.elderly,
        has_extra_luggage: requirements.luggage,
        has_wheel_chair_access: requirements.wheelchair,
        pickup_address: pickup,
        pickup_location: pickupCoords,
        destination_address: destination,
        destination_location: destinationCoords,
      };

      console.log("Request Data:", tripData);

      const response = await apiClient.post("/trips/guest-booking", tripData);

      console.log("Raw API Response:", response);

      if (response.status === "success" && response.data) {
        const trip = response.data;
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
        console.log("Trip ID: ", trip.id);

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
          setTripRequestError(`Unexpected booking state: ${trip.status.label}`);
        }
      } else {
        console.error(
          "API responded with non-success status or missing data:",
          response
        );
        let errorMessage =
          "Failed to book your trip. Server responded unexpectedly.";
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
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Guest booking error:", err);
      setTripRequestStatus("error");

      let errorMessage =
        "Failed to book your trip. Please check your connection and try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        console.error("Unexpected error type caught:", typeof err, err);
        errorMessage = "An unexpected error occurred during booking.";
      }

      setTripRequestError(errorMessage);
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

  const startWebSocketConnection = (guestId: string, tripId: string) => {
    if (webSocketConnection) {
      console.log("Closing existing WebSocket connection.");
      webSocketConnection.close();
    }

    const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?guest_id=${guestId}`;
    console.log(`Attempting to connect to WebSocket: ${wsUrl}`);

    const rws = new ReconnectingWebSocket(wsUrl, [], {
      connectionTimeout: 10000,
      maxRetries: 10,
      maxReconnectionDelay: 10000,
    });

    rws.onopen = () => {
      console.log("WebSocket connection opened.");
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
            setDriver(null);
            setTripProgress(0);
            setVerificationCode(null);
            if (tripData.status.value === "completed") {
              setScreen("trip-complete");
              showNotification("Trip completed successfully", "info");
            } else if (tripData.status.value === "cancelled") {
              showNotification("Trip was cancelled successfully", "info");
              setScreen("booking");
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
            console.warn("Invalid driver location data received:", payload);
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
      const currentPollingId = pollingIntervalIdRef.current;
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
        // startPollingTripStatus(guestId);
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

  const fetchTripStatus = async (tripId: string) => {
    if (!tripId || !guestId) {
      console.warn("fetchTripStatus called without a tripId or guestId");
      return;
    }
    try {
      console.log(
        `Polling trip status for ID: ${tripId} using guestId: ${guestId}`
      );
      const response = await apiClient.get(
        `/trips/${tripId}`,
        undefined,
        true,
        guestId
      );
      if (response.status === "success" && response.data) {
        const trip = response.data;
        console.log(
          `Polled trip status: ${trip.status.value}, has driver: !!${trip.driver}`
        );

        if (trip.status.value === "active") {
          setScreen("trip-progress");
        }

        if (trip.status.value === "driver not found") {
          console.log(
            `Trip ${tripId} is now ${trip.status.value} via polling, stopping polling.`
          );
          stopPollingTripStatus();
          stopWebSocketConnection();
          setTripRequestStatus("no-driver");
          return;
        }

        if (
          (trip.status.value === "accepted" ||
            trip.status.value === "driver_assigned") &&
          trip.driver
        ) {
          console.log("Driver assigned via polling, updating UI.");
          setDriver(trip.driver);
          setScreen("driver-assigned");
          stopPollingTripStatus();
          stopWebSocketConnection();
          return;
        } else if (
          trip.status.value === "cancelled" ||
          trip.status.value === "completed"
        ) {
          console.log(
            `Trip ${tripId} is now ${trip.status.value} via polling, stopping polling.`
          );
          if (trip.status.value === "completed") {
            showNotification("Trip Completed", "info");
          }
          if (trip.status.value === "cancelled") {
            showNotification("Trip was cancelled", "error");
          }

          setTripRequestStatus(null);
          stopPollingTripStatus();
          stopWebSocketConnection();
          setScreen("booking");
          return;
        } else {
          console.log(
            `Trip ${tripId} is still ${trip.status.value} via polling.`
          );
        }
      } else {
        console.error(
          "Polling API responded with non-success status or missing ",
          response
        );
      }
    } catch (err) {
      console.error("Error polling trip status:", err);
    }
  };

  const startPollingTripStatus = (tripId: string) => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
    }

    console.log(
      `Starting polling for trip ${tripId} every 5 seconds (fallback).`
    );
    const interval = setInterval(() => {
      fetchTripStatus(tripId);
    }, 5000);
    setPollingIntervalId(interval);
  };

  const stopPollingTripStatus = () => {
    if (pollingIntervalId) {
      console.log(
        `Stopping trip status polling. with interval ID: ${pollingIntervalId}`
      );
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

    if (!guestId) {
      console.error("Cannot cancel trip: guestId is missing.");
      console.log("Current guestId state:", guestId);
      showNotification("Unable to cancel trip. Session expired.", "error");
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

      console.log("Guest Id: ", guestId);
      const response = await apiClient.post(
        `/trips/${guestId}/cancel`,
        cancelRequestBody,
        undefined,
        guestId
      );

      if (response.status === "success" && response.data) {
        console.log("Trip cancelled successfully:", response.data);
        showNotification("Trip cancelled successfully.", "success");

        stopWebSocketConnection();
        stopPollingTripStatus();

        setDriver(null);
        setActiveTripId(null);
        setGuestId(null);
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

  const handleSignupInitiateSuccess = (data: {name: string;
  email: string;
  phone: string;
  password: string;}, countdown: number) =>{
    const {name, email, phone, password} = data;

    const signupData = {name, email, phone}
                  setSignupDataForOtp(signupData);
                  setPassengerData({name, phone, email})
                  console.log("setting passenger data:", {name, email, phone})
    setSignupPasswordForOtp(password);
    setInitialOtpCountdown(countdown);
    setShowSignup(false); // Close signup modal
    setShowOTP(true);  
  
  }


  const handleResendOtp = async (data: { name: string; phone: string; email: string; password: string }): Promise<number> => {
    console.log("Resending OTP for email:", data.email);

    try {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/passenger/onboard/initiate', {
        email: data.email,
        phone_number: data.phone, // Use the phone from the stored signup data
        first_name: firstName,    // Use the parsed name from the stored signup data
        last_name: lastName,
        password: data.password,       // Use the password stored during signup
      });

      console.log("Resend OTP Response:", response);

      if (response.status === "success" && response.data?.countdown) {
        // Return the new countdown received from the API
        console.log("New OTP sent, new countdown:", response.data.countdown);
        showNotification("New OTP sent, new countdown", "info")
        return response.data.countdown;
      } else {
        // Handle potential API error responses that still have status 200
        const errorMessage = response.message || 'Failed to resend OTP. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Resend OTP Error:", err);
      let errorMessage = 'An unexpected error occurred while resending OTP.';
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

  if (!hasHydrated || isAuthLoading) {
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
      />
    );
  } else if (screen === "trip-complete") {
    mainContent = (
      <TripCompleteScreen
        fareEstimate={fareEstimate}
        driver={driver}
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
          setGuestId(null);
          stopPollingTripStatus();
          stopWebSocketConnection();
          // setDriverLiveLocation(null);
          if (!token) {
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
            guestId={guestId}
            currentLocationAddress={pickup}
            currentLocationCoords={pickupCoords || [0, 0]}
            tripId={activeTripId || ""}
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
            initialSignupData ={{...passengerData, password: signupPasswordForOtp}}
            onComplete={() => {
              setScreen("dashboard");
              setShowOTP(false);
              setSignupPasswordForOtp('')
            }}
            onClose={() => {
              console.log('onclose button was clicked')
              setShowOTP(false)
              setSignupPasswordForOtp('')
            }

            }
            onResendOtp={handleResendOtp} // Pass the stored password
    
          />

          <ProfileModal
            isOpen={showProfile}
            passengerData={passengerData}
            onClose={() => setShowProfile(false)}
            onLogout={() => {
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
            onClose={() => {
              setTripRequestStatus(null);
              setScreen("booking");
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
              guestId={guestId}
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
