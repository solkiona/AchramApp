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
import DashboardScreen from "@/components/app/screens/DashboardScreen";

// Modals - Dynamically import map-dependent modals like DirectionsModal
import dynamic from 'next/dynamic'; // Keep dynamic import for modals
const DirectionsModal = dynamic(() => import("@/components/app/modals/DirectionsModal"), { ssr: false }); // Keep this

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
import Image from "next/image";

// UI
import TripUpdateNotification from "@/components/app/ui/TripUpdateNotification";

// Types
type ScreenState =
  | "booking"
  | "assigning"
  | "driver-assigned"
  | "trip-progress"
  | "trip-complete"
  | "dashboard";

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
  };

  const handleProceed = () => {
    if (fareEstimate && pickup && destination) {
      setShowPassengerDetails(true);
    }
  };

  // NEW: Modified handleRequestRide with mock API call simulation and state persistence
  const handleRequestRide = () => {
    if (passengerData.name && passengerData.phone && passengerData.email) {
      setShowPassengerDetails(false);
      setTripRequestStatus("loading"); // Show loading modal

      // Simulate API call delay
      setTimeout(() => {
        const mockApiResponse = Math.random(); // Random number to simulate different outcomes

        if (mockApiResponse < 0.7) {
          // 70% chance of success
          // Simulate successful trip creation
          setTripRequestStatus("accepted");
          setDriver({
            name: "Adebayo Ogunlesi",
            rating: 4.9,
            trips: 1247,
            phone: "+234 801 234 5678",
            car: {
              model: "Toyota Camry 2021",
              color: "Silver",
              plate: "ABC 123 XY",
            },
            photo: "AO",
          });
          // NEW: Set verification code (mock)
          const mockCode = Math.floor(
            100000 + Math.random() * 900000
          ).toString(); // 6-digit code
          setVerificationCode(mockCode);

          // Transition to driver assigned screen after a short delay
          setTimeout(() => {
            setTripRequestStatus(null); // Close loading modal
            setScreen("driver-assigned");
          }, 2000);
        } else if (mockApiResponse < 0.9) {
          // 20% chance of no driver
          setTripRequestStatus("no-driver");
          setTripRequestError(
            "No drivers available in your area at the moment."
          );
        } else {
          // 10% chance of other error
          setTripRequestStatus("error");
          setTripRequestError(
            "An unexpected error occurred. Please try again."
          );
        }
      }, 2000); // Simulate 2 seconds API call
    }
  };

  const handleTripStart = () => {
    setScreen("trip-progress");
  };

  const handleRateSubmit = () => {
    setScreen('trip-complete')
  }

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
              src="/images/achrams-logo.png"
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
          if (token) {
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
    mainContent = (
      <DashboardScreen
        passengerData={passengerData}
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
            onClose={() => setTripRequestStatus(null)}
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

          {/* Future: Uncomment when implemented */}
          <CancelModal isOpen={showCancel} onClose={() => setShowCancel(false)} onConfirm={() => {}} />
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
      <MessageWindowModal isOpen={showMessage} onClose={() => setShowMessage(false)} recipientName={driver?.name || 'Driver'} />
        </div>
      </div>
    </>
  );
}

// // src/app/page.tsx
// "use client";

// import { useEffect, useState } from "react";
// import { useAuth } from "@/contexts/AuthContext";
// import BookingScreen from "@/components/app/screens/BookingScreen";
// import AssigningScreen from "@/components/app/screens/AssigningScreen";
// import DriverAssignedScreen from "@/components/app/screens/DriverAssignedScreen";
// import TripProgressScreen from "@/components/app/screens/TripProgressScreen";
// import TripCompleteScreen from "@/components/app/screens/TripCompleteScreen";
// import DashboardScreen from "@/components/app/screens/DashboardScreen";

// // Modals
// import PassengerDetailsModal from "@/components/app/modals/PassengerDetailsModal";
// import DirectionsModal from "@/components/app/modals/DirectionsModal";
// import PanicModal from "@/components/app/modals/PanicModal";
// import SignupPromptModal from "@/components/app/modals/SignupPromptModal";
// import OTPModal from "@/components/app/modals/OTPModal";
// import ProfileModal from "@/components/app/modals/ProfileModal";
// import CancelModal from "@/components/app/modals/CancelModal";
// import RateModal from "@/components/app/modals/RateModal";
// import MessageWindowModal from "@/components/app/modals/MessageWindowModal";
// import TripRequestStatusModal from "@/components/app/modals/TripRequestStatusModal";
// import DriverVerificationModal from "@/components/app/modals/DriverVerificationModal";
// import LoginModal from "@/components/app/modals/LoginModal"; // NEW: Import LoginModal
// import Image from "next/image";

