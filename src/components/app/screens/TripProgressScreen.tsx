// src/components/app/screens/TripProgressScreen.tsx
"use client";

import { Shield, Navigation, MapPin, Car, Clock, Route } from "lucide-react";
import { GoogleMap, Marker, DirectionsRenderer, Polygon } from "@react-google-maps/api";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
import { useEffect, useState, useRef } from "react";
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

// Clean map styles - subtle enhancement
const mapStyles = [
  {
    featureType: "poi.business",
    elementType: "labels",
    stylers: [{ visibility: "off" }]
  }
];

// Enhanced driver marker with brand colors - using object literal (no google dependency)
const getDriverIcon = () => ({
  path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z",
  fillColor: "#F59E0B",
  fillOpacity: 1,
  strokeColor: "#FFFFFF",
  strokeWeight: 2.5,
  scale: 2.2,
  anchor: { x: 12, y: 12 } as google.maps.Point,
});

// Enhanced destination marker - using object literal (no google dependency)
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
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  const directionsService = useRef<google.maps.DirectionsService | null>(null);
  const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

  const getPolygonPaths = (): google.maps.LatLngLiteral[] => {
    if (!airportPickupArea?.geometry?.coordinates) return [];
    const coordinates = airportPickupArea.geometry.coordinates[0];
    return coordinates.map((coord: number[]) => ({
      lat: coord[1],
      lng: coord[0],
    }));
  };

  const polygonPaths = getPolygonPaths();

  // Fetch directions when driver location or destination changes
  useEffect(() => {
    if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !window.google?.maps) {
      setDirections(null);
      setRouteInfo(null);
      setDirectionsError(null);
      return;
    }

    const origin = new google.maps.LatLng(driverLocation[0], driverLocation[1]);
    const destination = new google.maps.LatLng(destinationCoords[1], destinationCoords[0]);

    if (!directionsService.current) {
      directionsService.current = new google.maps.DirectionsService();
    }
    if (!directionsRenderer.current) {
      directionsRenderer.current = new google.maps.DirectionsRenderer({
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
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING,
    };

    directionsService.current.route(request, (result, status) => {
      if (status === google.maps.DirectionsStatus.OK && result && result.routes.length > 0) {
        const route = result.routes[0];
        const leg = route.legs[0];

        setRouteInfo({
          distance: leg.distance?.text || "N/A",
          duration: leg.duration?.text || "N/A",
        });

        setDirections(result);
        if (directionsRenderer.current && window.google?.maps) {
          directionsRenderer.current.setDirections(result);
        }
        setDirectionsError(null);
      } else {
        console.warn("Directions request failed:", status, result);
        setDirections(null);
        setRouteInfo(null);
        setDirectionsError("Could not load route details");
        if (directionsRenderer.current) {
          directionsRenderer.current.setMap(null);
        }
      }
    });
  }, [driverLocation, destinationCoords, isGoogleMapsLoaded]);

  const mapCenter = driverLocation
    ? { lat: driverLocation[0], lng: driverLocation[1] }
    : destinationCoords
    ? { lat: destinationCoords[1], lng: destinationCoords[0] }
    : { lat: 6.5244, lng: 3.3792 };

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
          {/* Header with brand colors - subtle enhancement */}
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

          {/* Stats Bar - Enhanced layout */}
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

          {/* Map Container */}
          <div className="flex-1 relative">
            {isGoogleMapsLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={14}
                options={{
                  styles: mapStyles,
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                  zoomControl: true,
                  zoomControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_CENTER,
                  },
                }}
                onLoad={(map) => {
                  if (directionsRenderer.current) {
                    directionsRenderer.current.setMap(map);
                  }
                }}
                onUnmount={() => {
                  if (directionsRenderer.current) {
                    directionsRenderer.current.setMap(null);
                    directionsRenderer.current = null;
                  }
                  if (directionsService.current) {
                    directionsService.current = null;
                  }
                }}
              >
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

                {/* Destination Marker */}
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

                {/* Driver Marker */}
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

                {/* InfoWindow for Destination */}
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

                {/* InfoWindow for Driver */}
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

                {directionsError && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg text-sm">
                    {directionsError}
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
          </div>

          {/* Driver Info Card - Enhanced with subtle touches */}
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

// import { Shield, Navigation, MapPin, Car } from "lucide-react";
// import { GoogleMap, Marker, DirectionsService, DirectionsRenderer, Polygon } from "@react-google-maps/api";
// import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
// import { useEffect, useState, useRef } from "react";
// import { InfoWindow } from "@react-google-maps/api";

// interface Driver {
//   name: string;
//   initials?: string;
//   location?: [number, number] | null; // [lat, lng]
// }

// interface TripProgressScreenProps {
//   driver: Driver | null;
//   onPanic: () => void;
//   onComplete: () => void;
//   pickupCoords: [number, number] | null; // [lat, lng] - Still needed as origin for route calculation if driver is at pickup
//   destinationCoords: [number, number] | null; // [lat, lng]
//   isGoogleMapsLoaded: boolean;
//   googleMapsLoadError?: any;
//   // NEW: Prop for the airport pickup area polygon
//   airportPickupArea?: any; // GeoJSON-like structure
// }

// // NEW: Custom icon for the driver
// const driverIcon = {
//   path: "M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.22.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z", // Path for a car icon
//   fillColor: "#F59E0B", // Amber
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// };

// // NEW: Custom icon for destination
// const destinationIcon = {
//   path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z", // Person icon
//   fillColor: "#EF4444", // Red
//   fillOpacity: 1,
//   strokeColor: "#FFFFFF",
//   strokeWeight: 2,
//   scale: 2,
// };

// export default function TripProgressScreen({
//   driver,
//   onPanic,
//   onComplete,
//   pickupCoords,
//   destinationCoords,
//   isGoogleMapsLoaded,
//   googleMapsLoadError,
//   airportPickupArea, // NEW: Destructure the pickup area prop
// }: TripProgressScreenProps) {
//   const driverLocation = driver?.location || null;

//   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
//   const [directionsError, setDirectionsError] = useState<string | null>(null);
//   const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
//   const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

//   const directionsService = useRef<google.maps.DirectionsService | null>(null);
//   const directionsRenderer = useRef<google.maps.DirectionsRenderer | null>(null);

//   // Convert GeoJSON coordinates to Google Maps LatLng format
//   const getPolygonPaths = (): google.maps.LatLngLiteral[] => {
//     if (!airportPickupArea?.geometry?.coordinates) return [];

//     const coordinates = airportPickupArea.geometry.coordinates[0]; // First ring of polygon
//     return coordinates.map((coord: number[]) => ({
//       lat: coord[1], // GeoJSON is [lng, lat], Google Maps is {lat, lng}
//       lng: coord[0],
//     }));
//   };

//   const polygonPaths = getPolygonPaths();

//   // Fetch directions when driver location or destination changes
//   useEffect(() => {
//     if (!isGoogleMapsLoaded || !destinationCoords || !driverLocation || !window.google?.maps) {
//       setDirections(null);
//       setRouteInfo(null);
//       setDirectionsError(null);
//       return;
//     }

//     // Determine the origin for the route:
//     // Use the driver's current location as the origin for the route calculation
//     const origin = new google.maps.LatLng(driverLocation[1], driverLocation[0]); // [lat, lng]
//     const destination = new google.maps.LatLng(destinationCoords[1], destinationCoords[0]);

//     if (!directionsService.current) {
//       directionsService.current = new google.maps.DirectionsService();
//     }
//     if (!directionsRenderer.current) {
//       directionsRenderer.current = new google.maps.DirectionsRenderer({
//         suppressMarkers: true, // We render our own
//         suppressInfoWindows: true, // We handle our own
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
//         const leg = route.legs[0]; // Assuming single leg

//         setRouteInfo({
//           distance: leg.distance?.text || "N/A",
//           duration: leg.duration?.text || "N/A",
//         });

//         setDirections(result);
//         // Update the renderer if map is available
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
//           directionsRenderer.current.setMap(null); // Clear old route if any
//         }
//       }
//     });
//   }, [driverLocation, destinationCoords, isGoogleMapsLoaded]);

//   // Determine map center: prioritize real driver, then destination, then default
//   const mapCenter = driverLocation
//     ? { lat: driverLocation[1], lng: driverLocation[0] } // [lat, lng]
//     : destinationCoords
//     ? { lat: destinationCoords[1], lng: destinationCoords[0] } // [lat, lng]
//     : { lat: 6.5244, lng: 3.3792 };

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
//     <div className="h-screen bg-achrams-bg-primary flex flex-col">
//       {driver && (
//         <>
//           <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//             <h1 className="text-xl font-bold flex items-center gap-2">
//               <Navigation className="w-5 h-5" /> Trip in progress
//             </h1>
//             <button
//               onClick={onPanic}
//               className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center border border-white hover:from-red-600 hover:to-red-800 active:scale-95 hover:scale-[1.05] transition-all duration-200 ease-in-out"
//             >
//               <Shield className="w-6 h-6 text-white" />
//             </button>
//           </div>

//           {/* NEW: Distance & Duration Info Bar */}
//           {routeInfo && (
//             <div className="bg-achrams-bg-secondary border-b border-achrams-border px-4 py-2 text-sm flex items-center justify-between">
//               <div className="flex items-center gap-1">
//                 <MapPin className="w-4 h-4 text-achrams-secondary-solid" />
//                 <span className="font-medium">{routeInfo.distance}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <span className="text-achrams-text-secondary">ETA:</span>
//                 <span className="font-medium">{routeInfo.duration}</span>
//               </div>
//             </div>
//           )}

//           <div className="flex-1 relative">
//             {isGoogleMapsLoaded ? (
//               <GoogleMap
//                 mapContainerStyle={{ width: "100%", height: "100%" }}
//                 center={mapCenter}
//                 zoom={14}
//                 options={{
//                   streetViewControl: false,
//                   mapTypeControl: false,
//                   fullscreenControl: false,
//                 }}
//                 onLoad={(map) => {
//                   // Set the renderer's map after the map loads
//                   if (directionsRenderer.current) {
//                     directionsRenderer.current.setMap(map);
//                   }
//                 }}
//                 onUnmount={() => {
//                   // Clean up renderer
//                   if (directionsRenderer.current) {
//                     directionsRenderer.current.setMap(null);
//                     directionsRenderer.current = null;
//                   }
//                   if (directionsService.current) {
//                     directionsService.current = null; // No cleanup method needed on service itself
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
//                       lat: destinationCoords[1], // [lat, lng]
//                       lng: destinationCoords[0],
//                     }}
//                     icon={destinationIcon}
//                     title="Destination"
//                     onClick={() => setSelectedMarker("destination")}
//                   />
//                 )}

//                 {/* Driver Marker */}
//                 {driverLocation && (
//                   <Marker
//                     position={{
//                       lat: driverLocation[1], // [lat, lng]
//                       lng: driverLocation[0],
//                     }}
//                     icon={driverIcon}
//                     title={`Driver: ${driver.name}`}
//                     onClick={() => setSelectedMarker("driver")}
//                   />
//                 )}

//                 {/* InfoWindow for Destination */}
//                 {selectedMarker === "destination" && destinationCoords && (
//                   <InfoWindow
//                     position={{
//                       lat: destinationCoords[1], // [lat, lng]
//                       lng: destinationCoords[0],
//                     }}
//                     onCloseClick={() => setSelectedMarker(null)}
//                   >
//                     <div className="font-medium text-gray-800">
//                       <div className="flex items-center gap-1 mb-1">
//                         <MapPin className="w-4 h-4 text-achrams-secondary-solid" />
//                         <span>Destination</span>
//                       </div>
//                       <p className="text-xs text-achrams-text-secondary">{destinationCoords.join(', ')}</p>
//                     </div>
//                   </InfoWindow>
//                 )}

//                 {/* InfoWindow for Driver */}
//                 {selectedMarker === "driver" && driverLocation && driver && (
//                   <InfoWindow
//                     position={{
//                       lat: driverLocation[1], // [lat, lng]
//                       lng: driverLocation[0],
//                     }}
//                     onCloseClick={() => setSelectedMarker(null)}
//                   >
//                     <div className="font-medium text-gray-800">
//                       <div className="flex items-center gap-1 mb-1">
//                         <Car className="w-4 h-4" style={{ color: '#F59E0B' }} />
//                         <span>Driver</span>
//                       </div>
//                       <p className="text-xs text-achrams-text-secondary">{driver.name}</p>
//                       {routeInfo && (
//                         <div className="mt-1 text-xs">
//                           <p>Distance: {routeInfo.distance}</p>
//                           <p>ETA: {routeInfo.duration}</p>
//                         </div>
//                       )}
//                     </div>
//                   </InfoWindow>
//                 )}

//                 {/* Optional: Show error if route fails */}
//                 {directionsError && (
//                   <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm">
//                     {directionsError}
//                   </div>
//                 )}
//               </GoogleMap>
//             ) : (
//               <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//                 <p className="text-achrams-text-secondary">Loading map...</p>
//               </div>
//             )}
//           </div>

//           <div className="bg-achrams-bg-primary px-6 py-6 border-t border-achrams-border">
//             <div className="flex items-center gap-4 mb-4">
//               <div className="w-14 h-14 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-lg font-bold">
//                 {driver.initials || driver.name?.charAt(0) || "D"}
//               </div>
//               <div>
//                 <div className="font-bold text-achrams-text-primary">
//                   {driver.name}
//                 </div>
//                 <div className="text-sm text-achrams-text-secondary">
//                   En route to{" "}
//                   {destinationCoords ? "your destination" : "unknown"}
//                 </div>
//                 {/* NEW: Show ETA/Dist on info bar if not shown above */}
//                 {routeInfo && (
//                   <div className="text-xs text-achrams-text-secondary mt-1">
//                     {routeInfo.distance} • ETA: {routeInfo.duration}
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
