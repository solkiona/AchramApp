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

  // if (googleMapsLoadError) {
  //   return (
  //     <div className="h-screen bg-achrams-bg-primary flex flex-col">
  //       <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4">
  //         <h1 className="text-xl font-bold">Trip in progress</h1>
  //       </div>
  //       <div className="flex-1 flex items-center justify-center bg-achrams-bg-secondary">
  //         <p className="text-achrams-text-secondary">Error loading map</p>
  //       </div>
  //       <ACHRAMFooter />
  //     </div>
  //   );
  // }

  return (
    <div className="flex-1 bg-achrams-bg-primary flex flex-col">
      {driver && (
        <>
          <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between shadow-md z-10"
          style={{ 
          // Your existing 1rem (py-4) + the phone's safe area height
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: '1rem'
        }}
          >
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
            
            {googleMapsLoadError ? (
              <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary p-6">
                <div className="text-center max-w-xs">
                  <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MapPin className="w-7 h-7 text-red-500" />
                  </div>
                  <p className="font-semibold text-achrams-text-primary mb-1">Map unavailable</p>
                  <p className="text-sm text-achrams-text-secondary">
                    The map failed to load. Your trip is still active — check your connection.
                  </p>
                </div>
              </div>
            ) : isGoogleMapsLoaded ? (
              
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



