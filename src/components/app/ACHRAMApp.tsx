"use client";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
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
import TripHistoryModal from "@/components/app/modals/TripHistoryModal";
import TripDetailsModal from "@/components/app/modals/TripDetailModal";
import LoginOTPModal from "@/components/app/modals/LoginOTPModal";
import PasswordResetModal from "@/components/app/modals/PasswordResetModal";
import AccountDeletionModal from "@/components/app/modals/AccountDeletionModal";
import { useApiErrorHandler } from "@/lib/errors/apiErrorHandler";
import router from "next/router";
import {
  ScreenState,
  PersistedState,
} from "@/types/app";
import { Requirements, PassengerData } from "@/types/booking";
import { TripStatusValue, TripStatus, WebSocketMessage } from "@/types/trip";
import { saveAppState, loadAppState } from "@/lib/storage/sessionState";
import { formatPhoneNumber } from "@/lib/booking/formatPhone";
import { useNotification } from "@/lib/notifications/useNotification";
import { usePersistedAppState } from "@/hooks/app/usePersistedAppState";
import { useAppInitialization } from "@/hooks/app/useAppInitialization";
import { useTripWebSocket } from "@/hooks/trip/useTripWebSocket";
import { useDriverTracking } from "@/hooks/trip/useDriverTracking";
import { useBooking } from "@/hooks/booking/useBooking";
import posthog from "posthog-js";
import { usePWAPrompt } from "@/hooks/usePWA";
import IOSInstallBanner from '@/components/app/ui/IOSInstallBanner';
import NoInternetModal from "./modals/NoInternetModal";
import { useLocation } from "@/hooks/useLocation";

export default function ACHRAMApp() {
  const { token, isAuthenticated, isLoading: isAuthLoading, checkAuthStatus } = useAuth();
  const {
    generalError: bookingGeneralError,
    fieldErrors: bookingFieldErrors,
    handleApiError: handleBookingApiError,
    clearErrors: clearBookingErrors,
  } = useApiErrorHandler();

  const getBookingFieldError = (fieldName: string): string | undefined => {
    return bookingFieldErrors[fieldName]?.[0];
  };

  const [hasHydrated, setHasHydrated] = useState(false);
  const [screen, setScreen] = useState<ScreenState | null>(null);
  const [accountData, setAccountData] = useState<any>(null);
  const [pickup, setPickup] = useState<string>("");
  const [destination, setDestination] = useState<string>("");
  const [fareEstimate, setFareEstimate] = useState<number | null>(null);
  const [fareIsFlatRate, setFareIsFlatRate] = useState<boolean | null>(null);
  const [driver, setDriver] = useState<any>(null);
  const [tripProgress, setTripProgress] = useState<number>(0);
  const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(null);
  const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null);
  const [pickupCodename, setPickupCodename] = useState<string | undefined>(undefined);
  const [destinationCoords, setDestinationCoords] = useState<[number, number] | null>(null);
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [verificationCode, setVerificationCode] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [activeTripId, setActiveTripId] = useState<string | null>(null);
  const [webSocketConnection, setWebSocketConnection] = useState<ReconnectingWebSocket | null>(null);
  const [webSocketStatus, setWebSocketStatus] = useState<"connecting" | "open" | "closed" | "reconnecting">("closed");
  const [pollingIntervalId, setPollingIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [bookAsGuest, setBookAsGuest] = useState(false);
  const activeTripIdRef = useRef(activeTripId);
  const activeGuestIdRef = useRef(guestId);
  const screenRef = useRef(screen);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  useEffect(() => {
    activeTripIdRef.current = activeTripId;
  }, [activeTripId]);
  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);
  useEffect(() => {
    pollingIntervalRef.current = pollingIntervalId;
  }, [pollingIntervalId]);

  const screenPaddingClass = isAuthenticated ? "pb-24" : "pb-20";
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [is2FAEnabled, setIs2FAEnabled] = useState<boolean>(false);
  const [showPassengerDetails, setShowPassengerDetails] = useState(false);
  const [showDirections, setShowDirections] = useState(false);
  const [showPanic, setShowPanic] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [signupDataForOtp, setSignupDataForOtp] = useState<PassengerData | null>(null);
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
  const [tripRequestStatus, setTripRequestStatus] = useState<"loading" | "accepted" | "no-driver" | "error" | null>(null);
  const [tripRequestError, setTripRequestError] = useState<string | null>(null);
  const [showDriverVerification, setShowDriverVerification] = useState(false);
  const [resetBookingKey, setResetBookingKey] = useState(0);
  const { currentNotification, showNotification, setCurrentNotification } = useNotification();
  const [pickupId, setPickupId] = useState<string | null>(null);
  // const [passengerLiveLocation, setPassengerLiveLocation] = useState<[number, number] | null>(null);

  const { coords: passengerLiveLocation, requestPermission } = useLocation();

  const lastValidPickupForAnalyticsRef = useRef<string | null>(null);

  const [weatherData, setWeatherData] = useState<{
    temp: number;
    condition: string;
    location: string;
    humidity?: number;
    windSpeed?: number;
  } | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [airportPickupArea, setAirportPickupArea] = useState<any>(null);
  const [previousScreen, setPreviousScreen] = useState<ScreenState | null>(null);
  const [show2FAOtpModal, setShow2FAOtpModal] = useState(false);
  const [pendingLoginCreds, setPendingLoginCreds] = useState<{ email: string; password: string } | null>(null);
  const [isNavigatingToDashboard, setIsNavigatingToDashboard] = useState(false);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [initComplete, setInitComplete] = useState(false);
  const currentAuthStatusRef = useRef(isAuthenticated);
  const currentTokenRef = useRef(token);
  useEffect(() => {
    currentAuthStatusRef.current = isAuthenticated;
    currentTokenRef.current = token;
  }, [isAuthenticated, token]);

  



  const preserveBookingContext = useCallback(() => {
    console.log("Clearing trip data but preserving booking context for retry");
    console.log("Inside preserve booking context, I am setting guest Id to null");
    setActiveTripId(null);
    setGuestId(null);
    setDriver(null);
    setVerificationCode(null);
    setTripProgress(0);
    setFareEstimate(null);
    setDestination("");
    if (typeof window !== "undefined" && window.sessionStorage) {
      const currentState = loadAppState();
      sessionStorage.removeItem("tripData");
      if (currentState) {
        saveAppState({
          ...currentState,
          activeTripId: null,
          guestId: null,
          driver: null,
          verificationCode: null,
          tripProgress: 0,
          screen: "booking",
        });
      }
    }
    setScreen("booking");
  },[
    setActiveTripId,
    setGuestId,
    setDriver,
    setVerificationCode,
    setTripProgress,
    setFareEstimate,
    setDestination,
    setScreen,
  ])



  const [isOnline, setIsOnline] = useState<boolean | null>(null);
const [showNoInternetModal, setShowNoInternetModal] = useState(false);




useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    setShowNoInternetModal(false);
  };

  const handleOffline = () => {
    setIsOnline(false);
    setShowNoInternetModal(true);
  };

  setIsOnline(navigator.onLine);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Cleanup
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);


