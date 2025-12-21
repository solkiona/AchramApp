// src/components/app/screens/TripProgressScreen.tsx
"use client";

import { Shield, Navigation, MapPin, Car, Clock, Route } from "lucide-react";
import { GoogleMap, Marker, Polyline, Polygon } from "@react-google-maps/api";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
import { useEffect, useState, useRef, useCallback } from "react";
import { InfoWindow } from "@react-google-maps/api";

interface Driver {
  name: string;
  initials?: string;
  location?: [number, number] | null;
  vehicle?: {
    make?: string;
    model?: string;
    plate?: string;
    color?: string;
  };
}

interface TripProgressScreenProps {
  driver: Driver | null;
  onPanic: () => void;
  onComplete: () => void;
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  isGoogleMapsLoaded: boolean;
  googleMapsLoadError?: any;
  airportPickupArea?: any;
  screenPaddingClass: string;
  isAuthenticated: boolean;
}

const mapStyles = [
  {
    featureType: "poi.business",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

const getDriverIcon = () => ({
  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  fillColor: "#F59E0B",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 12 } as google.maps.Point,
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

export default function TripProgressScreen({
  driver,
  onPanic,
  onComplete,
  pickupCoords,
  destinationCoords,
  isGoogleMapsLoaded,
  googleMapsLoadError,
  airportPickupArea,
  screenPaddingClass,
  isAuthenticated,
}: TripProgressScreenProps) {
  const driverLocation = driver?.location || null;
  
  // ✅ FIX 1: Store route path as state (for persistent blue line)
  const [routePath, setRoutePath] = useState<google.maps.LatLngLiteral[]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  // ✅ FIX 2: Track user interaction with STATE (not just ref)
  const [hasUserInteracted, setHasUserInteracted] = useState(false);
  const userInteractionRef = useRef(false);

  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);

  const getPolygonPaths = useCallback((): google.maps.LatLngLiteral[] => {
    if (!airportPickupArea?.geometry?.coordinates) return [];
    const coordinates = airportPickupArea.geometry.coordinates[0];
    return coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  }, [airportPickupArea]);

  const polygonPaths = getPolygonPaths();

  // ✅ FIX 3: Listen for user interactions and UPDATE STATE
  useEffect(() => {
    if (!map || hasUserInteracted) return;

    const handleMapInteraction = () => {
      if (!userInteractionRef.current) {
        console.log('User interacted with map - disabling auto-center/zoom');
        userInteractionRef.current = true;
        setHasUserInteracted(true); // ✅ Triggers re-render to stop passing center/zoom props
      }
    };

    // Listen for common user interaction events
    const centerListener = map.addListener('center_changed', handleMapInteraction);
    const zoomListener = map.addListener('zoom_changed', handleMapInteraction);
    const dragListener = map.addListener('dragstart', handleMapInteraction); // Also consider dragstart

    return () => {
      if (centerListener) centerListener.remove();
      if (zoomListener) zoomListener.remove();
      if (dragListener) dragListener.remove();
    };
  }, [map, hasUserInteracted]);

  // ✅ FIX 4: Fetch directions and store path permanently
  useEffect(() => {
    if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !window.google?.maps) {
      return;
    }

    const origin = new google.maps.LatLng(driverLocation[0], driverLocation[1]);
    const destination = new google.maps.LatLng(destinationCoords[1], destinationCoords[0]);

    if (!directionsServiceRef.current) {
      directionsServiceRef.current = new google.maps.DirectionsService();
    }

    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsServiceRef.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];

        setRouteInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
        });

        // ✅ Store the route path for persistent rendering
        const path = route.overview_path.map((point) => ({
          lat: point.lat(),
          lng: point.lng(),
        }));
        setRoutePath(path);
        
        console.log('Route fetched and stored:', path.length, 'points');
      } else {
        console.warn("Directions request failed:", status);
        setRoutePath([]);
        setRouteInfo(null);
      }
    });
  }, [driverLocation, destinationCoords, isGoogleMapsLoaded]);

  // ✅ FIX 5: FitBounds ONLY once initially, then never again if user interacted
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded || hasUserInteracted) {
      return; // ✅ Stop if user has interacted
    }

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (driverLocation) {
      bounds.extend({ lat: driverLocation[0], lng: driverLocation[1] });
      hasPoints = true;
    }
    if (destinationCoords) {
      bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
      hasPoints = true;
    }
    if (pickupCoords) {
      bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
      hasPoints = true;
    }
    if (polygonPaths.length > 0) {
      polygonPaths.forEach(point => bounds.extend(point));
      hasPoints = true;
    }

    if (hasPoints) {
      console.log('Auto-fitting map bounds (initial view)');
      map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
    }
  }, [map, driverLocation, destinationCoords, pickupCoords, polygonPaths, isGoogleMapsLoaded, hasUserInteracted]);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
    setHasUserInteracted(false);
    userInteractionRef.current = false;
  }, []);

  // ✅ DETERMINE INITIAL CENTER ONLY IF USER HASN'T INTERACTED AND NO INITIAL FIT BOUNDS DONE
  // We don't use mapCenter directly as a prop anymore, let the map manage its view after interaction
  const initialMapCenter = !hasUserInteracted ? (
    driverLocation
      ? { lat: driverLocation[0], lng: driverLocation[1] }
      : destinationCoords
      ? { lat: destinationCoords[1], lng: destinationCoords[0] }
      : { lat: 6.5244, lng: 3.3792 }
  ) : undefined; // Use undefined if user interacted

  if (googleMapsLoadError) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex flex-col">
        <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4">
          <h1 className="text-xl font-bold">Trip in progress</h1>
        </div>
        <div className="flex-1 flex items-center justify-center bg-achrams-bg-secondary">
          <p className="text-achrams-text-secondary">Error loading map</p>
        </div>
        <ACHRAMFooter />
      </div>
    );
  }

  return (
    <div className="flex-1 bg-achrams-bg-primary flex flex-col">
      {driver && (
        <>
          <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Navigation className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold">Trip in Progress</h1>
                <p className="text-xs text-achrams-text-light/80">Live tracking</p>
              </div>
            </div>
            <button
              onClick={onPanic}
              className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:from-red-600 hover:to-red-800 active:scale-95 hover:scale-105 transition-all duration-200"
            >
              <Shield className="w-6 h-6 text-white" />
            </button>
          </div>

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
                    <p className="text-xs text-achrams-text-secondary font-medium">ETA</p>
                    <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.duration}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 relative">
            {isGoogleMapsLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                // ✅ FIX 6: ONLY PASS center/zoom IF USER HASN'T INTERACTED
                center={hasUserInteracted ? undefined : initialMapCenter}
                zoom={hasUserInteracted ? undefined : 14}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                  styles: mapStyles,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  zoomControl: true,
                  zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                  },
                  // Ensure map is controllable by user
                  draggable: true,
                  scrollwheel: true,
                  disableDefaultUI: false,
                }}
              >
                {/* ✅ FIX 6: Use Polyline instead of DirectionsRenderer for persistent route */}
                {routePath.length > 0 && (
                  <Polyline
                    path={routePath}
                    options={{
                      strokeColor: "#3B82F6",
                      strokeOpacity: 0.8,
                      strokeWeight: 6,
                    }}
                  />
                )}

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

                {destinationCoords && (
                  <Marker
                    position={{
                      lat: destinationCoords[1],
                      lng: destinationCoords[0],
                    }}
                    icon={getDestinationIcon()}
                    title="Destination"
                    onClick={() => setSelectedMarker("destination")}
                  />
                )}

                {driverLocation && (
                  <Marker
                    position={{
                      lat: driverLocation[0],
                      lng: driverLocation[1],
                    }}
                    icon={getDriverIcon()}
                    title={`Driver: ${driver.name}`}
                    onClick={() => setSelectedMarker("driver")}
                  />
                )}

                {selectedMarker === "destination" && destinationCoords && (
                  <InfoWindow
                    position={{
                      lat: destinationCoords[1],
                      lng: destinationCoords[0],
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-4 h-4 text-red-600" />
                        </div>
                        <span className="font-bold text-gray-900">Destination</span>
                      </div>
                      {routeInfo && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <Route className="w-3 h-3" />
                            {routeInfo.distance} away
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {routeInfo.duration} remaining
                          </p>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
                )}

                {selectedMarker === "driver" && driverLocation && driver && (
                  <InfoWindow
                    position={{
                      lat: driverLocation[0],
                      lng: driverLocation[1],
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="p-2">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
                          <Car className="w-4 h-4 text-amber-600" />
                        </div>
                        <span className="font-bold text-gray-900">{driver.name}</span>
                      </div>
                      {routeInfo && (
                        <div className="text-xs text-gray-600 space-y-1">
                          <p className="flex items-center gap-1">
                            <Route className="w-3 h-3" />
                            {routeInfo.distance} to destination
                          </p>
                          <p className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {routeInfo.duration} away
                          </p>
                        </div>
                      )}
                    </div>
                  </InfoWindow>
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
          </div>

          <div className={`bg-achrams-bg-primary px-6 py-5 border-t border-achrams-border shadow-lg ${isAuthenticated ? 'mb-10': ''}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-2xl flex items-center justify-center text-achrams-text-light text-xl font-bold shadow-md ring-4 ring-achrams-primary-solid/10">
                  {driver.initials || driver.name?.charAt(0) || "D"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-sm"></div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-achrams-text-primary text-lg">
                  {driver.name}
                </div>
                <div className="text-sm text-achrams-text-secondary flex items-center gap-1 mt-0.5">
                  <Navigation className="w-3.5 h-3.5" />
                  En route to destination
                </div>
                {routeInfo && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-achrams-text-secondary">
                    <span className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      {routeInfo.distance}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {routeInfo.duration}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <ACHRAMFooter />
        </>
      )}
    </div>
  );
}

// // src/components/app/screens/TripProgressScreen.tsx
// "use client";

// import { Shield, Navigation, MapPin, Car, Clock, Route } from "lucide-react";
// import { GoogleMap, Marker, DirectionsRenderer, Polygon } from "@react-google-maps/api";
// import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
// import { useEffect, useState, useRef, useCallback } from "react";
// import { InfoWindow } from "@react-google-maps/api";

// interface Driver {
//   name: string;
//   initials?: string;
//   location?: [number, number] | null;
//   vehicle?: {
//     make?: string;
//     model?: string;
//     plate?: string;
//     color?: string;
//   };
// }

// interface TripProgressScreenProps {
//   driver: Driver | null;
//   onPanic: () => void;
//   onComplete: () => void;
//   pickupCoords: [number, number] | null;
//   destinationCoords: [number, number] | null;
//   isGoogleMapsLoaded: boolean;
//   googleMapsLoadError?: any;
//   airportPickupArea?: any;
//   screenPaddingClass: string;
//   isAuthenticated: boolean;
// }

// // Clean map styles - subtle enhancement
// const mapStyles = [
//   {
//     featureType: "poi.business",
//     elementType: "labels",
//     stylers: [{ visibility: "off" }]
//   }
// ];

// // Enhanced driver marker with brand colors - using object literal (no google dependency)
// const getDriverIcon = () => ({
//   path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
//   fillColor: "#F59E0B",
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2.5,
//   scale: 2.2,
//   anchor: { x: 12, y: 12 } as google.maps.Point,
// });

// // Enhanced destination marker - using object literal (no google dependency)
// const getDestinationIcon = () => ({
//   path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
//   fillColor: "#EF4444",
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2.5,
//   scale: 2.2,
//   anchor: { x: 12, y: 24 } as google.maps.Point,
// });

// export default function TripProgressScreen({
//   driver,
//   onPanic,
//   onComplete,
//   pickupCoords,
//   destinationCoords,
//   isGoogleMapsLoaded,
//   googleMapsLoadError,
//   airportPickupArea,
//   screenPaddingClass,
//   isAuthenticated,
// }: TripProgressScreenProps) {
//   const driverLocation = driver?.location || null;
//   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
//   const [directionsError, setDirectionsError] = useState<string | null>(null);
//   const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
//   const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

//   // NEW: Ref to track user interaction with the map
//   const userInteractionRef = useRef(false);
//   // NEW: Ref to track if initial fitBounds has been done
//   const initialFitBoundsDoneRef = useRef(false);

//   const directionsService = useRef<google.maps.DirectionsService | null>(null);
//   const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

//   const getPolygonPaths = (): google.maps.LatLngLiteral[] => {
//     if (!airportPickupArea?.geometry?.coordinates) return [];
//     const coordinates = airportPickupArea.geometry.coordinates[0];
//     return coordinates.map((coord: number[]) => ({
//       lat: coord[1],
//       lng: coord[0],
//     }));
//   };

//   const polygonPaths = getPolygonPaths();

//   // NEW: Effect to handle user interaction events
//   useEffect(() => {
//     if (!window.google?.maps || !directionsRenderer.current?.getMap()) return;

//     const map = directionsRenderer.current.getMap() as google.maps.Map;

//     const handleMapInteraction = () => {
//       // Set the flag to true when user interacts (pan, zoom, rotate, etc.)
//       userInteractionRef.current = true;
//     };

//     // Listen for common user interaction events
//     const centerListener = map.addListener('center_changed', handleMapInteraction);
//     const zoomListener = map.addListener('zoom_changed', handleMapInteraction);
//     const headingListener = map.addListener('heading_changed', handleMapInteraction); // NEW: For rotation
//     const tiltListener = map.addListener('tilt_changed', handleMapInteraction); // NEW: For tilt

//     // Cleanup listeners when component unmounts or map changes
//     return () => {
//       if (centerListener) centerListener.remove();
//       if (zoomListener) zoomListener.remove();
//       if (headingListener) headingListener.remove(); // NEW
//       if (tiltListener) tiltListener.remove(); // NEW
//     };
//   }, [directionsRenderer.current]); // Depend on the renderer which holds the map reference


//   // Fetch directions when driver location or destination changes
//   useEffect(() => {
//     if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !window.google?.maps) {
//       setDirections(null);
//       setRouteInfo(null);
//       setDirectionsError(null);
//       return;
//     }

//     const origin = new google.maps.LatLng(driverLocation[0], driverLocation[1]);
//     const destination = new google.maps.LatLng(destinationCoords[1], destinationCoords[0]);

//     if (!directionsService.current) {
//       directionsService.current = new google.maps.DirectionsService();
//     }
//     if (!directionsRenderer.current) {
//       directionsRenderer.current = new google.maps.DirectionsRenderer({
//         suppressMarkers: true,
//         suppressInfoWindows: true,
//         polylineOptions: {
//           strokeColor: "#3B82F6",
//           strokeOpacity: 0.8,
//           strokeWeight: 6,
//         },
//       });
//     }

//     const request: google.maps.DirectionsRequest = {
//       origin: origin,
//       destination: destination,
//       travelMode: google.maps.TravelMode.DRIVING,
//     };

//     directionsService.current.route(request, (result, status) => {
//       if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
//         const route = result.routes[0];
//         const leg = route.legs[0];

//         setRouteInfo({
//           distance: leg.distance?.text || "N/A",
//           duration: leg.duration?.text || "N/A",
//         });

//         setDirections(result);
//         if (directionsRenderer.current && window.google?.maps) {
//           directionsRenderer.current.setDirections(result);
//         }
//         setDirectionsError(null);
//       } else {
//         console.warn("Directions request failed:", status, result);
//         setDirections(null);
//         setRouteInfo(null);
//         setDirectionsError("Could not load route details");
//         if (directionsRenderer.current) {
//           directionsRenderer.current.setMap(null);
//         }
//       }
//     });
//   }, [driverLocation, destinationCoords, isGoogleMapsLoaded]);

//   // NEW: Effect to fit bounds initially, respecting user interaction
//   useEffect(() => {
//     if (!window.google?.maps || !directionsRenderer.current?.getMap() || initialFitBoundsDoneRef.current || userInteractionRef.current) return;

//     const map = directionsRenderer.current.getMap() as google.maps.Map;
//     const bounds = new google.maps.LatLngBounds();

//     let hasPoints = false;
//     if (driverLocation) {
//       bounds.extend({ lat: driverLocation[0], lng: driverLocation[1] });
//       hasPoints = true;
//     }
//     if (destinationCoords) {
//       bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
//       hasPoints = true;
//     }
//     // Optionally include pickupCoords if relevant for initial view
//     if (pickupCoords) {
//         bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
//         hasPoints = true;
//     }

//     if (polygonPaths.length > 0) {
//         polygonPaths.forEach(point => bounds.extend(point));
//         hasPoints = true;
//     }

//     if (hasPoints) {
//         map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
//         initialFitBoundsDoneRef.current = true; // Mark that the initial fitBounds has been done
//     }

//   }, [driverLocation, destinationCoords, pickupCoords, polygonPaths, userInteractionRef.current]); // Depend on data points and interaction flag


//   // Determine initial map center only if initial fitBounds hasn't happened and user hasn't interacted
//   let mapCenter = { lat: 6.5244, lng: 3.3792 }; // Default fallback
//   if (!initialFitBoundsDoneRef.current && !userInteractionRef.current) {
//     if (driverLocation) {
//         mapCenter = { lat: driverLocation[0], lng: driverLocation[1] };
//     } else if (destinationCoords) {
//         mapCenter = { lat: destinationCoords[1], lng: destinationCoords[0] };
//     }
//   }
//   // Otherwise, let the map use its current view (controlled by user interaction)

//   if (googleMapsLoadError) {
//     return (
//       <div className="h-screen bg-achrams-bg-primary flex flex-col">
//         <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4">
//           <h1 className="text-xl font-bold">Trip in progress</h1>
//         </div>
//         <div className="flex-1 flex items-center justify-center bg-achrams-bg-secondary">
//           <p className="text-achrams-text-secondary">Error loading map</p>
//         </div>
//         <ACHRAMFooter />
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 bg-achrams-bg-primary flex flex-col">
//       {driver && (
//         <>
//           {/* Header with brand colors - subtle enhancement */}
//           <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between shadow-md">
//             <div className="flex items-center gap-2">
//               <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center">
//                 <Navigation className="w-5 h-5" />
//               </div>
//               <div>
//                 <h1 className="text-lg font-bold">Trip in Progress</h1>
//                 <p className="text-xs text-achrams-text-light/80">Live tracking</p>
//               </div>
//             </div>
//             <button
//               onClick={onPanic}
//               className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:from-red-600 hover:to-red-800 active:scale-95 hover:scale-105 transition-all duration-200"
//             >
//               <Shield className="w-6 h-6 text-white" />
//             </button>
//           </div>

//           {/* Stats Bar - Enhanced layout */}
//           {routeInfo && (
//             <div className="bg-white border-b border-achrams-border px-6 py-3 shadow-sm">
//               <div className="flex items-center justify-between gap-4">
//                 <div className="flex items-center gap-2">
//                   <div className="w-9 h-9 bg-achrams-primary-solid/5 rounded-lg flex items-center justify-center">
//                     <Route className="w-4 h-4 text-achrams-primary-solid" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-achrams-text-secondary font-medium">Distance</p>
//                     <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.distance}</p>
//                   </div>
//                 </div>
//                 <div className="w-px h-10 bg-achrams-border"></div>
//                 <div className="flex items-center gap-2">
//                   <div className="w-9 h-9 bg-achrams-secondary-solid/5 rounded-lg flex items-center justify-center">
//                     <Clock className="w-4 h-4 text-achrams-secondary-solid" />
//                   </div>
//                   <div>
//                     <p className="text-xs text-achrams-text-secondary font-medium">ETA</p>
//                     <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.duration}</p>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Map Container */}
//           <div className="flex-1 relative">
//             {isGoogleMapsLoaded ? (
//               <GoogleMap
//                 mapContainerStyle={{ width: "100%", height: "100%" }}
//                 // NEW: Only pass center and zoom if initial fitBounds hasn't happened and user hasn't interacted
//                 center={(!initialFitBoundsDoneRef.current && !userInteractionRef.current) ? mapCenter : undefined}
//                 zoom={(!initialFitBoundsDoneRef.current && !userInteractionRef.current) ? 14 : undefined}
//                 options={{
//                   styles: mapStyles,
//                   streetViewControl: false,
//                   mapTypeControl: false,
//                   fullscreenControl: false,
//                   zoomControl: true,
//                   zoomControlOptions: {
//                     position: google.maps.ControlPosition.RIGHT_CENTER,
//                   },
//                   // NEW: Enable rotation and tilt
//                   rotateControl: true,
//                   rotateControlOptions: {
//                     position: google.maps.ControlPosition.RIGHT_CENTER,
//                   },
//                   tilt: 45, // Default tilt angle, user can change it
//                   // NEW: Ensure the map is draggable and user-controllable
//                   draggable: true,
//                   scrollwheel: true, // Allow scroll to zoom if desired
//                   disableDefaultUI: false, // Keep zoom controls
//                 }}
//                 onLoad={(map) => {
//                   if (directionsRenderer.current) {
//                     directionsRenderer.current.setMap(map);
//                   }
//                 }}
//                 onUnmount={() => {
//                   setDirections(null); // Clear directions state
//                   if (directionsRenderer.current) {
//                     directionsRenderer.current.setMap(null);
//                     directionsRenderer.current = null;
//                   }
//                   if (directionsService.current) {
//                     directionsService.current = null;
//                   }
//                 }}
//               >
//                 {/* Airport Pickup Area Polygon */}
//                 {polygonPaths.length > 0 && (
//                   <Polygon
//                     paths={polygonPaths}
//                     options={{
//                       fillColor: '#10B981',
//                       fillOpacity: 0.2,
//                       strokeColor: '#10B981',
//                       strokeOpacity: 0.8,
//                       strokeWeight: 2,
//                     }}
//                   />
//                 )}

//                 {/* Destination Marker */}
//                 {destinationCoords && (
//                   <Marker
//                     position={{
//                       lat: destinationCoords[1],
//                       lng: destinationCoords[0],
//                     }}
//                     icon={getDestinationIcon()}
//                     title="Destination"
//                     onClick={() => setSelectedMarker("destination")}
//                   />
//                 )}

//                 {/* Driver Marker */}
//                 {driverLocation && (
//                   <Marker
//                     position={{
//                       lat: driverLocation[0],
//                       lng: driverLocation[1],
//                     }}
//                     icon={getDriverIcon()}
//                     title={`Driver: ${driver.name}`}
//                     onClick={() => setSelectedMarker("driver")}
//                   />
//                 )}

//                 {/* InfoWindow for Destination */}
//                 {selectedMarker === "destination" && destinationCoords && (
//                   <InfoWindow
//                     position={{
//                       lat: destinationCoords[1],
//                       lng: destinationCoords[0],
//                     }}
//                     onCloseClick={() => setSelectedMarker(null)}
//                   >
//                     <div className="p-2">
//                       <div className="flex items-center gap-2 mb-2">
//                         <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
//                           <MapPin className="w-4 h-4 text-red-600" />
//                         </div>
//                         <span className="font-bold text-gray-900">Destination</span>
//                       </div>
//                       {routeInfo && (
//                         <div className="text-xs text-gray-600 space-y-1">
//                           <p className="flex items-center gap-1">
//                             <Route className="w-3 h-3" />
//                             {routeInfo.distance} away
//                           </p>
//                           <p className="flex items-center gap-1">
//                             <Clock className="w-3 h-3" />
//                             {routeInfo.duration} remaining
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </InfoWindow>
//                 )}

//                 {/* InfoWindow for Driver */}
//                 {selectedMarker === "driver" && driverLocation && driver && (
//                   <InfoWindow
//                     position={{
//                       lat: driverLocation[0],
//                       lng: driverLocation[1],
//                     }}
//                     onCloseClick={() => setSelectedMarker(null)}
//                   >
//                     <div className="p-2">
//                       <div className="flex items-center gap-2 mb-2">
//                         <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center">
//                           <Car className="w-4 h-4 text-amber-600" />
//                         </div>
//                         <span className="font-bold text-gray-900">{driver.name}</span>
//                       </div>
//                       {routeInfo && (
//                         <div className="text-xs text-gray-600 space-y-1">
//                           <p className="flex items-center gap-1">
//                             <Route className="w-3 h-3" />
//                             {routeInfo.distance} to destination
//                           </p>
//                           <p className="flex items-center gap-1">
//                             <Clock className="w-3 h-3" />
//                             {routeInfo.duration} away
//                           </p>
//                         </div>
//                       )}
//                     </div>
//                   </InfoWindow>
//                 )}

//                 {directionsError && (
//                   <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
//                     {directionsError}
//                   </div>
//                 )}
//               </GoogleMap>
//             ) : (
//               <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//                 <div className="text-center">
//                   <div className="w-12 h-12 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
//                   <p className="text-achrams-text-secondary text-sm">Loading map...</p>
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Driver Info Card - Enhanced with subtle touches */}
//           <div className={`bg-achrams-bg-primary px-6 py-5 border-t border-achrams-border shadow-lg ${isAuthenticated ? 'mb-10': ''}`}>
//             <div className="flex items-center gap-4">
//               <div className="relative">
//                 <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-2xl flex items-center justify-center text-achrams-text-light text-xl font-bold shadow-md ring-4 ring-achrams-primary-solid/10">
//                   {driver.initials || driver.name?.charAt(0) || "D"}
//                 </div>
//                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white shadow-sm"></div>
//               </div>
//               <div className="flex-1">
//                 <div className="font-bold text-achrams-text-primary text-lg">
//                   {driver.name}
//                 </div>
//                 <div className="text-sm text-achrams-text-secondary flex items-center gap-1 mt-0.5">
//                   <Navigation className="w-3.5 h-3.5" />
//                   En route to destination
//                 </div>
//                 {routeInfo && (
//                   <div className="flex items-center gap-3 mt-2 text-xs text-achrams-text-secondary">
//                     <span className="flex items-center gap-1">
//                       <Route className="w-3 h-3" />
//                       {routeInfo.distance}
//                     </span>
//                     <span>•</span>
//                     <span className="flex items-center gap-1">
//                       <Clock className="w-3 h-3" />
//                       {routeInfo.duration}
//                     </span>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//           <ACHRAMFooter />
//         </>
//       )}
//     </div>
//   );
// }
