// // src/hooks/useLocation.ts
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { Geolocation, PositionOptions } from '@capacitor/geolocation';
// import { Capacitor } from '@capacitor/core';

// export interface LocationResult {
//   coords: [number, number] | null;
//   error: string | null;
//   loading: boolean;
//   requestPermission: () => Promise<boolean>;
// }

// export const useLocation = (): LocationResult => {
//   const [coords, setCoords] = useState<[number, number] | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const watchIdRef = useRef<string | null>(null);
//   const isCapacitor = Capacitor.getPlatform() !== 'web';
//   const timeoutRef = useRef<NodeJS.Timeout | null>(null);

//   const clearAll = useCallback(() => {
//     if (timeoutRef.current) {
//       clearTimeout(timeoutRef.current);
//       timeoutRef.current = null;
//     }
//     if (watchIdRef.current) {
//       if (isCapacitor) {
//         Geolocation.clearWatch({ id: watchIdRef.current });
//       } else {
//         navigator.geolocation.clearWatch(parseInt(watchIdRef.current));
//       }
//       watchIdRef.current = null;
//     }
//   }, [isCapacitor]);

//   const requestPermission = useCallback(async (): Promise<boolean> => {
//     if (!isCapacitor) return true;

//     try {
//       const status = await Geolocation.checkPermissions();
//       if (status.location === 'granted') return true;
      
//       const result = await Geolocation.requestPermissions();
//       return result.location === 'granted';
//     } catch (err) {
//       console.error('Permission request failed:', err);
//       return false;
//     }
//   }, [isCapacitor]);

//   useEffect(() => {
//     let isMounted = true;

//     const startLocation = async () => {
//       if (!isMounted) return;

//       // Step 1: Try last known position (fast!)
//       if (isCapacitor) {
//         try {
//           const lastPos = await Geolocation.getLastKnownPosition();
//           if (lastPos?.coords && isMounted) {
//             setCoords([lastPos.coords.latitude, lastPos.coords.longitude]);
//             setError(null);
//             // Don't stop loading yet—we'll try for fresher data
//           }
//         } catch (e) {
//           console.warn('No last known position');
//         }
//       }

//       // Step 2: Request permission
//       const hasPerms = await requestPermission();
//       if (!hasPerms) {
//         setError('Location permission denied');
//         setLoading(false);
//         return;
//       }

//       // Step 3: Set aggressive timeout (8s max wait)
//       timeoutRef.current = setTimeout(() => {
//         if (isMounted && loading) {
//           setError('Location timeout: GPS signal weak or disabled');
//           setLoading(false);
//           clearAll();
//         }
//       }, 8000);

//       // Step 4: Start watching
//       const options: PositionOptions = {
//         enableHighAccuracy: true,
//         timeout: 10000,
//         maximumAge: 10000, // Use cached if <10s old
//         interval: 2000,    // Android-only: min update interval
//       };

//       if (isCapacitor) {
//         const id = await Geolocation.watchPosition(options, (position, err) => {
//           if (!isMounted) return;
          
//           if (err) {
//             setError(err.message || 'Unknown location error');
//             setLoading(false);
//             return;
//           }

//           if (position) {
//             setCoords([position.coords.latitude, position.coords.longitude]);
//             setError(null);
//             setLoading(false);
//             // Clear timeout since we got a fix
//             if (timeoutRef.current) {
//               clearTimeout(timeoutRef.current);
//               timeoutRef.current = null;
//             }
//           }
//         });
//         watchIdRef.current = id;
//       } else {
//         // Web fallback (unchanged)
//         const id = navigator.geolocation.watchPosition(
//           (pos) => {
//             if (isMounted) {
//               setCoords([pos.coords.latitude, pos.coords.longitude]);
//               setError(null);
//               setLoading(false);
//               if (timeoutRef.current) {
//                 clearTimeout(timeoutRef.current);
//                 timeoutRef.current = null;
//               }
//             }
//           },
//           (err) => {
//             if (isMounted) {
//               setError(err.message);
//               setLoading(false);
//             }
//           },
//           { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
//         );
//         watchIdRef.current = id.toString();
//       }
//     };

//     startLocation();

//     return () => {
//       isMounted = false;
//       clearAll();
//     };
//   }, [isCapacitor, requestPermission, clearAll, loading]);

//   return { coords, error, loading, requestPermission };
// };



// // src/hooks/useLocation.ts
// import { useState, useEffect, useRef, useCallback } from 'react';
// import { Geolocation, PositionOptions } from '@capacitor/geolocation';
// import { Capacitor } from '@capacitor/core';

// export interface LocationResult {
//   coords: [number, number] | null;
//   error: string | null;
//   loading: boolean;
//   requestPermission: () => Promise<boolean>;
// }

// export const useLocation = (): LocationResult => {
//   const [coords, setCoords] = useState<[number, number] | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const watchIdRef = useRef<string | null>(null);
//   const isCapacitor = Capacitor.getPlatform() !== 'web';

//   // --- SAFE PERMISSION REQUEST ---
//   const requestPermission = useCallback(async (): Promise<boolean> => {
//     if (!isCapacitor) return true; // Web version continues to work as-is

