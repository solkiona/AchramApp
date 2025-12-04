

// // src/components/app/modals/DirectionsModal.tsx
// import { X } from 'lucide-react';
// import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'; // NEW: Import DirectionsRenderer
// import {useState, useEffect} from 'react';

// interface DirectionsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   pickup: string; // Keep for potential fallback or other uses
//   pickupCoords?: [number, number] | null; // Destination for "driver to pickup" route
//   destination: string; // Keep for potential fallback or other uses
//   destinationCoords?: [number, number] | null; // Keep for potential fallback or other uses
//   // NEW: Props for specifying the origin and destination for the route calculation
//   origin?: [number, number] | null; // e.g., Driver's live location or initial pickup location
//   originLabel?: string; // e.g., "Driver Location" or "Pickup"
//   destinationOverride?: [number, number] | null; // e.g., Pickup location (when showing directions *to* pickup)
//   destinationLabelOverride?: string; // e.g., "Pickup Location"
// }

// // NEW: Define map container style
// const mapContainerStyle = {
//   width: '100%',
//   height: '100%',
// };

// // NEW: Optional: Set a default center if no coordinates are provided
// const defaultCenter = {
//   lat: 6.5244, // Example: Lagos approximate center
//   lng: 3.3792,
// };

// export default function DirectionsModal({
//   isOpen,
//   onClose,
//   pickup,
//   pickupCoords,
//   destination,
//   destinationCoords,
//   // NEW: Destructure the new props
//   origin,
//   originLabel = "Origin", // Default label
//   destinationOverride, // Use this instead of pickupCoords for the destination marker/route
//   destinationLabelOverride = "Destination", // Default label
// }: DirectionsModalProps) {
//   if (!isOpen) return null;

//   // NEW: Load the Google Maps API script
//   const { isLoaded, loadError } = useJsApiLoader({
//     id: 'google-map-script',
//     // Ensure you have this in your .env.local
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
//   });

//   // NEW: State for directions result
//   const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
//   const [directionsError, setDirectionsError] = useState<string | null>(null);

//   // NEW: Determine the actual origin and destination for the route calculation and markers
//   // Prefer the override props (e.g., for "driver to pickup" scenario)
//   const routeOrigin = origin;
//   const routeDestination = destinationOverride || pickupCoords; // Fallback to pickupCoords if override not provided
//   const originMarkerPosition = routeOrigin;
//   const destinationMarkerPosition = routeDestination;

//   // NEW: Calculate directions when the determined origin and destination coords are available
//   useEffect(() => {
//     if (isLoaded && routeOrigin && routeDestination) {
//       const directionsService = new google.maps.DirectionsService();
//       const request: google.maps.DirectionsRequest = {
//         origin: { lat: routeOrigin[1], lng: routeOrigin[0] }, // [lng, lat] to {lat, lng}
//         destination: { lat: routeDestination[1], lng: routeDestination[0] }, // [lng, lat] to {lat, lng}
//         travelMode: google.maps.TravelMode.DRIVING,
//       };

//       directionsService.route(request, (result, status) => {
//         if (status === "OK" && result) {
//           setDirections(result);
//           setDirectionsError(null);
//         } else {
//           console.error("Directions request failed due to " + status);
//           setDirections(null);
//           setDirectionsError("Could not calculate directions.");
//         }
//       });
//     } else {
//         setDirections(null); // Reset if coords are missing
//         setDirectionsError(null);
//     }
//   }, [isLoaded, routeOrigin, routeDestination]); // Depend on the calculated routeOrigin and routeDestination

//   // NEW: Determine map center based on available coordinates (could be origin, destination, or midpoint)
//   // For simplicity, using origin if available, otherwise destination, otherwise default
//   let mapCenter = defaultCenter;
//   if (originMarkerPosition) {
//       mapCenter = { lat: originMarkerPosition[1], lng: originMarkerPosition[0] };
//   } else if (destinationMarkerPosition) {
//       mapCenter = { lat: destinationMarkerPosition[1], lng: destinationMarkerPosition[0] };
//   }