useEffect(() => {
  if (screen === 'dashboard' || screen === 'trip-progress' || screen === 'driver-assigned') {
    requestPermission(); // ← Only when relevant
  }
}, [screen, requestPermission]);


  // useEffect(() => {
  //   if (screen !== "driver-assigned" && screen !== "trip-progress" && screen !== "dashboard") return;
  //   let watchId: number;


  //   const startWatchingLocation = async () => {
  //     if (!navigator.geolocation) return;
  //     try {
  //       const initialPosition = await new Promise<GeolocationPosition>((resolve, reject) => {
  //         navigator.geolocation.getCurrentPosition(resolve, reject, {
  //           enableHighAccuracy: true,
  //           maximumAge: 5000,
  //           timeout: 20000,
  //         });
  //       });
  //       const { longitude, latitude } = initialPosition.coords;
  //       setPassengerLiveLocation([latitude, longitude]);
  //       console.log("Initial accurate location:", [longitude, latitude]);
  //       watchId = navigator.geolocation.watchPosition(
  //         (position) => {
  //           const { longitude, latitude, accuracy } = position.coords;
  //           if (accuracy <= 50) {
  //             setPassengerLiveLocation([latitude, longitude]);
  //             console.log("Updated location:", [longitude, latitude]);
  //           }
  //         },
  //         (error) => {
  //           console.error("Error watching location:", error);
  //         },
  //         {
  //           enableHighAccuracy: true,
  //           maximumAge: 0,
  //           timeout: 15000,
  //         }
  //       );
  //     } catch (error) {
  //       console.error("Failed to get initial location:", error);
  //     }
  //   };
  //   startWatchingLocation();
  //   return () => {
  //     if (watchId) {
  //       navigator.geolocation.clearWatch(watchId);
  //     }
  //   };
  // }, [screen]);

  const activeTripForDashboard = useMemo(() => {
    if (activeTripId) {
      return {
        id: activeTripId,
        status:
          previousScreen === "trip-progress"
            ? "In Progress"
            : previousScreen === "driver-assigned"
            ? "Driver Assigned"
            : previousScreen === "assigning"
            ? "Assigning"
            : previousScreen === "trip-complete"
            ? "Completed"
            : "Unknown",
        driver: driver,
        destination: destination,
      };
    }
    return null;
  }, [activeTripId, driver, screen, destination]);

  const {
    startWebSocketConnectionForAuthUser,
    startWebSocketConnection,
    stopWebSocketConnection,
    startPollingTripStatus,
    fetchTripStatus,
  } = useTripWebSocket({
    webSocketConnection,
    setWebSocketConnection,
    setWebSocketStatus,
    activeTripIdRef,
    activeGuestIdRef,
    screenRef,
    pollingIntervalRef,
    stopPollingTripStatus: useCallback(() => {
      if (pollingIntervalRef.current) {
        console.log(`Stopping trip status polling. with interval ID: ${pollingIntervalRef.current}`);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setPollingIntervalId(null);
      } else {
        console.log("stopPollingTripStatus called but no active polling interval found");
      }
    }, [pollingIntervalRef, setPollingIntervalId]),
    setTripRequestStatus,
    setTripRequestError,
    setDriver,
    setScreen,
    setPickup,
    setPickupCoords,
    setDestinationCoords,
    setDestination,
    setFareEstimate,
    setDriverLocation,
    showNotification,
    setAirportPickupArea,
    setVerificationCode,
    setTripProgress,
    setActiveTripId,
    preserveBookingContext,
    guestId,
    activeTripId,
    bookAsGuest,
    isAuthenticated,
  });

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
  

  const { handleRequestRide } = useBooking({
    tripHistory,
    pickup,
    destination,
    fareEstimate,
    pickupCoords,
    destinationCoords,
    passengerData,
    requirements,
    bookAsGuest,
    tripRequestStatus,
    isAuthenticated,
    setTripRequestStatus,
    setTripRequestError,
    setShowPassengerDetails,
    clearBookingErrors,
    handleBookingApiError,
    bookingFieldErrors,
    bookingGeneralError,
    showNotification,
    setVerificationCode,
    setActiveTripId,
    setGuestId,
    setScreen,
    setDriver,
    setAirportPickupArea,
    preserveBookingContext,
    startWebSocketConnection,
    startWebSocketConnectionForAuthUser,
    bookTripRetry: false,
    setBookTripRetry: () => {},
  });

  useDriverTracking({
    screen,
    driver,
    pickupCoords,
    airportPickupArea,
    isDriverAtPickupArea: false,
    showNotification,
    setDriverDistance: () => {},
    setDriverDuration: () => {},
    setIsDriverAtPickupArea: () => {},
  });

  const { initializeAppState } = useAppInitialization({
    hasHydrated,
    isAuthLoading,
    isAuthenticated,
    token,
    setScreen,
    setBookAsGuest,
    setActiveTripId,
    setDriver,
    setPickup,
    setDestination,
    setFareEstimate,
    setPickupCoords,
    setDestinationCoords,
    setRequirements: () => {},
    setPassengerData: () => {},
    passengerData: { name: "", phone: "", email: "" },
    setGuestId,
    setVerificationCode,
    setTripProgress,
    setAirportPickupArea,
    startWebSocketConnection,
    startWebSocketConnectionForAuthUser,
    stopWebSocketConnection,
    stopPollingTripStatus: useCallback(() => {
      if (pollingIntervalRef.current) {
        console.log(`Stopping trip status polling. with interval ID: ${pollingIntervalRef.current}`);
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setPollingIntervalId(null);
      } else {
        console.log("stopPollingTripStatus called but no active polling interval found");
      }
    }, [pollingIntervalRef, setPollingIntervalId]),
    setTripRequestStatus,
    setTripRequestError,
    preserveBookingContext,
    setInitComplete,
  });


const { showIOSInstallGuide } = usePWAPrompt();



useEffect(() => {
  const hasRecordedDownload = localStorage.getItem("achrams_app_downloaded");

  if (!hasRecordedDownload) {
    // Record immediately on first load (covers iOS + all users)
    posthog.capture("passenger_app_opened", {
      source: "web",
      airport_location: lastValidPickupForAnalyticsRef.current || "Unknown",
    });
    localStorage.setItem("achrams_app_downloaded", "true");
  }

  // Also listen for install prompt (for better intent signal)
  const handleBeforeInstallPrompt = () => {
    // You could log an additional event like "pwa_install_prompted"
    // but don't duplicate "downloaded"
  };

  window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
}, []);


  /**
   * 
   * posthog capture events section Block
   */

  const initRef = useRef(false);

  useEffect(()=>{
    if(pickup && pickup !== "Use my current location"){

      // alert(pickup)
      lastValidPickupForAnalyticsRef.current = pickup;
    }
  } , [pickup])


  // After successful login or auth check
useEffect(() => {
  if (isAuthenticated && accountData?.email) {
    posthog.identify(accountData.email, {
      email: accountData.email,
      name: `${accountData.first_name} ${accountData.last_name}`,
      user_type: "passenger",
      is_authenticated: true,
      source: "ride.achrams.com.ng"
    });
  }
}, [isAuthenticated, accountData]);


