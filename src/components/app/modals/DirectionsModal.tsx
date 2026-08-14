import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { X, Navigation, MapPin, Car, User, Route, Clock, Crosshair } from 'lucide-react';
import { GoogleMap, Marker, Polygon } from '@react-google-maps/api';

// --- 1. Static Configurations (Prevent Re-allocations) ---
const MAP_OPTIONS: google.maps.MapOptions = {
  styles: [
    { featureType: "poi.business", elementType: "labels", stylers: [{ visibility: "off" }] },
    { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] }
  ],
  disableDefaultUI: true,
  zoomControl: false, // Custom UI is lighter
  gestureHandling: 'greedy',
  tilt: 0,
};

const mapContainerStyle = { width: '100%', height: '100%' };

const createIcon = (color: string): google.maps.Symbol => ({
  path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
  fillColor: color,
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2,
  scale: 2.2,
  anchor: { x: 12, y: 24 } as google.maps.Point,
});


export default function DirectionsModal({
  isOpen, onClose, pickup, destination, destinationCoords,
  driverLocation, passengerLocation, airportPickupArea,
  isGoogleMapsLoaded, googleMapsLoadError
}: any) {
  
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isDriverInPickupArea, setIsDriverInPickupArea] = useState(false);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [showRecenter, setShowRecenter] = useState(false);

  // Refs for persistent instances
  const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(null);
  const lastRoutedLocationRef = useRef<[number, number] | null>(null);
  const isFetchingRef = useRef(false);
  const initialFitDoneRef = useRef(false);
  const userInteractionRef = useRef(false);

  //  const debug = useCallback(()=>{
  //   alert(`{driver location, passenger location} ${driverLocation}, ${passengerLocation}`)
  //  }, [])

  //  useEffect(()=>{
  //   debug();
  //  }, [driverLocation])

  // --- 2. Memoized Static Assets ---
  // const icons = useMemo(() => ({
  //   passenger: createIcon("#4F46E5"),
  //   driverEnRoute: createIcon("#F59E0B"),
  //   driverArrived: createIcon("#10B981"),
  //   destination: createIcon("#EF4444")
  // }), []);

  const icons = useMemo(() => {
  const passenger = createIcon("#4F46E5");
  const destination = createIcon("#EF4444");

  // ✅ Driver icon as a Symbol (not SVG URL)
  const driverEnRoute: google.maps.Symbol = {
    path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
    fillColor: "#F59E0B",
    fillOpacity: 1,
    strokeColor: "#FFFFFF",
    strokeWeight: 2,
    scale: 1.8,
    anchor: { x: 12, y: 12 } as google.maps.Point,
  };

  const driverArrived: google.maps.Symbol = {
    ...driverEnRoute,
    fillColor: "#10B981",
  };

  return { passenger, driverEnRoute, driverArrived, destination };
}, []);


  const polygonPaths = useMemo(() => {
    if (!airportPickupArea?.geometry?.coordinates) return [];

    return airportPickupArea.geometry.coordinates[0].map((coord: number[]) => ({
      lat: coord[1], lng: coord[0],
    }));
  }, [airportPickupArea]);


  useEffect(() => {
  if (!driverLocation || !airportPickupArea?.geometry?.coordinates || !isGoogleMapsLoaded) {
    setIsDriverInPickupArea(false);
    return;
  }

  try {
    // Extract polygon paths (same as your existing logic)
    const coordinates = airportPickupArea.geometry.coordinates[0];
    const polygonPaths = coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));

    // Create polygon and driver point
    const polygon = new google.maps.Polygon({ paths: polygonPaths });
    const driverPoint = new google.maps.LatLng(driverLocation[1], driverLocation[0]);

    // Check containment
    const isInside = google.maps.geometry.poly.containsLocation(driverPoint, polygon);
    setIsDriverInPickupArea(isInside);
  } catch (error) {
    console.error("Error checking driver in pickup area:", error);
    setIsDriverInPickupArea(false);
  }
}, [driverLocation, airportPickupArea, isGoogleMapsLoaded]);



  // --- 3. Recenter Logic ---
  const handleRecenter = useCallback(() => {
    if (!map || !passengerLocation) return;
    map.panTo({ lat: passengerLocation[0], lng: passengerLocation[1] });
    map.setZoom(17);
    setShowRecenter(false);
    userInteractionRef.current = false;
  }, [map, passengerLocation]);

  // --- 4. Directions Logic (Optimized for Web Vitals) ---
  const fetchDirections = useCallback(async () => {
    if (!isGoogleMapsLoaded || !passengerLocation || !airportPickupArea || !map || isFetchingRef.current) return;

    // Only update if moved > 15m to save API quota and CPU
    if (lastRoutedLocationRef.current) {
      const dist = google.maps.geometry.spherical.computeDistanceBetween(
        new google.maps.LatLng(lastRoutedLocationRef.current[0], lastRoutedLocationRef.current[1]),
        new google.maps.LatLng(passengerLocation[0], passengerLocation[1])
      );
      if (dist < 15) return;
    }

    isFetchingRef.current = true;
    if (!directionsServiceRef.current) directionsServiceRef.current = new google.maps.DirectionsService();
    if (!directionsRendererRef.current) {
      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map, suppressMarkers: true, preserveViewport: true,
        polylineOptions: { strokeColor: "#059669", strokeOpacity: 0.7, strokeWeight: 5 }
      });
    }

    const coords = airportPickupArea.geometry.coordinates[0];
    let lat = 0, lng = 0;
    coords.forEach((c: number[]) => { lng += c[0]; lat += c[1]; });
    const centroid = { lat: lat / coords.length, lng: lng / coords.length };

    try {
      const result = await directionsServiceRef.current.route({
        origin: new google.maps.LatLng(passengerLocation[0], passengerLocation[1]),
        destination: new google.maps.LatLng(centroid.lat, centroid.lng),
        travelMode: google.maps.TravelMode.WALKING,
      });

      if (result.status === "OK") {
        setRouteInfo({
          distance: result.routes[0].legs[0].distance?.text || "",
          duration: result.routes[0].legs[0].duration?.text || "",
        });
        directionsRendererRef.current.setDirections(result);
        lastRoutedLocationRef.current = passengerLocation;
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, [isGoogleMapsLoaded, passengerLocation, airportPickupArea, map]);

  useEffect(() => { if (isOpen) fetchDirections(); }, [fetchDirections, isOpen]);

  // --- 5. Initial Viewport Setup ---
  useEffect(() => {
    if (!map || !isGoogleMapsLoaded || initialFitDoneRef.current || userInteractionRef.current) return;
    const bounds = new google.maps.LatLngBounds();
    if (passengerLocation) bounds.extend({ lat: passengerLocation[0], lng: passengerLocation[1] });
    polygonPaths.forEach(p => bounds.extend(p));
    map.fitBounds(bounds, { top: 120, bottom: 150, left: 60, right: 60 });
    initialFitDoneRef.current = true;
  }, [map, isGoogleMapsLoaded, passengerLocation, polygonPaths]);

  // Clean up on unmount to prevent memory leaks
  const onUnmount = useCallback(() => {
    setMap(null);
    if (directionsRendererRef.current) directionsRendererRef.current.setMap(null);
    // directionsRendererRef.current = null;
    console.log("Map unmounted - Resources cleared.");
  }, []);

  useEffect(() => {
  if (isOpen && map) {
    // 1. Force Google Maps to recalculate its container size
    google.maps.event.trigger(map, 'resize');

    // 2. Re-fit the bounds so the user sees the whole route immediately
    const bounds = new google.maps.LatLngBounds();
    if (passengerLocation) bounds.extend({ lat: passengerLocation[0], lng: passengerLocation[1] });
    if (destinationCoords) bounds.extend({ lat: destinationCoords[1], lng: destinationCoords[0] });
    polygonPaths.forEach(p => bounds.extend(p));

    map.fitBounds(bounds, { top: 80, bottom: 100, left: 40, right: 40 });
    
    // 3. Reset the interaction flag so the "Recenter" button disappears until they move it again
    userInteractionRef.current = false;
    setShowRecenter(false);
  }
}, [isOpen, map]); // Triggers every time the modal slides up


  return (
    <div className={`fixed inset-0 bg-white z-[60] flex flex-col overflow-hidden animate-in fade-in transition-transform duration-500 ease-in-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}>
      {/* HEADER: Decoupled from Map for performance */}
      <div className="bg-achrams-primary-solid text-white p-4 sm:p-5 py-6 flex justify-between items-center shadow-xl z-20"
      
      style={{ 
          // Your existing 1rem (py-4) + the phone's safe area height
          paddingTop: 'calc(env(safe-area-inset-top) + 1rem)',
          paddingBottom: '1rem'
        }}
      >
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-9 h-9 sm:w-10 sm:h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Navigation size={20} className="sm:size-22" />
          </div>
          <div>
            <h2 className="text-sm font-bold tracking-tight">Active Navigation</h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full animate-ping" />
              <p className="text-[9px] sm:text-[10px] text-white/90 uppercase font-semibold">Live GPS Active</p>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-white/10  sm:rounded-xl transition-colors"><X size={18} className="" /></button>
      </div>

      <div className="flex-1 relative bg-slate-100">
        {/* STATS OVERLAY */}
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
                              <p className="text-xs text-achrams-text-secondary font-medium">Walking ETA</p>
                              <p className="text-sm font-bold text-achrams-text-primary">{routeInfo.duration}</p>
                            </div>
                          </div>
                        </div>
                      </div>
          // <div className="absolute top-5 sm:top-6 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md shadow-lg rounded-xl sm:rounded-2xl px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-4 sm:gap-6 border border-achrams-border/30">
          //   <div className="flex flex-col">
          //     <span className="text-[8px] sm:text-[9px] font-bold text-achrams-text-secondary uppercase">Distance</span>
          //     <span className="text-sm font-black text-achrams-text-primary">{routeInfo.distance}</span>
          //   </div>
          //   <div className="w-px h-6 sm:h-8 bg-achrams-border/30" />
          //   <div className="flex flex-col">
          //     <span className="text-[8px] sm:text-[9px] font-bold text-achrams-text-secondary uppercase">Walking ETA</span>
          //     <span className="text-sm font-black text-achrams-text-primary">{routeInfo.duration}</span>
          //   </div>
          // </div>
        )}


        {
          googleMapsLoadError ? (

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
          ): isGoogleMapsLoaded ? (

                <GoogleMap
              mapContainerStyle={mapContainerStyle}
              onLoad={setMap}
              onUnmount={onUnmount}
              options={MAP_OPTIONS}
              onDragStart={() => {
                userInteractionRef.current = true;
                setShowRecenter(true);
              }}
            >
              {passengerLocation && (
                <Marker 
                  position={{ lat: passengerLocation[0], lng: passengerLocation[1] }} 
                  icon={icons.passenger} 
                  zIndex={100}
                />
              )}

              {driverLocation && (
                <Marker 
                  position={{ lat: driverLocation[1], lng: driverLocation[0] }}
                  // position={{lat:4.8502933, lng: 7.0367293}} 
                  icon={isDriverInPickupArea ? icons.driverArrived : icons.driverEnRoute}
                  zIndex={90}
                />
              )}

              {destinationCoords && (
                <Marker 
                  position={{ lat: destinationCoords[1], lng: destinationCoords[0] }} 
                  icon={icons.destination} 
                />
              )}

              <Polygon
                paths={polygonPaths}
                options={{ fillColor: '#059669', fillOpacity: 0.12, strokeColor: '#059669', strokeWeight: 2, clickable: false }}
              />
            </GoogleMap>
          ) : (

            <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-achrams-text-secondary text-sm">Loading map...</p>
            </div>
          </div>
          
          )
        }

        



        {/* RECENTER BUTTON */}
        {showRecenter && (
          <button 
            onClick={handleRecenter}
            className="absolute bottom-24 sm:bottom-28 right-4 sm:right-6 z-30 bg-white p-2.5 sm:p-3 rounded-full shadow-lg border border-achrams-border/20 text-achrams-primary-solid hover:scale-105 active:scale-95 transition-all"
            aria-label="Recenter map"
          >
            <Crosshair size={20} className="" />
          </button>
        )}

        {/* LEGEND */}
        <div className="absolute bottom-6 left-4 sm:left-6 z-20 bg-white/90 backdrop-blur-md p-3.5 sm:p-5 rounded-xl sm:rounded-2xl shadow-lg border border-achrams-border/20 space-y-2.5">
          <h4 className="text-[9px] sm:text-[10px] font-bold text-achrams-text-secondary uppercase tracking-wider">Legend</h4>
          <div className="flex items-center gap-2.5">
            <MapPin className="text-indigo-600" size={14} />
            <span className="text-xs font-medium text-achrams-text-primary">You</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Car 
              className={`${isDriverInPickupArea ? 'text-emerald-600' : 'text-amber-500'}`}
              size={14}
            />
            <span className="text-xs font-medium text-achrams-text-primary">Driver</span>
          </div>
        </div>
      </div>
    </div>
  );
}