// // UI
// import TripUpdateNotification from "@/components/app/ui/TripUpdateNotification";

// // Types
// type ScreenState =
//   | "booking"
//   | "assigning"
//   | "driver-assigned"
//   | "trip-progress"
//   | "trip-complete"
//   | "dashboard"; // Removed 'signup-prompt' as it's handled by state

// type Requirements = {
//   luggage: boolean;
//   wheelchair: boolean;
//   elderly: boolean;
// };

// type PassengerData = {
//   name: string;
//   phone: string;
//   email: string;
// };

// // NEW: Define type for the state you want to persist
// interface PersistedState {
//   screen: ScreenState;
//   pickup: string;
//   destination: string;
//   fareEstimate: number | null;
//   driver: any | null;
//   tripProgress: number;
//   pickupCoords: [number, number] | null;
//   destinationCoords: [number, number] | null;
//   verificationCode: string | null;
//   // Add other critical states as needed
// }

// // NEW: Function to save state to sessionStorage - only runs on client
// const saveAppState = (state: PersistedState) => {
//   if (typeof window !== "undefined" && window.sessionStorage) {
//     try {
//       sessionStorage.setItem("achrams_app_state", JSON.stringify(state));
//       console.log("App state saved to sessionStorage"); // Optional: For debugging
//     } catch (e) {
//       console.error("Failed to save app state to sessionStorage", e);
//     }
//   }
// };

// // NEW: Function to load state from sessionStorage - only runs on client
// const loadAppState = (): PersistedState | null => {
//   if (typeof window !== "undefined" && window.sessionStorage) {
//     try {
//       const savedStateStr = sessionStorage.getItem("achrams_app_state");
//       if (savedStateStr) {
//         const savedState = JSON.parse(savedStateStr) as PersistedState;
//         console.log("App state loaded from sessionStorage", savedState); // Optional: For debugging
//         return savedState;
//       }
//     } catch (e) {
//       console.error("Failed to load app state from sessionStorage", e);
//     }
//   }
//   return null; // Return null if sessionStorage is not available or error occurred
// };

// export default function ACHRAMApp() {
//   const { token } = useAuth();

//   // NEW: Use a state variable to track if we have checked sessionStorage on the client
//   const [hasHydrated, setHasHydrated] = useState(false);

//   // NEW: Define state variables without initial values from loadAppState here
//   const [screen, setScreen] = useState<ScreenState>("booking"); // Will be set after hydration
//   const [pickup, setPickup] = useState<string>("");
//   const [destination, setDestination] = useState<string>("");
//   const [fareEstimate, setFareEstimate] = useState<number | null>(null);
//   const [driver, setDriver] = useState<any>(null);
//   const [tripProgress, setTripProgress] = useState<number>(0);
//   const [pickupCoords, setPickupCoords] = useState<[number, number] | null>(
//     null
//   );
//   const [destinationCoords, setDestinationCoords] = useState<
//     [number, number] | null
//   >(null);
//   const [verificationCode, setVerificationCode] = useState<string | null>(null);

//   // NEW: State for modals (these can be initialized normally)
//   const [showPassengerDetails, setShowPassengerDetails] = useState(false);
//   const [showDirections, setShowDirections] = useState(false);
//   const [showPanic, setShowPanic] = useState(false);
//   const [showSignup, setShowSignup] = useState(false); // NEW: Use this state instead of screen === 'signup-prompt'
//   const [showOTP, setShowOTP] = useState(false);
//   const [showProfile, setShowProfile] = useState(false);
//   const [showCancel, setShowCancel] = useState(false);
//   const [showRate, setShowRate] = useState(false);
//   const [showMessage, setShowMessage] = useState(false);

//   // NEW: State for Login Modal
//   const [showLogin, setShowLogin] = useState(false); // NEW: Add state for login modal

//   // NEW: State for trip request status modal
//   const [tripRequestStatus, setTripRequestStatus] = useState<
//     "loading" | "accepted" | "no-driver" | "error" | null
//   >(null);
//   const [tripRequestError, setTripRequestError] = useState<string | null>(null);

