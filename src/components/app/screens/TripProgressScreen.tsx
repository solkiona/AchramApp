// src/components/app/screens/TripProgressScreen.tsx
"use client";

import { Shield } from "lucide-react";
import {
  GoogleMap,
  Marker,
  DirectionsService,
  DirectionsRenderer,
} from "@react-google-maps/api";
import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter";
import { useEffect, useState } from "react";
import { InfoWindow } from "@react-google-maps/api";

interface Driver {
  name: string;
  initials?: string;
  location?: [number, number] | null;
}

interface TripProgressScreenProps {
  driver: Driver | null;
  onPanic: () => void;
  onComplete: () => void;
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  isGoogleMapsLoaded: boolean;
  googleMapsLoadError?: any;
}

export default function TripProgressScreen({
  driver,
  onPanic,
  onComplete,
  pickupCoords,
  destinationCoords,
  isGoogleMapsLoaded,
  googleMapsLoadError,
}: TripProgressScreenProps) {
  
  const driverLocation = driver?.location || null;

  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<string | null>(null);

  // Fetch directions when pickup/destination change
  useEffect(() => {
    
    
    if (!pickupCoords || !destinationCoords) {
      setDirections(null);
      setDirectionsError(null);
      return;
    }

    // Create request for DirectionsService
    const request = {
      origin: { lat: pickupCoords[1], lng: pickupCoords[0] },
      destination: { lat: destinationCoords[1], lng: destinationCoords[0] },
      travelMode: google.maps.TravelMode.DRIVING,
    };

    // We can only use google.maps if window is defined (client-side)
    if (
      typeof window !== "undefined" &&
      window.google?.maps?.DirectionsService
    ) {
      const directionsService = new google.maps.DirectionsService();
      directionsService.route(request, (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setDirectionsError(null);
        } else {
          console.warn("Directions request failed:", status);
          setDirections(null);
          setDirectionsError("Could not load route");
        }
      });
    }
  }, [pickupCoords, destinationCoords]);

  // Determine map center: prioritize real driver, then pickup
  const mapCenter = driverLocation
    ? { lat: driverLocation[1], lng: driverLocation[0] }
    : pickupCoords
    ? { lat: pickupCoords[1], lng: pickupCoords[0] }
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
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {driver && (
        <>
          <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
            <h1 className="text-xl font-bold">Trip in progress</h1>
            <button
              onClick={onPanic}
              className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-700 rounded-full shadow-lg flex items-center justify-center border border-white hover:from-red-600 hover:to-red-800 active:scale-95 hover:scale-[1.05] transition-all duration-200 ease-in-out"
            >
              <Shield className="w-6 h-6 text-white" />
            </button>
          </div>

          <div className="flex-1 relative">
            {isGoogleMapsLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={14}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {/* Pickup */}
                {pickupCoords && (
                  <Marker
                    position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/micons/green-dot.png",
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    title="Pickup"
                    onClick={() => setSelectedMarker("pickup")}
                  />
                )}

                {/* Destination */}
                {destinationCoords && (
                  <Marker
                    position={{
                      lat: destinationCoords[1],
                      lng: destinationCoords[0],
                    }}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/micons/red-dot.png",
                      scaledSize: new window.google.maps.Size(32, 32),
                    }}
                    title="Destination"
                    onClick={() => setSelectedMarker("destination")}
                  />
                )}

                {/* Driver */}
                {driverLocation && (
                  <Marker
                    position={{
                      lat: driverLocation[1],
                      lng: driverLocation[0],
                    }}
                    icon={{
                      url: "https://maps.google.com/mapfiles/ms/micons/blue-dot.png",
                      scaledSize: new window.google.maps.Size(36, 36),
                    }}
                    title={`Driver: ${driver.name}`}
                    onClick={() => setSelectedMarker("driver")}
                  />
                )}

                {/* Actual Route */}
                {directions && (
                  <DirectionsRenderer
                    directions={directions}
                    options={{
                      polylineOptions: {
                        strokeColor: "#007BFF",
                        strokeWeight: 5,
                        strokeOpacity: 0.8,
                      },
                      suppressMarkers: true, // we already render custom markers
                      suppressInfoWindows: true,
                    }}
                  />
                )}

                {selectedMarker === "pickup" && pickupCoords && (
                  <InfoWindow
                    position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="font-medium text-gray-800">Pickup</div>
                  </InfoWindow>
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
                    <div className="font-medium text-gray-800">Destination</div>
                  </InfoWindow>
                )}

                {/* InfoWindow for Driver */}
                {selectedMarker === "driver" && driverLocation && (
                  <InfoWindow
                    position={{
                      lat: driverLocation[1],
                      lng: driverLocation[0],
                    }}
                    onCloseClick={() => setSelectedMarker(null)}
                  >
                    <div className="font-medium text-gray-800">
                      Driver: {driver?.name}
                    </div>
                  </InfoWindow>
                )}

                {/* Optional: Show error if route fails */}
                {directionsError && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded text-sm">
                    {directionsError}
                  </div>
                )}
              </GoogleMap>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
                <p className="text-achrams-text-secondary">Loading map...</p>
              </div>
            )}
          </div>

          <div className="bg-achrams-bg-primary px-6 py-6 border-t border-achrams-border">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-lg font-bold">
                {driver.initials || driver.name?.charAt(0) || "D"}
              </div>
              <div>
                <div className="font-bold text-achrams-text-primary">
                  {driver.name}
                </div>
                <div className="text-sm text-achrams-text-secondary">
                  En route to{" "}
                  {destinationCoords ? "your destination" : "unknown"}
                </div>
              </div>
            </div>
          </div>
          <ACHRAMFooter />
        </>
      )}
    </div>
  );
}

