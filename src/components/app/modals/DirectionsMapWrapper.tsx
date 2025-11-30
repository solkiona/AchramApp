// src/components/app/modals/DirectionsMapWrapper.tsx
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { useEffect, useState } from 'react';

interface DirectionsMapWrapperProps {
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  pickup: string; // For display
  destination: string; // For display
  // Add any other props needed specifically for map rendering
}

const DirectionsMapWrapper: React.FC<DirectionsMapWrapperProps> = ({
  pickupCoords,
  destinationCoords,
  pickup,
  destination,
}) => {
  // NEW: State to ensure map renders only after mount
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    // NEW: Set mounted state after the first render
    setHasMounted(true);
  }, []);

  // NEW: Load Google Maps API only if mounted
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-directions',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    // NEW: Skip loading if not mounted yet
    skip: !hasMounted,
  });

  // NEW: Determine map center - prioritize pickup, then destination, then default
  let mapCenter = { lat: 6.5244, lng: 3.3792 }; // Default
  if (pickupCoords) {
    mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] };
  } else if (destinationCoords) {
    mapCenter = { lat: destinationCoords[1], lng: destinationCoords[0] };
  }

  // NEW: If not mounted, return a placeholder
  if (!hasMounted) {
    return <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary"><p className="text-achrams-text-secondary">Loading map...</p></div>;
  }

  if (loadError) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
        <p className="text-achrams-text-secondary">Error loading map: {loadError.message}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative">
      {isLoaded ? (
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={mapCenter}
          zoom={14}
          options={{
            // Optional: Disable default UI elements for a cleaner look
            // mapTypeControl: false,
            // streetViewControl: false,
            // fullscreenControl: false,
            // zoomControl: false,
            // Add other map options as needed
          }}
        >
          {/* Pickup Marker */}
          {pickupCoords && (
            <Marker
              position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
              // FIXED: Removed trailing spaces from URL
              icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/green-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
              title="Pickup Location"
            />
          )}
          {/* Destination Marker */}
          {destinationCoords && (
            <Marker
              position={{ lat: destinationCoords[1], lng: destinationCoords[0] }}
              // FIXED: Removed trailing spaces from URL
              icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
              title="Destination"
            />
          )}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
          <p className="text-achrams-text-secondary">Loading map...</p>
        </div>
      )}
    </div>
  );
};

export default DirectionsMapWrapper;