//   // NEW: Handle loading/error states for the script
//   if (loadError) {
//     return (
//       <div className="fixed inset-0 bg-achrams-bg-primary z-50 flex items-center justify-center">
//         <p className="text-achrams-text-secondary">Error loading map: {loadError.message}</p>
//       </div>
//     );
//   }

//   return (
//     // NEW: Apply ACHRAMS bg color
//     <div className="fixed inset-0 bg-achrams-secondary-solid/50 z-50" suppressHydrationWarning={true}>
//       <div className="h-full flex flex-col">
//         {/* NEW: Apply ACHRAMS header styling */}
//         <div className=" bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//           {/* NEW: Use a more generic title or pass title as prop if needed */}
//           <h2 className="text-xl font-bold">Directions</h2>
//           <button
//             onClick={onClose}
//             className="text-achrams-text-light hover:text-achrams-text-light/80 transition-colors"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         {/* NEW: Map Container */}
//         <div className="flex-1 relative">
//           {isLoaded ? (
//             <GoogleMap
//               mapContainerStyle={mapContainerStyle}
//               center={mapCenter}
//               zoom={12} // Adjust zoom level as needed, maybe fitBounds later
//               options={{
//                 // Optional: Disable default UI elements for a cleaner look
//                 // mapTypeControl: false,
//                 // streetViewControl: false,
//                 // fullscreenControl: false,
//                 // zoomControl: false,
//                 // Add other map options as needed
//               }}
//             >
//               {/* NEW: Add marker for the route origin (e.g., Driver's location) if coordinates are available */}
//               {originMarkerPosition && (
//                 <Marker
//                   position={{ lat: originMarkerPosition[1], lng: originMarkerPosition[0] }}
//                   // Optional: Customize marker icon
//                   // icon={...}
//                   title={originLabel} // Use the label prop
//                 />
//               )}
//               {/* NEW: Add marker for the route destination (e.g., Pickup location) if coordinates are available */}
//               {destinationMarkerPosition && (
//                 <Marker
//                   position={{ lat: destinationMarkerPosition[1], lng: destinationMarkerPosition[0] }}
//                   // Optional: Customize marker icon
//                   // icon={...}
//                   title={destinationLabelOverride} // Use the label prop
//                 />
//               )}
//               {/* NEW: Render directions if available */}
//               {directions && <DirectionsRenderer directions={directions} />}
//               {/* NEW: Display error if directions failed */}
//               {directionsError && (
//                  <div className="absolute top-4 left-4 bg-red-100 text-red-800 p-2 rounded">
//                     {directionsError}
//                  </div>
//               )}
//             </GoogleMap>
//           ) : (
//             // NEW: Fallback while loading or if failed to load
//             <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//               <p className="text-achrams-text-secondary">Loading map...</p>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }



// // src/components/app/modals/DirectionsModal.tsx
import { X } from 'lucide-react';
import { GoogleMap, Marker, DirectionsRenderer, useJsApiLoader } from '@react-google-maps/api'; // NEW: Import DirectionsRenderer
import {useState, useEffect} from 'react';
interface DirectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  pickup: string;
  pickupCoords?: [number, number] | null;
  destination: string; // NEW
  destinationCoords?: [number, number] | null; // NEW
}

// NEW: Define map container style
const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

// NEW: Optional: Set a default center if no coordinates are provided
const defaultCenter = {
  lat: 6.5244, // Example: Lagos approximate center
  lng: 3.3792,
};

