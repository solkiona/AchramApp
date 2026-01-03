// src/components/app/modals/DirectionsModal.tsx
import { X, Navigation, MapPin, Car, User, Route, Clock } from 'lucide-react';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useCallback, useRef } from 'react';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: string;
  pickupCoords?: [number, number] | null; // Booking location (where request was made)
  destination: string;
  destinationCoords?: [number, number] | null;
  driverLocation?: [number, number] | null;
  passengerLocation?: [number, number] | null; // Passenger's current live location
  airportPickupArea?: any; // The polygon defining the pickup zone
  isGoogleMapsLoaded: boolean;
  googleMapsLoadError?: any;
}

interface RouteLeg {
  start_address: string;
  end_address: string;
  distance: { text: string; value: number };
  duration: { text: string; value: number };
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 6.5244,
  lng: 3.3792,
};

// Clean map styles
const mapStyles = [
  {
    featureType: "poi.business",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

// Custom marker icons - using functions to avoid google dependency at load time
const getPassengerIcon = () => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#4F46E5",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 24 } as google.maps.Point,
});

const getDriverIcon = (isInPickupArea: boolean) => ({
  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  fillColor: isInPickupArea ? "#10B981" : "#F59E0B",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 12 } as google.maps.Point,
});

const getPickupIcon = () => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#10B981",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 24 } as google.maps.Point,
});

const getDestinationIcon = () => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: "#EF4444",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 24 } as google.maps.Point,
});

// NEW: Helper function to calculate the centroid of a polygon
const calculatePolygonCentroid = (polygonCoords: number[][]): [number, number] | null => {
  if (!polygonCoords || polygonCoords.length === 0) return null;

  let totalX = 0;
  let totalY = 0;
  let count = 0;

  // Loop through the coordinates of the polygon
  for (let i = 0; i < polygonCoords.length; i++) {
    const [lng, lat] = polygonCoords[i];
    totalX += lng;
    totalY += lat;
    count++;
  }

  // Avoid division by zero
  if (count === 0) return null;

  // Calculate the average (centroid)
  const centroidLng = totalX / count;
  const centroidLat = totalY / count;

  return [centroidLng, centroidLat];
};

