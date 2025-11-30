// // src/hooks/useGeolocation.ts
// import { useState, useEffect } from 'react';

// export interface GeolocationCoordinates {
//   latitude: number;
//   longitude: number;
// }

// export interface GeolocationResult {
//   coords: GeolocationCoordinates | null;
//   error: string | null;
//   loading: boolean;
//   requestPermission: () => Promise<GeolocationCoordinates | null>;
// }

// export const useGeolocation = (): GeolocationResult => {
//   const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState<boolean>(false);

//   const requestPermission = (): Promise<GeolocationCoordinates | null> => {
//     return new Promise((resolve) => {
//       if (!navigator.geolocation) {
//         setError('Geolocation is not supported by this browser.');
//         resolve(null);
//         return;
//       }

//       setLoading(true);
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           const newCoords = { latitude, longitude };
//           setCoords(newCoords);
//           setError(null);
//           setLoading(false);
//           resolve(newCoords);
//         },
//         (err) => {
//           let message = 'Unable to retrieve your location.';
//           if (err.code === 1) message = 'Location access denied.';
//           else if (err.code === 2) message = 'Location unavailable.';
//           else if (err.code === 3) message = 'Location request timed out.';

//           setError(message);
//           setLoading(false);
//           resolve(null);
//         },
//         {
//           enableHighAccuracy: true,
//           timeout: 10000,
//           maximumAge: 0,
//         }
//       );
//     });
//   };

//   return { coords, error, loading, requestPermission };
// };

// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationResult {
  coords: GeolocationCoordinates | null;
  error: string | null;
  loading: boolean; // NEW: Track overall loading state
  requestPermission: () => Promise<GeolocationCoordinates | null>;
}

export const useGeolocation = (): GeolocationResult => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false); // NEW: Overall loading state

  const requestPermission = (): Promise<GeolocationCoordinates | null> => {
    // NEW: Return a promise that resolves when getCurrentPosition succeeds or rejects on error
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by this browser.';
        setError(errorMsg);
        setLoading(false); // NEW: Stop loading if unsupported
        reject(errorMsg);
        return;
      }

      // NEW: Set loading state before requesting
      setLoading(true);
      setError(null); // NEW: Clear previous errors
      setCoords(null); // NEW: Clear previous coords

      navigator.geolocation.getCurrentPosition(
        (position) => {
          // NEW: Success callback
          const { latitude, longitude } = position.coords;
          const newCoords = { latitude, longitude };
          setCoords(newCoords);
          setError(null); // Ensure error is cleared on success
          setLoading(false); // NEW: Stop loading on success
          resolve(newCoords); // NEW: Resolve the promise with the coords
        },
        (err) => {
          // NEW: Error callback
          let message = 'Unable to retrieve your location.';
          if (err.code === 1) message = 'Location access denied.';
          else if (err.code === 2) message = 'Location unavailable.';
          else if (err.code === 3) message = 'Location request timed out.';

          setError(message);
          setLoading(false); // NEW: Stop loading on error
          console.error("Geolocation error:", message); // NEW: Log for debugging
          reject(message); // NEW: Reject the promise with the error message
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // NEW: Provide overall loading state to consumers
  return { coords, error, loading, requestPermission };
};