//   // NEW: State for driver verification modal
//   const [showDriverVerification, setShowDriverVerification] = useState(false);

//   // NEW: State for trip update notifications
//   const [currentNotification, setCurrentNotification] = useState<{
//     message: string;
//     type: "info" | "success" | "warning" | "error";
//   } | null>(null);

//   // NEW: Effect to run only on the client after mount to load state and set initial values
//   useEffect(() => {
//     // Check if we are on the client
//     if (typeof window !== "undefined") {
//       const savedState = loadAppState();
//       if (savedState) {
//         // Set state using the loaded values
//         setScreen(savedState.screen);
//         setPickup(savedState.pickup);
//         setDestination(savedState.destination);
//         setFareEstimate(savedState.fareEstimate);
//         setDriver(savedState.driver);
//         setTripProgress(savedState.tripProgress);
//         setPickupCoords(savedState.pickupCoords);
//         setDestinationCoords(savedState.destinationCoords);
//         setVerificationCode(savedState.verificationCode);
//       } else {
//         // Set default initial state based on token
//         setScreen(token ? "dashboard" : "booking");
//       }
//       // Mark as hydrated after loading/saving defaults
//       setHasHydrated(true);
//     } else {
//       // Fallback if somehow this runs on server (shouldn't with 'use client')
//       setScreen(token ? "dashboard" : "booking");
//       setHasHydrated(true);
//     }
//   }, [token]); // Depend on token if initial screen logic depends on it

//   // NEW: Effect to handle navigation after trip completion and set showSignup
//   useEffect(() => {
//     if (screen === "trip-complete") {
//       // Check if user is authenticated
//       if (token) {
//         // If authenticated, maybe show rate modal (if not already shown) and then go to dashboard
//         // Or, if rating is handled elsewhere, just go to dashboard after a delay or user action
//         // For now, let's assume the user can click a button or it happens automatically after a short delay
//         // Or, the TripCompleteScreen itself could trigger this.
//         // Let's simulate a delay and then transition to dashboard if authenticated.
//         // This is just a simulation, the real trigger might be clicking 'Done' in TripCompleteScreen.
//         // We'll add a specific state to manage this transition cleanly.
//         // Let's assume the TripCompleteScreen has a button that calls a handler passed from page.tsx.
//         // For now, let's just add the logic here that *would* happen when the user wants to leave the trip-complete screen.
//         // The key is to clear trip data and set screen to dashboard *before* the save effect runs.
//       } else {
//         // If not authenticated (guest), show signup prompt after a delay
//         const timer = setTimeout(() => {
//           // NEW: Clear specific trip-related state before navigating to signup
//           // Note: This clearing is now handled in the onDone handler in TripCompleteScreen render block
//           // We set showSignup here, which triggers the modal.
//           setShowSignup(true); // NEW: Trigger the signup modal
//         }, 1500); // Delay matches the original effect

//         return () => clearTimeout(timer);
//       }
//     }
//   }, [screen, token]); // Depend on screen and token only


//   // Data state
//   const [passengerData, setPassengerData] = useState<PassengerData>({
//     name: "",
//     phone: "",
//     email: "",
//   });
//   const [requirements, setRequirements] = useState<Requirements>({
//     luggage: false,
//     wheelchair: false,
//     elderly: false,
//   });

//   // NEW: Function to show notifications
//   const showNotification = (
//     message: string,
//     type: "info" | "success" | "warning" | "error"
//   ) => {
//     setCurrentNotification({ message, type });
//     setTimeout(() => {
//       setCurrentNotification(null);
//     }, 5000); // Auto-dismiss after 5 seconds
//   };

//   // NEW: Effect to trigger notifications based on screen changes (simulated)
//   useEffect(() => {
//     if (screen === "driver-assigned" && driver) {
//       // Simulate driver found notification
//       showNotification("Driver assigned successfully!", "success");
//       // Simulate trip updates after some delay
//       const timer1 = setTimeout(
//         () => showNotification("Driver is 7 mins from pickup location", "info"),
//         3000
//       );
//       const timer2 = setTimeout(
//         () =>
//           showNotification("Driver has arrived at pickup location", "success"),
//         10000
//       );

//       return () => {
//         clearTimeout(timer1);
//         clearTimeout(timer2);
//       };
//     }
//     if (screen === "trip-progress") {
//       // Simulate ongoing trip updates
//       const timer = setInterval(() => {
//         setTripProgress((prev) => {
//           if (prev >= 100) {
//             clearInterval(timer);
//             setScreen("trip-complete");
//             return 100;
//           }
//           return prev + 2; // Simulate progress
//         });
//       }, 1000); // Update every second for simulation