// When guestId is set (after booking starts)
useEffect(() => {
  if (guestId && passengerData.email) {
    posthog.identify(`guest_${guestId}`, {
      email: passengerData.email,
      name: passengerData.name,
      phone: passengerData.phone,
      user_type: "passenger",
      is_guest: true,
      guest_id: guestId,
      source: "ride.achrams.com.ng"
    });
  }
}, [guestId, passengerData]);




useEffect(() => {
  // if (screen) {
  //   posthog.capture("$pageview", { screen });
  // }

  if(screen === "trip-complete"){
    posthog.capture("trip_payment_completed", { fare_amount: fareEstimate, payment_method: "Cash", faan_fee: fareEstimate * 0.05,
    source: "ride.achrams.com.ng"
    });
  }
}, [screen]);


useEffect(()=>{
  if(tripHistory.length > 0){posthog.capture("passenger_first_booking", { pickup, destination, booking_method: bookAsGuest ? "guest" : "auth", fare_estimate: fareEstimate,
  source: "ride.achrams.com.ng",
   });
  }
},[tripHistory])




// In settings or onboarding
const [analyticsConsent, setAnalyticsConsent] = useState(true);

useEffect(() => {
  if (analyticsConsent) {
    posthog.opt_in_capturing();
  } else {
    posthog.opt_out_capturing();
  }
}, [analyticsConsent]);



