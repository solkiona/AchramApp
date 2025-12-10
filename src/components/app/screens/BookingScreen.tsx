// "use client";
import { useState, useEffect, useRef, useCallback } from "react";
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
import { findNearestAirport, Airport } from "@/lib/airports";
import { LoadScript, StandaloneSearchBox } from "@react-google-maps/api";
import AirportSelectionModal from "@/components/app/modals/AirportSelectionModal";
import OutsideServiceAreaModal from "@/components/app/modals/OutsideServiceAreaModal";
import { apiClient } from "@/lib/api";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";

interface LocationData {
  name: string;
  coords: [number, number] | null;
  id?: string;
  codename?: string;
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
  setPickupCoords: (coords: [number, number] | null) => void;
  setDestinationCoords: (coords: [number, number] | null) => void;
  tripRequestStatus: "loading" | "accepted" | "no-driver" | "error" | null;
  resetKey: number;
  setPickupId: (id: string | null) => void;
  setPickupCodename: (codename: string | undefined) => void;
  fareIsFlatRate: boolean | null;
  setFareIsFlatRate: (val: boolean | null) => void;

  isGoogleMapsLoaded: boolean;
  googleMapsLoadError?: Error | undefined;
  onShowLogin: (val: boolean) => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error" ) => void;
}

const losCoords: [number, number] = [3.330058, 6.568287];
const abvCoords: [number, number] = [7.2667, 9.0167];

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const libraries: "places"[] = ["places"];

// Custom debounce hook (lightweight & stable)
function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    }) as T,
    [callback, delay]
  );
}