// // // // src/components/app/screens/TripProgressScreen.tsx
// 'use client';

// import { Shield } from 'lucide-react';
// import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
// import { Driver } from '@/types/passenger'; // Assuming this type is defined
// import { useState, useEffect } from 'react';
// import ACHRAMFooter from "@/components/app/ui/ACHRAMFooter"

// interface TripProgressScreenProps {
//   driver: Driver;
//   onPanic: () => void;
//   onComplete: () => void;
//   pickupCoords: [number, number] | null; // NEW: Prop for pickup coordinates
//   destinationCoords: [number, number] | null; // NEW: Prop for destination coordinates
//   tripProgress: number; // NEW: Prop for simulated progress
//   isGoogleMapsLoaded: boolean;
//   googleMapsLoadError?: any;

// }

// export default function TripProgressScreen({
//   driver,
//   onPanic,
//   onComplete,
//   pickupCoords,
//   destinationCoords,
//   tripProgress, // NEW: Destructure prop
//   isGoogleMapsLoaded,
//   googleMapsLoadError,

// }: TripProgressScreenProps) {
//   const [driverLocation, setDriverLocation] = useState<[number, number] | null>(null); // NEW: State for driver location

//   // NEW: Simulate driver movement based on tripProgress
//   useEffect(() => {
//     if (pickupCoords && destinationCoords) {
//       const [startLng, startLat] = pickupCoords;
//       const [endLng, endLat] = destinationCoords;

//       // Simple linear interpolation for simulation
//       const lat = startLat + (endLat - startLat) * (tripProgress / 100);
//       const lng = startLng + (endLng - startLng) * (tripProgress / 100);

//       setDriverLocation([lng, lat]);
//     }
//   }, [tripProgress, pickupCoords, destinationCoords]);

//   // // NEW: Load Google Maps API
//   // const { isLoaded, loadError } = useJsApiLoader({
//   //   id: 'google-map-script',
//   //   googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
//   // });

//   // NEW: Determine map center (use driver location if available, otherwise pickup or default)
//   let mapCenter = { lat: 6.5244, lng: 3.3792 }; // Default
//   if (driverLocation) {
//     mapCenter = { lat: driverLocation[1], lng: driverLocation[0] };
//   } else if (pickupCoords) {
//     mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
//   }

//   if (googleMapsLoadError) {
//     return (
//       <div className="h-screen bg-achrams-bg-primary flex flex-col">
//         <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4">
//           <h1 className="text-xl font-bold">Trip in progress</h1>
//         </div>
//         <div className="flex-1 flex items-center justify-center bg-achrams-bg-secondary">
//           <p className="text-achrams-text-secondary">Error loading map: {googleMapsLoadError.message || googleMapsLoadError}</p>
//         </div>
//         <div className="bg-achrams-bg-primary px-6 py-6 border-t border-achrams-border">
//           <div className="flex items-center gap-4 mb-4">
//             <div className="w-14 h-14 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-lg font-bold">
//               {driver.initials || driver.name?.charAt(0) || 'D'}
//             </div>
//             <div>
//               <div className="font-bold text-achrams-text-primary">{driver.name}</div>
//               <div className="text-sm text-achrams-text-secondary">
//                 En route to {destinationCoords ? 'your destination' : 'unknown'}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-achrams-bg-primary flex flex-col">