export default function DirectionsModal({
  isOpen,
  onClose,
  pickup,
  pickupCoords,
  destination, // NEW: Destructure the new prop
  destinationCoords, // NEW: Destructure the new prop
}: DirectionsModalProps) {
  if (!isOpen) return null;

  // NEW: Load the Google Maps API script
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    // Ensure you have this in your .env.local
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  // NEW: State for directions result
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsError, setDirectionsError] = useState<string | null>(null);

  // NEW: Calculate directions when both pickup and destination coords are available
  useEffect(() => {
    if (isLoaded && pickupCoords && destinationCoords) {
      const directionsService = new google.maps.DirectionsService();
      const request: google.maps.DirectionsRequest = {
        origin: { lat: pickupCoords[1], lng: pickupCoords[0] }, // [lng, lat] to {lat, lng}
        destination: { lat: destinationCoords[1], lng: destinationCoords[0] }, // [lng, lat] to {lat, lng}
        travelMode: google.maps.TravelMode.DRIVING,
      };

      directionsService.route(request, (result, status) => {
        if (status === "OK" && result) {
          setDirections(result);
          setDirectionsError(null);
        } else {
          console.error("Directions request failed due to " + status);
          setDirections(null);
          setDirectionsError("Could not calculate directions.");
        }
      });
    } else {
        setDirections(null); // Reset if coords are missing
        setDirectionsError(null);
    }
  }, [isLoaded, pickupCoords, destinationCoords]);

  // NEW: Determine map center based on available coordinates (could be pickup, destination, or midpoint)
  // For simplicity, using pickup if available, otherwise destination, otherwise default
  let mapCenter = defaultCenter;
  if (pickupCoords) {
      mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
  } else if (destinationCoords) {
      mapCenter = { lat: destinationCoords[1], lng: destinationCoords[0] };
  }


  // NEW: Handle loading/error states for the script
  if (loadError) {
    return (
      <div className="fixed inset-0 bg-achrams-bg-primary z-50 flex items-center justify-center">
        <p className="text-achrams-text-secondary">Error loading map: {loadError.message}</p>
      </div>
    );
  }

  return (
    // NEW: Apply ACHRAMS bg color
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 z-50" suppressHydrationWarning={true}>
      <div className="h-full flex flex-col">
        {/* NEW: Apply ACHRAMS header styling */}
        <div className=" bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Directions to Pickup</h2>
          <button
            onClick={onClose}
            className="text-achrams-text-light hover:text-achrams-text-light/80 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* NEW: Map Container */}
        <div className="flex-1 relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={mapContainerStyle}
              center={mapCenter}
              zoom={12} // Adjust zoom level as needed, maybe fitBounds later
              options={{
                // Optional: Disable default UI elements for a cleaner look
                // mapTypeControl: false,
                // streetViewControl: false,
                // fullscreenControl: false,
                // zoomControl: false,
                // Add other map options as needed
              }}
            >
              {/* NEW: Add marker for pickup location if coordinates are available */}
              {pickupCoords && (
                <Marker
                  position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
                  // Optional: Customize marker icon
                  // icon={...}
                  title={`Pickup: ${pickup}`}
                />
              )}
              {/* NEW: Add marker for destination location if coordinates are available */}
              {destinationCoords && (
                <Marker
                  position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
                  // Optional: Customize marker icon
                  // icon={...}
                  title={`Destination: ${destination}`}
                />
              )}
              {/* NEW: Render directions if available */}
              {directions && <DirectionsRenderer directions={directions} />}
              {/* NEW: Display error if directions failed */}
              {directionsError && (
                 <div className="absolute top-4 left-4 bg-red-100 text-red-800 p-2 rounded">
                    {directionsError}
                 </div>
              )}
            </GoogleMap>
          ) : (
            // NEW: Fallback while loading or if failed to load
            <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
              <p className="text-achrams-text-secondary">Loading map...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// src/components/app/modals/DirectionsModal.tsx
// import { X } from 'lucide-react';
// // NEW: Import the wrapper component
// import DirectionsMapWrapper from './DirectionsMapWrapper'; // Adjust path if necessary

// interface DirectionsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   pickup: string;
//   pickupCoords?: [number, number] | null;
//   destination: string;
//   destinationCoords?: [number, number] | null;
// }

// export default function DirectionsModal({
//   isOpen,
//   onClose,
//   pickup,
//   pickupCoords,
//   destination,
//   destinationCoords,
// }: DirectionsModalProps) {
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-achrams-bg-primary z-50">
//       <div className="h-full flex flex-col">
//         <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//           <h2 className="text-xl font-bold">Directions to Pickup</h2>
//           <button onClick={onClose}>
//             <X className="w-6 h-6" />
//           </button>
//         </div>
//         {/* NEW: Use the wrapper component */}
//         <DirectionsMapWrapper
//           pickup={pickup}
//           destination={destination}
//           pickupCoords={pickupCoords || null}
//           destinationCoords={destinationCoords || null}
//         />
//       </div>
//     </div>
//   );
// }