//       return () => clearInterval(timer);
//     }
//   }, [screen, driver]); // Depend on screen and driver

//   // NEW: Effect to save state whenever it changes (only runs on client after hydration)
//   useEffect(() => {
//     if (hasHydrated) {
//       // Only save after initial state has been loaded/set
//       const stateToSave: PersistedState = {
//         screen,
//         pickup,
//         destination,
//         fareEstimate,
//         driver,
//         tripProgress,
//         pickupCoords,
//         destinationCoords,
//         verificationCode,
//         // Add other states...
//       };
//       saveAppState(stateToSave);
//     }
//   }, [
//     screen,
//     pickup,
//     destination,
//     fareEstimate,
//     driver,
//     tripProgress,
//     pickupCoords,
//     destinationCoords,
//     verificationCode,
//     hasHydrated, // Include hydration flag to prevent saving before state is loaded
//   ]);

//   // NEW: Handler passed to SignupPromptModal for successful registration (e.g., open OTP)
//   const handleRegistrationSuccess = (email: string) => {
//     // For now, simulate OTP verification success and move to dashboard
//     // In reality, you'd open OTPModal here
//     // setShowOTP(true); // Assuming OTPModal exists and handles verification
//     // If OTP verification is successful within OTPModal, it would then trigger navigation to dashboard
//     // OR, if registration API directly logs in (less common), update token and screen here.
//     // Let's assume it leads to OTP first, then dashboard.
//     // For this mock, let's just move to dashboard after "registration"
//     setScreen("dashboard");
//     setShowSignup(false); // Close signup prompt modal
//     // setShowOTP(true); // Uncomment if implementing OTP flow
//   };

//   // NEW: Handler passed to LoginModal for successful login
//   const handleLoginSuccess = () => {
//     // The useAuth context should now have the token
//     // page.tsx relies on the `token` from useAuth to determine initial screen and rendering logic
//     // If token exists, screen should be 'dashboard' (handled by initial load or subsequent logic)
//     // Ensure screen is set correctly, maybe explicitly if needed after login
//     // setScreen('dashboard'); // Often not needed if initial load logic handles it based on token
//     // onClose in LoginModal should be sufficient if screen logic in render is correct
//     // No explicit action needed here if state management is correct, just let the parent re-render based on updated token.
//     // If token changes and initial screen logic in useEffect isn't catching it, maybe force update screen here.
//     // For now, assume token update in context triggers correct re-render.
//   };

//   const handleProceed = () => {
//     if (fareEstimate && pickup && destination) {
//       setShowPassengerDetails(true);
//     }
//   };

//   // NEW: Modified handleRequestRide with mock API call simulation and state persistence
//   const handleRequestRide = () => {
//     if (passengerData.name && passengerData.phone && passengerData.email) {
//       setShowPassengerDetails(false);
//       setTripRequestStatus("loading"); // Show loading modal

//       // Simulate API call delay
//       setTimeout(() => {
//         const mockApiResponse = Math.random(); // Random number to simulate different outcomes

//         if (mockApiResponse < 0.7) {
//           // 70% chance of success
//           // Simulate successful trip creation
//           setTripRequestStatus("accepted");
//           setDriver({
//             name: "Adebayo Ogunlesi",
//             rating: 4.9,
//             trips: 1247,
//             phone: "+234 801 234 5678",
//             car: {
//               model: "Toyota Camry 2021",
//               color: "Silver",
//               plate: "ABC 123 XY",
//             },
//             photo: "AO",
//           });
//           // NEW: Set verification code (mock)
//           const mockCode = Math.floor(
//             100000 + Math.random() * 900000
//           ).toString(); // 6-digit code
//           setVerificationCode(mockCode);

//           // Transition to driver assigned screen after a short delay
//           setTimeout(() => {
//             setTripRequestStatus(null); // Close loading modal
//             setScreen("driver-assigned");
//           }, 2000);
//         } else if (mockApiResponse < 0.9) {
//           // 20% chance of no driver
//           setTripRequestStatus("no-driver");
//           setTripRequestError(
//             "No drivers available in your area at the moment."
//           );
//         } else {
//           // 10% chance of other error
//           setTripRequestStatus("error");
//           setTripRequestError(
//             "An unexpected error occurred. Please try again."
//           );
//         }
//       }, 2000); // Simulate 2 seconds API call
//     }
//   };

