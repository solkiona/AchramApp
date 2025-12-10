// // src/components/app/modals/DirectionsMapWrapper.tsx
// import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
// import { useEffect, useState } from 'react';

// interface DirectionsMapWrapperProps {
//   pickupCoords: [number, number] | null;
//   destinationCoords: [number, number] | null;
//   pickup: string; // For display
//   destination: string; // For display
//   // Add any other props needed specifically for map rendering
//   driverLocation: [number, number] | null;
// }

// const DirectionsMapWrapper: React.FC<DirectionsMapWrapperProps> = ({
//   pickupCoords,
//   destinationCoords,
//   pickup,
//   destination,
//   driverLocation

// }) => {
//   // NEW: State to ensure map renders only after mount
//   const [hasMounted, setHasMounted] = useState(false);

//   useEffect(() => {
//     // NEW: Set mounted state after the first render
//     setHasMounted(true);
//   }, []);

//   // NEW: Load Google Maps API only if mounted
//   const { isLoaded, loadError } = useJsApiLoader({
//     id: 'google-map-script-directions',
//     googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
//     // NEW: Skip loading if not mounted yet
//     skip: !hasMounted,
//   });

//   // NEW: Determine map center - prioritize pickup, then destination, then default
//   let mapCenter = { lat: 6.5244, lng: 3.3792 }; // Default
//   if (pickupCoords) {
//     mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
//   } else if (destinationCoords) {
//     mapCenter = { lat: destinationCoords[1], lng: destinationCoords[0] };
//   }

//   // NEW: If not mounted, return a placeholder
//   if (!hasMounted) {
//     return <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary"><p className="text-achrams-text-secondary">Loading map...</p></div>;
//   }

//   if (loadError) {
//     return (
//       <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//         <p className="text-achrams-text-secondary">Error loading map: {loadError.message}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="flex-1 relative">
//       {isLoaded ? (
//         <GoogleMap
//           mapContainerStyle={{ width: '100%', height: '100%' }}
//           center={mapCenter}
//           zoom={14}
//           options={{
//             // Optional: Disable default UI elements for a cleaner look
//             // mapTypeControl: false,
//             // streetViewControl: false,
//             // fullscreenControl: false,
//             // zoomControl: false,
//             // Add other map options as needed
//           }}
//         >
//           {/* Pickup Marker */}
//           {pickupCoords && (
//             <Marker
//               position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
//               // FIXED: Removed trailing spaces from URL
//               icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/green-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
//               title="Pickup Location"
//             />
//           )}
//           {/* Destination Marker */}
//           {destinationCoords && (
//             <Marker
//               position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
//               // FIXED: Removed trailing spaces from URL
//               icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
//               title="Destination"
//             />
//           )}
//         </GoogleMap>
//       ) : (
//         <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
//           <p className="text-achrams-text-secondary">Loading map...</p>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DirectionsMapWrapper;

// src/components/app/modals/DirectionsMapWrapper.tsx
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState, useMemo } from 'react';
import { useGeolocation } from '@/hooks/useGeolocation'; // assuming you have this

interface DirectionsMapWrapperProps {
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  pickup: string;
  destination: string;
  driverLocation: [number, number] | null;
  // Optional: force re-center when driver moves far
  isTripActive?: boolean;
}

const DirectionsMapWrapper: React.FC<DirectionsMapWrapperProps> = ({
  pickupCoords,
  destinationCoords,
  driverLocation,
  isTripActive = false,
}) => {
  const [hasMounted, setHasMounted] = useState(false);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 6.5244, lng: 3.3792 });

  // Track passenger's real-time location
  const { coords: passengerCoords } = useGeolocation();

  // Extract passenger [lng, lat] from geolocation
  const passengerCurrentLocation: [number, number] | null = passengerCoords
    ? [passengerCoords.longitude, passengerCoords.latitude]
    : null;

  // Side effect: update map center based on trip state
  useEffect(() => {
    let newCenter = { lat: 6.5244, lng: 3.3792 };

    if (isTripActive && driverLocation) {
      // During active trip: center on driver (or midpoint between driver & passenger)
      if (passengerCurrentLocation) {
        // Optional: midpoint (more engaging)
        newCenter = {
          lat: (driverLocation[1] + passengerCurrentLocation[1]) / 2,
          lng: (driverLocation[0] + passengerCurrentLocation[0]) / 2,
        };
      } else {
        // Fallback: center on driver
        newCenter = { lat: driverLocation[1], lng: driverLocation[0] };
      }
    } else if (pickupCoords) {
      // Before trip starts: center on pickup
      newCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
    } else if (destinationCoords) {
      newCenter = { lat: destinationCoords[1], lng: destinationCoords[0] };
    } else if (passengerCurrentLocation) {
      newCenter = { lat: passengerCurrentLocation[1], lng: passengerCurrentLocation[0] };
    }

    setMapCenter(newCenter);
  }, [isTripActive, pickupCoords, destinationCoords, driverLocation, passengerCurrentLocation]);

  // Ensure first render only after mount
  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-directions',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    skip: !hasMounted,
  });

  if (!hasMounted) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
        <p className="text-achrams-text-secondary">Preparing map...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
        <p className="text-achrams-text-secondary">Map failed to load</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
        <p className="text-achrams-text-secondary">Loading map...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={mapCenter}
        zoom={14}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
      >
        {/* Pickup (static after booking) */}
        {pickupCoords && (
          <Marker
            position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/micons/green-dot.png',
              scaledSize: new window.google.maps.Size(32, 32),
            }}
            title="Pickup"
          />
        )}

        {/* Destination (static) */}
        {destinationCoords && (
          <Marker
            position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png',
              scaledSize: new window.google.maps.Size(32, 32),
            }}
            title="Destination"
          />
        )}

        {/* Driver (live) */}
        {driverLocation && (
          <Marker
            position={{ lat: driverLocation[1], lng: driverLocation[0] }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/micons/blue-dot.png', // or use a car icon
              scaledSize: new window.google.maps.Size(36, 36),
            }}
            title="Driver"
          />
        )}

        {/* Passenger (live) */}
        {passengerCurrentLocation && (
          <Marker
            position={{ lat: passengerCurrentLocation[1], lng: passengerCurrentLocation[0] }}
            icon={{
              url: 'https://maps.google.com/mapfiles/ms/micons/yellow-dot.png',
              scaledSize: new window.google.maps.Size(32, 32),
            }}
            title="You"
          />
        )}
      </GoogleMap>
    </div>
  );
};

export default DirectionsMapWrapper;