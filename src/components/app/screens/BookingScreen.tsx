

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

interface LocationData {
  name: string;
  coords: [number, number] | null;
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
  tripRequestStatus: 'loading' | 'accepted' | 'no-driver' | 'error' | null;
  resetKey: number;
}

const losCoords: [number, number] = [3.330058, 6.568287];
const abvCoords: [number, number] = [7.2667, 9.0167];

const airports = [
  { id: "current", name: "Use my current location", special: true },
  { id: "los", name: "Murtala Muhammed Int'l Airport (LOS)", city: "Lagos" },
  { id: "abv", name: "Nnamdi Azikiwe Int'l Airport (ABV)", city: "Abuja" },
];

const destinationCoordsMap: Record<string, [number, number] | null> = {
  "Victoria Island, Lagos": [3.4084, 6.4397],
  "Lekki Phase 1, Lagos": [3.9942, 6.4253],
  "Ikeja GRA, Lagos": [3.3519, 6.555],
  "Ikorodu, Lagos": [3.504145, 6.620891],
};

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
const libraries: ("places")[] = ["places"];

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
}: BookingScreenProps) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const [showAirportSelectionModal, setShowAirportSelectionModal] = useState(false);
  const [airportsToSelect, setAirportsToSelect] = useState<Airport[]>([]);
  const [showOutsideServiceModal, setShowOutsideServiceModal] = useState(false);
  const [showLocationSettingsModal, setShowLocationSettingsModal] = useState(false);

  const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
  const destinationInputRef = useRef<HTMLInputElement>(null);

  const { coords, error, requestPermission, loading: hookLoading } = useGeolocation();
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const [pickupLocationData, setPickupLocationData] = useState<LocationData>({
    name: pickup,
    coords: null,
  });

  const [destinationLocationData, setDestinationLocationData] = useState<LocationData>({
    name: destination,
    coords: null,
  });

 
  
  useEffect(() => {
    // This effect runs whenever resetKey changes.
    // page.tsx will increment resetKey when a new booking flow starts or after a trip ends/cancels.
    setPickupLocationData({ name: '', coords: null });
    setDestinationLocationData({ name: '', coords: null });
    // Optionally, clear other relevant local states if needed
    // e.g., setFareEstimate(null); -> This is likely handled by parent
    // e.g., setIsFetchingLocation(false); -> Only if explicitly needed here, parent tripRequestStatus effect handles fetching UI
  }, [resetKey]); // Depend on resetKey

  // Sync local state → parent
  useEffect(() => {
    setPickup(pickupLocationData.name);
    setPickupCoords(pickupLocationData.coords);
  }, [pickupLocationData, setPickup, setPickupCoords]);

  useEffect(() => {
    setDestination(destinationLocationData.name);
    setDestinationCoords(destinationLocationData.coords);
  }, [destinationLocationData, setDestination, setDestinationCoords]);

  // Fare estimate mock (replace with API later)
  useEffect(() => {
    if (pickupLocationData.name && destinationLocationData.name) {
      const estimate = 4500 + Math.floor(Math.random() * 2000);
      setFareEstimate(estimate);
    } else {
      setFareEstimate(null);
    }
  }, [pickupLocationData, destinationLocationData, setFareEstimate]);

  // Reset fetching state when trip request ends
  useEffect(() => {
    if (tripRequestStatus !== "loading") {
      setIsFetchingLocation(false);
    }
  }, [tripRequestStatus]);

  const showFetchingUI = isFetchingLocation || hookLoading;

  // Stable debounced handler
  const debouncedDestinationInput = useDebounceCallback((value: string) => {
    console.log("Destination input settled:", value);
    // Add custom logic here if needed (e.g. fallback API search)
  }, 300);

  // Stable change handler
  const handleDestinationChanged = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDestinationLocationData(prev => ({ ...prev, name: value }));
    if (value.trim()) {
      setDestOpen(true);
    }
    debouncedDestinationInput(value);
  }, [debouncedDestinationInput]);

  // Stable place selection handler
  const handlePlaceChanged = useCallback(() => {
    if (!searchBoxRef.current) return;

    const places = searchBoxRef.current.getPlaces();
    if (!places || places.length === 0) return;

    const place = places[0];
    if (place.geometry?.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const formattedAddress = place.formatted_address || place.name || "";

      setDestinationLocationData({
        name: formattedAddress,
        coords: [lng, lat],
      });
      setDestOpen(false);
    }
  }, []);

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
      const airports = await findNearestAirport(longitude, latitude);

      if (airports && airports.length > 0) {
        if (airports.length === 1) {
          setPickupLocationData({
            name: airports[0].name,
            coords: [longitude, latitude],
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
    setPickupLocationData(prev => ({
      name: airport.name,
      coords: prev.coords, // retain geolocation coords
    }));
    setShowAirportSelectionModal(false);
  }, []);

  const handleAirportSelect = useCallback((airportId: string) => {
    const map: Record<string, { name: string; coords: [number, number] }> = {
      los: { name: "Murtala Muhammed Int'l Airport (LOS)", coords: losCoords },
      abv: { name: "Nnamdi Azikiwe Int'l Airport (ABV)", coords: abvCoords },
    };

    const selected = map[airportId];
    if (selected) {
      setPickupLocationData({
        name: selected.name,
        coords: selected.coords,
      });
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-2">Enable Location Access</h3>
            <p className="mb-4">Please allow location access in your browser settings.</p>
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
            <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
              <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
              <input
                type="text"
                placeholder="Airport pickup location"
                value={showFetchingUI ? "Getting your location..." : pickupLocationData.name}
                onChange={(e) => !showFetchingUI && setPickupLocationData(prev => ({ ...prev, name: e.target.value }))}
                onFocus={() => !showFetchingUI && setPickupOpen(true)}
                readOnly={showFetchingUI}
                className={`flex-1 bg-transparent outline-none text-base ${
                  showFetchingUI ? "text-achrams-text-secondary italic" : "text-achrams-text-primary"
                }`}
              />
              <button
                onClick={() => !showFetchingUI && setPickupOpen(!pickupOpen)}
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

            {pickupOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                {showFetchingUI ? (
                  <div className="px-4 py-3 flex items-center gap-3 text-achrams-text-secondary">
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>Locating you...</span>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleUseCurrentLocation}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
                    >
                      <MapPin className="w-5 h-5 text-achrams-primary-solid" />
                      <span>Use my current location</span>
                    </button>
                    {airports.slice(1).map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleAirportSelect(a.id)}
                        className="w-full px-4 py-3 flex items-start gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
                      >
                        <Plane className="w-5 h-5 text-achrams-primary-solid mt-0.5" />
                        <div>
                          <div className="font-medium text-sm">{a.name}</div>
                          <div className="text-xs text-achrams-text-secondary">{a.city}</div>
                        </div>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-center py-1">
            <div className="w-0.5 h-6 bg-achrams-border" />
          </div>

          {/* Destination */}
          <div className="relative">
            <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={libraries}>
              <StandaloneSearchBox
                onLoad={(ref) => (searchBoxRef.current = ref)}
                onPlacesChanged={handlePlaceChanged}
              >
                <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
                  <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
                  <input
                    ref={destinationInputRef}
                    type="text"
                    placeholder="Enter destination"
                    value={destinationLocationData.name}
                    onChange={handleDestinationChanged}
                    onFocus={() => destinationLocationData.name && setDestOpen(true)}
                    className="flex-1 bg-transparent outline-none text-base text-achrams-text-primary"
                  />
                  {destOpen && destinationLocationData.name && (
                    <button
                      onClick={handleClearDestination}
                      className="p-2 text-achrams-text-secondary hover:text-achrams-text-primary"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </StandaloneSearchBox>
            </LoadScript>
          </div>
        </div>

        {fareEstimate && (
          <div className="mt-6 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="flex justify-between items-center">
              <span className="text-achrams-text-secondary">Estimated fare</span>
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
          {fareEstimate ? `Proceed • ₦${fareEstimate.toLocaleString()}` : "Enter destinations"}
        </button>
      </div>
    </div>
  );
}