//     try {
//       // Check status first to avoid unnecessary "pop-up" flicker
//       const status = await Geolocation.checkPermissions();
//       if (status.location === 'granted') return true;

//       const request = await Geolocation.requestPermissions();
//       return request.location === 'granted';
//     } catch (err) {
//       console.error("Capacitor permission error", err);
//       return false;
//     }
//   }, [isCapacitor]);

//   // --- RELIABLE WATCHER ---
//   useEffect(() => {
//     let isMounted = true;

//     const startWatching = async () => {
//       if (isCapacitor) {
//         // --- MOBILE NATIVE LOGIC ---
//         try {
//           const hasPerms = await requestPermission();
//           if (!hasPerms) {
//             setError("Permission denied");
//             setLoading(false);
//             return;
//           }

//           const options: PositionOptions = { 
//                 enableHighAccuracy: true, 
//                 timeout: 10000,
//                 maximumAge: 0,
//                 interval: 1000,
//               };

//           const id = await Geolocation.watchPosition(
//             options,
//             (position, err) => {
//               if (err) {
//                 setError(err.message);
//               } else if (position && isMounted) {
//                 setCoords([position.coords.latitude, position.coords.longitude]);
//                 setError(null);
//               }
//               setLoading(false);
//             }
//           );
//           watchIdRef.current = id;
//         } catch (err) {
//           setError("Native GPS error");
//           setLoading(false);
//         }
//       } else {
//         // --- EXISTING WEB LOGIC (DO NOT CHANGE) ---
//         if (!navigator.geolocation) return;
//         const id = navigator.geolocation.watchPosition(
//           (pos) => {
//             if (isMounted) {
//               setCoords([pos.coords.latitude, pos.coords.longitude]);
//               setError(null);
//               setLoading(false);
//             }
//           },
//           (err) => {
//             setError(err.message);
//             setLoading(false);
//           },
//           { enableHighAccuracy: true, timeout: 10000 }
//         );
//         watchIdRef.current = id.toString();
//       }
//     };

//     startWatching();

//     return () => {
//       isMounted = false;
//       if (watchIdRef.current) {
//         if (isCapacitor) {
//           Geolocation.clearWatch({ id: watchIdRef.current });
//         } else {
//           navigator.geolocation.clearWatch(parseInt(watchIdRef.current));
//         }
//       }
//     };
//   }, [isCapacitor, requestPermission]);

//   return { coords, error, loading, requestPermission };
// };

// // src/hooks/useLocation.ts
import { useState, useEffect, useRef } from 'react';
import { Geolocation } from '@capacitor/geolocation';
import { Network } from '@capacitor/network';
import {Capacitor } from '@capacitor/core'

export interface LocationResult {
  coords: [number, number] | null; // [lat, lng]
  error: string | null;
  loading: boolean;
  requestPermission: () => Promise<boolean>;
}

export const useLocation = (): LocationResult => {
  const [coords, setCoords] = useState<[number, number] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const watchIdRef = useRef<string | null>(null);
  const isCapacitor = Capacitor.getPlatform() !== 'web'

  // Check online status
  const [isOnline, setIsOnline] = useState(true);
  useEffect(() => {
    const checkNetwork = async () => {
      const status = await Network.getStatus();
      setIsOnline(status.connected);
    };
    checkNetwork();
    const listener = Network.addListener('networkStatusChange', (status) => {
      setIsOnline(status.connected);
    });
    return () => listener.remove();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isCapacitor) return false; // Browser handles its own permissions

    try {
      const permission = await Geolocation.requestPermissions();
      return permission.location === 'granted';
    } catch (err) {
      console.error('Location permission error:', err);
      return false;
    }
  };

  // Watch location
  useEffect(() => {
    if (!isCapacitor || !isOnline) return;

    const watchLocation = async () => {
      try {
        const id = await Geolocation.watchPosition(
          { enableHighAccuracy: true, timeout: 10000, distanceFilter: 5 },
          (position) => {
            if (position.coords) {
              setCoords([position.coords.latitude, position.coords.longitude]);
              setError(null);
            }
          },
          (err) => {
            console.error('Capacitor location error:', err);
            setError(err.message || 'Location error');
          }
        );
        watchIdRef.current = id;
      } catch (err) {
        console.error('Failed to start location watch:', err);
        setError('Failed to start location tracking');
      }
    };

    watchLocation();

    return () => {
      if (watchIdRef.current) {
        Geolocation.clearWatch({ id: watchIdRef.current });
      }
    };
  }, [isCapacitor, isOnline]);

  // Fallback to browser geolocation if not in Capacitor
  useEffect(() => {
    if (isCapacitor || !isOnline) return;

    let watchId: number;
    const startBrowserWatch = () => {
      if (!navigator.geolocation) return;
      

      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setCoords([pos.coords.latitude, pos.coords.longitude]);
          //alert(`watching with browser geolocation ${pos.coords.latitude}, ${pos.coords.longitude}`)
          setError(null);
        },
        (err) => {
          console.error('Browser location error:', err);
          setError(err.message || 'Location unavailable');
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    };

    startBrowserWatch();

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [isCapacitor, isOnline]);

  return { coords, error, loading, requestPermission };
};