// src/components/app/modals/DirectionsModal.tsx
import { X, Navigation, MapPin, Car, User, Route, Clock } from 'lucide-react';
import { GoogleMap, Marker, Polygon, useJsApiLoader } from '@react-google-maps/api';
import { useState, useEffect, useCallback, useRef } from 'react';

interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: string;
  pickupCoords?: [number, number] | null;
  destination: string;
  destinationCoords?: [number, number] | null;
  driverLocation?: [number, number] | null;
  passengerLocation?: [number, number] | null;
  airportPickupArea?: any;
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

export default function DirectionsModal({
  isOpen,
  onClose,
  pickup,
  pickupCoords,
  destination,
  destinationCoords,
  driverLocation,
  passengerLocation,
  airportPickupArea,
  isGoogleMapsLoaded,
  googleMapsLoadError,
}: DirectionsModalProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isDriverInPickupArea, setIsDriverInPickupArea] = useState(false);
  const [routePolylinePath, setRoutePolylinePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);

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

  const fetchDirections = useCallback(async () => {
    if (!isGoogleMapsLoaded || !pickupCoords || !destinationCoords || !map) {
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

    const request: google.maps.DirectionsRequest = {
      origin: new google.maps.LatLng(pickupCoords[1], pickupCoords[0]),
      destination: new google.maps.LatLng(destinationCoords[1], destinationCoords[0]),
      travelMode: google.maps.TravelMode.DRIVING,
    };

    try {
      const result = await directionsService.current.route(request);
      if (result.status === "OK" && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];

        setRouteInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
        });

        directionsRenderer.current.setDirections(result);
        const path = route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
        setRoutePolylinePath(path);

      } else {
        console.error("Directions request failed due to status: " + result.status);
        setRouteInfo(null);
        setRoutePolylinePath([]);
        directionsRenderer.current.setMap(null);
      }
    } catch (e) {
      console.error("Error fetching directions", e);
      setRouteInfo(null);
      setRoutePolylinePath([]);
      directionsRenderer.current.setMap(null);
    }
  }, [isGoogleMapsLoaded, pickupCoords, destinationCoords, map]);

  useEffect(() => {
    if (!map || !isGoogleMapsLoaded) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (pickupCoords) {
      bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
      hasPoints = true;
    }

    if (destinationCoords) {
      bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
      hasPoints = true;
    }

    if (driverLocation) {
      bounds.extend({ lat: driverLocation[1], lng: driverLocation[0] });
      hasPoints = true;
    }

    if (passengerLocation) {
      bounds.extend({ lat: passengerLocation[1], lng: passengerLocation[0] });
      hasPoints = true;
    }

    const polygonPaths = getPolygonPaths();
    if (polygonPaths.length > 0) {
      polygonPaths.forEach(point => bounds.extend(point));
      hasPoints = true;
    }

    if (routePolylinePath.length > 0) {
      routePolylinePath.forEach(point => bounds.extend(point));
      hasPoints = true;
    }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
    }
  }, [map, pickupCoords, destinationCoords, driverLocation, passengerLocation, airportPickupArea, isGoogleMapsLoaded, getPolygonPaths, routePolylinePath]);

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
    fetchDirections();
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

  let mapCenter = defaultCenter;
  if (passengerLocation) {
    mapCenter = { lat: passengerLocation[1], lng: passengerLocation[0] };
  } else if (pickupCoords) {
    mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
  }

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
                  <p className="text-xs text-achrams-text-secondary font-medium">Distance</p>
                  <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.distance}</p>
                </div>
              </div>
              <div className="w-px h-10 bg-achrams-border"></div>
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 bg-achrams-secondary-solid/5 rounded-lg flex items-center justify-center">
                  <Clock className="w-4 h-4 text-achrams-secondary-solid" />
                </div>
                <div>
                  <p className="text-xs text-achrams-text-secondary font-medium">Duration</p>
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
              center={mapCenter}
              zoom={14}
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
              }}
            >
              {/* Passenger's Current Location */}
              {passengerLocation && (
                <Marker
                  position={{ lat: passengerLocation[1], lng: passengerLocation[0] }}
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

              {/* Airport Pickup Point Marker */}
              {pickupCoords && (
                <Marker
                  position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
                  icon={getPickupIcon()}
                  title={`Pickup: ${pickup}`}
                  onClick={() => setActiveMarker('pickup')}
                />
              )}

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
              {activeMarker === 'pickup' && pickupCoords && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg p-3 min-w-[180px] z-[1001] border border-achrams-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-bold text-achrams-text-primary">Pickup Point</span>
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





// // src/components/app/modals/DirectionsModal.tsx
// import { X, Navigation, MapPin, Car, User } from 'lucide-react'; // Added icons
// import { GoogleMap, Marker, Polygon, Polyline, useJsApiLoader } from '@react-google-maps/api';
// import { useState, useEffect, useCallback, useRef } from 'react';

// interface DirectionsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   pickup: string;
//   pickupCoords?: [number, number] | null;
//   destination: string;
//   destinationCoords?: [number, number] | null;
//   driverLocation?: [number, number] | null; // NEW: Driver's live location [lat, lng]
//   passengerLocation?: [number, number] | null; // NEW: Passenger's live location [lat, lng]
//   airportPickupArea?: any; // NEW: GeoJSON Polygon for pickup area
//   isGoogleMapsLoaded: boolean;
//   googleMapsLoadError?: any;
// }

// interface RouteLeg {
//   start_address: string;
//   end_address: string;
//   distance: { text: string; value: number }; // value in meters
//   duration: { text: string; value: number }; // value in seconds
// }

// interface RouteStep {
//   maneuver?: string; // e.g., turn-left, turn-right
//   instructions: string;
//   distance: { text: string; value: number };
//   duration: { text: string; value: number };
//   start_location: { lat: () => number; lng: () => number };
//   end_location: { lat: () => number; lng: () => number };
// }

// interface RouteOverviewPath {
//   lat: number;
//   lng: number;
// }

// interface DirectionsResult {
//   status: string;
//   routes: {
//     legs: RouteLeg[];
//     steps: RouteStep[];
//     overview_path: RouteOverviewPath[];
//   }[];
// }

// const mapContainerStyle = {
//   width: '100%',
//   height: '100%',
// };

// const defaultCenter = {
//   lat: 6.5244,
//   lng: 3.3792,
// };

// // Custom marker icons
// const passengerIcon = {
//   path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Path for a person icon
//   fillColor: "#4F46E5",
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// };

// const driverIcon = (isInPickupArea: boolean) => ({
//   path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z", // Path for a car icon
//   fillColor: isInPickupArea ? "#10B981" : "#F59E0B", // Green if in area, Amber otherwise
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// });

// const pickupIcon = {
//   path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Same person icon for pickup
//   fillColor: "#10B981",
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// };

// const destinationIcon = {
//   path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Same person icon for destination
//   fillColor: "#EF4444",
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// };

// export default function DirectionsModal({
//   isOpen,
//   onClose,
//   pickup,
//   pickupCoords,
//   destination,
//   destinationCoords,
//   driverLocation,
//   passengerLocation,
//   airportPickupArea,
//   isGoogleMapsLoaded,
//   googleMapsLoadError,
// }: DirectionsModalProps) {
//   const [map, setMap] = useState<google.maps.Map | null>(null);
//   const [isDriverInPickupArea, setIsDriverInPickupArea] = useState(false);
//   const [routePolylinePath, setRoutePolylinePath] = useState<google.maps.LatLngLiteral[]>([]);
//   const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
//   const [activeMarker, setActiveMarker] = useState<string | null>(null); // Track which marker's info is open

//   const directionsService = useRef<google.maps.DirectionsService | null>(null);
//   const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

//   // Convert GeoJSON coordinates to Google Maps LatLng format
//   const getPolygonPaths = useCallback((): google.maps.LatLngLiteral[] => {
//     if (!airportPickupArea?.geometry?.coordinates) return [];

//     const coordinates = airportPickupArea.geometry.coordinates[0]; // First ring of polygon
//     return coordinates.map((coord: number[]) => ({
//       lat: coord[1],
//       lng: coord[0],
//     }));
//   }, [airportPickupArea]);

//   // Fetch directions using Google Maps Directions Service
//   const fetchDirections = useCallback(async () => {
//     if (!isGoogleMapsLoaded || !pickupCoords || !destinationCoords || !map) {
//       return;
//     }

//     if (!directionsService.current) {
//       directionsService.current = new google.maps.DirectionsService();
//     }
//     if (!directionsRenderer.current) {
//       directionsRenderer.current = new google.maps.DirectionsRenderer({
//         map: map,
//         suppressMarkers: true, // We render our own markers
//         suppressInfoWindows: true, // We handle info windows ourselves
//         polylineOptions: {
//           strokeColor: "#3B82F6",
//           strokeOpacity: 0.8,
//           strokeWeight: 6,
//         },
//       });
//     }

//     const request: google.maps.DirectionsRequest = {
//       origin: new google.maps.LatLng(pickupCoords[1], pickupCoords[0]), // [lat, lng]
//       destination: new google.maps.LatLng(destinationCoords[1], destinationCoords[0]), // [lat, lng]
//       travelMode: google.maps.TravelMode.DRIVING,
//     };

//     try {
//       const result = await directionsService.current.route(request);
//       if (result.status === "OK" && result.routes.length > 0) {
//         const route = result.routes[0];
//         const leg = route.legs[0]; // Assuming single leg for simplicity

//         setRouteInfo({
//           distance: leg.distance?.text || "N/A",
//           duration: leg.duration?.text || "N/A",
//         });

//         // Update the renderer with the new route
//         directionsRenderer.current.setDirections(result);
//         // Store the path for potential manual polyline rendering if needed
//         const path = route.overview_path.map((point) => ({ lat: point.lat(), lng: point.lng() }));
//         setRoutePolylinePath(path);

//       } else {
//         console.error("Directions request failed due to status: " + result.status);
//         setRouteInfo(null);
//         setRoutePolylinePath([]);
//         directionsRenderer.current.setMap(null); // Clear previous route if any
//       }
//     } catch (e) {
//       console.error("Error fetching directions", e);
//       setRouteInfo(null);
//       setRoutePolylinePath([]);
//       directionsRenderer.current.setMap(null); // Clear previous route if any
//     }
//   }, [isGoogleMapsLoaded, pickupCoords, destinationCoords, map]);

//   // Adjust map bounds to fit all markers and route
//   useEffect(() => {
//     if (!map || !isGoogleMapsLoaded) return;

//     const bounds = new google.maps.LatLngBounds();
//     let hasPoints = false;

//     // Add pickup location
//     if (pickupCoords) {
//       bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
//       hasPoints = true;
//     }

//     // Add destination location
//     if (destinationCoords) {
//       bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
//       hasPoints = true;
//     }

//     // Add driver location
//     if (driverLocation) {
//       bounds.extend({ lat: driverLocation[1], lng: driverLocation[0] });
//       hasPoints = true;
//     }

//     // Add passenger location
//     if (passengerLocation) {
//       bounds.extend({ lat: passengerLocation[1], lng: passengerLocation[0] });
//       hasPoints = true;
//     }

//     // Add pickup area polygon points
//     const polygonPaths = getPolygonPaths();
//     if (polygonPaths.length > 0) {
//       polygonPaths.forEach(point => bounds.extend(point));
//       hasPoints = true;
//     }

//     // Add route path points
//     if (routePolylinePath.length > 0) {
//       routePolylinePath.forEach(point => bounds.extend(point));
//       hasPoints = true;
//     }

//     if (hasPoints) {
//       map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 }); // Adjust padding as needed
//     }
//   }, [map, pickupCoords, destinationCoords, driverLocation, passengerLocation, airportPickupArea, isGoogleMapsLoaded, getPolygonPaths, routePolylinePath]);

//   // Check if driver is within pickup area
//   useEffect(() => {
//     if (!isGoogleMapsLoaded || !driverLocation || !airportPickupArea) return;

//     const polygonPaths = getPolygonPaths();
//     if (polygonPaths.length === 0) return;

//     const polygon = new google.maps.Polygon({ paths: polygonPaths });
//     const driverPoint = new google.maps.LatLng(driverLocation[1], driverLocation[0]); // [lat, lng]

//     const isInside = google.maps.geometry.poly.containsLocation(driverPoint, polygon);
//     setIsDriverInPickupArea(isInside);
//   }, [driverLocation, airportPickupArea, isGoogleMapsLoaded, getPolygonPaths]);

//   // Fetch directions when map, pickup, or destination changes
//   useEffect(() => {
//     fetchDirections();
//   }, [fetchDirections]);

//   const onLoad = useCallback((map: google.maps.Map) => {
//     setMap(map);
//   }, []);

//   const onUnmount = useCallback(() => {
//     setMap(null);
//     // Clean up directions renderer if it exists
//     if (directionsRenderer.current) {
//       directionsRenderer.current.setMap(null);
//       directionsRenderer.current = null;
//     }
//     if (directionsService.current) {
//       directionsService.current = null; // No cleanup method needed on service itself
//     }
//   }, []);

//   if (!isOpen) return null;

//   if (googleMapsLoadError) {
//     return (
//       <div className="fixed inset-0 bg-achrams-bg-primary z-50 flex items-center justify-center">
//         <p className="text-achrams-text-secondary">Error loading map: {googleMapsLoadError.message || googleMapsLoadError}</p>
//       </div>
//     );
//   }

//   // Determine map center
//   let mapCenter = defaultCenter;
//   if (passengerLocation) {
//     mapCenter = { lat: passengerLocation[1], lng: passengerLocation[0] };
//   } else if (pickupCoords) {
//     mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
//   }

//   const polygonPaths = getPolygonPaths();

//   return (
//     <div className="fixed inset-0 bg-achrams-secondary-solid/50 z-50" suppressHydrationWarning={true}>
//       <div className="h-full flex flex-col">
//         {/* Header */}
//         <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//           <div>
//             <h2 className="text-xl font-bold flex items-center gap-2">
//               <Navigation className="w-5 h-5" /> Live Tracking
//             </h2>
//             {isDriverInPickupArea && (
//               <p className="text-xs text-green-300 mt-1 flex items-center gap-1">
//                 <Car className="w-3 h-3" /> Driver has arrived at pickup area!
//               </p>
//             )}
//           </div>
//           <button
//             onClick={onClose}
//             className="text-achrams-text-light hover:text-achrams-text-light/80 transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* Route Info Bar (Optional, above map) */}
//         {routeInfo && (
//           <div className="bg-achrams-bg-secondary border-b border-achrams-border px-4 py-2 text-sm flex items-center justify-between">
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-1">
//                 <MapPin className="w-4 h-4 text-achrams-primary-solid" />
//                 <span>{pickup}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <MapPin className="w-4 h-4 text-achrams-secondary-solid" />
//                 <span>{destination}</span>
//               </div>
//             </div>
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-1">
//                 <span className="text-achrams-text-secondary">Distance:</span>
//                 <span className="font-medium">{routeInfo.distance}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="text-achrams-text-secondary">Duration:</span>
//                 <span className="font-medium">{routeInfo.duration}</span>
//               </div>
//             </div>
//           </div>
//         )}

//         <div className="flex-1 relative">
//           {isGoogleMapsLoaded ? (
//             <GoogleMap
//               mapContainerStyle={mapContainerStyle}
//               center={mapCenter}
//               zoom={14}
//               onLoad={onLoad}
//               onUnmount={onUnmount}
//               options={{
//                 mapTypeControl: false,
//                 streetViewControl: false,
//                 fullscreenControl: false,
//               }}
//             >
//               {/* Passenger's Current Location */}
//               {passengerLocation && (
//                 <Marker
//                   position={{ lat: passengerLocation[1], lng: passengerLocation[0] }}
//                   icon={passengerIcon}
//                   title="Your Location"
//                   zIndex={1000}
//                   onClick={() => setActiveMarker('passenger')}
//                 />
//               )}

//               {/* Airport Pickup Area Polygon */}
//               {polygonPaths.length > 0 && (
//                 <Polygon
//                   paths={polygonPaths}
//                   options={{
//                     fillColor: '#10B981',
//                     fillOpacity: 0.2,
//                     strokeColor: '#10B981',
//                     strokeOpacity: 0.8,
//                     strokeWeight: 2,
//                   }}
//                 />
//               )}

//               {/* Airport Pickup Point Marker */}
//               {pickupCoords && (
//                 <Marker
//                   position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
//                   icon={pickupIcon}
//                   title={`Pickup: ${pickup}`}
//                   onClick={() => setActiveMarker('pickup')}
//                 />
//               )}

//               {/* Driver's Current Location */}
//               {driverLocation && (
//                 <Marker
//                   position={{ lat: driverLocation[1], lng: driverLocation[0] }}
//                   icon={driverIcon(isDriverInPickupArea)}
//                   title="Driver Location"
//                   zIndex={999}
//                   onClick={() => setActiveMarker('driver')}
//                 />
//               )}

//               {/* Destination Marker */}
//               {destinationCoords && (
//                 <Marker
//                   position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
//                   icon={destinationIcon}
//                   title={`Destination: ${destination}`}
//                   onClick={() => setActiveMarker('destination')}
//                 />
//               )}

//               {/* Info Windows - Simplified for now, could be more complex */}
//               {activeMarker === 'passenger' && passengerLocation && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: "10px",
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     background: "white",
//                     padding: "8px",
//                     borderRadius: "4px",
//                     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//                     zIndex: 1001,
//                   }}
//                 >
//                   <div className="flex items-center gap-2">
//                     <User className="w-4 h-4 text-achrams-primary-solid" />
//                     <span className="font-medium">You</span>
//                   </div>
//                   <p className="text-xs text-achrams-text-secondary">{pickup}</p>
//                 </div>
//               )}
//               {activeMarker === 'driver' && driverLocation && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: "10px",
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     background: "white",
//                     padding: "8px",
//                     borderRadius: "4px",
//                     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//                     zIndex: 1001,
//                   }}
//                 >
//                   <div className="flex items-center gap-2">
//                     <Car className="w-4 h-4" style={{ color: isDriverInPickupArea ? '#10B981' : '#F59E0B' }} />
//                     <span className="font-medium">Driver</span>
//                   </div>
//                   <p className="text-xs text-achrams-text-secondary">Status: {isDriverInPickupArea ? 'Arrived' : 'En Route'}</p>
//                 </div>
//               )}
//               {activeMarker === 'pickup' && pickupCoords && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: "10px",
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     background: "white",
//                     padding: "8px",
//                     borderRadius: "4px",
//                     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//                     zIndex: 1001,
//                   }}
//                 >
//                   <div className="flex items-center gap-2">
//                     <MapPin className="w-4 h-4 text-achrams-primary-solid" />
//                     <span className="font-medium">Pickup</span>
//                   </div>
//                   <p className="text-xs text-achrams-text-secondary">{pickup}</p>
//                 </div>
//               )}
//               {activeMarker === 'destination' && destinationCoords && (
//                 <div
//                   style={{
//                     position: "absolute",
//                     top: "10px",
//                     left: "50%",
//                     transform: "translateX(-50%)",
//                     background: "white",
//                     padding: "8px",
//                     borderRadius: "4px",
//                     boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
//                     zIndex: 1001,
//                   }}
//                 >
//                   <div className="flex items-center gap-2">
//                     <MapPin className="w-4 h-4 text-achrams-secondary-solid" />
//                     <span className="font-medium">Destination</span>
//                   </div>
//                   <p className="text-xs text-achrams-text-secondary">{destination}</p>
//                 </div>
//               )}
//             </GoogleMap>
//           ) : (
//             <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//               <p className="text-achrams-text-secondary">Loading map...</p>
//             </div>
//           )}

//           {/* Legend */}
//           <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-3 text-xs space-y-2 min-w-[150px]">
//             <h3 className="font-semibold text-achrams-text-primary border-b border-achrams-border pb-1">Legend</h3>
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-[#4F46E5] border-2 border-white"></div>
//               <span>Your Location</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-[#F59E0B] border-2 border-white"></div>
//               <span>Driver</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-[#10B981] border-2 border-white"></div>
//               <span>Pickup Area</span>
//             </div>
//             <div className="flex items-center gap-2">
//               <div className="w-3 h-3 rounded-full bg-[#EF4444] border-2 border-white"></div>
//               <span>Destination</span>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