//   const handleTripStart = () => {
//     setScreen("trip-progress");
//   };

//   const handleTripComplete = () => {
//     setScreen("trip-complete");
//   };

//   // NEW: Wait for hydration before rendering main content to avoid SSR/client mismatch
//   if (!hasHydrated) {
//     return (
//       <div className="flex items-center justify-center h-screen w-full bg-white animate-fadeIn">
//         <div className="relative">
//           {/* Soft pulsing glow */}
//           <div className="absolute inset-0 rounded-2xl bg-achrams-gradient-primary opacity-40 blur-xl animate-pulse"></div>

//           {/* Main Logo Container */}
//           <div className="w-16 h-16 bg-achrams-gradient-primary rounded-2xl flex items-center justify-center shadow-xl animate-scaleIn relative overflow-hidden">
//             {/* Subtle rotating light sweep */}
//             <div className="absolute inset-0 bg-white/20 animate-sweep pointer-events-none"></div>

//             <Image
//               src="/images/achrams-logo.png"
//               alt="ACHRAMS Logo"
//               width={30}
//               height={30}
//               className="object-contain animate-popIn"
//             />
//           </div>
//         </div>
//       </div>
//     ); // Or a skeleton loader
//   }

//   // === Render current screen as main content ===
//   let mainContent = null;

//   if (screen === "booking") {
//     mainContent = (
//       <BookingScreen
//         pickup={pickup}
//         setPickup={setPickup}
//         destination={destination}
//         setDestination={setDestination}
//         fareEstimate={fareEstimate}
//         setFareEstimate={setFareEstimate}
//         onProceed={handleProceed}
//         setShowPassengerDetails={setShowPassengerDetails}
//         passengerData={passengerData}
//         setPassengerData={setPassengerData}
//         showPassengerDetails={showPassengerDetails}
//         requirements={requirements}
//         setRequirements={setRequirements}
//         setPickupCoords={setPickupCoords} // NEW
//         setDestinationCoords={setDestinationCoords} // NEW
//       />
//     );
//   } else if (screen === "assigning") {
//     mainContent = <AssigningScreen />;
//   } else if (screen === "driver-assigned") {
//     mainContent = (
//       <DriverAssignedScreen
//         pickup={pickup}
//         destination={destination}
//         driver={driver}
//         verificationCode={verificationCode || ""} // NEW: Pass verification code
//         onShowDirections={() => setShowDirections(true)}
//         onShowDriverVerification={() => setShowDriverVerification(true)} // NEW: Handler for verification modal
//         onStartTrip={handleTripStart}
//         onBack={() => setScreen("booking")}
//       />
//     );
//   } else if (screen === "trip-progress") {
//     mainContent = (
//       <TripProgressScreen
//         driver={driver}
//         onPanic={() => setShowPanic(true)}
//         onComplete={handleTripComplete}
//         pickupCoords={pickupCoords} // NEW: Pass coordinates
//         destinationCoords={destinationCoords} // NEW: Pass coordinates
//         tripProgress={tripProgress} // NEW: Pass progress
//       />
//     );
//   } else if (screen === "trip-complete") {
//     mainContent = (
//       <TripCompleteScreen
//         fareEstimate={fareEstimate}
//         driver={driver}
//         onRate={() => setShowRate(true)}
//         onDone={() => {
//           // NEW: Clear specific trip-related state before navigating
//           setPickup("");
//           setDestination("");
//           setFareEstimate(null);
//           setDriver(null);
//           setTripProgress(0);
//           setPickupCoords(null);
//           setDestinationCoords(null);
//           setVerificationCode(null); // NEW: Clear verification code
//           alert('was called');
//           if (token) {
//             setScreen("dashboard");
//           } else {
//             // NEW: Instead of setting screen to 'signup-prompt', just set the showSignup state
//             setScreen("booking");
//             // setShowSignup(true);
//           }
//         }}
//       />
//     );
//   } else if (screen === "dashboard") {
//     mainContent = (
//       <DashboardScreen
//         passengerData={passengerData}
//         onShowProfile={() => setShowProfile(true)}
//         onBookNewTrip={() => {
//           setScreen("booking");
//           setPickup("");
//           setDestination("");
//           setFareEstimate(null);
//           setPickupCoords(null);
//           setDestinationCoords(null);
//           setDriver(null);
//           setTripProgress(0); // NEW: Reset trip progress
//           setVerificationCode(null); // NEW: Reset verification code
//         }}
//       />
//     );
//   }
//   // Note: Removed the 'signup-prompt' screen render block as it's handled by the showSignup state and modal

