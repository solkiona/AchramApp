// src/components/app/screens/BookingScreen.tsx
'use client';

import { useState, useEffect } from 'react';
import { MapPin, Navigation, Plane, ChevronDown, X, Loader } from 'lucide-react'; // NEW: Add Gps and Loader
import { useGeolocation } from '@/hooks/useGeolocation';
import ACHRAMSHeader from '@/components/ui/ACHRAMSHeader';

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
  setDestinationCoords: (coords: [number, number] | null) => void; // NEW
}

// NEW: Define coordinates for airports (replace with actual coordinates)
const losCoords: [number, number] = [3.330058, 6.568287]; // Actual coord from API doc
const abvCoords: [number, number] = [7.2667, 9.0167]; // Placeholder, find actual

const airports = [
  { id: 'current', name: 'Use my current location', special: true },
  { id: 'los', name: 'Murtala Muhammed Int\'l Airport (LOS)', city: 'Lagos' },
  { id: 'abv', name: 'Nnamdi Azikiwe Int\'l Airport (ABV)', city: 'Abuja' },
];

const commonDestinations = [
  'Victoria Island, Lagos',
  'Lekki Phase 1, Lagos',
  'Ikeja GRA, Lagos',
];

// NEW: Placeholder coordinates for common destinations (find actual coords)
const destinationCoordsMap: Record<string, [number, number] | null> = {
  'Victoria Island, Lagos': [3.4084, 6.4397],
  'Lekki Phase 1, Lagos': [3.9942, 6.4253],
  'Ikeja GRA, Lagos': [3.3519, 6.5550],
  'Ikorodu, Lagos': [3.504145, 6.620891], // From API doc
  // Add more as needed
};

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
  setPickupCoords, // NEW: Destructure the setter
  setDestinationCoords, // NEW: Destructure the setter
}: BookingScreenProps) {
  const [pickupOpen, setPickupOpen] = useState(false);
  const [destOpen, setDestOpen] = useState(false);
  const { coords, error, requestPermission } = useGeolocation(); // Destructure coords

  // NEW: State to track if location is being fetched
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  // NEW: State to hold full pickup location data including coordinates
  const [pickupLocationData, setPickupLocationData] = useState<LocationData>({
    name: pickup,
    coords: null,
  });

  // NEW: State to hold full destination location data including coordinates
  const [destinationLocationData, setDestinationLocationData] = useState<LocationData>({ // NEW
    name: destination,
    coords: null,
  });

  // NEW: Sync pickupLocationData.name with the parent's pickup state if it changes externally
  useEffect(() => {
    setPickupLocationData(prev => ({ ...prev, name: pickup }));
  }, [pickup]);

  // NEW: Sync destinationLocationData.name with the parent's destination state if it changes externally
  useEffect(() => { // NEW
    setDestinationLocationData(prev => ({ ...prev, name: destination }));
  }, [destination]); // NEW


  // NEW: Sync parent's pickup and pickupCoords states when pickupLocationData changes
  useEffect(() => {
    setPickup(pickupLocationData.name);
    setPickupCoords(pickupLocationData.coords);
  }, [pickupLocationData, setPickup, setPickupCoords]);

  // NEW: Sync parent's destination and destinationCoords states when destinationLocationData changes
  useEffect(() => { // NEW
    setDestination(destinationLocationData.name);
    setDestinationCoords(destinationLocationData.coords);
  }, [destinationLocationData, setDestination, setDestinationCoords]); // NEW


  // NEW: Sync parent's fareEstimate when pickupLocationData or destinationLocationData changes
  useEffect(() => {
    if (destinationLocationData.name && pickupLocationData.name) { // Use names from local state
      const estimate = 4500 + Math.floor(Math.random() * 2000);
      setFareEstimate(estimate);
    } else {
      setFareEstimate(null);
    }
  }, [destinationLocationData, pickupLocationData, setFareEstimate]); // Depend on location data


  // NEW: Updated handleUseCurrentLocation function
  const handleUseCurrentLocation = async () => {
    // NEW: Set fetching state and close dropdown immediately
    setIsFetchingLocation(true);
    setPickupOpen(false); // Close dropdown when fetching starts

    try {
      const granted = await requestPermission();
      if (granted && coords) {
        // In a real app, you'd reverse geocode coords.latitude, coords.longitude
        setPickupLocationData({
          name: 'Your current location', // Placeholder
          coords: [coords.longitude, coords.latitude] // [lng, lat]
        });
        // Dropdown is already closed
      } else if (error) {
        console.error("Location error:", error);
        // Optionally show a user-friendly message within the UI
        // e.g., setErrorState("Failed to get location: " + error);
      }
    } catch (err) {
      console.error("Unexpected error during location fetch:", err);
      // Optionally show a user-friendly message
      // setErrorState("An unexpected error occurred while getting your location.");
    } finally {
      // NEW: Always stop fetching state when done (success or failure)
      setIsFetchingLocation(false);
    }
  };

  const handleAirportSelect = (airportId: string) => {
    let selectedCoords: [number, number] | null = null;
    let selectedName = '';

    switch (airportId) {
      case 'los':
        selectedCoords = losCoords;
        selectedName = 'Murtala Muhammed Int\'l Airport (LOS)';
        break;
      case 'abv':
        selectedCoords = abvCoords;
        selectedName = 'Nnamdi Azikiwe Int\'l Airport (ABV)';
        break;
      default:
        selectedName = 'Unknown Airport';
    }

    if (selectedCoords) {
      setPickupLocationData({
        name: selectedName,
        coords: selectedCoords
      });
    }
    setPickupOpen(false);
  };

  // NEW: Handle destination selection
  const handleDestinationSelect = (selectedDestination: string) => {
    const selectedCoords = destinationCoordsMap[selectedDestination] || null; // Use map or null
    setDestinationLocationData({
      name: selectedDestination,
      coords: selectedCoords
    });
    setDestOpen(false);
  };


  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
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
                value={isFetchingLocation ? 'Getting your location...' : pickupLocationData.name}
                // NEW: Disable input while fetching
                onChange={(e) => {
                    if (!isFetchingLocation) {
                        setPickupLocationData(prev => ({ ...prev, name: e.target.value }));
                    }
                }}
                onFocus={() => {
                    if (!isFetchingLocation) {
                        setPickupOpen(true);
                    }
                }}
                // NEW: Show read-only state while fetching
                readOnly={isFetchingLocation}
                className={`flex-1 bg-transparent outline-none text-base ${
                  // NEW: Apply different text color when fetching to indicate disabled state
                  isFetchingLocation ? 'text-achrams-text-secondary italic' : 'text-achrams-text-primary'
                }`}
              />
              {/* Dropdown/Open Button */}
              <div className="flex items-center">
                {/* NEW: Show loader next to dropdown button while fetching, disable button */}
                {isFetchingLocation && (
                  <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid mr-1" />
                )}
                <button
                  onClick={() => {
                      if (!isFetchingLocation) {
                          setPickupOpen(!pickupOpen);
                      }
                  }}
                  disabled={isFetchingLocation} // NEW: Disable button while fetching
                  className={`p-2 ${
                    // NEW: Apply different text color and cursor when disabled
                    isFetchingLocation ? 'text-achrams-text-secondary opacity-50 cursor-not-allowed' : 'text-achrams-text-secondary hover:text-achrams-text-primary'
                  } transition-colors`}
                >
                  {/* NEW: Show spinner inside button instead of Navigation icon while fetching */}
                  {isFetchingLocation ? (
                    <Loader className="w-5 h-5 animate-spin text-achrams-primary-solid" />
                  ) : (
                    pickupOpen ? <ChevronDown className="w-5 h-5" /> : <Navigation className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Dropdown Content */}
            {pickupOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                {/* NEW: Show fetching indicator if loading, otherwise show options */}
                {isFetchingLocation ? (
                  <div className="w-full px-4 py-3 flex items-center gap-3 justify-center text-achrams-text-secondary">
                    <Loader className="w-5 h-5 animate-spin mr-2" />
                    <span>Locating you...</span> {/* NEW: Professional message */}
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleUseCurrentLocation}
                      disabled={isFetchingLocation} // NEW: Disable button while fetching (shouldn't be reachable here, but good practice)
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
                          <div className="font-medium text-achrams-text-primary text-sm">{a.name}</div>
                          <div className="text-xs text-achrams-text-secondary">{a.city}</div>
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
            <div className="flex items-center gap-3 bg-achrams-bg-secondary rounded-xl px-4 py-4 border border-achrams-border">
              <div className="w-2 h-2 bg-achrams-primary-solid rounded-full" />
              <input
                type="text"
                placeholder="Enter destination"
                value={destinationLocationData.name} // NEW: Use name from local state
                onChange={(e) => { // NEW: Update local state
                  setDestinationLocationData(prev => ({ ...prev, name: e.target.value }));
                  setDestOpen(true); // NEW: Open dropdown
                }}
                onFocus={() => setDestOpen(true)}
                className="flex-1 bg-transparent outline-none text-base text-achrams-text-primary"
              />
              {destOpen && destinationLocationData.name && ( // NEW: Use local state
                <button
                  onClick={() => {
                    setDestinationLocationData({ name: '', coords: null }); // NEW: Clear local state
                    setDestination(''); // NEW: Clear parent state
                  }}
                  className="p-2 text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
            {destOpen && destinationLocationData.name && ( // NEW: Use local state
              // Dropdown now uses solid background color and border
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-lg border border-achrams-border z-50 max-h-64 overflow-y-auto">
                {commonDestinations
                  .filter((d) => d.toLowerCase().includes(destinationLocationData.name.toLowerCase())) // NEW: Filter based on local state
                  .map((d, i) => (
                    <button
                      key={i}
                      onClick={() => handleDestinationSelect(d)} // NEW: Use new handler
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-achrams-bg-secondary border-b border-achrams-border text-left"
                    >
                      <MapPin className="w-5 h-5 text-achrams-primary-solid flex-shrink-0" />
                      <div className="text-achrams-text-primary text-sm">{d}</div>
                    </button>
                  ))}
              </div>
            )}
          </div>
        </div>

        {fareEstimate && (
          <div className="mt-6 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="flex justify-between items-center">
              <span className="text-achrams-text-secondary">Estimated fare</span>
              <span className="text-xl font-bold text-achrams-text-primary">₦{fareEstimate.toLocaleString()}</span>
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
              ? 'bg-achrams-gradient-primary hover:opacity-95 active:scale-[0.98] shadow-md'
              : 'bg-achrams-secondary-solid opacity-75 cursor-not-allowed'
          }`}
        >
          {fareEstimate ? `Proceed • ₦${fareEstimate.toLocaleString()}` : 'Enter destinations'}
        </button>
      </div>

      {/* Modals handled by parent */}
    </div>
  );
}