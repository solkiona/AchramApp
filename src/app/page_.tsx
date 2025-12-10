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

const readTripContextFromURL = () => {
  if (typeof window === "undefined") return { tripId: null, guestId: null };
  const params = new URLSearchParams(window.location.search);
  return {
    tripId: params.get("trip_id"),
    guestId: params.get("guest_id"),
  };
};

const writeToURL = (tripId: string, guestId: string) => {
  if (typeof window === "undefined") return;
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.set("trip_id", tripId);
  newUrl.searchParams.set("guest_id", guestId);
  window.history.replaceState(null, "", newUrl.toString());
};

const clearURLTripParams = () => {
  if (typeof window === "undefined") return;
  const newUrl = new URL(window.location.href);
  newUrl.searchParams.delete("trip_id");
  newUrl.searchParams.delete("guest_id");
  window.history.replaceState(null, "", newUrl.toString());
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


  useEffect(() => {
    activeTripIdRef.current = activeTripId;
    screenRef.current = screen;
  }, [activeTripId, screen]);

 const pollingIntervalIdRef = useRef(pollingIntervalId);

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

  

const mapTripStatusToScreen = useCallback((status: TripStatusValue): ScreenState => {
    switch (status) {
      case "searching": return "assigning";
      case "driver_assigned":
      case "accepted": return "driver-assigned";
      case "active": return "trip-progress";
      case "completed": return "trip-complete";
      case "cancelled":
      case "driver not found": return "booking";
      default: return "booking";
    }
  }, []);


const syncTripToState = useCallback((trip: any) => {
    setPickup(trip.pickup_address || "");
    setDestination(trip.destination_address || "");
    setFareEstimate(trip.amount?.amount ? Number(trip.amount.amount) : null);
    setPickupCoords(trip.pickup_location || null);
    setDestinationCoords(trip.destination_location || null);
    setVerificationCode(trip.verification_code || null);
    setDriver(trip.driver || null);
    setActiveTripId(trip.id);

    if (trip.guest?.id && !isAuthenticated) {
      setGuestId(trip.guest.id);
      // Write to URL for deep-linkability
      writeToURL(trip.id, trip.guest.id);
    }
  }, [isAuthenticated]);



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
    if (screen === "trip-progress") {
      const timer = setInterval(() => {
        setTripProgress((prev) => {
          if (prev >= 100) {
            clearInterval(timer);
            return 100;
          }
          return prev + 2;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [screen, driver]);
  
  
  

  const handleRegistrationSuccess = (email: string) => {
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

const isConnectingRef = useRef(false);

const startWebSocketConnection = useCallback((guestIdParam?: string, tripId: string = activeTripIdRef.current!) => {
    stopWebSocketConnection();
    stopPollingTripStatus();

    const wsUrl = isAuthenticated
      ? `wss://api.achrams.com.ng/ws/v1/app?trip_id=${tripId}`
      : `wss://api.achrams.com.ng/ws/v1/app?guest_id=${guestIdParam}`;

    console.log(`Connecting WebSocket: ${wsUrl}`);
    const rws = new ReconnectingWebSocket(wsUrl, [], {
      connectionTimeout: 10000,
      maxRetries: 10,
      maxReconnectionDelay: 10000,
    });

    rws.onopen = () => {
      console.log("WebSocket opened");
    };

    rws.onmessage = (event) => {
      try {
        const { event: eventType, data: trip } = JSON.parse(event.data);
        if (["trip:assigned", "trip:status:update"].includes(eventType)) {
          syncTripToState(trip);
          const nextScreen = mapTripStatusToScreen(trip.status.value);
          setScreen(nextScreen);
          if (["completed", "cancelled", "driver not found"].includes(trip.status.value)) {
            stopWebSocketConnection();
            stopPollingTripStatus();
          }
        }
      } catch (e) {
        console.error("WS parse error", e);
      }
    };

    rws.onclose = () => {
      console.log("WebSocket closed");


      const currentScreen = screenRef.current;
      const currentTripId = activeTripIdRef.current;
      const isTerminalScreen = ["trip-complete", "booking", "dashboard"].includes(currentScreen!);
      const isPolling = pollingIntervalIdRef.current !== null;

      if (!isTerminalScreen && currentTripId && !isPolling) {
        startPollingTripStatus(currentTripId);
      }
    };

    setWebSocketConnection(rws);
  }, [isAuthenticated, syncTripToState, mapTripStatusToScreen]);

  
  const stopWebSocketConnection = useCallback(() => {
    if (webSocketConnection) {
      webSocketConnection.close();
      setWebSocketConnection(null);
    }
  }, [webSocketConnection]);



  const fetchTripStatus = useCallback(async (tripId: string) => {
    if (!tripId) return;
    try {
      const res = isAuthenticated
        ? await apiClient.get(`/trips/${tripId}`, undefined, false, undefined, true)
        : await apiClient.get(`/trips/${guestId}`, undefined, true, guestId);
      if (res.status === "success" && res.data) {
        const trip = res.data;
        syncTripToState(trip);
        const nextScreen = mapTripStatusToScreen(trip.status.value);
        setScreen(nextScreen);
        if (["completed", "cancelled", "driver not found"].includes(trip.status.value)) {
          stopPollingTripStatus();
        }
      }
    } catch (e) {
      console.error("Poll error", e);
    }
  }, [guestId, isAuthenticated, syncTripToState, mapTripStatusToScreen]);

  const startPollingTripStatus = useCallback((tripId: string) => {
    stopPollingTripStatus();
    const id = setInterval(() => fetchTripStatus(tripId), 5000);
    setPollingIntervalId(id);
  }, [fetchTripStatus]);

  const stopPollingTripStatus = useCallback(() => {
    if (pollingIntervalId) {
      clearInterval(pollingIntervalId);
      setPollingIntervalId(null);
    }
  }, [pollingIntervalId]);


useEffect(() => {
  const screensNeedingRealtime = ["assigning", "driver-assigned", "trip-progress"];
  const shouldConnect = 
    activeTripId && 
    guestId && // for guests
    screensNeedingRealtime.includes(screen!) &&
    !isConnectingRef.current &&
    webSocketStatus !== "open";

  if (!shouldConnect) {
    if (screen === "booking" || screen === "dashboard") {
      clearURLTripParams();
      setActiveTripId(null);
      setGuestId(null);
    }
    stopWebSocketConnection();
    stopPollingTripStatus();
    return;
  }

  isConnectingRef.current = true;
  if (isAuthenticated) {
    startWebSocketConnection(undefined, activeTripId!);
  } else {
    startWebSocketConnection(guestId!, activeTripId!);
  }

  return () => {
    isConnectingRef.current = false;
  };
}, [screen, activeTripId, guestId, isAuthenticated, webSocketStatus]);











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

  


  useEffect(() => {
    return () => {
      stopWebSocketConnection();
      stopPollingTripStatus();
    };
  }, [stopWebSocketConnection, stopPollingTripStatus]);

  useEffect(()=>{
    setHasHydrated(true);
  }, [])


useEffect(() => {
    if (!hasHydrated) return;

    const { tripId, guestId: urlGuestId } = readTripContextFromURL();
    const validTripContext = tripId && (isAuthenticated || urlGuestId);

    if (validTripContext) {
      // Resume trip from backend
      (async () => {
        try {
          const res = isAuthenticated
            ? await apiClient.get(`/trips/${tripId}`, undefined, false, undefined, true)
            : await apiClient.get(`/trips/${urlGuestId}`, undefined, true, urlGuestId!);
          if (res.status === "success" && res.data) {
            syncTripToState(res.data);
            const nextScreen = mapTripStatusToScreen(res.data.status.value);
            setScreen(nextScreen);
            setGuestId(urlGuestId!);
            if (!isAuthenticated) {
              startWebSocketConnection(urlGuestId!, tripId);
            } else {
              startWebSocketConnection(undefined, tripId);
            }
            return;
          }
        } catch (err) {
          console.error("Failed to restore trip", err);
        }
        // Fallback: clear URL and reset
        clearURLTripParams();
      })();
    } else {
      // Fresh start
      setScreen(isAuthenticated ? "dashboard" : "booking");
    }
  }, [hasHydrated, isAuthenticated]);


  




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
              onVerifyEmail={() => setShowOTP(true)}
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
