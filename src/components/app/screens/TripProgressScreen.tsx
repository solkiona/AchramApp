"use client";

import { Shield, Navigation, MapPin, Car, Clock, Route } from "lucide-react";
import { GoogleMap, Marker, Polygon, InfoWindow } from "@react-google-maps/api";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";

// --- Static Configurations ---
const MAP_OPTIONS: google.maps.MapOptions = {
  styles: [
    { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] }
  ],
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  zoomControl: true,
  draggable: true,
  scrollwheel: true,
};

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
  driverLocation: [number, number] | null;
  setDriverLocation: (val: [number, number] | null) => void;
}

export default function TripProgressScreen({
  driver,
  onPanic,
  onComplete,
  pickupCoords,
  destinationCoords,
  isGoogleMapsLoaded,
  googleMapsLoadError,
  airportPickupArea,
  isAuthenticated,
  driverLocation,
  setDriverLocation,
}: TripProgressScreenProps) {
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // --- Persistence Refs (The "Modal" Pattern) ---
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const userInteractionRef = useRef(false);
  const lastRoutedLocationRef = useRef<[number, number] | null>(null);
  const isFetchingRef = useRef(false);

  // --- 1. Memoized Icons (Prevent Re-renders) ---
  const icons = useMemo(() => ({
    driver: {
      path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
      fillColor: "#F59E0B",
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2.5,
      scale: 2.2,
      anchor: { x: 12, y: 12 } as google.maps.Point,
    },
    destination: {
      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
      fillColor: "#EF4444",
      fillOpacity: 1,
      strokeColor: "#FFFFFF",
      strokeWeight: 2.5,
      scale: 2.2,
      anchor: { x: 12, y: 24 } as google.maps.Point,
    }
  }), []);

  const polygonPaths = useMemo(() => {
    if (!airportPickupArea?.geometry?.coordinates) return [];
    return airportPickupArea.geometry.coordinates[0].map((coord: number[]) => ({
      lat: coord[1], lng: coord[0],
    }));
  }, [airportPickupArea]);

  // Update parent state
  useEffect(() => {
    if (driver?.location) setDriverLocation(driver.location);
  }, [driver, setDriverLocation]);

  // --- 2. Throttled Directions Logic ---
  const fetchDirections = useCallback(async () => {
    if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !map || isFetchingRef.current) return;

    // Smoothness Check: Only re-route if moved > 15m
    if (lastRoutedLocationRef.current) {
      const dist = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lastRoutedLocationRef.current[1], lastRoutedLocationRef.current[0]),
        new google.maps.LatLng(driverLocation[1], driverLocation[0])
      );
      if (dist < 15) return;
    }

    isFetchingRef.current = true;

    if (!directionsServiceRef.current) directionsServiceRef.current = new google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map, suppressMarkers: true, preserveViewport: true,
        polylineOptions: { strokeColor: "#3B82F6", strokeOpacity: 0.8, strokeWeight: 6 }
      });
    }

    try {
      const result = await directionsServiceRef.current.route({
        origin: new google.maps.LatLng(driverLocation[1], driverLocation[0]),
        destination: new google.maps.LatLng(destinationCoords[1], destinationCoords[0]),
        travelMode: google.maps.TravelMode.DRIVING,
      });

      if (result.status === "OK") {
        const leg = result.routes[0].legs[0];
        setRouteInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
        });
        directionsRendererRef.current.setDirections(result);
        lastRoutedLocationRef.current = driverLocation;
      }
    } catch (e) {
      console.error("Routing error:", e);
    } finally {
      isFetchingRef.current = false;
    }
  }, [isGoogleMapsLoaded, driverLocation, destinationCoords, map]);

  useEffect(() => { fetchDirections(); }, [fetchDirections]);

  // --- 3. Optimized Viewport Setup ---
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded || hasUserInteracted) return;

    const bounds = new google.maps.LatLngBounds();
    let hasPoints = false;

    if (driverLocation) { bounds.extend({ lat: driverLocation[1], lng: driverLocation[0] }); hasPoints = true; }
    if (destinationCoords) { bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] }); hasPoints = true; }
    if (polygonPaths.length > 0) { polygonPaths.forEach(p => bounds.extend(p)); hasPoints = true; }

    if (hasPoints) {
      map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
    }
  }, [map, isGoogleMapsLoaded, hasUserInteracted, driverLocation, destinationCoords, polygonPaths]);

  const onUnmount = useCallback(() => {
    if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    setMap(null);
  }, []);

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
          <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between shadow-md z-10">
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
              className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center border-2 border-white hover:scale-105 active:scale-95 transition-all"
            >
              <Shield className="w-6 h-6 text-white" />
            </button>
          </div>

          {routeInfo && (
            <div className="bg-white border-b border-achrams-border px-6 py-3 shadow-sm z-10">
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
            <GoogleMap
              mapContainerStyle={{ width: "100%", height: "100%" }}
              onLoad={setMap}
              onUnmount={onUnmount}
              options={MAP_OPTIONS}
              onDragStart={() => {
                userInteractionRef.current = true;
                setHasUserInteracted(true);
              }}
            >
              {polygonPaths.length > 0 && (
                <Polygon
                  paths={polygonPaths}
                  options={{ fillColor: '#10B981', fillOpacity: 0.15, strokeColor: '#10B981', strokeWeight: 2 }}
                />
              )}

              {destinationCoords && (
                <Marker
                  position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
                  icon={icons.destination}
                  onClick={() => setSelectedMarker("destination")}
                />
              )}

              {driverLocation && (
                <Marker
                  position={{ lat: driverLocation[1], lng: driverLocation[0] }}
                  icon={icons.driver}
                  onClick={() => setSelectedMarker("driver")}
                  zIndex={100}
                />
              )}

              {selectedMarker === "destination" && destinationCoords && (
                <InfoWindow position={{ lat: destinationCoords[1], lng: destinationCoords[0] }} onCloseClick={() => setSelectedMarker(null)}>
                  <div className="p-2 min-w-[120px]">
                    <p className="font-bold text-sm mb-1">Destination</p>
                    <p className="text-xs text-gray-600">{routeInfo?.distance} remaining</p>
                  </div>
                </InfoWindow>
              )}

              {selectedMarker === "driver" && driverLocation && (
                <InfoWindow position={{ lat: driverLocation[1], lng: driverLocation[0] }} onCloseClick={() => setSelectedMarker(null)}>
                  <div className="p-2 min-w-[120px]">
                    <p className="font-bold text-sm mb-1">{driver.name}</p>
                    <p className="text-xs text-gray-600">Heading to destination</p>
                  </div>
                </InfoWindow>
              )}
            </GoogleMap>
          </div>

          <div className={`bg-achrams-bg-primary px-6 py-5 border-t border-achrams-border shadow-lg ${isAuthenticated ? 'mb-10': ''}`}>
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-2xl flex items-center justify-center text-achrams-text-light text-xl font-bold shadow-md ring-4 ring-achrams-primary-solid/10">
                  {driver.initials || driver.name?.charAt(0) || "D"}
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-3 border-white"></div>
              </div>
              <div className="flex-1">
                <div className="font-bold text-achrams-text-primary text-lg">{driver.name}</div>
                <div className="text-sm text-achrams-text-secondary flex items-center gap-1 mt-0.5">
                  <Navigation className="w-3.5 h-3.5" />
                  En route to destination
                </div>
                {routeInfo && (
                  <div className="flex items-center gap-3 mt-2 text-xs text-achrams-text-secondary">
                    <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {routeInfo.distance}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {routeInfo.duration}</span>
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
// import { GoogleMap, Marker, DirectionsRenderer, Polygon } from "@react-google-maps/api"; // Use DirectionsRenderer
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
//   driverLocation: [number, number] | null;
//   setDriverLocation: (val: [number, number] | null) => void;
// }

// const mapStyles = [
//   {
//     featureType: "poi.business",
//     elementType: "labels",
//     stylers: [{ visibility: "off" }]
//   }
// ];



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
//   driverLocation,
//   setDriverLocation,
// }: TripProgressScreenProps) {
//   // ✅ Store route info as state
//   const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
//   const [selectedMarker, setSelectedMarker] = useState<string | null>(null);
//   const [map, setMap] = useState<google.maps.Map | null>(null);

//   // ✅ Track user interaction
//   const [hasUserInteracted, setHasUserInteracted] = useState(false);
//   const userInteractionRef = useRef(false);

//   // ✅ Refs for Directions Service and Renderer
//   const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
//   const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);


//   const getDriverIcon = useCallback(
//   () => ({
//     path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
//     fillColor: "#F59E0B",
//     fillOpacity: 1,
//     strokeColor: "#FFFFFF",
//     strokeWeight: 2.5,
//     scale: 2.2,
//     anchor: { x: 12, y: 12 } as google.maps.Point,
//   }),
//   []
// );

// const getDestinationIcon = useCallback(
//   () => ({
//     path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
//     fillColor: "#EF4444",
//     fillOpacity: 1,
//     strokeColor: "#FFFFFF",
//     strokeWeight: 2.5,
//     scale: 2.2,
//     anchor: { x: 12, y: 24 } as google.maps.Point,
//   }),
//   []
// );

//   const getPolygonPaths = useCallback((): google.maps.LatLngLiteral[] => {
//     if (!airportPickupArea?.geometry?.coordinates) return [];
//     const coordinates = airportPickupArea.geometry.coordinates[0];
//     return coordinates.map((coord: number[]) => ({
//       lat: coord[1],
//       lng: coord[0],
//     }));
//   }, [airportPickupArea]);

//   const polygonPaths = getPolygonPaths();

//   useEffect(() => {
//     if (driver?.location) {
//       setDriverLocation(driver.location); // Persist driver location in parent state
//     }
//   }, [driver, setDriverLocation]);

//   // ✅ Effect to listen for user interactions
//   useEffect(() => {
//     if (!map || hasUserInteracted) return;

//     const handleMapInteraction = () => {
//       if (!userInteractionRef.current) {
//         console.log('User interacted with map - disabling auto-center/zoom');
//         userInteractionRef.current = true;
//         setHasUserInteracted(true);
//       }
//     };

//     const centerListener = map.addListener('center_changed', handleMapInteraction);
//     const zoomListener = map.addListener('zoom_changed', handleMapInteraction);
//     const dragListener = map.addListener('dragstart', handleMapInteraction);

//     return () => {
//       if (centerListener) centerListener.remove();
//       if (zoomListener) zoomListener.remove();
//       if (dragListener) dragListener.remove();
//     };
//   }, [map, hasUserInteracted]);

//   // ✅ FIX: Fetch directions and use DirectionsRenderer
//   useEffect(() => {
//     if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !window.google?.maps || !map) {
//       return;
//     }

//     // Ensure DirectionsRenderer exists
//     if (!directionsRendererRef.current) {
//       directionsRendererRef.current = new google.maps.DirectionsRenderer({
//         suppressMarkers: true,
//         suppressInfoWindows: true,
//         polylineOptions: {
//           strokeColor: "#3B82F6",
//           strokeOpacity: 0.8,
//           strokeWeight: 6,
//         },
//       });
//     }

//     // Attach the renderer to the current map instance
//     directionsRendererRef.current.setMap(map);

//     // Ensure DirectionsService exists
//     if (!directionsServiceRef.current) {
//       directionsServiceRef.current = new google.maps.DirectionsService();
//     }

//     const origin = new google.maps.LatLng(driverLocation[1], driverLocation[0]);
//     const destination = new google.maps.LatLng(destinationCoords[1], destinationCoords[0]);

//     const request: google.maps.DirectionsRequest = {
//       origin: origin,
//       destination: destination,
//       travelMode: google.maps.TravelMode.DRIVING,
//     };

//     directionsServiceRef.current.route(request, (result, status) => {
//       if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
//         const route = result.routes[0];
//         const leg = route.legs[0];

//         setRouteInfo({
//           distance: leg.distance?.text || "N/A",
//           duration: leg.duration?.text || "N/A",
//         });

//         // ✅ SET the new directions using the renderer - this replaces the old route
//         directionsRendererRef.current?.setDirections(result);
//         console.log('Route fetched and rendered via DirectionsRenderer:', route.overview_path.length, 'points');
//       } else {
//         console.warn("Directions request failed:", status);
//         setRouteInfo(null);
//         // ✅ Clear the route from the renderer if request fails
//         directionsRendererRef.current?.setMap(null);
//         directionsRendererRef.current?.setMap(map); // Reattach to map
//       }
//     });

//     // Cleanup: Remove renderer from map when dependencies change
//     return () => {
//         if (directionsRendererRef.current) {
//             directionsRendererRef.current.setMap(null); // Detach from map
//         }
//     };

//   }, [driverLocation, destinationCoords, isGoogleMapsLoaded, map]); // Depend on map so it can attach/detach correctly


//   // ✅ Effect for fitBounds (runs only once or when user hasn't interacted and map/coords change)
//   useEffect(() => {
//     if (!map || !isGoogleMapsLoaded || hasUserInteracted) {
//       return;
//     }

//     const bounds = new google.maps.LatLngBounds();
//     let hasPoints = false;

//     if (driverLocation) {
//       bounds.extend({ lat: driverLocation[1], lng: driverLocation[0] });
//       hasPoints = true;
//     }
//     if (destinationCoords) {
//       bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
//       hasPoints = true;
//     }
//     if (pickupCoords) {
//       bounds.extend({ lat: pickupCoords[1], lng: pickupCoords[0] });
//       hasPoints = true;
//     }
//     if (polygonPaths.length > 0) {
//       polygonPaths.forEach(point => bounds.extend(point));
//       hasPoints = true;
//     }

//     if (hasPoints) {
//       console.log('Auto-fitting map bounds (initial view)');
//       map.fitBounds(bounds, { top: 100, right: 50, bottom: 150, left: 50 });
//     }
//   }, [map, driverLocation, destinationCoords, pickupCoords, polygonPaths, isGoogleMapsLoaded, hasUserInteracted]);

//   const onLoad = useCallback((map: google.maps.Map) => {
//     setMap(map);
//     // ✅ Attach renderer to the map instance once it loads
//     if (directionsRendererRef.current) {
//         directionsRendererRef.current.setMap(map);
//     }
//   }, []);

//   const onUnmount = useCallback(() => {
//     setMap(null);
//     setHasUserInteracted(false);
//     userInteractionRef.current = false;
//     // ✅ Clean up directions renderer
//     if (directionsRendererRef.current) {
//         directionsRendererRef.current.setMap(null);
//         directionsRendererRef.current = null;
//     }
//     if (directionsServiceRef.current) {
//         directionsServiceRef.current = null;
//     }
//   }, []);

//   // Determine initial center only if user hasn't interacted
//   const initialMapCenter = !hasUserInteracted ? (
//     driverLocation
//       ? { lat: driverLocation[1], lng: driverLocation[0] }
//       : destinationCoords
//       ? { lat: destinationCoords[1], lng: destinationCoords[0] }
//       : { lat: 6.5244, lng: 3.3792 }
//   ) : undefined;

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

//           <div className="flex-1 relative">
//             {isGoogleMapsLoaded ? (
//               <GoogleMap
//                 mapContainerStyle={{ width: "100%", height: "100%" }}
//                 center={hasUserInteracted ? undefined : initialMapCenter}
//                 zoom={hasUserInteracted ? undefined : 14}
//                 onLoad={onLoad}
//                 onUnmount={onUnmount}
//                 options={{
//                   styles: mapStyles,
//                   streetViewControl: false,
//                   mapTypeControl: false,
//                   fullscreenControl: false,
//                   zoomControl: true,
//                   zoomControlOptions: {
//                     position: google.maps.ControlPosition.RIGHT_CENTER,
//                   },
//                   draggable: true,
//                   scrollwheel: true,
//                   disableDefaultUI: false,
//                 }}
//               >
//                 {/* ✅ Polygon */}
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

//                 {/* ✅ Destination Marker */}
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

//                 {/* ✅ Driver Marker */}
//                 {driverLocation && (
//                   <Marker
//                     position={{
//                       lat: driverLocation[1],
//                       lng: driverLocation[0],
//                     }}
//                     icon={getDriverIcon()}
//                     title={`Driver: ${driver.name}`}
//                     onClick={() => setSelectedMarker("driver")}
//                   />
//                 )}

//                 {/* ✅ InfoWindow for Destination */}
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

//                 {selectedMarker === "driver" && driverLocation && driver && (
//                   <InfoWindow
//                     position={{
//                       lat: driverLocation[1],
//                       lng: driverLocation[0],
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