/***
 * PostHog Capture Event EndBlock
 */


  useEffect(() => {
    if(!initRef.current && hasHydrated && !isAuthLoading){
      initRef.current = true;
      initializeAppState();
    }
  }, [hasHydrated, isAuthLoading, initializeAppState]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setHasHydrated(true);
    }
  }, []);

  console.log(passengerData)

  useEffect(() => {
    if (hasHydrated && isAuthenticated) {
      const fetchAccountData = async () => {
        try {
          console.log("Fetching account data from /auth/passenger/me...");
          const response = await apiClient.get("/auth/passenger/me", undefined, false, undefined, true);
          console.log("Account data API response:", response);
          if (response.status === "success" && response.data) {
            setAccountData(response.data);
            const balanceAmount = response.data.profile?.wallet?.balance?.amount ?? 0;
            setWalletBalance(balanceAmount);
            const is2FAEnabled = response.data.is_2fa_enabled ?? false;
            setIs2FAEnabled(is2FAEnabled);
            console.log("Account data fetched and state updated:", {
              balance: balanceAmount,
              is2FA: is2FAEnabled,
            });
          } else {
            console.error("API response for account data was not successful:", response);
            setWalletBalance(0);
            setIs2FAEnabled(false);
            setCurrentNotification({
              message: response.message || "Failed to load profile data.",
              type: "error",
            });
          }
        } catch (err) {
          console.error("Failed to fetch user account data:", err);
          setWalletBalance(0);
          setIs2FAEnabled(false);
          setCurrentNotification({
            message: "Failed to load profile data. Please check your connection.",
            type: "error",
          });
        }
      };
      fetchAccountData();
    } else if (hasHydrated && !isAuthenticated) {
      console.log("User is not authenticated, clearing account data.");
      setAccountData(null);
      setWalletBalance(0);
      setIs2FAEnabled(false);
    }
  }, [hasHydrated, isAuthenticated, setCurrentNotification]);

  useEffect(() => {
    if (screen === "trip-complete") {
      if (isAuthenticated) {
        console.log("user is authenticated no need to prompt signup");
      } else {
        const timer = setTimeout(() => {
          setShowSignup(true);
        }, 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [screen]);



  console.log("Page.tsx is being rendered Now");
  const [driverDistance, setDriverDistance] = useState<string | null>(null);
  const [driverDuration, setDriverDuration] = useState<string | null>(null);
  const [isDriverAtPickupArea, setIsDriverAtPickupArea] = useState<boolean>(false);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const driverDurationRef = useRef<number | null>(null);
  const driverDistanceRef = useRef<number | null>(null);
  const isDriverAtPickupAreaRef = useRef<boolean>(false);

  useDriverTracking({
    screen,
    driver,
    pickupCoords,
    airportPickupArea,
    isDriverAtPickupArea,
    showNotification,
    setDriverDistance,
    setDriverDuration,
    setIsDriverAtPickupArea,
  });

  usePersistedAppState(
    isAuthenticated,
    isNavigatingToDashboard,
    previousScreen,
    screen,
    hasHydrated,
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
    setIsNavigatingToDashboard
  );

  const handleRegistrationSuccess = (email: string) => {
    console.log("setting screen to dashboard six");
    posthog.capture("passenger_signup_completed", {
    signup_method: "email",
    airport_location: lastValidPickupForAnalyticsRef.current, // Use last known valid pickup location
  });
    setScreen("dashboard");
    setShowSignup(false);
  };

  const handleLoginSuccess = () => {
    console.log("login successful, Authcontext should update. Screen will update via useEffect");
    showNotification("Welcome Back!", "success");
    setScreen("dashboard")
    setShowLogin(false);
  };

  const handleLogoutSuccess = () => {
    console.log("Logout successful, Authcontext should update. Screen will update via useEffect");
    showNotification("You have been logged out.", "info");
    preserveBookingContext();
  };

  const handle2FAEnabled = () => {
    setIs2FAEnabled(true);
    setShowEnable2FA(false);
    showNotification("Two-factor authentication enabled successfully!", "success");
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

  const [bookTripRetry, setBookTripRetry] = useState(false);

  const handleShowLocationModal = () => {
    // Placeholder – not used
  };

  const handleLocationModalClose = () => {
    // Placeholder – not used
  };

  const handleGrantLocationAccess = () => {
    console.log("location access granted button clicked in modal. The BookingScreen will handle the requestPermission call");
  };

  useEffect(() => {
    return () => {
      console.log("Cleaning up WebSocket and polling intervals on unmount.");
      stopWebSocketConnection();
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
        setPollingIntervalId(null);
      }
    };
  }, [stopWebSocketConnection]);

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
      console.error("Cannot cancel trip: activeTripId is missing (is null, undefined, or empty string).");
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
      console.error("Cannot cancel trip: Missing pickup coordinates or address for cancellation payload.");
      console.log("Current pickupCoords state:", pickupCoords);
      console.log("Current pickup state:", pickup);
      showNotification("Unable to cancel trip. Missing location data.", "error");
      setShowCancel(false);
      return;
    }
    try {
      const cancelRequestBody = {
        reason: reason,
        location: [locationToUse[0], locationToUse[1]],
        address: addressToUse,
      };
      console.log("Cancelling trip with ID:", activeTripId, "and payload:", cancelRequestBody);
      let response;
      if (!bookAsGuest && isAuthenticated) {
        response = await apiClient.post(`/trips/${activeTripId}/cancel`, cancelRequestBody, undefined, undefined, true);
      } else {
        if (!guestId) {
          console.error("Cannot cancel trip: guestId is missing.");
          console.log("Current guestId state:", guestId);
          showNotification("Unable to cancel trip. Session expired.", "error");
          setShowCancel(false);
          return;
        }
        console.log("Guest Id: ", guestId);
        response = await apiClient.post(`/trips/${guestId}/cancel`, cancelRequestBody, undefined, guestId);
      }
      if (response.status === "success" && response.data) {
        console.log("Trip cancelled successfully:", response.data);
        showNotification("Trip cancelled successfully.", "success");
        stopWebSocketConnection();
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
          setPollingIntervalId(null);
        }
        setDriver(null);
        setActiveTripId(null);
        if (!isAuthenticated) {
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
        console.error("Trip cancellation API responded with non-success status or missing data:", response);
        let errorMessage = "Failed to cancel your trip. Server responded unexpectedly.";
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
      let errorMessage = "Failed to cancel your trip. Please check your connection and try again.";
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
    setShowSignup(false);
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
      const response = await apiClient.post("/auth/passenger/onboard/initiate", {
        email: data.email,
        phone_number: data.phone,
        first_name: firstName,
        last_name: lastName,
        password: data.password,
      });
      console.log("Resend OTP Response:", response);
      if (response.status === "success" && response.data?.countdown) {
        console.log("New OTP sent, new countdown:", response.data.countdown);
        showNotification("New OTP sent, new countdown", "info");
        return response.data.countdown;
      } else {
        const errorMessage = response.message || "Failed to resend OTP. Please try again.";
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
      throw new Error(errorMessage);
    }
  };

  const handleCancelConfirmed = (reason: string, location?: [number, number], address?: string) => {
    cancelTrip(reason);
  };

  const syncTripStatusInBackground = useCallback(
    async (tripId: string, wasBookedAsGuest: boolean) => {
      console.log("Background sync: Fetching current status for trip ID:", tripId);
      try {
        let response;

        
        const isCurrentlyAuthenticated = isAuthenticated && !bookAsGuest;
        const isCurrentlyGuest = !isAuthenticated || bookAsGuest;


        if (isCurrentlyAuthenticated && !wasBookedAsGuest) {
          console.log("Background sync: Fetching status via authenticated endpoint.");
          response = await apiClient.get(`/trips/${tripId}`, undefined, false, undefined, true);
        } else if (isCurrentlyGuest && guestId && wasBookedAsGuest) {
          console.log("Background sync: Fetching status via guest endpoint with guestId:", guestId);
          response = await apiClient.get(`/trips/${guestId}`, undefined, true, guestId);
        } else {
          console.error("Background sync: Cannot sync status. Authentication context mismatch or missing guestId.");
          return;
        }
        if (response.status === "success" && response.data) {
          const trip = response.data;
          console.log("Background sync: Fetched current trip status:", trip.status.value);
          if (trip.driver && JSON.stringify(trip.driver) !== JSON.stringify(driver)) {
            setDriver(trip.driver);
          }
          if (trip.status.value === "active" && trip.progress !== tripProgress) {
            setTripProgress(trip.progress || 0);
          }
          if (trip.verification_code && trip.verification_code !== verificationCode) {
            setVerificationCode(trip.verification_code);
          }
          if (trip.status.value === "completed") {
            console.log("Background sync: Trip is now completed.");
            setScreen("trip-complete");
            stopWebSocketConnection();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setPollingIntervalId(null);
            }
          } else if (trip.status.value === "cancelled") {
            console.log("Background sync: Trip was cancelled.");
            showNotification("Trip was cancelled.", "info");
            setScreen("booking");
            preserveBookingContext();
            stopWebSocketConnection();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setPollingIntervalId(null);
            }
          } else if (trip.status.value === "driver not found") {
            console.log("Background sync: Driver not found.");
            setTripRequestStatus("no-driver");
            setTripRequestError("No drivers available for your trip.");
          }
        } else {
          console.error("Background sync: API call succeeded but response data/status was unexpected:", response);
        }
      } catch (error) {
        console.error("Background sync: Error fetching current trip status:", error);
      }
    },
    [
      isAuthenticated,
      bookAsGuest,
      guestId,
      driver,
      tripProgress,
      verificationCode,
      setDriver,
      setTripProgress,
      setVerificationCode,
      setScreen,
      setTripRequestStatus,
      setTripRequestError,
      showNotification,
      preserveBookingContext,
      stopWebSocketConnection,
    ]
  );



const isAuthenticatedRef = useRef(isAuthenticated);
const bookAsGuestRef = useRef(bookAsGuest);
const guestIdRef = useRef(guestId);
const previousScreenRef = useRef(previousScreen)
// Sync refs
useEffect(() => { activeTripIdRef.current = activeTripId; }, [activeTripId]);
useEffect(() => { isAuthenticatedRef.current = isAuthenticated; }, [isAuthenticated]);
useEffect(() => {bookAsGuestRef.current = bookAsGuest},[bookAsGuest])
useEffect(() => {
  guestIdRef.current = guestId
}, [guestId])

useEffect(()=>{
  previousScreenRef.current = previousScreen
}, [previousScreen])


  

  const handleResumeActiveTrip = useCallback(() => {
    
    const currentActiveTripId = activeTripIdRef.current;

    const isCurrentlyAuthenticated = isAuthenticatedRef.current && !bookAsGuestRef.current;

    const isCurrentlyGuest = !isAuthenticatedRef.current || bookAsGuestRef.current;

    const currentGuestId = guestIdRef.current;

    console.log("Attempting to resume active trip with ID:", activeTripId);
    if (!activeTripId) {
      console.warn("No active trip ID found to resume.");
      setScreen("booking");
      return;
    }
    const savedState = loadAppState();
  

    if (!savedState || savedState.activeTripId !== activeTripId) {
      console.warn("No valid persisted state found for the active trip ID, or trip ID mismatch.");
      setScreen("booking");
      return;
    }
    console.log("Found persisted state, saved screen was:", savedState.screen);
    const savedScreen = previousScreenRef.current;

    if (["assigning", "driver-assigned", "trip-progress"].includes(savedScreen)) {
      
      setScreen(savedScreen);
      setDriver(savedState.driver || null);
      setTripProgress(savedState.tripProgress || 0);
      setVerificationCode(savedState.verificationCode || "");

      // const isCurrentlyAuthenticated = isAuthenticated && !bookAsGuest;

      // const isCurrentlyGuest = !isAuthenticated || bookAsGuest;


      if (isCurrentlyAuthenticated && ["assigning", "driver-assigned", "trip-progress"].includes(savedScreen)) {
        console.log("Resuming WebSocket for authenticated user based on saved screen.");
        // startWebSocketConnectionForAuthUser(currentActiveTripId);
      } else if (isCurrentlyGuest && guestId && ["assigning", "driver-assigned", "trip-progress"].includes(savedScreen)) {
        console.log("Resuming WebSocket for guest user based on saved screen.");
        // startWebSocketConnection(currentGuestId, currentActiveTripId);
      }
      syncTripStatusInBackground(currentActiveTripId, savedState.bookAsGuest);
    } else if (savedScreen === "trip-complete") {
      setScreen("trip-complete");
      setDriver(savedState.driver || null);
    } else {
      console.warn("Persisted screen state is inconsistent with activeTripId, going to booking.");
      setScreen("booking");
    }
  }, [
    // activeTripId,
    // isAuthenticated,
    // bookAsGuest,
    // guestId,
    setScreen,
    setDriver,
    setTripProgress,
    setVerificationCode,
    startWebSocketConnectionForAuthUser,
    startWebSocketConnection,
    syncTripStatusInBackground,
    // previousScreen,
  ]);

  const fetchTripHistory = useCallback(async () => {
    if (!isAuthenticated || bookAsGuest) {
      return;
    }
    try {
      console.log("Fetching trip history for dashboard...");
      const pageNum = 1;
      const limit = 10;
      const queryParams = `?page=${pageNum}&page_size=${limit}`;
      const response = await apiClient.get(`/trips${queryParams}`, undefined, false, undefined, true);
      console.log("Trip history API response for dashboard:", response);
      if (response.count > 0) {
        const history = response.results || [];
        console.log("Fetched trip history for dashboard:", history);
        setTripHistory(history);
      } else {
        console.log("No trips found in history or count is 0.");
        setTripHistory([]);
      }
    } catch (error) {
      console.error("Error fetching trip history for dashboard:", error);
      setTripHistory([]);
    }
  }, [isAuthenticated, bookAsGuest, apiClient]);

  useEffect(() => {
    if (isAuthenticated && !bookAsGuest) {
      fetchTripHistory();
    } else {
      setTripHistory([]);
    }
  }, [isAuthenticated, bookAsGuest, fetchTripHistory]);

  const recentTripData = useMemo(() => {
    if (activeTripId && !bookAsGuest) {
      console.log("Current session has an active trip. Looking for second most recent in history.");
      return tripHistory.length > 1 ? tripHistory[1] : null;
    } else {
      console.log("Current session has no active trip. Checking history for resumable or fallback trip.");
      const terminalStatuses = ["completed", "cancelled"];
      if (bookAsGuest) {
        return tripHistory.length > 1 ? tripHistory[0] : null;
      }
      const resumableTrip = tripHistory.find((trip) => !terminalStatuses.includes(trip.status.value));
      if (resumableTrip) {
        console.log("Found a potentially active/resumable trip in history:", resumableTrip);
        return resumableTrip;
      }
      if (tripHistory.length > 0) {
        console.log("No non-terminal trips found. Falling back to the most recent trip (might be terminal):", tripHistory[0]);
        return tripHistory[0];
      }
      console.log("No active trip and no history found. recentTripData will be null.");
      return null;
    }
  }, [activeTripId, bookAsGuest, tripHistory]);

  const verify2FAAfterLogin = async (email: string, password: string, otp: string) => {
    console.log("page.tsx: Attempting 2FA verification for login with email:", email);
    try {
      const response = await apiClient.post(
        "/auth/passenger/2fa/verify",
        { email, password, otp },
        undefined,
        undefined,
        true
      );
      console.log("2FA Verification Response:", response);
      if (response.status === "success" && response.data && response.data.token) {
        console.log("2FA Verification successful. Token received.");
        await new Promise((resolve) => setTimeout(resolve, 500));
        await checkAuthStatus();
        return { success: true };
      } else {
        console.error("2FA Verification failed:", response);
        return { success: false, message: response.message || "2FA verification failed." };
      }
    } catch (err: any) {
      console.error("Error during 2FA verification API call:", err);
      let errorMessage = "An error occurred during 2FA verification.";
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      return { success: false, message: errorMessage };
    }
  };

  const handle2FAOtpSubmit = async (otpCode: string) => {
    if (!pendingLoginCreds) {
      console.error("page.tsx: No pending login credentials found for 2FA verification.");
      showNotification("Session expired. Please try logging in again.", "error");
      setShow2FAOtpModal(false);
      return;
    }
    console.log("page.tsx: Submitting OTP for 2FA verification...");
    const { email, password } = pendingLoginCreds;
    const result = await verify2FAAfterLogin(email, password, otpCode);
    if (result.success) {
      console.log("page.tsx: 2FA verification successful. User is now fully authenticated.");
      showNotification("Login successful!", "success");
      setShow2FAOtpModal(false);
      setPendingLoginCreds(null);
    } else {
      console.error("page.tsx: 2FA verification failed:", result.message);
      showNotification(result.message || "2FA verification failed. Please try again.", "error");
    }
  };

  const handleRequires2FA = useCallback(
    (email: string, password: string) => {
      console.log("page.tsx: Received 2FA requirement from LoginModal for email:", email);
      setPendingLoginCreds({ email, password });
      setShowLogin(false);
      setShow2FAOtpModal(true);
    },
    [setShowLogin, setShow2FAOtpModal, setPendingLoginCreds]
  );

  const updateAccountData = useCallback(
    (newAccountData: any) => {
      console.log("Updating account data state after API call:", newAccountData);
      setAccountData(newAccountData);
    },
    [setAccountData]
  );




  const handleResumeTripById = useCallback(
    async (tripIdToResume: string) => {
      console.log("Attempting to resume trip by ID from dashboard:", tripIdToResume);
      if (!tripIdToResume) {
        console.warn("No trip ID provided to resume.");
        setScreen("booking");
        return;
      }
      try {
        const isCurrentlyAuthenticated = isAuthenticated && !bookAsGuest;
        const isCurrentlyGuest = !isAuthenticated || bookAsGuest;
        let response;
        if (isCurrentlyAuthenticated) {
          console.log("Resuming trip via authenticated endpoint with tripId:", tripIdToResume);
          response = await apiClient.get(`/trips/${tripIdToResume}`, undefined, false, undefined, true);
          console.log(response);
        } else if (isCurrentlyGuest && guestId) {
          console.log("Resuming trip via guest endpoint with guestId:", guestId);
          response = await apiClient.get(`/trips/${tripIdToResume}?guest_id=${guestId}`, undefined, true, guestId);
        } else {
          console.error("Cannot resume trip: No valid auth context (token or guestId) for the provided trip ID.");
          setScreen("booking");
          return;
        }
        if (response.status === "success" && response.data) {
          const trip = response.data;
          console.log("Fetched trip details for resume from dashboard:", trip);
          setActiveTripId(trip.id);
          setDriver(trip.driver || null);
          setTripProgress(trip.progress || 0);
          setVerificationCode(trip.verification_code || "");
          setPickup(trip.pickup_address || "");
          setDestination(trip.destination_address || "");
          setFareEstimate(trip.amount?.amount ? parseFloat(trip.amount.amount) : null);
          setPickupCoords(trip.map_data.pickup_location.geometry.coordinates || null);
          console.log("Pickup coords", pickupCoords);
          setDestinationCoords(trip.map_data.destination_location.geometry.coordinates || null);
          if (trip?.map_data?.airport?.pickup_area) {
            setAirportPickupArea(trip.map_data.airport.pickup_area);
          }
          if (trip.status.value === "searching") {
            setScreen("assigning");
            if (isCurrentlyAuthenticated) {
              startWebSocketConnectionForAuthUser(trip.id);
            } else if (isCurrentlyGuest && guestId) {
              startWebSocketConnection(guestId, trip.id);
            }
          } else if (trip.status.value === "accepted") {
            setScreen("driver-assigned");
            setDriver(trip.driver);
            setVerificationCode(trip.verification_code);
            if (isCurrentlyAuthenticated) {
              startWebSocketConnectionForAuthUser(trip.id);
            } else if (isCurrentlyGuest && guestId) {
              startWebSocketConnection(guestId, trip.id);
            }
          } else if (trip.status.value === "active") {
            setScreen("trip-progress");
            setDriver(trip.driver);
            setTripProgress(trip.progress || 0);
            if (isCurrentlyAuthenticated) {
              startWebSocketConnectionForAuthUser(trip.id);
            } else if (isCurrentlyGuest && guestId) {
              startWebSocketConnection(guestId, trip.id);
            }
          } else if (trip.status.value === "completed") {
            setScreen("trip-complete");
            setDriver(trip.driver);
            stopWebSocketConnection();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setPollingIntervalId(null);
            }
          } else if (trip.status.value === "cancelled") {
            console.log("Trip was cancelled, clearing ID and going to dashboard.");
            setActiveTripId(null);
            preserveBookingContext();
            stopWebSocketConnection();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setPollingIntervalId(null);
            }
            setScreen("dashboard");
          } else {
            console.warn("Unexpected trip status on resume by ID from dashboard:", trip.status.value);
            setScreen("booking");
            stopWebSocketConnection();
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
              setPollingIntervalId(null);
            }
          }
          const stateToSave: PersistedState = {
            screen: screen,
            pickup,
            destination,
            fareEstimate,
            driver,
            tripProgress,
            pickupCoords,
            destinationCoords,
            verificationCode,
            activeTripId: trip.id,
            guestId,
            bookAsGuest,
          };
          saveAppState(stateToSave);
        } else {
          console.error("Failed to fetch trip details for resume from dashboard:", response);
          setScreen("booking");
          if (activeTripId === tripIdToResume) {
            setActiveTripId(null);
          }
        }
      } catch (error) {
        console.error("Error resuming trip by ID from dashboard:", error);
        setScreen("booking");
        if (activeTripId === tripIdToResume) {
          setActiveTripId(null);
        }
      }
    },
    [
      isAuthenticated,
      bookAsGuest,
      guestId,
      startWebSocketConnectionForAuthUser,
      startWebSocketConnection,
      stopWebSocketConnection,
      setScreen,
      setActiveTripId,
      setDriver,
      setTripProgress,
      setVerificationCode,
      setPickup,
      setDestination,
      setAirportPickupArea,
      pickup,
      destination,
      fareEstimate,
      driver,
      tripProgress,
      verificationCode,
      preserveBookingContext,
      activeTripId,
      screen,
      destinationCoords,
      pickupCoords,
    ]
  );

  const handleHomeClick = useCallback(() => {
    if (screen === "dashboard") return;
    if (activeTripId) {
      console.log("Navigating to dashboard with active trip. Current screen:", screen);
      setPreviousScreen(screen);
      setIsNavigatingToDashboard(true);
      setScreen("dashboard");
    } else {
      console.log("Navigating to booking (no active trip). Current screen:", screen);
      setScreen("dashboard");
    }
  }, [activeTripId, screen]);

  const handleLogout = async () => {
    try {
      console.log("Initiating logout API call...");
      const response = await apiClient.post("/auth/logout", {}, undefined, undefined, true);
      console.log("Logout API response:", response);
      if (response.status === "success") {
        console.log("Logout successful on server, cookie should be cleared.");
        window.location.href = "/";
      } else {
        console.error("Logout API responded with non-success status:", response);
        showNotification(response.message || "Logout failed. Please try again.", "error");
      }
    } catch (err) {
      console.error("An error occurred during the logout API call:", err);
      showNotification("An error occurred while logging out. Please check your connection.", "error");
    }
  };

  const handleAccountDeletionSuccess = () => {
    console.log("Account deletion confirmed. Loggin out user");
    handleLogout();
    setShowAccountDeletionModal(false);
  };

  const [resolvedLocationName, setResolvedLocationName] = useState<string | null>(null);

  const reverseGeocodeLocation = useCallback(async (lat: number, lng: number): Promise<string | null> => {
    try {
      const GEOCODE_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
      if (!GEOCODE_API_KEY) {
        throw new Error("Geocoding API key is not configured.");
      }
      const GEOCODE_API_URL = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GEOCODE_API_KEY}`;
      const response = await fetch(GEOCODE_API_URL);
      if (!response.ok) {
        throw new Error(`Geocoding API request failed with status ${response.status}`);
      }
      const data = await response.json();
      console.log("Reverse geocode response:", data);
      if (data.status === "OK" && data.results && data.results.length > 0) {
        const result = data.results[0];
        const addressComponents = result.address_components;
        let locality = "";
        let administrativeArea = "";
        let country = "";
        if (addressComponents) {
          for (let component of addressComponents) {
            const types = component.types;
            if (types.includes("locality") && types.includes("political")) {
              locality = component.long_name;
            } else if (types.includes("administrative_area_level_1") && types.includes("political")) {
              administrativeArea = component.short_name;
            } else if (types.includes("country") && types.includes("political")) {
              country = component.short_name;
            }
          }
        }
        let locationName = "";
        if (locality) locationName = locality;
        if (administrativeArea) locationName = locationName ? `${locationName}, ${administrativeArea}` : administrativeArea;
        if (country) locationName = locationName ? `${locationName}, ${country}` : country;
        if (locationName) {
          return locationName;
        } else {
          return result.formatted_address || null;
        }
      } else {
        console.warn("Geocoding API returned no results for coordinates:", lat, lng);
        return null;
      }
    } catch (error) {
      console.error("Error reverse geocoding location:", error);
      return null;
    }
  }, []);

  const weatherFetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitialWeatherFetch = useRef(false);
  const fetchWeatherData = useCallback(
    async (lat: number, lng: number) => {
      if (!lat || !lng) {
        console.warn("Cannot fetch weather: coordinates missing.");
        setWeatherData(null);
        setWeatherError("Location not available for weather.");
        setResolvedLocationName(null);
        return;
      }
      setWeatherLoading(true);
      setWeatherError(null);
      console.log("Fetching weather data for:", lat, lng);
      try {
        const locationName = await reverseGeocodeLocation(lat, lng);
        if (!locationName) {
          console.warn("Could not determine location name for coordinates:", lat, lng);
          setWeatherData(null);
          setWeatherError("Could not determine location name.");
          setResolvedLocationName(null);
          setWeatherLoading(false);
          return;
        }
        const WEATHER_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
        if (!WEATHER_API_KEY) {
          throw new Error("Weather API key is not configured.");
        }
        const WEATHER_API_URL =
          `https://weather.googleapis.com/v1/currentConditions:lookup` +
          `?location.latitude=${lat}` +
          `&location.longitude=${lng}` +
          `&key=${WEATHER_API_KEY}`;
        const response = await fetch(WEATHER_API_URL, {
          method: "GET",
          headers: { Accept: "application/json" },
        });
        if (!response.ok) {
          throw new Error(`Weather API failed: ${response.status}`);
        }
        const data = await response.json();
        console.log(data);
        const parsedWeather = {
          temp: Math.round(data.temperature?.degrees) || 0,
          condition: data.weatherCondition?.description?.text?.toLowerCase() || data.weatherCondition?.type?.toLowerCase() || "unknown",
          location: locationName,
          humidity: data.relativeHumidity || undefined,
          windSpeed: data.wind?.speed?.value ? (data.wind.speed.value / 3.6).toFixed(2) : undefined,
        };
        setWeatherData(parsedWeather);
        hasInitialWeatherFetch.current = true;
        console.log("Weather data set:", parsedWeather);
      } catch (error) {
        console.error("Error fetching weather:", error);
        setWeatherError(error instanceof Error ? error.message : "Unknown error");
        setWeatherData(null);
        setResolvedLocationName(null);
      } finally {
        setWeatherLoading(false);
      }
    },
    [reverseGeocodeLocation]
  );


  



  useEffect(() => {
    if (weatherFetchTimeoutRef.current) {
      clearTimeout(weatherFetchTimeoutRef.current);
      weatherFetchTimeoutRef.current = null;
    }
    if (!passengerLiveLocation) {
      console.log("No location available, clearing weather.");
      setWeatherData(null);
      setWeatherError(null);
      hasInitialWeatherFetch.current = false;
      return;
    }
    const [lat, lng] = passengerLiveLocation;
    if (typeof lat !== "number" || typeof lng !== "number" || isNaN(lat) || isNaN(lng)) {
      console.warn("Invalid coordinates:", passengerLiveLocation);
      console.log("passenger live location coords", {lat, lng})
      setWeatherData(null);
      setWeatherError("Invalid location coordinates.");
      return;
    }
    if (!hasInitialWeatherFetch.current) {
      console.log("First valid location detected, fetching weather...");
      console.log("passenger live location coords", {lat, lng})
      fetchWeatherData(lat, lng);
      return;
    }
    console.log("Location updated, but initial weather already fetched. Skipping.");
    return () => {
      if (weatherFetchTimeoutRef.current) {
        clearTimeout(weatherFetchTimeoutRef.current);
      }
    };
  }, [hasHydrated, isAuthenticated, passengerLiveLocation, fetchWeatherData]);


   const { isLoaded: isGoogleMapsLoaded, loadError: googleMapsLoadError } =
      useJsApiLoader({
        id: "google-map-script",
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places", "geometry"],
      });
  
    if (googleMapsLoadError) {
      console.error("Failed to load Google Maps API:", googleMapsLoadError);
      return <div>Error loading Google Maps.</div>;
    }



    // only show on ios
