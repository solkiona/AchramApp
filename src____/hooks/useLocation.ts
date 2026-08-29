// src/hooks/useLocation.ts
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
  
  // useEffect(() => {
  //   const checkNetwork = async () => {
  //     const status = await Network.getStatus();
  //     setIsOnline(status.connected);
  //   };
  //   checkNetwork();
  //   const listener = Network.addListener('networkStatusChange', (status) => {
  //     setIsOnline(status.connected);
  //   });
  //   return () => listener.remove();
  // }, []);

useEffect(() => {
  let isMounted = true;
  let listenerHandle: any = null;

  const checkNetwork = async () => {
    try {
      const status = await Network.getStatus();
      if (isMounted) setIsOnline(status.connected);
    } catch (e) {
      console.warn('Network status check failed:', e);
    }
  };
  checkNetwork();

  // ✅ Network.addListener returns a Promise<PluginListenerHandle>
  Network.addListener('networkStatusChange', (status) => {
    if (isMounted) setIsOnline(status.connected);
  })
    .then((handle) => {
      if (isMounted) {
        listenerHandle = handle;
      } else {
        // Component already unmounted — clean up immediately
        handle.remove();
      }
    })
    .catch((e) => {
      console.warn('Failed to add network listener:', e);
    });

  return () => {
    isMounted = false;
    if (listenerHandle) {
      listenerHandle.remove();
    }
  };
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

        const permission = await Geolocation.requestPermissions();

        if (permission.location !== 'granted') {
          setError('Location permission not granted');
          return;
        }

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