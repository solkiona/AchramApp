// src/hooks/useGeolocation.ts
import { useState, useRef, useCallback } from 'react';

export interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

export interface GeolocationResult {
  coords: GeolocationCoordinates | null;
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<GeolocationCoordinates | null>;
}

export const useGeolocation = (): GeolocationResult => {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Prevent multiple simultaneous requests
  const requestInProgress = useRef<boolean>(false);
  const pendingRequest = useRef<Promise<GeolocationCoordinates | null> | null>(null);

  /**
   * Fallback to IP-based geolocation
   */
  const getIPBasedLocation = async (): Promise<GeolocationCoordinates | null> => {
    try {
      console.log('Attempting IP-based location fallback...');
      
      const response = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate coordinates
      if (
        typeof data.latitude === 'number' &&
        typeof data.longitude === 'number' &&
        !isNaN(data.latitude) &&
        !isNaN(data.longitude)
      ) {
        console.log('IP-based location obtained:', data.latitude, data.longitude);
        return {
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
      
      throw new Error('Invalid coordinates from IP service');
    } catch (err: any) {
      console.error('IP-based location failed:', err.message);
      return null;
    }
  };

  const requestPermission = useCallback((): Promise<GeolocationCoordinates | null> => {
    // If a request is already in progress, return the existing promise
    if (requestInProgress.current && pendingRequest.current) {
      console.log('Location request already in progress');
      return pendingRequest.current;
    }

    requestInProgress.current = true;
    setLoading(true);
    setError(null);

    const promise = new Promise<GeolocationCoordinates | null>(async (resolve) => {
      // Check browser support
      if (!navigator.geolocation) {
        console.warn('Geolocation not supported, trying IP fallback...');
        const ipLocation = await getIPBasedLocation();
        
        if (ipLocation) {
          setCoords(ipLocation);
          setError(null);
          resolve(ipLocation);
        } else {
          const errorMsg = 'Geolocation is not supported and IP fallback failed.';
          setError(errorMsg);
          setCoords(null);
          resolve(null);
        }
        
        setLoading(false);
        requestInProgress.current = false;
        pendingRequest.current = null;
        return;
      }

      let hasResolved = false;

      const handleSuccess = (position: GeolocationPosition) => {
        if (hasResolved) return;
        hasResolved = true;

        const { latitude, longitude } = position.coords;
        const newCoords = { latitude, longitude };
        
        setCoords(newCoords);
        setError(null);
        setLoading(false);
        requestInProgress.current = false;
        pendingRequest.current = null;
        
        console.log('GPS location obtained:', newCoords);
        resolve(newCoords);
      };

      const handleError = async (err: GeolocationPositionError) => {
        if (hasResolved) return;
        hasResolved = true;

        console.warn('GPS location failed, trying IP fallback...', err.message);
        
        // Try IP-based fallback
        const ipLocation = await getIPBasedLocation();
        
        if (ipLocation) {
          setCoords(ipLocation);
          setError(null);
          resolve(ipLocation);
        } else {
          let message = 'Unable to retrieve your location.';
          
          switch (err.code) {
            case 1:
              message = 'Location access denied.';
              break;
            case 2:
              message = 'Location unavailable.';
              break;
            case 3:
              message = 'Location request timed out.';
              break;
          }
          
          setError(message);
          setCoords(null);
          resolve(null);
        }

        setLoading(false);
        requestInProgress.current = false;
        pendingRequest.current = null;
      };

      // Request GPS location
      navigator.geolocation.getCurrentPosition(
        handleSuccess,
        handleError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 5000,
        }
      );
    });

    pendingRequest.current = promise;
    return promise;
  }, []);

  return { coords, error, loading, requestPermission };
};



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
  
//     return new Promise((resolve, reject) => {
//       if (!navigator.geolocation) {
//         const errorMsg = 'Geolocation is not supported by this browser.';
//         setError(errorMsg);
//         setLoading(false); 
//         reject(errorMsg);
//         return;
//       }

      
//       setLoading(true);
//       setError(null); 
//       setCoords(null); 

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
//           console.error("Geolocation error:", message); 
//           reject(message); 
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