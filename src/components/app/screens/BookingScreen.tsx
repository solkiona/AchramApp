// src/components/app/screens/BookingScreen.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Plane,
  ChevronDown,
  X,
  Loader,
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";
import { findNearestAirport, Airport } from "@/lib/airports"; // NEW: Import Airport type
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api"; // NEW: Import Google Maps components
import AirportSelectionModal from "@/components/app/modals/AirportSelectionModal"; // NEW: Import the new modal
import OutsideServiceAreaModal from "@/components/app/modals/OutsideServiceAreaModal"; // NEW: Import the new modal

// NEW: Define type for location data
interface LocationData {
  name: string;
  coords: [number, number] | null; // [lng, lat]
}

interface BookingScreenProps {
  pickup: string;
  setPickup: (val: string) => void;
  destination: string;
  setDestination: (val: string) => void;
  fareEstimate: number | null;
  setFareEstimate: (val: number | null) => void;
  onProceed: () => void;
  setShowPassengerDetails: (val: boolean) => void;
  passengerData: any;
  setPassengerData: (val: any) => void;
  showPassengerDetails: boolean;
  requirements: any;
  setRequirements: (val: any) => void;
  // NEW: Prop to set pickup coordinates in parent (page.tsx)
  setPickupCoords: (coords: [number, number] | null) => void;
  // NEW: Prop to set destination coordinates in parent (page.tsx)
  setDestinationCoords: (coords: [number, number] | null) => void;
  // NEW: Prop to show the location permission modal
  onShowLocationModal: () => void;
}

// NEW: Define coordinates for airports (replace with actual coordinates)
const losCoords: [number, number] = [3.330058, 6.568287]; // Actual coord from API doc
const abvCoords: [number, number] = [7.2667, 9.0167]; // Placeholder, find actual

const airports = [
  { id: "current", name: "Use my current location", special: true },
  { id: "los", name: "Murtala Muhammed Int'l Airport (LOS)", city: "Lagos" },
  { id: "abv", name: "Nnamdi Azikiwe Int'l Airport (ABV)", city: "Abuja" },
];

// NEW: Placeholder coordinates for common destinations (find actual coords)
// This map is now primarily used for the simple destination dropdown suggestions.
// For real coordinates, Google Maps Autocomplete is preferred.
const destinationCoordsMap: Record<string, [number, number] | null> = {
  "Victoria Island, Lagos": [3.4084, 6.4397],
  "Lekki Phase 1, Lagos": [3.9942, 6.4253],
  "Ikeja GRA, Lagos": [3.3519, 6.555],
  "Ikorodu, Lagos": [3.504145, 6.620891], // From API doc
  // Add more as needed
};

// NEW: Google Maps API Key (ensure it's available in environment)
const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;