//   // === Return full UI tree including modals and notifications ===
//   return (
//     <>
//       <div className="min-h-screen flex items-center justify-center">
//         <div
//           className="
//   min-h-screen h-dvh
//   w-full max-w-[430px] mx-auto
//   bg-white
//   flex flex-col
//   /* Critical for header/body/footer layouts */
//   text-sm
//   antialiased
//   [font-feature-settings:'ss01']
// "
//         >
//           {/* NEW: Render notification if available */}
//           {currentNotification && (
//             <TripUpdateNotification
//               message={currentNotification.message}
//               type={currentNotification.type}
//               onDismiss={() => setCurrentNotification(null)}
//             />
//           )}

//           {mainContent}

//           {/* Modals — all rendered as overlays */}
//           <PassengerDetailsModal
//             isOpen={showPassengerDetails}
//             onClose={() => setShowPassengerDetails(false)}
//             passengerData={passengerData}
//             setPassengerData={setPassengerData}
//             requirements={requirements}
//             setRequirements={setRequirements}
//             onRequestRide={handleRequestRide}
//           />

//           <DirectionsModal
//             isOpen={showDirections}
//             onClose={() => setShowDirections(false)}
//             pickup={pickup}
//             pickupCoords={pickupCoords}
//             destination={destination} // NEW
//             destinationCoords={destinationCoords} // NEW
//           />

//           <PanicModal
//             isOpen={showPanic}
//             onClose={() => setShowPanic(false)}
//             onComplete={() => {
//               setShowPanic(false);
//               alert("Safety team notified");
//             }}
//           />

//           {!token &&
//             showSignup && ( // Ensure it only shows for unauthenticated users
//               <SignupPromptModal
//                 isOpen={showSignup} // Use showSignup state
//                 passengerData={passengerData}
//                 onClose={() => setShowSignup(false)} // Close the modal state
//                 onVerifyEmail={() => setShowOTP(true)} // Keep existing link to OTP
//                 onRegistrationSuccess={handleRegistrationSuccess} // NEW: Pass success handler
//                 onOpenLoginModal={() => setShowLogin(true)} // NEW: Pass handler to open login modal
//               />
//             )}

//           <OTPModal
//             isOpen={showOTP}
//             email={passengerData.email}
//             onComplete={() => {
//               setTimeout(() => {
//                 setScreen("dashboard");
//                 setShowOTP(false);
//                 setShowSignup(false);
//               }, 1000);
//             }}
//             onClose={() => setShowOTP(false)}
//           />

//           <ProfileModal
//             isOpen={showProfile}
//             passengerData={passengerData}
//             onClose={() => setShowProfile(false)}
//             onLogout={() => {
//               // Clear saved state on logout
//               if (typeof window !== "undefined" && window.sessionStorage) {
//                 sessionStorage.removeItem("achrams_app_state");
//               }
//               window.location.href = "/auth/login";
//             }}
//           />

//           {/* NEW: Trip Request Status Modal */}
//           <TripRequestStatusModal
//             isOpen={!!tripRequestStatus}
//             status={tripRequestStatus}
//             message={tripRequestError}
//             onClose={() => setTripRequestStatus(null)}
//           />

//           {/* NEW: Driver Verification Modal */}
//           <DriverVerificationModal
//             isOpen={showDriverVerification}
//             securityCode={verificationCode || ""}
//             onClose={() => setShowDriverVerification(false)}
//           />

//           {/* NEW: Login Modal */}
//           <LoginModal
//             isOpen={showLogin}
//             onClose={() => setShowLogin(false)}
//             onLoginSuccess={handleLoginSuccess} // NEW: Pass success handler
//           />

//           {/* Future: Uncomment when implemented */}
//           <CancelModal isOpen={showCancel} onClose={() => setShowCancel(false)} onConfirm={() => {}} />
//       <RateModal isOpen={showRate} onClose={() => setShowRate(false)} onRate={() => {}} driverName={driver?.name} />
//       <MessageWindowModal isOpen={showMessage} onClose={() => setShowMessage(false)} recipientName={driver?.name || 'Driver'} />
//         </div>
//       </div>
//     </>
//   );
// }