//        {driver ? ( // NEW: Check if driver object exists
//         <>
//       {/* Header */}
//       <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//         <h1 className="text-xl font-bold">Trip in progress</h1>

//         {/* <button
//           onClick={onPanic}
//           className="w-12 h-12 bg-achrams-bg-primary rounded-full shadow-lg flex items-center justify-center border border-red-600 hover:bg-achrams-bg-secondary transition-colors"
//         >
//           <Shield className="w-6 h-6 text-red-600" />
//         </button> */}

//         <button
//     onClick={onPanic}
//     className="
//       w-12 h-12
//       bg-gradient-to-br from-red-500 to-red-700 rounded-full // Red gradient
//       shadow-lg
//       flex items-center justify-center
//       border border-white
//       hover:from-red-600 hover:to-red-800
//       active:scale-95
//       hover:scale-[1.05]
//       transition-all duration-200 ease-in-out
//     "
//   >
//     <Shield className="w-6 h-6 text-white" />
//   </button>

//       </div>
//       {/* Map Container */}
//       <div className="flex-1 relative">
//         {isGoogleMapsLoaded ? (
//           <GoogleMap
//             mapContainerStyle={{ width: '100%', height: '100%' }}
//             center={mapCenter}
//             zoom={14}
//             options={{
//               // Optional: Disable default UI elements for a cleaner look
//               // mapTypeControl: false,
//               // streetViewControl: false,
//               // fullscreenControl: false,
//               // zoomControl: false,
//               // Add other map options as needed
//             }}
//           >
//             {/* Pickup Marker */}
//             {pickupCoords && (
//               <Marker
//                 position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
//                 icon={{
//                   url: 'https://maps.google.com/mapfiles/ms/micons/green-dot.png',
//                   scaledSize: new window.google.maps.Size(32, 32),
//                 }}
//                 title="Pickup Location"
//               />
//             )}
//             {/* Destination Marker */}
//             {destinationCoords && (
//               <Marker
//                 position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
//                 icon={{
//                   url: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png',
//                   scaledSize: new window.google.maps.Size(32, 32),
//                 }}
//                 title="Destination"
//               />
//             )}
//             {/* Driver Marker */}
//             {driverLocation && (
//               <Marker
//                 position={{ lat: driverLocation[1], lng: driverLocation[0] }}
//                 icon={{
//                   url: 'https://maps.google.com/mapfiles/ms/micons/blue-dot.png',
//                   scaledSize: new window.google.maps.Size(32, 32),
//                 }}
//                 title={`Driver ${driver.name}`}
//               />
//             )}
//             {/* Route Polyline (Optional) */}
//             {pickupCoords && destinationCoords && (
//               <Polyline
//                 path={[
//                   { lat: pickupCoords[1], lng: pickupCoords[0] },
//                   { lat: destinationCoords[1], lng: destinationCoords[0] },
//                 ]}
//                 options={{
//                   strokeColor: '#FF0000',
//                   strokeOpacity: 0.8,
//                   strokeWeight: 2,
//                 }}
//               />
//             )}
//           </GoogleMap>
//         ) : (
//           <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//             <p className="text-achrams-text-secondary">Loading map...</p>
//           </div>
//         )}
//       </div>
//       {/* Driver Info Bar */}
//       <div className="bg-achrams-bg-primary px-6 py-6 border-t border-achrams-border">
//         <div className="flex items-center gap-4 mb-4">
//           <div className="w-14 h-14 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-lg font-bold">
//             {driver.initials || driver.name?.charAt(0) || 'D'}
//           </div>
//           <div>
//             <div className="font-bold text-achrams-text-primary">{driver.name}</div>
//             <div className="text-sm text-achrams-text-secondary">
//               En route to {destinationCoords ? 'your destination' : 'unknown'}
//             </div>
//           </div>
//         </div>
//         {/* NEW: Progress indicator */}
//         <div className="w-full bg-achrams-border rounded-full h-2.5">
//           <div
//             className="bg-achrams-gradient-primary h-2.5 rounded-full transition-all duration-300"
//             style={{ width: `${tripProgress}%` }}
//           ></div>
//         </div>
//         <div className="text-center mt-1 text-sm text-achrams-text-secondary">
//           {tripProgress}% Complete
//         </div>
//       </div>
//       <ACHRAMFooter />

//       </>
//       ) : (
//         // NEW: Render a fallback UI if driver is null
//         <div className="flex-1 flex items-center justify-center">
//           <p className="text-achrams-text-secondary">Updating trip status...</p>
//         </div>
//       )}
//     </div>
//   );
// }