export default function BookingScreen({
  pickup,
  setPickup,
  destination,
  setDestination,
  fareEstimate,
  setFareEstimate,
  onProceed,
  setPickupCoords,
  setDestinationCoords,
  tripRequestStatus,
  resetKey,
  setPickupId,
  setPickupCodename,
  fareIsFlatRate,
  setFareIsFlatRate,
  isGoogleMapsLoaded,
  googleMapsLoadError,
  showNotification,
  onShowLogin,
}: BookingScreenProps) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [showAirportSelectionModal, setShowAirportSelectionModal] =
    useState(false);
  const [airportsToSelect, setAirportsToSelect] = useState<Airport[]>([]);
  const [showOutsideServiceModal, setShowOutsideServiceModal] = useState(false);
  const [showLocationSettingsModal, setShowLocationSettingsModal] =
    useState(false);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);
  const pickupSearchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const pickupInputRef = useRef<HTMLInputElement>(null);

  const {
    coords,
    error,
    requestPermission,
    loading: hookLoading,
  } = useGeolocation();
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [pickupLocationData, setPickupLocationData] = useState<LocationData>({
    name: pickup,
    coords: null,
    id: undefined,
    codename: undefined,
  });

  const [destinationLocationData, setDestinationLocationData] =
    useState<LocationData>({
      name: destination,
      coords: null,
    });

  useEffect(() => {
    console.log("DEBUG: Reset key changed, resetting booking screen state");
    setPickupLocationData({ name: "", coords: null });
    setDestinationLocationData({ name: "", coords: null });
  }, [resetKey]); // Depend on resetKey

  // Sync local state → parent
  useEffect(() => {
    console.log(
      "DEBUG: Syncing pickup data to parent - Name: ",
      pickupLocationData.name
    );
    setPickup(pickupLocationData.name);
    setPickupCoords(pickupLocationData.coords);
  }, [pickupLocationData, setPickup, setPickupCoords]);

  useEffect(() => {
    console.log(
      "DEBUG: Syncing destination data to parent - Name:",
      destinationLocationData.name,
      "coords:",
      destinationLocationData.coords
    );
    setDestination(destinationLocationData.name);
    setDestinationCoords(destinationLocationData.coords);
  }, [destinationLocationData, setDestination, setDestinationCoords]);

  useEffect(() => {
    setPickupCodename(pickupLocationData.codename);
  }, [pickupLocationData.codename, setPickupCodename]);

  const fetchFareEstimate = async (
    airportCodename: string,
    destinationName: string
  ): Promise<number | null> => {
    if (!airportCodename || !destinationName) {
      console.warn(
        "Cannot fetch fare: airport codename or destination name is missing"
      );
      setFareEstimate(null);
      setFareIsFlatRate(null);
      return null;
    }
    try {
      console.log(
        `Fetching fare for airport: ${airportCodename}, destination: ${destinationName}`
      );
      // The 'search' parameter is the destination address string.
      // The 'airport' parameter is the airport codename.
      const response = await apiClient.get(
        `/fares/lookup?airport=${encodeURIComponent(
          airportCodename
        )}&search=${encodeURIComponent(destinationName)}`
      );
      // ikeja
      console.log(`Estimated Fare Response: ${response}`);

      if (response.status === "success" && response.data) {
        const fareData = response.data;
        console.log("Fetched fare data:", fareData);
        // Return the numeric amount from the API response
        setFareEstimate(fareData.amount.amount);
        setFareIsFlatRate(fareData.is_flat_rate);
        return fareData.amount.amount; // e.g., 100 from the example
      } else {
        console.log(
          "Fare lookup API responded with non-success status or missing data:",
          response
        );

        setFareEstimate(null);
        setFareIsFlatRate(null);
        return null;
      }
    } catch (err) {
      console.error("Error fetching fare estimate:", err);
      //showNotification("Could not fetch fare estimate. Using default.", "warning"); // Example
      setFareEstimate(null);
      setFareIsFlatRate(null);
      return null;
    }
  };

  useEffect(() => {
    const getFare = async () => {
      // Only proceed if both codename and destination name are present
      if (pickupLocationData.codename && destinationLocationData.name) {
        // Show a loading state if desired (e.g., disable proceed button, show spinner next to fare)
        // setIsFetchingFare(true); // Example state

        const fare = await fetchFareEstimate(
          pickupLocationData.codename,
          destinationLocationData.name
        );

        // setIsFetchingFare(false); // Example state

        if (fare !== null) {
          // Update the parent's fare estimate state
          setFareEstimate(fare);
        } else {
          // Handle case where fare lookup failed
          // You might want to clear the estimate or show an error
          setFareIsFlatRate(null);
          setFareEstimate(null); // Or keep the previous value, or set to -1 to indicate error
          // showNotification("Failed to get fare estimate.", "error"); // Example
        }
      } else {
        // If either codename or destination name is missing, clear the estimate
        setFareEstimate(null);
        setFareIsFlatRate(null);
      }
    };

    getFare(); // Call the async function

    // Depend on the codename and destination name to re-run the effect when they change
  }, [
    pickupLocationData.codename,
    destinationLocationData.name,
    setFareEstimate,
    setFareIsFlatRate,
  ]);

  // Reset fetching state when trip request ends
  useEffect(() => {
    if (tripRequestStatus !== "loading") {
      setIsFetchingLocation(false);
    }
  }, [tripRequestStatus]);

  const showFetchingUI = isFetchingLocation || hookLoading;

  useEffect(() => {
    setPickupId(pickupLocationData.id || null);
  }, [pickupLocationData.id, setPickupId]);

  // Stable debounced handler
  const debouncedDestinationInput = useDebounceCallback((value: string) => {
    console.log("Destination input settled:", value);
    // Add custom logic here if needed (e.g. fallback API search)
  }, 300);

  // Stable change handler
  const handleDestinationChanged = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setDestinationLocationData((prev) => ({ ...prev, name: value }));
      if (value.trim()) {
        setDestOpen(true);
      }
      debouncedDestinationInput(value);
    },
    [debouncedDestinationInput]
  );

  const geolocationCoordsRef = useRef<[number, number] | null>(null);

  const handlePlaceChanged = useCallback(() => {
    if (isGoogleMapsLoaded && searchBoxRef.current) {
      // NEW: Only run if API is loaded
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
        setDestinationLocationData((prev) => ({ ...prev, coords: null }));
      }
    }
  }, [isGoogleMapsLoaded]);

  const handlePickupPlaceChanged = useCallback(() => {
    if (isGoogleMapsLoaded && pickupSearchBoxRef.current) {
      const places = pickupSearchBoxRef.current.getPlaces();
      if (places && places.length > 0) {
        const place = places[0];
        if (place.geometry?.location) {
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          const coords: [number, number] = [lng, lat];

          // Close dropdown
          setPickupOpen(false);

          // Trigger airport lookup using these coords
          (async () => {
            setIsFetchingLocation(true);
            try {
              const airports = await findNearestAirport(lng, lat);
              if (airports && airports.length > 0) {
                if (airports.length === 1) {
                  setPickupLocationData({
                    name: airports[0].name,
                    coords,
                    id: airports[0].id,
                    codename: airports[0].codename,
                  });
                } else {
                  setAirportsToSelect(airports);
                  setShowAirportSelectionModal(true);
                  // Store coords for later use in modal selection
                  geolocationCoordsRef.current = coords;
                }
              } else {
                setShowOutsideServiceModal(true);
              }
            } catch (err) {
              console.error(
                "Failed to fetch airports for pickup location:",
                err
              );
              showNotification("Failed to fetch airports for pickup location. Please try again", "error")
              // 👇 Notify user — see Step 4 for implementation
              onShowLogin(false); // Placeholder — you’ll replace this with real notification
              // Example: showNotification("Failed to find nearby airport. Please try again.", "error");
            } finally {
              setIsFetchingLocation(false);
            }
          })();
        } else {
          console.warn("Selected pickup place has no geometry.");
        }
      }
    }
  }, [isGoogleMapsLoaded]);

  const handleClearDestination = useCallback(() => {
    setDestinationLocationData({ name: "", coords: null });
    setDestOpen(false);
    destinationInputRef.current?.focus();
  }, []);

  const handleUseCurrentLocation = useCallback(async () => {
    if (error?.includes("denied")) {
      setShowLocationSettingsModal(true);
      setPickupOpen(false);
      return;
    }

    setIsFetchingLocation(true);
    setPickupOpen(false);

    try {
      const position = await requestPermission();
      if (!position) throw new Error("No coordinates");

      const { longitude, latitude } = position;
      console.log(
        "DEBUG: handleUseCurrentLocation - Got geolocation:",
        longitude,
        latitude
      );

      const coords = [longitude, latitude] as [number, number];

      geolocationCoordsRef.current = coords;

      const airports = await findNearestAirport(longitude, latitude);
      console.log(
        "DEBUG: handleUseCurrentLocation - Found airports:",
        airports
      );
      if (airports && airports.length > 0) {
        if (airports.length === 1) {
          console.log(
            "DEBUG: handleUseCurrentLocation - Setting single airport:",
            airports[0].name,
            "with coords:",
            [longitude, latitude]
          );

          setPickupLocationData({
            name: airports[0].name,
            coords: [longitude, latitude],
            id: airports[0].id,
            codename: airports[0].codename,
          });
        } else {
          setAirportsToSelect(airports);
          setShowAirportSelectionModal(true);
        }
      } else {
        setShowOutsideServiceModal(true);
      }
    } catch (err) {
      console.error("Location fetch failed:", err);
    } finally {
      setIsFetchingLocation(false);
    }
  }, [error, requestPermission]);

  const handleAirportSelectedFromModal = useCallback((airport: Airport) => {
    const geolocationCoords = geolocationCoordsRef.current;

    console.log(
      "DEBUG: handleAirportSelectedFromModal - Selected airport:",
      airport,
      "Retaining coords:",
      geolocationCoords
    );
    console.log(
      "DEBUG: handleAirportSelectedFromModal - Using coords from SELECTED airport object:",
      geolocationCoords
    );
    setPickupLocationData({
      name: airport.name,
      coords: geolocationCoords,
      id: airport.id,
      codename: airport.codename,
    });
    setShowAirportSelectionModal(false);
  }, []);

  const handleAirportSelect = useCallback((airportId: string) => {
    const map: Record<
      string,
      { name: string; coords: [number, number]; id: string; codename?: string }
    > = {
      los: {
        name: "Murtala Muhammed Int'l Airport (LOS)",
        coords: losCoords,
        id: "0199de42-10b4-7f53-b670-42f107897a1d",
        codename: "actual_codename",
      },
      abv: {
        name: "Nnamdi Azikiwe Int'l Airport (ABV)",
        coords: abvCoords,
        id: "actual_id",
        codename: "Acutal_codeName",
      },
    };

    const selected = map[airportId];
    if (selected) {
      console.log(
        "DEBUG: handleAirportSelect - Setting pickup to:",
        selected.name,
        "with coords:",
        selected.coords
      );
      setPickupLocationData({
        name: selected.name,
        coords: selected.coords,
        id: selected.id,
        codename: selected.codename,
      });
    } else {
      console.warn(
        "DEBUG: handleAirportSelect - Airport ID not found in map:",
        airportId
      );
    }
    setPickupOpen(false);
  }, []);

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      <AirportSelectionModal
        isOpen={showAirportSelectionModal}
        onClose={() => setShowAirportSelectionModal(false)}
        airports={airportsToSelect}
        onSelect={handleAirportSelectedFromModal}
      />
      <OutsideServiceAreaModal
        isOpen={showOutsideServiceModal}
        onClose={() => setShowOutsideServiceModal(false)}
      />

      <div className="bg-achrams-primary-solid text-achrams-text-light px-0 py-4">
        <div className="px-6">
          <ACHRAMSHeader title="" />
        </div>
      </div>

      {error?.includes("denied") && (
        <div className="bg-blue-600 text-achrams-text-light p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            <span>This app requires your location access to work</span>
          </div>
          <button
            onClick={() => setShowLocationSettingsModal(true)}
            className="bg-white text-achrams-text-primary px-4 py-1 rounded-full text-sm font-medium hover:bg-achrams-bg-primary"
          >
            Grant access
          </button>
        </div>
      )}

      {showLocationSettingsModal && (
        <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">
              Enable Location Access
            </h3>
            <p className="mb-4">
              Please allow location access in your browser settings.
            </p>
            <ol className="list-decimal list-inside mb-4 space-y-1 text-sm">
              <li>Click the lock/info icon in the address bar</li>
              <li>Go to "Site settings" → "Location" → Allow</li>
              <li>Refresh the page</li>
            </ol>
            <button
              onClick={() => setShowLocationSettingsModal(false)}
              className="w-full bg-achrams-primary-solid text-white py-2 rounded-lg"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 px-6 py-8 overflow-y-auto">
        <h2 className="text-2xl font-semibold tracking-tight text-achrams-text-primary pb-4">
          Book Your Airport Ride
        </h2>

        <div className="space-y-4">
          {/* Pickup */}
          <div className="relative">
            {!isGoogleMapsLoaded ? (
              <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
                <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
                <input
                  type="text"
                  placeholder="Airport pickup location (Loading...)"
                  value={pickupLocationData.name}
                  onChange={() => {}}
                  className="flex-1 bg-transparent outline-none text-base text-achrams-text-secondary italic"
                  disabled
                />
              </div>
            ) : (
              <StandaloneSearchBox
                onLoad={(ref) => (pickupSearchBoxRef.current = ref)}
                onUnmount={() => (pickupSearchBoxRef.current = null)}
                onPlacesChanged={handlePickupPlaceChanged}
              >
                <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
                  <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
                  <input
                    ref={pickupInputRef}
                    type="text"
                    placeholder="Search pickup location"
                    value={
                      showFetchingUI
                        ? "Getting your location..."
                        : pickupLocationData.name
                    }
                    onChange={(e) =>
                      !showFetchingUI &&
                      setPickupLocationData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    onFocus={() => !showFetchingUI && setPickupOpen(true)}
                    readOnly={showFetchingUI}
                    className={`flex-1 bg-transparent outline-none text-base ${
                      showFetchingUI
                        ? "text-achrams-text-secondary italic"
                        : "text-achrams-text-primary"
                    }`}
                  />
                  <button
                    onClick={() =>
                      !showFetchingUI && setPickupOpen(!pickupOpen)
                    }
                    disabled={showFetchingUI}
                    className={`p-2 transition-colors ${
                      showFetchingUI
                        ? "text-achrams-text-secondary opacity-50 cursor-not-allowed"
                        : "text-achrams-text-secondary hover:text-achrams-text-primary"
                    }`}
                  >
                    {showFetchingUI ? (
                      <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid" />
                    ) : pickupOpen ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <Navigation className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </StandaloneSearchBox>
            )}

            {pickupOpen && !showFetchingUI && isGoogleMapsLoaded && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                <button
                  onClick={handleUseCurrentLocation}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary text-left"
                >
                  <MapPin className="w-5 h-5 text-achrams-primary-solid" />
                  <span>Use my current location</span>
                </button>
                {/* Optionally: Add "Or type to search" hint */}
                
              </div>
            )}
          </div>

          {/* Destination */}
          <div className="relative">
            {!isGoogleMapsLoaded ? (
              <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
                <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
                <input
                  type="text"
                  placeholder="Enter destination (Loading...)"
                  value={destinationLocationData.name}
                  // Disable input while loading
                  onChange={() => {}} // No-op while loading
                  className="flex-1 bg-transparent outline-none text-base text-achrams-text-secondary italic"
                  disabled
                />
              </div>
            ) : (
              // NEW: Render the StandaloneSearchBox only when API is loaded
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
                    value={destinationLocationData.name}
                    onChange={(e) => {
                      // Update local state name immediately as user types
                      setDestinationLocationData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      setDestOpen(true); // Keep dropdown open while typing
                    }}
                    onFocus={() => setDestOpen(true)} // Open dropdown on focus
                    className="flex-1 bg-transparent outline-none text-base text-achrams-text-primary"
                  />
                  {destOpen &&
                    destinationLocationData.name && ( // Use local state
                      <button
                        onClick={() => {
                          setDestinationLocationData({
                            name: "",
                            coords: null,
                          });
                          setDestOpen(false);
                        }}
                        className="p-2 text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    )}
                </div>
              </StandaloneSearchBox>
            )}
          </div>
        </div>

        {fareEstimate !== null && (
          <div className="mt-6 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="flex justify-between items-center">
              <span className="text-achrams-text-secondary">
                {fareIsFlatRate ? (
                  <>
                    Estimated fare
                    <br />
                    (subject to bargain)
                  </>
                ) : (
                  "Actual fare"
                )}
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
      <div className="w-full flex justify-end mb-4">
        {" "}
        {/* Example: Top-right aligned */}
        <button
          onClick={onShowLogin} // NEW: Call the prop function passed from page.tsx
          className="text-sm text-achrams-primary-solid hover:underline transition-colors  mx-auto cursor-pointer"
        >
          Have an account? Log in
        </button>
      </div>

      <ACHRAMFooter />
    </div>
  );
}
