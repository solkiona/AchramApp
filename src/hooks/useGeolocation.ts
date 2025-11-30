// src/hooks/useGeolocation.ts
import { useState, useEffect } from 'react';

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

  const requestPermission = (): Promise<GeolocationCoordinates | null> => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        setError('Geolocation is not supported by this browser.');
        resolve(null);
        return;
      }

      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const newCoords = { latitude, longitude };
          setCoords(newCoords);
          setError(null);
          setLoading(false);
          resolve(newCoords);
        },
        (err) => {
          let message = 'Unable to retrieve your location.';
          if (err.code === 1) message = 'Location access denied.';
          else if (err.code === 2) message = 'Location unavailable.';
          else if (err.code === 3) message = 'Location request timed out.';

          setError(message);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { coords, error, loading, requestPermission };
};