// if (showIOSInstallGuide) {
//   return (
//     <div className="fixed inset-0 flex items-center justify-center bg-achrams-bg-primary">
//       <div className="p-4 bg-[#059669] text-white text-center rounded-lg max-w-sm mx-4">
//         <p className="text-lg font-semibold mb-2">Install ACHRAMS</p>
//         <p>
//           Tap <b>Share</b> → <b>Add to Home Screen</b> for the full app experience!
//         </p>
//       </div>
//     </div>
//   );
// }





  if (!hasHydrated || isAuthLoading || !initComplete) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-achrams-bg-primary z-50">
        <div className="absolute inset-0 bg-gradient-to-br from-achrams-primary-solid/5 via-achrams-secondary-solid/5 to-achrams-bg-primary"></div>
        <div className="relative z-10 flex flex-col items-center space-y-6">
          <div className="relative">
            <div
              className="absolute -inset-4 rounded-full bg-achrams-primary-solid/20 blur-lg animate-pulse"
              style={{
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            ></div>
            <div className="relative w-20 h-20 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-2xl flex items-center justify-center shadow-lg border border-achrams-border/20 overflow-hidden">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_40%,rgba(255,255,255,0.1)_50%,transparent_60%)] animate-sweep"></div>
              <Image
                src="/images/logo.png"
                alt="ACHRAMS Logo"
                width={40}
                height={40}
                className="object-contain z-10 relative"
                priority
              />
            </div>
          </div>
          <div className="text-center">
            <div className="mt-3 w-32 h-1 bg-achrams-bg-secondary rounded-full overflow-hidden mx-auto">
              <div
                className="h-full bg-achrams-gradient-primary rounded-full animate-progress"
                style={{
                  animation: "loadingBar 1.5s ease-in-out infinite",
                }}
              ></div>
            </div>
          </div>
        </div>
        <style jsx>{`
          @keyframes pulse {
            0%, 100% {
              opacity: 0.3;
              transform: scale(1);
            }
            50% {
              opacity: 0.6;
              transform: scale(1.05);
            }
          }
          @keyframes sweep {
            0% {
              transform: translateX(-100%) skewX(-25deg);
            }
            100% {
              transform: translateX(100vw) skewX(-25deg);
            }
          }
          @keyframes loadingBar {
            0% {
              width: 0%;
            }
            50% {
              width: 80%;
            }
            100% {
              width: 100%;
            }
          }
        `}</style>
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
        onBackToDashboard={
          isAuthenticated
            ? () => {
                preserveBookingContext();
                setScreen("dashboard");
              }
            : undefined
        }
        screenPaddingClass={screenPaddingClass}
      />
    );
  } else if (screen === "assigning") {
    mainContent = <AssigningScreen status={tripRequestStatus} isAuthenticated={isAuthenticated} />;
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
        screenPaddingClass={screenPaddingClass}
        isAuthenticated={isAuthenticated}
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
        isGoogleMapsLoaded={true}
        googleMapsLoadError={googleMapsLoadError}
        guestId={guestId}
        airportPickupArea={airportPickupArea}
        screenPaddingClass={screenPaddingClass}
        isAuthenticated={isAuthenticated}
        driverLocation={driverLocation}
        setDriverLocation={setDriverLocation}
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
        screenPaddingClass={screenPaddingClass}
        isAuthenticated={isAuthenticated}
        onDone={() => {
          setResetBookingKey((prev) => prev + 1);
          preserveBookingContext();
          setPickup("");
          setDestination("");
          setFareEstimate(null);
          setDriver(null);
          setTripProgress(0);
          setPickupCoords(null);
          setDestinationCoords(null);
          setVerificationCode(null);
          setBookAsGuest(false);
          if (!isAuthenticated) {
            setGuestId(null);
          }
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
            setPollingIntervalId(null);
          }
          stopWebSocketConnection();
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", "/");
            console.log("cleared deep link URL, redirected to /");
          }
          if (isAuthenticated) {
            console.log("setting screen to dashboard seven");
            fetchTripHistory();
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
        accountData={accountData}
        onBookNewTrip={() => {
          if (activeTripId) {
            showNotification("You have an active Trip", "info");
            return null;
          }
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
        onShowWallet={() => setShowWallet(true)}
        onShowSettings={() => setShowSettings(true)}
        onShowEnable2FA={() => setShowEnable2FA(true)}
        onShowUpdateProfile={() => setShowUpdateProfile(true)}
        onBookRide={() => setScreen("booking")}
        onProfile={() => setShowProfile(true)}
        onLogout={() => {}}
        weatherData={weatherData}
        weatherLoading={weatherLoading}
        weatherError={weatherError}
        activeTrip={activeTripForDashboard}
        onShowActiveTrip={handleResumeActiveTrip}
        recentTripData={recentTripData}
        onResumeRecentTrip={handleResumeTripById}
      />
    );
  } else if (showTripHistory) {
    console.log("show trip history was called");
    mainContent = (
      <TripHistoryScreen
        isOpen={showTripHistory}
        onClose={() => setShowTripHistory(false)}
        onSelectTrip={(tripId) => {
          setSelectedTripId(tripId);
          setShowTripHistory(false);
        }}
        showNotification={showNotification}
      />
    );
  } else if (selectedTripId) {
    mainContent = (
      <TripDetailsScreen
        tripId={selectedTripId}
        onBack={() => {
          setSelectedTripId(null);
          console.log("Selected trip Id is true");
          setShowTripHistory(true);
        }}
        showNotification={showNotification}
      />
    );
  } else if (showWallet) {
    mainContent = <WalletScreen balance={walletBalance} onBack={() => setShowWallet(false)} />;
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
            text-sm
            antialiased
            [font-feature-settings:'ss01']
          "
        >

          <IOSInstallBanner />

          {currentNotification && (
            <TripUpdateNotification
              message={currentNotification.message}
              type={currentNotification.type}
              onDismiss={() => setCurrentNotification(null)}
            />
          )}
          {mainContent}
          <PassengerDetailsModal
            isOpen={showPassengerDetails}
            onClose={() => setShowPassengerDetails(false)}
            passengerData={passengerData}
            setPassengerData={setPassengerData}
            requirements={requirements}
            setRequirements={setRequirements}
            getBookingFieldError={getBookingFieldError}
            onRequestRide={handleRequestRide}
            isLoading={tripRequestStatus === "loading"}
            isAuthenticated={isAuthenticated}
            setBookAsGuest={setBookAsGuest}
            bookAsGuest={bookAsGuest}
            setTripRequestStatus={setTripRequestStatus}
            setTripRequestError={setTripRequestError}
          />
          {hasHydrated && (
            <DirectionsModal
              isOpen={showDirections}
              onClose={() => setShowDirections(false)}
              pickup={pickup}
              pickupCoords={pickupCoords}
              destination={destination}
              destinationCoords={destinationCoords}
              driverLocation={driver?.location || null}
              passengerLocation={passengerLiveLocation}
              airportPickupArea={airportPickupArea}
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
            guestId={isAuthenticated && !bookAsGuest ? null : guestId}
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
              onVerifyEmail={handleSignupInitiateSuccess}
              PHPAirportLocation={lastValidPickupForAnalyticsRef.current}
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
            onResendOtp={handleResendOtp}
          />
          <ProfileModal
            isOpen={showProfile}
            accountData={accountData}
            onClose={() => setShowProfile(false)}
            showNotification={showNotification}
            onLogout={handleLogout}
            onUpdateAccountData={updateAccountData}
            setShowPasswordResetModal={setShowPasswordResetModal}
            setShowAccountDeletionModal={setShowAccountDeletionModal}
          />
          <TripRequestStatusModal
            isOpen={!!tripRequestStatus}
            status={tripRequestStatus}
            message={tripRequestError}
            onClose={() => {
              setTripRequestStatus(null);
              if (typeof window !== "undefined" && window.sessionStorage && tripRequestStatus === "no-driver") {
                console.log("Clearing TripData in session");
                preserveBookingContext();
                sessionStorage.removeItem("tripData");
                console.log("Cleared tripData from sessionStorage.");
                window.history.replaceState(null, "", "/");
                setScreen("booking");
              }
            }}
            onConfirm={() => {
              if (tripRequestStatus === "no-driver" || tripRequestStatus === "error") {
                console.log("Retrying booking process...");
                setTripRequestStatus(null);
                setBookTripRetry(true);
                handleRequestRide();
              } else {
                setTripRequestStatus(null);
              }
            }}
          />
          <DriverVerificationModal
            isOpen={showDriverVerification}
            securityCode={verificationCode || ""}
            onClose={() => setShowDriverVerification(false)}
          />
          <LoginModal
            isOpen={showLogin}
            onClose={() => setShowLogin(false)}
            onLoginSuccess={handleLoginSuccess}
            onRequires2FA={handleRequires2FA}
            onLoginError={(errorMessage) => {
              console.log("page.tsx: Received login error from modal:", errorMessage);
              showNotification(errorMessage, "error");
            }}
            showNotification={showNotification}
            onShowSignupPrompt={() => {
              setShowSignup(true);
              setShowLogin(false);
            }}
          />
          {show2FAOtpModal && pendingLoginCreds && (
            <LoginOTPModal
              isOpen={show2FAOtpModal}
              onClose={() => {
                setShow2FAOtpModal(false);
                setPendingLoginCreds(null);
              }}
              onSubmit={handle2FAOtpSubmit}
              email={pendingLoginCreds.email}
              showNotification={showNotification}
            />
          )}
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
          {showTripHistory && (
            <TripHistoryModal
              isOpen={showTripHistory}
              onClose={() => setShowTripHistory(false)}
              onSelectTrip={(tripId) => {
                setSelectedTripId(tripId);
                setShowTripDetails(true);
              }}
              showNotification={showNotification}
            />
          )}
          <TripDetailsModal
            isOpen={showTripDetails}
            tripId={selectedTripId}
            onClose={() => {
              setShowTripDetails(false);
              setSelectedTripId(null);
              setShowTripHistory(true);
            }}
            showNotification={showNotification}
          />
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
              guestId={isAuthenticated && !bookAsGuest ? null : guestId}
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
      <PasswordResetModal
        isOpen={showPasswordResetModal}
        onClose={() => setShowPasswordResetModal(false)}
        showNotification={showNotification}
        email={accountData?.email ?? ""}
      />
      <AccountDeletionModal
        isOpen={showAccountDeletionModal}
        onClose={() => setShowAccountDeletionModal(false)}
        onConfirm={handleAccountDeletionSuccess}
        showNotification={showNotification}
      />

      {showNoInternetModal && (
        <NoInternetModal
          onRetry={() => {
            // Optional: retry last action, or just close modal
            setShowNoInternetModal(false);
          }}
        />
      )}
      {isAuthenticated && (
        <BottomNavBar
          onProfileClick={() => setShowProfile(true)}
          walletBalance={walletBalance}
          onHomeClick={handleHomeClick}
          onWalletClick={() => setShowWallet(true)}
          onShowTripHistory={() => {
            setShowTripHistory(true);
            console.log("show trip history value", showTripHistory);
          }}
        />
      )}

      {/* {process.env.NODE_ENV === 'development' && passengerLiveLocation && (
        <div 
          style={{
            position: 'fixed',
            top: 10,
            right: 10,
            background: 'rgba(0,0,0,0.7)',
            color: 'white',
            padding: '8px 12px',
            borderRadius: 6,
            fontSize: '12px',
            zIndex: 10000,
          }}
        >
          📍 Lat: {passengerLiveLocation[0].toFixed(6)}<br/>
          📍 Lng: {passengerLiveLocation[1].toFixed(6)}
        </div>
      )} */}
    </>
  );
}