export default function BookingScreen({
  pickup,
  setPickup,
  destination,
  setDestination,
  fareEstimate,
  setFareEstimate,
  onProceed,
  setShowPassengerDetails,
  passengerData,
  setPassengerData,
  showPassengerDetails,
  requirements,
  setRequirements,
  setPickupCoords,
  setDestinationCoords,
  onShowLocationModal, // NEW: Destructure the prop
}: BookingScreenProps) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  // NEW: State for airport selection modal
  const [showAirportSelectionModal, setShowAirportSelectionModal] = useState(false);
  const [airportsToSelect, setAirportsToSelect] = useState<Airport[]>([]);
  // NEW: State for outside service area modal
  const [showOutsideServiceModal, setShowOutsideServiceModal] = useState(false); // NEW
  // NEW: Ref for the destination search box
  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  // NEW: Destructure loading state from the hook
  const {
    coords,
    error,
    requestPermission,
    loading: hookLoading,
  } = useGeolocation();

  // NEW: State to track if location is being fetched (combines hook loading and UI state)
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // NEW: State to hold full pickup location data including coordinates
  const [pickupLocationData, setPickupLocationData] = useState<LocationData>({
    name: pickup,
    coords: null,
  });

  // NEW: State to hold full destination location data including coordinates
  const [destinationLocationData, setDestinationLocationData] =
    useState<LocationData>({
      name: destination,
      coords: null,
    });

  // NEW: Sync pickupLocationData.name with the parent's pickup state if it changes externally
  useEffect(() => {
    setPickupLocationData((prev) => ({ ...prev, name: pickup }));
  }, [pickup]);

  // NEW: Sync destinationLocationData.name with the parent's destination state if it changes externally
  useEffect(() => {
    setDestinationLocationData((prev) => ({ ...prev, name: destination }));
  }, [destination]);

  // NEW: Sync parent's pickup and pickupCoords states when pickupLocationData changes
  useEffect(() => {
    setPickup(pickupLocationData.name);
    setPickupCoords(pickupLocationData.coords);
  }, [pickupLocationData, setPickup, setPickupCoords]);

  // NEW: Sync parent's destination and destinationCoords states when destinationLocationData changes
  useEffect(() => {
    setDestination(destinationLocationData.name);
    setDestinationCoords(destinationLocationData.coords);
  }, [destinationLocationData, setDestination, setDestinationCoords]);

  // NEW: Sync parent's fareEstimate when pickupLocationData or destinationLocationData changes
  // This is a placeholder. In a real implementation, you would call GET /v1/fares/lookup here.
  useEffect(() => {
    if (destinationLocationData.name && pickupLocationData.name) {
      // Example: Call fare lookup API when both locations are set
      // fetchFareEstimate(pickupLocationData, destinationLocationData).then(setFareEstimate);
      // For now, keep the existing mock logic or remove it if using API call exclusively
      const estimate = 4500 + Math.floor(Math.random() * 2000);
      setFareEstimate(estimate);
    } else {
      setFareEstimate(null);
    }
  }, [destinationLocationData, pickupLocationData, setFareEstimate]);

  // NEW: Updated handleUseCurrentLocation function
  const handleUseCurrentLocation = async () => {
    // NEW: Check if permission was previously denied or if error indicates need for modal
    if (error && (error.includes("denied") || error.includes("Permission denied"))) {
      console.log(error);
      console.log("Location permission denied, showing modal.");
      onShowLocationModal(); // Trigger parent to show the modal
      setPickupOpen(false); // Close dropdown
      return;
    }

    // NEW: Set fetching state and close dropdown immediately
    setIsFetchingLocation(true);
    setPickupOpen(false); // Close dropdown when fetching starts

    try {
      // NEW: Await the result of requestPermission
      const fetchedCoords = await requestPermission();
      // NEW: Check if coords were successfully obtained
      if (fetchedCoords) {
        // NEW: Call /v1/airports/by-location to resolve the airport
        const foundAirports = await findNearestAirport(
          fetchedCoords.longitude,
          fetchedCoords.latitude
        );

        if (foundAirports && Array.isArray(foundAirports) && foundAirports.length > 0) {
            if (foundAirports.length === 1) {
                // If only one airport found, use it directly
                setPickupLocationData({
                    name: foundAirports[0].name, // e.g., "Murtala Muhammed International Airport"
                    coords: [fetchedCoords.longitude, fetchedCoords.latitude],
                });
            } else {
                // If multiple airports found, show the selection modal
                setAirportsToSelect(foundAirports);
                setShowAirportSelectionModal(true);
            }
        } else {
          // Handle case where no airport is found near the location (foundAirports is null or [])
          console.warn("No ACHRAMS airport found near the current location.");
          // NEW: Show the specific modal for this scenario
          setShowOutsideServiceModal(true);
          // NEW: Do NOT clear pickupLocationData here, let the modal handle user dismissal
          // setPickupLocationData({ name: "", coords: null }); // Remove this line
        }
      } else {
        // NEW: Handle case where request was granted but coords were null (unlikely but possible)
        console.warn(
          "Geolocation request granted but no coordinates returned."
        );
        // Optionally update UI to show a generic error or retry option
        // setPickupLocationData({ name: "", coords: null }); // Or clear if needed for other errors
      }
    } catch (err) {
      console.error("Geolocation request or API call failed:", err);
      // NEW: Optionally update UI to show the error from the hook or a generic message
      // setErrorState("Failed to get location: " + err);
      // setPickupLocationData({ name: "", coords: null }); // Or clear on generic error
    } finally {
      // NEW: Always stop fetching state when done (success or failure)
      setIsFetchingLocation(false);
    }
  };

  // NEW: Handle airport selection from the modal
  const handleAirportSelectedFromModal = (selectedAirport: Airport) => {
    // Use the coordinates from the geolocation request and the name/ID from the selected airport
    setPickupLocationData({
      name: selectedAirport.name,
      coords: pickupLocationData.coords, // Use the coords obtained from geolocation
    });
    // The airport ID (selectedAirport.id) is now resolved and can be used
    // in handleRequestRide in page.tsx for the booking API call.
  };

  const handleAirportSelect = (airportId: string) => {
    let selectedCoords: [number, number] | null = null;
    let selectedName = "";

    switch (airportId) {
      case "los":
        selectedCoords = losCoords;
        selectedName = "Murtala Muhammed Int'l Airport (LOS)";
        break;
      case "abv":
        selectedCoords = abvCoords;
        selectedName = "Nnamdi Azikiwe Int'l Airport (ABV)";
        break;
      default:
        selectedName = "Unknown Airport";
    }

    if (selectedCoords) {
      setPickupLocationData({
        name: selectedName,
        coords: selectedCoords,
      });
    }
    setPickupOpen(false);
  };

  // NEW: Handle destination selection from simple dropdown (fallback)
  const handleDestinationSelect = (selectedDestination: string) => {
    // NEW: In a real implementation with autocomplete, the coordinates would come from the autocomplete result
    // For now, use the map or set to null if not found
    const selectedCoords = destinationCoordsMap[selectedDestination] || null;
    setDestinationLocationData({
      name: selectedDestination,
      coords: selectedCoords,
    });
    setDestOpen(false);
  };

  // NEW: Handle destination changes from Google Maps Autocomplete
  const handleDestinationChanged = (e: any) => { // 'e' is the event from StandaloneSearchBox
    // Update local state name immediately as user types
    setDestinationLocationData((prev) => ({ ...prev, name: e.target.value }));
    setDestOpen(true); // Keep dropdown open while typing/searching
  };

  // NEW: Handle when a place is selected from the autocomplete dropdown
  const handlePlaceChanged = () => {
    if (searchBoxRef.current) {
      const places = searchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry && place.geometry.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          setDestinationLocationData({
            name: place.formatted_address || place.name || "", // Prefer formatted address, fallback to name
            coords: [lng, lat], // [longitude, latitude]
          });
          setDestOpen(false); // Close the dropdown after selection
        } else {
          console.error("Place selected but no geometry.location found.");
        }
      } else {
          console.log("No places found from search box.");
          // Optionally clear coordinates if user clears the input and presses enter/selects nothing
          // setDestinationLocationData(prev => ({ ...prev, coords: null }));
      }
    }
  };

  // NEW: Combine internal fetching state with hook's loading state for UI
  const showFetchingUI = isFetchingLocation || hookLoading;

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {/* NEW: Airport Selection Modal */}
      <AirportSelectionModal
        isOpen={showAirportSelectionModal}
        onClose={() => setShowAirportSelectionModal(false)}
        airports={airportsToSelect}
        onSelect={handleAirportSelectedFromModal}
      />
      {/* NEW: Outside Service Area Modal */}
      <OutsideServiceAreaModal
        isOpen={showOutsideServiceModal}
        onClose={() => setShowOutsideServiceModal(false)} // Close the modal
      />

      {/* Header container now spans full width with no horizontal padding */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-0 py-4">
        <div className="px-6">
          <ACHRAMSHeader title="" />
        </div>
      </div>
      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-achrams-text-primary pb-4">
          Book Your Airport Ride
        </h2>

        <div className="space-y-4">
          {/* Pickup */}
          <div className="relative">
            {/* Main Input Field */}
            <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
              <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
              <input
                type="text"
                placeholder="Airport pickup location"
                // NEW: Show fetching message or actual name, make read-only if fetching
                value={
                  showFetchingUI
                    ? "Getting your location..."
                    : pickupLocationData.name
                }
                // NEW: Disable input while fetching
                onChange={(e) => {
                  if (!showFetchingUI) {
                    setPickupLocationData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }));
                  }
                }}
                onFocus={() => {
                  if (!showFetchingUI) {
                    setPickupOpen(true);
                  }
                }}
                // NEW: Show read-only state while fetching
                readOnly={showFetchingUI}
                className={`flex-1 bg-transparent outline-none text-base ${
                  // NEW: Apply different text color when fetching to indicate disabled state
                  showFetchingUI
                    ? "text-achrams-text-secondary italic"
                    : "text-achrams-text-primary"
                }`}
              />
              {/* Dropdown/Open Button */}
              <div className="flex items-center">
                {/* NEW: Show loader next to dropdown button while fetching, disable button */}
                {showFetchingUI && (
                  <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid mr-1" />
                )}
                <button
                  onClick={() => {
                    if (!showFetchingUI) {
                      setPickupOpen(!pickupOpen);
                    }
                  }}
                  disabled={showFetchingUI} // NEW: Disable button while fetching
                  className={`p-2 ${
                    // NEW: Apply different text color and cursor when disabled
                    showFetchingUI
                      ? "text-achrams-text-secondary opacity-50 cursor-not-allowed"
                      : "text-achrams-text-secondary hover:text-achrams-text-primary"
                  } transition-colors`}
                >
                  {/* NEW: Show spinner inside button instead of Navigation icon while fetching */}
                  {showFetchingUI ? (
                    <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid" />
                  ) : pickupOpen ? (
                    <ChevronDown className="w-5 h-5" />
                  ) : (
                    <Navigation className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Dropdown Content */}
            {pickupOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                {/* NEW: Show fetching indicator if loading, otherwise show options */}
                {showFetchingUI ? (
                  <div className="w-full px-4 py-3 flex items-center gap-3 justify-center text-achrams-text-secondary">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    <span>Locating you...</span>{" "}
                    {/* NEW: Professional message */}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={showFetchingUI} // NEW: Disable button while fetching (shouldn't be reachable here, but good practice)
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left disabled:opacity-50 disabled:cursor-not-allowed" // NEW: Add disabled styles
                    >
                      <MapPin className="w-5 h-5 text-achrams-primary-solid flex-shrink-0" />
                      <span>Use my current location</span>
                    </button>
                    {/* ... Other Airport Buttons ... */}
                    {airports.slice(1).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleAirportSelect(a.id)} // Use new handler
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
                      >
                        <Plane className="w-5 h-5 text-achrams-primary-solid flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-medium text-achrams-text-primary text-sm">
                            {a.name}
                          </div>
                          <div className="text-xs text-achrams-text-secondary">
                            {a.city}
                          </div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center py-1">
            <div className="w-0.5 h-6 bg-achrams-border" />
          </div>

          {/* Destination */}
          <div className="relative">
            {/* NEW: Wrap destination input with LoadScript and StandaloneSearchBox */}
            <LoadScript
              googleMapsApiKey={GOOGLE_MAPS_API_KEY}
              libraries={["places"]}
            >
              <StandaloneSearchBox
                onLoad={(ref) => {
                  searchBoxRef.current = ref; // Store the reference
                }}
                onUnmount={() => {
                  searchBoxRef.current = null; // Clean up reference
                }}
                onPlacesChanged={handlePlaceChanged} // Handle place selection
              >
                <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
                  <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
                  <input
                    type="text"
                    placeholder="Enter destination"
                    value={destinationLocationData.name} // NEW: Use name from local state
                    onChange={handleDestinationChanged} // NEW: Handle input change for autocomplete
                    onFocus={() => setDestOpen(true)} // NEW: Open dropdown on focus
                    className="flex-1 bg-transparent outline-none text-base text-achrams-text-primary"
                  />
                  {destOpen &&
                    destinationLocationData.name && ( // NEW: Use local state
                      <button
                        onClick={() => {
                          setDestinationLocationData({ name: "", coords: null }); // NEW: Clear local state
                          setDestination(""); // NEW: Clear parent state
                        }}
                        className="p-2 text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                </div>
              </StandaloneSearchBox>
            </LoadScript>
            {/* NEW: Dropdown for simple destination suggestions (fallback if autocomplete not used) */}
            {/* This is now hidden when the search box is active, but could be shown if needed */}
            {destOpen &&
              destinationLocationData.name &&
              !searchBoxRef.current && ( // NEW: Only show if search box ref is not active (fallback logic)
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                  {Object.keys(destinationCoordsMap)
                    .filter((d) =>
                      d
                        .toLowerCase()
                        .includes(destinationLocationData.name.toLowerCase())
                    )
                    .map((d, i) => (
                      <button
                        key={i}
                        onClick={() => handleDestinationSelect(d)} // NEW: Use new handler
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
                      >
                        <MapPin className="w-5 h-5 text-achrams-primary-solid flex-shrink-0" />
                        <div className="text-achrams-text-primary text-sm">
                          {d}
                        </div>
                      </button>
                    ))}
                </div>
              )}
          </div>
        </div>

        {fareEstimate && (
          <div className="mt-6 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="flex justify-between items-center">
              <span className="text-achrams-text-secondary">
                Estimated fare
              </span>
              <span className="text-xl font-bold text-achrams-text-primary">
                ₦{fareEstimate.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </div>
      <div className="p-6">
        <button
          onClick={onProceed}
          disabled={!fareEstimate}
          className={`w-full py-4 rounded-xl text-lg font-bold text-achrams-text-light transition-all ${
            fareEstimate
              ? "bg-achrams-gradient-primary hover:opacity-95 active:scale-[0.98] shadow-md"
              : "bg-achrams-secondary-solid opacity-75 cursor-not-allowed"
          }`}
        >
          {fareEstimate
            ? `Proceed • ₦${fareEstimate.toLocaleString()}`
            : "Enter destinations"}
        </button>
      </div>

      {/* Modals handled by parent */}
    </div>
  );
}


// // src/components/app/screens/BookingScreen.tsx
// "use client";

// import { useState, useEffect } from "react";
// import {
//   MapPin,
//   Navigation,
//   Plane,
//   ChevronDown,
//   X,
//   Loader,
// } from "lucide-react"; // NEW: Add Gps and Loader
// import { useGeolocation } from "@/hooks/useGeolocation";
// import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";

// // NEW: Define type for location data
// interface LocationData {
//   name: string;
//   coords: [number, number] | null; // [lng, lat]
// }

// interface BookingScreenProps {
//   pickup: string;
//   setPickup: (val: string) => void;
//   destination: string;
//   setDestination: (val: string) => void;
//   fareEstimate: number | null;
//   setFareEstimate: (val: number | null) => void;
//   onProceed: () => void;
//   setShowPassengerDetails: (val: boolean) => void;
//   passengerData: any;
//   setPassengerData: (val: any) => void;
//   showPassengerDetails: boolean;
//   requirements: any;
//   setRequirements: (val: any) => void;
//   // NEW: Prop to set pickup coordinates in parent (page.tsx)
//   setPickupCoords: (coords: [number, number] | null) => void;
//   // NEW: Prop to set destination coordinates in parent (page.tsx)
//   setDestinationCoords: (coords: [number, number] | null) => void; // NEW
// }

// // NEW: Define coordinates for airports (replace with actual coordinates)
// const losCoords: [number, number] = [3.330058, 6.568287]; // Actual coord from API doc
// const abvCoords: [number, number] = [7.2667, 9.0167]; // Placeholder, find actual

// const airports = [
//   { id: "current", name: "Use my current location", special: true },
//   { id: "los", name: "Murtala Muhammed Int'l Airport (LOS)", city: "Lagos" },
//   { id: "abv", name: "Nnamdi Azikiwe Int'l Airport (ABV)", city: "Abuja" },
// ];

// const commonDestinations = [
//   "Victoria Island, Lagos",
//   "Lekki Phase 1, Lagos",
//   "Ikeja GRA, Lagos",
// ];

// // NEW: Placeholder coordinates for common destinations (find actual coords)
// const destinationCoordsMap: Record<string, [number, number] | null> = {
//   "Victoria Island, Lagos": [3.4084, 6.4397],
//   "Lekki Phase 1, Lagos": [3.9942, 6.4253],
//   "Ikeja GRA, Lagos": [3.3519, 6.555],
//   "Ikorodu, Lagos": [3.504145, 6.620891], // From API doc
//   // Add more as needed
// };

// export default function BookingScreen({
//   pickup,
//   setPickup,
//   destination,
//   setDestination,
//   fareEstimate,
//   setFareEstimate,
//   onProceed,
//   setShowPassengerDetails,
//   passengerData,
//   setPassengerData,
//   showPassengerDetails,
//   requirements,
//   setRequirements,
//   setPickupCoords, // NEW: Destructure the setter
//   setDestinationCoords, // NEW: Destructure the setter
// }: BookingScreenProps) {
//   const [pickupOpen, setPickupOpen] = useState(false);
//   const [destOpen, setDestOpen] = useState(false);
//   // NEW: Destructure loading state from the hook
//   const {
//     coords,
//     error,
//     requestPermission,
//     loading: hookLoading,
//   } = useGeolocation();

//   // NEW: State to track if location is being fetched (combines hook loading and UI state)
//   const [isFetchingLocation, setIsFetchingLocation] = useState(false);

//   // NEW: State to hold full pickup location data including coordinates
//   const [pickupLocationData, setPickupLocationData] = useState<LocationData>({
//     name: pickup,
//     coords: null,
//   });

//   // NEW: State to hold full destination location data including coordinates
//   const [destinationLocationData, setDestinationLocationData] =
//     useState<LocationData>({
//       // NEW
//       name: destination,
//       coords: null,
//     });

//   // NEW: Sync pickupLocationData.name with the parent's pickup state if it changes externally
//   useEffect(() => {
//     setPickupLocationData((prev) => ({ ...prev, name: pickup }));
//   }, [pickup]);

//   // NEW: Sync destinationLocationData.name with the parent's destination state if it changes externally
//   useEffect(() => {
//     // NEW
//     setDestinationLocationData((prev) => ({ ...prev, name: destination }));
//   }, [destination]); // NEW

//   // NEW: Sync parent's pickup and pickupCoords states when pickupLocationData changes
//   useEffect(() => {
//     setPickup(pickupLocationData.name);
//     setPickupCoords(pickupLocationData.coords);
//   }, [pickupLocationData, setPickup, setPickupCoords]);

//   // NEW: Sync parent's destination and destinationCoords states when destinationLocationData changes
//   useEffect(() => {
//     // NEW
//     setDestination(destinationLocationData.name);
//     setDestinationCoords(destinationLocationData.coords);
//   }, [destinationLocationData, setDestination, setDestinationCoords]); // NEW

//   // NEW: Sync parent's fareEstimate when pickupLocationData or destinationLocationData changes
//   useEffect(() => {
//     if (destinationLocationData.name && pickupLocationData.name) {
//       // Use names from local state
//       const estimate = 4500 + Math.floor(Math.random() * 2000);
//       setFareEstimate(estimate);
//     } else {
//       setFareEstimate(null);
//     }
//   }, [destinationLocationData, pickupLocationData, setFareEstimate]); // Depend on location data

//   // NEW: Updated handleUseCurrentLocation function
//   const handleUseCurrentLocation = async () => {
//     // NEW: Set fetching state and close dropdown immediately
//     setIsFetchingLocation(true);
//     setPickupOpen(false); // Close dropdown when fetching starts

//     try {
//       // NEW: Await the result of requestPermission
//       const fetchedCoords = await requestPermission();
//       // NEW: Check if coords were successfully obtained
//       // In handleUseCurrentLocation:
//       if (fetchedCoords) {
//         setPickupLocationData({
//           name: "Use my current location", // ← MUST match string used in resolver
//           coords: [fetchedCoords.longitude, fetchedCoords.latitude],
//         });
//       } else {
//         // NEW: Handle case where request was granted but coords were null (unlikely but possible)
//         console.warn(
//           "Geolocation request granted but no coordinates returned."
//         );
//         // Optionally update UI to show a generic error or retry option
//       }
//     } catch (err) {
//       console.error("Geolocation request failed:", err);
//       // NEW: Optionally update UI to show the error from the hook or a generic message
//       // setErrorState("Failed to get location: " + err);
//     } finally {
//       // NEW: Always stop fetching state when done (success or failure)
//       setIsFetchingLocation(false);
//     }
//   };

//   const handleAirportSelect = (airportId: string) => {
//     let selectedCoords: [number, number] | null = null;
//     let selectedName = "";

//     switch (airportId) {
//       case "los":
//         selectedCoords = losCoords;
//         selectedName = "Murtala Muhammed Int'l Airport (LOS)";
//         break;
//       case "abv":
//         selectedCoords = abvCoords;
//         selectedName = "Nnamdi Azikiwe Int'l Airport (ABV)";
//         break;
//       default:
//         selectedName = "Unknown Airport";
//     }

//     if (selectedCoords) {
//       setPickupLocationData({
//         name: selectedName,
//         coords: selectedCoords,
//       });
//     }
//     setPickupOpen(false);
//   };

//   // NEW: Handle destination selection
//   const handleDestinationSelect = (selectedDestination: string) => {
//     const selectedCoords = destinationCoordsMap[selectedDestination] || null; // Use map or null
//     setDestinationLocationData({
//       name: selectedDestination,
//       coords: selectedCoords,
//     });
//     setDestOpen(false);
//   };

//   // NEW: Combine internal fetching state with hook's loading state for UI
//   const showFetchingUI = isFetchingLocation || hookLoading;

//   return (
//     <div className="h-screen bg-achrams-bg-primary flex flex-col">
//       {/* Header container now spans full width with no horizontal padding */}
//       <div className="bg-achrams-primary-solid text-achrams-text-light px-0 py-4">
//         <div className="px-6">
//           <ACHRAMSHeader title="" />
//         </div>
//       </div>
//       <div className="flex-1 px-6 py-8 overflow-y-auto">
//         <h2 className="text-2xl font-semibold tracking-tight text-achrams-text-primary pb-4">
//           Book Your Airport Ride
//         </h2>

//         <div className="space-y-4">
//           {/* Pickup */}
//           <div className="relative">
//             {/* Main Input Field */}
//             <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
//               <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
//               <input
//                 type="text"
//                 placeholder="Airport pickup location"
//                 // NEW: Show fetching message or actual name, make read-only if fetching
//                 value={
//                   showFetchingUI
//                     ? "Getting your location..."
//                     : pickupLocationData.name
//                 }
//                 // NEW: Disable input while fetching
//                 onChange={(e) => {
//                   if (!showFetchingUI) {
//                     setPickupLocationData((prev) => ({
//                       ...prev,
//                       name: e.target.value,
//                     }));
//                   }
//                 }}
//                 onFocus={() => {
//                   if (!showFetchingUI) {
//                     setPickupOpen(true);
//                   }
//                 }}
//                 // NEW: Show read-only state while fetching
//                 readOnly={showFetchingUI}
//                 className={`flex-1 bg-transparent outline-none text-base ${
//                   // NEW: Apply different text color when fetching to indicate disabled state
//                   showFetchingUI
//                     ? "text-achrams-text-secondary italic"
//                     : "text-achrams-text-primary"
//                 }`}
//               />
//               {/* Dropdown/Open Button */}
//               <div className="flex items-center">
//                 {/* NEW: Show loader next to dropdown button while fetching, disable button */}
//                 {showFetchingUI && (
//                   <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid mr-1" />
//                 )}
//                 <button
//                   onClick={() => {
//                     if (!showFetchingUI) {
//                       setPickupOpen(!pickupOpen);
//                     }
//                   }}
//                   disabled={showFetchingUI} // NEW: Disable button while fetching
//                   className={`p-2 ${
//                     // NEW: Apply different text color and cursor when disabled
//                     showFetchingUI
//                       ? "text-achrams-text-secondary opacity-50 cursor-not-allowed"
//                       : "text-achrams-text-secondary hover:text-achrams-text-primary"
//                   } transition-colors`}
//                 >
//                   {/* NEW: Show spinner inside button instead of Navigation icon while fetching */}
//                   {showFetchingUI ? (
//                     <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid" />
//                   ) : pickupOpen ? (
//                     <ChevronDown className="w-5 h-5" />
//                   ) : (
//                     <Navigation className="w-5 h-5" />
//                   )}
//                 </button>
//               </div>
//             </div>

//             {/* Dropdown Content */}
//             {pickupOpen && (
//               <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
//                 {/* NEW: Show fetching indicator if loading, otherwise show options */}
//                 {showFetchingUI ? (
//                   <div className="w-full px-4 py-3 flex items-center gap-3 justify-center text-achrams-text-secondary">
//                     <Loader className="w-5 h-5 animate-spin mr-2" />
//                     <span>Locating you...</span>{" "}
//                     {/* NEW: Professional message */}
//                   </div>
//                 ) : (
//                   <>
//                     <button
//                       onClick={handleUseCurrentLocation}
//                       disabled={showFetchingUI} // NEW: Disable button while fetching (shouldn't be reachable here, but good practice)
//                       className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left disabled:opacity-50 disabled:cursor-not-allowed" // NEW: Add disabled styles
//                     >
//                       <MapPin className="w-5 h-5 text-achrams-primary-solid flex-shrink-0" />
//                       <span>Use my current location</span>
//                     </button>
//                     {/* ... Other Airport Buttons ... */}
//                     {airports.slice(1).map((a) => (
//                       <button
//                         key={a.id}
//                         onClick={() => handleAirportSelect(a.id)} // Use new handler
//                         className="w-full px-4 py-3 flex items-start gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
//                       >
//                         <Plane className="w-5 h-5 text-achrams-primary-solid flex-shrink-0 mt-0.5" />
//                         <div>
//                           <div className="font-medium text-achrams-text-primary text-sm">
//                             {a.name}
//                           </div>
//                           <div className="text-xs text-achrams-text-secondary">
//                             {a.city}
//                           </div>
//                         </div>
//                       </button>
//                     ))}
//                   </>
//                 )}
//               </div>
//             )}
//           </div>

//           <div className="flex items-center justify-center py-1">
//             <div className="w-0.5 h-6 bg-achrams-border" />
//           </div>

//           {/* Destination */}
//           <div className="relative">
//             <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
//               <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
//               <input
//                 type="text"
//                 placeholder="Enter destination"
//                 value={destinationLocationData.name} // NEW: Use name from local state
//                 onChange={(e) => {
//                   // NEW: Update local state
//                   setDestinationLocationData((prev) => ({
//                     ...prev,
//                     name: e.target.value,
//                   }));
//                   setDestOpen(true); // NEW: Open dropdown
//                 }}
//                 onFocus={() => setDestOpen(true)}
//                 className="flex-1 bg-transparent outline-none text-base text-achrams-text-primary"
//               />
//               {destOpen &&
//                 destinationLocationData.name && ( // NEW: Use local state
//                   <button
//                     onClick={() => {
//                       setDestinationLocationData({ name: "", coords: null }); // NEW: Clear local state
//                       setDestination(""); // NEW: Clear parent state
//                     }}
//                     className="p-2 text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
//                   >
//                     <X className="w-5 h-5" />
//                   </button>
//                 )}
//             </div>
//             {destOpen &&
//               destinationLocationData.name && ( // NEW: Use local state
//                 // Dropdown now uses solid background color and border
//                 <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
//                   {commonDestinations
//                     .filter((d) =>
//                       d
//                         .toLowerCase()
//                         .includes(destinationLocationData.name.toLowerCase())
//                     ) // NEW: Filter based on local state
//                     .map((d, i) => (
//                       <button
//                         key={i}
//                         onClick={() => handleDestinationSelect(d)} // NEW: Use new handler
//                         className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
//                       >
//                         <MapPin className="w-5 h-5 text-achrams-primary-solid flex-shrink-0" />
//                         <div className="text-achrams-text-primary text-sm">
//                           {d}
//                         </div>
//                       </button>
//                     ))}
//                 </div>
//               )}
//           </div>
//         </div>

//         {fareEstimate && (
//           <div className="mt-6 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
//             <div className="flex justify-between items-center">
//               <span className="text-achrams-text-secondary">
//                 Estimated fare
//               </span>
//               <span className="text-xl font-bold text-achrams-text-primary">
//                 ₦{fareEstimate.toLocaleString()}
//               </span>
//             </div>
//           </div>
//         )}
//       </div>
//       <div className="p-6">
//         <button
//           onClick={onProceed}
//           disabled={!fareEstimate}
//           className={`w-full py-4 rounded-xl text-lg font-bold text-achrams-text-light transition-all ${
//             fareEstimate
//               ? "bg-achrams-gradient-primary hover:opacity-95 active:scale-[0.98] shadow-md"
//               : "bg-achrams-secondary-solid opacity-75 cursor-not-allowed"
//           }`}
//         >
//           {fareEstimate
//             ? `Proceed • ₦${fareEstimate.toLocaleString()}`
//             : "Enter destinations"}
//         </button>
//       </div>

//       {/* Modals handled by parent */}
//     </div>
//   );
// }