export default function DirectionsModal({
  isOpen,
  onClose,
  pickup,
  pickupCoords,
  destination,
  destinationCoords,
  driverLocation,
  passengerLocation, // ✅ Use passengerLocation (live location) as the origin
  airportPickupArea,
  isGoogleMapsLoaded,
  googleMapsLoadError,
}: DirectionsModalProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isDriverInPickupArea, setIsDriverInPickupArea] = useState(false);
  const [routePolylinePath, setRoutePolylinePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null); // ✅ Reflects passenger -> pickup area centroid
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

  // NEW: Refs to track user interaction and initial fitBounds status
  const userInteractionRef = useRef(false);
  const initialFitBoundsDoneRef = useRef(false);

  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

  const getPolygonPaths = useCallback((): google.maps.LatLngLiteral[] => {
    if (!airportPickupArea?.geometry?.coordinates) return [];
    const coordinates = airportPickupArea.geometry.coordinates[0];
    return coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  }, [airportPickupArea]);

  // ✅ UPDATED: Fetch directions from passenger's *current* location to the *centroid* of the pickup area
  const fetchDirections = useCallback(async () => {
    if (!isGoogleMapsLoaded || !passengerLocation || !airportPickupArea?.geometry?.coordinates || !map) {
      return;
    }

    if (!directionsService.current) {
      directionsService.current = new google.maps.DirectionsService();
    }
    if (!directionsRenderer.current) {
      directionsRenderer.current = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        suppressInfoWindows: true,
        polylineOptions: {
          strokeColor: "#3B82F6",
          strokeOpacity: 0.8,
          strokeWeight: 6,
        },
      });
    }

    // ✅ Calculate the centroid of the pickup area polygon
    const pickupAreaCentroid = calculatePolygonCentroid(airportPickupArea.geometry.coordinates[0]);
    if (!pickupAreaCentroid) {
        console.error("Could not calculate centroid for pickup area polygon.");
        setRouteInfo(null);
        setRoutePolylinePath([]);
        directionsRenderer.current.setMap(null);
        return;
    }

    // ✅ Set origin to passenger's *current* location (passengerLocation)
    // ✅ Set destination to the calculated centroid of the pickup area
    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(passengerLocation[0], passengerLocation[1]), // [lng, lat] -> {lat, lng}
      destination: new google.maps.LatLng(pickupAreaCentroid[1], pickupAreaCentroid[0]), // [lng, lat] -> {lat, lng}
      travelMode: google.maps.TravelMode.DRIVING,
    };

    try {
      const result = await directionsService.current.route(request);
      if (result.status === "OK" && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0]; // Leg from passenger's current location to pickup area centroid

        // ✅ Update routeInfo with distance and duration for passenger -> pickup area centroid leg
        setRouteInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
        });

        directionsRenderer.current.setDirections(result);
        const path = route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
        setRoutePolylinePath(path);

      } else {
        console.error("Directions request failed due to status: " + result.status);
        setRouteInfo(null); // ✅ Clear route info on failure
        setRoutePolylinePath([]);
        directionsRenderer.current.setMap(null);
      }
    } catch (e) {
      console.error("Error fetching directions", e);
      setRouteInfo(null); // ✅ Clear route info on error
      setRoutePolylinePath([]);
      directionsRenderer.current.setMap(null);
    }
  }, [isGoogleMapsLoaded, passengerLocation, airportPickupArea, map]); // ✅ Update dependencies

  // NEW: Effect to handle user interaction events
  useEffect(() => {
    if (!map) return;

    const handleMapInteraction = () => {
      // Set the flag to true when user interacts (pan, zoom, etc.)
      userInteractionRef.current = true;
    };

    // Listen for common user interaction events
    const centerListener = map.addListener('center_changed', handleMapInteraction);
    const zoomListener = map.addListener('zoom_changed', handleMapInteraction);

    // Cleanup listeners when component unmounts or map changes
    return () => {
      if (centerListener) centerListener.remove();
      if (zoomListener) zoomListener.remove();
    };
  }, [map]);

  // NEW: Effect to perform initial fitBounds only once, respecting user interaction
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded || initialFitBoundsDoneRef.current || userInteractionRef.current) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    // ✅ Include passenger's *current* location in fitBounds calculation
    if (passengerLocation) {
      bounds.extend({ lat: passengerLocation[0], lng: passengerLocation[1] });
      hasPoints = true;
    }

    // ✅ Include pickup area polygon points in fitBounds calculation
    const polygonPaths = getPolygonPaths();
    if (polygonPaths.length > 0) {
      polygonPaths.forEach(point => bounds.extend(point));
      hasPoints = true;
    }

    if (driverLocation) {
      bounds.extend({ lat: driverLocation[1], lng: driverLocation[0] });
      hasPoints = true;
    }

    // ✅ Include destination coords only if you want them visible initially
    if (destinationCoords) {
      bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
      hasPoints = true;
    }

    if (routePolylinePath.length > 0) {
      routePolylinePath.forEach(point => bounds.extend(point));
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
      initialFitBoundsDoneRef.current = true; // Mark that the initial fitBounds has been done
    }
  }, [
    map,
    passengerLocation, // ✅ Use passengerLocation for initial view
    getPolygonPaths, // ✅ Use the helper to get polygon points
    driverLocation,
    destinationCoords,
    airportPickupArea, // Needed by getPolygonPaths
    isGoogleMapsLoaded, // Needed by getPolygonPaths
    routePolylinePath,
    // userInteractionRef.current and initialFitBoundsDoneRef.current are not deps
    // because we only read their *current* value inside.
  ]);

  // REMOVED: The old useEffect that constantly tried to fit bounds based on live data

  useEffect(() => {
    if (!isGoogleMapsLoaded || !driverLocation || !airportPickupArea) return;

    const polygonPaths = getPolygonPaths();
    if (polygonPaths.length === 0) return;

    const polygon = new google.maps.Polygon({ paths: polygonPaths });
    const driverPoint = new google.maps.LatLng(driverLocation[1], driverLocation[0]);

    const isInside = google.maps.geometry.poly.containsLocation(driverPoint, polygon);
    setIsDriverInPickupArea(isInside);
  }, [driverLocation, airportPickupArea, isGoogleMapsLoaded, getPolygonPaths]);

  useEffect(() => {
    fetchDirections(); // ✅ Fetch passenger (live) -> pickup area centroid route
  }, [fetchDirections]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    if (directionsRenderer.current) {
      directionsRenderer.current.setMap(null);
      directionsRenderer.current = null;
    }
    if (directionsService.current) {
      directionsService.current = null;
    }
  }, []);

  if (!isOpen) return null;

  if (googleMapsLoadError) {
    return (
      <div className="fixed inset-0 bg-achrams-bg-primary z-50 flex items-center justify-center">
        <p className="text-achrams-text-secondary">Error loading map: {googleMapsLoadError.message || googleMapsLoadError}</p>
      </div>
    );
  }

  // NEW: Determine initial center only if initial fitBounds hasn't happened and user hasn't interacted
  let mapCenter = defaultCenter;
  if (!initialFitBoundsDoneRef.current && !userInteractionRef.current) {
     if (passengerLocation) { // ✅ Prefer passenger's *current* location first
        mapCenter = { lat: passengerLocation[0], lng: passengerLocation[1] };
      } else if (airportPickupArea) { // ✅ Then the pickup area (use its first coordinate as a fallback if no centroid calc)
          const centroid = calculatePolygonCentroid(airportPickupArea.geometry.coordinates[0]);
          if (centroid) {
              mapCenter = { lat: centroid[1], lng: centroid[0] };
          } else if (airportPickupArea.geometry.coordinates[0] && airportPickupArea.geometry.coordinates[0].length > 0) {
              const [lng, lat] = airportPickupArea.geometry.coordinates[0][0];
              mapCenter = { lat, lng }; // Fallback to first point of polygon
          }
      }
  }
  // Otherwise, let the map use its current view (controlled by user interaction)

  const polygonPaths = getPolygonPaths();

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 z-50" suppressHydrationWarning={true}>
      <div className="h-full flex flex-col">
        {/* Header with brand colors - subtle enhancement */}
        <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 shadow-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Live Tracking</h2>
                {isDriverInPickupArea && (
                  <p className="text-xs text-white flex items-center gap-1 mt-0.5">
                    <Car className="w-3 h-3" /> Driver has arrived!
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-achrams-text-light hover:text-achrams-text-light/80 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Route Info Bar - Enhanced layout */}
        {routeInfo && (
          <div className="bg-white border-b border-achrams-border px-6 py-3 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-achrams-primary-solid/5 rounded-lg flex items-center justify-center">
                  <Route className="w-4 h-4 text-achrams-primary-solid" />
                </div>
                <div>
                  {/* ✅ Updated label to reflect passenger (live) -> pickup area */}
                  <p className="text-xs text-achrams-text-secondary font-medium">To Pickup Area</p>
                  <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.distance}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-achrams-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-achrams-secondary-solid/5 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-achrams-secondary-solid" />
                </div>
                <div>
                  {/* ✅ Updated label to reflect passenger (live) -> pickup area */}
                  <p className="text-xs text-achrams-text-secondary font-medium">ETA to Pickup</p>
                  <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.duration}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 relative">
          {isGoogleMapsLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              // NEW: Only pass center and zoom if initial fitBounds hasn't happened and user hasn't interacted
              // This prevents the map from being forced back to the center prop.
              // The map will manage its own view after initial load/fitBounds/user interaction.
              center={(!initialFitBoundsDoneRef.current && !userInteractionRef.current) ? mapCenter : undefined}
              zoom={(!initialFitBoundsDoneRef.current && !userInteractionRef.current) ? 14 : undefined}
              onLoad={onLoad}
              onUnmount={onUnmount}
              options={{
                styles: mapStyles,
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: true,
                zoomControlOptions: {
                  position: google.maps.ControlPosition.RIGHT_CENTER,
                },
                // NEW: Ensure the map is draggable and user-controllable
                draggable: true,
                scrollwheel: true, // Allow scroll to zoom if desired
                disableDefaultUI: false, // Keep zoom controls
              }}
            >
              {/* Passenger's Current Location */}
              {passengerLocation && (
                <Marker
                  position={{ lat: passengerLocation[0], lng: passengerLocation[1] }}
                  icon={getPassengerIcon()}
                  title="Your Location"
                  zIndex={1000}
                  onClick={() => setActiveMarker('passenger')}
                />
              )}

              {/* Airport Pickup Area Polygon */}
              {polygonPaths.length > 0 && (
                <Polygon
                  paths={polygonPaths}
                  options={{
                    fillColor: '#10B981',
                    fillOpacity: 0.2,
                    strokeColor: '#10B981',
                    strokeOpacity: 0.8,
                    strokeWeight: 2,
                  }}
                />
              )}

              {/* Airport Pickup Point Marker (Optional: Show centroid) */}
              {/* You could optionally show a marker at the centroid used for routing */}
              {/* {airportPickupArea && calculatePolygonCentroid(airportPickupArea.geometry.coordinates[0]) && (
                <Marker
                  position={{
                      lat: calculatePolygonCentroid(airportPickupArea.geometry.coordinates[0])[1],
                      lng: calculatePolygonCentroid(airportPickupArea.geometry.coordinates[0])[0]
                  }}
                  icon={getPickupIcon()} // Could use a different icon
                  title={`Pickup Area Centroid: ${pickup}`}
                  zIndex={998} // Slightly below passenger/driver
                />
              )} */}

              {/* Driver's Current Location */}
              {driverLocation && (
                <Marker
                  position={{ lat: driverLocation[1], lng: driverLocation[0] }}
                  icon={getDriverIcon(isDriverInPickupArea)}
                  title="Driver Location"
                  zIndex={999}
                  onClick={() => setActiveMarker('driver')}
                />
              )}

              {/* Destination Marker */}
              {destinationCoords && (
                <Marker
                  position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
                  icon={getDestinationIcon()}
                  title={`Destination: ${destination}`}
                  onClick={() => setActiveMarker('destination')}
                />
              )}

              {/* Enhanced Info Popups */}
              {activeMarker === 'passenger' && passengerLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 min-w-[180px] z-[1001] border border-achrams-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <User className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-bold text-achrams-text-primary">Your Location</span>
                  </div>
                  <p className="text-xs text-achrams-text-secondary ml-10">{pickup}</p>
                </div>
              )}
              {activeMarker === 'driver' && driverLocation && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 min-w-[180px] z-[1001] border border-achrams-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDriverInPickupArea ? 'bg-green-100' : 'bg-amber-100'}`}>
                      <Car className={`w-4 h-4 ${isDriverInPickupArea ? 'text-green-600' : 'text-amber-600'}`} />
                    </div>
                    <span className="font-bold text-achrams-text-primary">Driver</span>
                  </div>
                  <p className="text-xs text-achrams-text-secondary ml-10">
                    {isDriverInPickupArea ? '✓ Arrived at pickup area' : 'En route to pickup'}
                  </p>
                </div>
              )}
              {activeMarker === 'pickup' && polygonPaths.length > 0 && airportPickupArea && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 min-w-[180px] z-[1001] border border-achrams-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-bold text-achrams-text-primary">Pickup Area</span>
                  </div>
                  <p className="text-xs text-achrams-text-secondary ml-10">{pickup}</p>
                </div>
              )}
              {activeMarker === 'destination' && destinationCoords && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 min-w-[180px] z-[1001] border border-achrams-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-red-600" />
                    </div>
                    <span className="font-bold text-achrams-text-primary">Destination</span>
                  </div>
                  <p className="text-xs text-achrams-text-secondary ml-10">{destination}</p>
                </div>
              )}
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-achrams-text-secondary text-sm">Loading map...</p>
              </div>
            </div>
          )}

          {/* Enhanced Legend */}
          <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg p-4 text-xs min-w-[160px] border border-achrams-border">
            <h3 className="font-bold text-achrams-text-primary border-b border-achrams-border pb-2 mb-3">Legend</h3>
            <div className="space-y-2.5">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#4F46E5] border-2 border-white shadow-sm"></div>
                <span className="text-achrams-text-primary">Your Location</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#F59E0B] border-2 border-white shadow-sm"></div>
                <span className="text-achrams-text-primary">Driver</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#10B981] border-2 border-white shadow-sm"></div>
                <span className="text-achrams-text-primary">Pickup Area</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-[#EF4444] border-2 border-white shadow-sm"></div>
                <span className="text-achrams-text-primary">Destination</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}



