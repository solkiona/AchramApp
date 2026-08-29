import { useEffect, useRef } from "react";

type UseDriverTrackingProps = {
  screen: string | null;
  driver: any;
  pickupCoords: [number, number] | null;
  airportPickupArea: any;
  isDriverAtPickupArea: boolean;
  showNotification: (msg: string, type: "info" | "success" | "warning" | "error") => void;
  setDriverDistance: (dist: string | null) => void;
  setDriverDuration: (dur: string | null) => void;
  setIsDriverAtPickupArea: (val: boolean) => void;
};

export const useDriverTracking = ({
  screen,
  driver,
  pickupCoords,
  airportPickupArea,
  isDriverAtPickupArea,
  showNotification,
  setDriverDistance,
  setDriverDuration,
  setIsDriverAtPickupArea,
}: UseDriverTrackingProps) => {
  const directionsServiceRef = useRef<google.maps.DirectionsService | null>(
    null
  );
  const driverDurationRef = useRef<number | null>(null);
  const driverDistanceRef = useRef<number | null>(null);
  const isDriverAtPickupAreaRef = useRef<boolean>(false);

  useEffect(() => {
    if (
      screen !== "driver-assigned" ||
      !driver?.location ||
      !pickupCoords ||
      !window.google?.maps
    ) {
      setDriverDistance(null);
      setDriverDuration(null);
      setIsDriverAtPickupArea(false);
      return;
    }
    const [driverLng, driverLat] = driver.location;
    const [pickupLng, pickupLat] = pickupCoords;
    if (airportPickupArea?.geometry?.coordinates) {
      const polygonCoords = airportPickupArea.geometry.coordinates[0];
      const polygon = new google.maps.Polygon({
        paths: polygonCoords.map((coord: number[]) => ({
          lat: coord[1],
          lng: coord[0],
        })),
      });
      const driverLatLng = new google.maps.LatLng(driverLat, driverLng);

      console.log("Driver Latitude and Longitude ", {driverLat, driverLng})
      
      const isInside = google.maps.geometry.poly.containsLocation(
        driverLatLng,
        polygon
      );
      setIsDriverAtPickupArea(isInside);
      if (isInside) {
        if (!isDriverAtPickupAreaRef.current) {
          showNotification("Driver has arrived at the pickup area!", "success");
          isDriverAtPickupAreaRef.current = true;
        }
        return;
      } else {
        isDriverAtPickupAreaRef.current = false;
      }
    }
    if (!isDriverAtPickupArea) {
      if (!directionsServiceRef.current) {
        directionsServiceRef.current = new google.maps.DirectionsService();
      }
      const request: google.maps.DirectionsRequest = {
        origin: new google.maps.LatLng(driverLat, driverLng),
        destination: new google.maps.LatLng(pickupLat, pickupLng),
        travelMode: google.maps.TravelMode.DRIVING,
      };
      directionsServiceRef.current.route(request, (result, status) => {
        if (
          status === google.maps.DirectionsStatus.OK &&
          result &&
          result.routes.length > 0
        ) {
          const route = result.routes[0];
          const leg = route.legs[0];
          const newDistance = leg.distance?.text || "Unknown";
          const newDuration = leg.duration?.text || "Unknown";
          const durationThreshold = 60;
          const distanceThreshold = 500;
          const durationValue = leg.duration?.value || 0;
          const distanceValue = leg.distance?.value || 0;
          if (
            driverDurationRef.current !== null &&
            driverDistanceRef.current !== null
          ) {
            const prevDurationValue = driverDurationRef.current;
            const prevDistanceValue = driverDistanceRef.current;
            const durationChange = Math.abs(durationValue - prevDurationValue);
            const distanceChange = Math.abs(distanceValue - prevDistanceValue);
            if (
              durationChange >= durationThreshold ||
              distanceChange >= distanceThreshold
            ) {
              let notificationType: "info" | "success" | "warning" | "error" =
                "info";
              let message = `Driver is ${newDistance} away, ETA ${newDuration}`;
              if (durationValue < 120) {
                notificationType = "success";
                message = "Driver is very close!";
              } else if (durationValue < 300) {
                notificationType = "info";
                message = `Driver is ${newDistance} away, ETA ${newDuration}`;
              } else if (durationValue > 600) {
                notificationType = "warning";
                message = `Driver is ${newDistance} away, ETA ${newDuration}. This is longer than usual.`;
              }
              showNotification(message, notificationType);
            }
          } else {
            let notificationType: "info" | "success" | "warning" | "error" =
              "info";
            let message = `Driver is ${newDistance} away, ETA ${newDuration}`;
            if (durationValue < 120) {
              notificationType = "success";
              message = "Driver is very close!";
            }
            showNotification(message, notificationType);
          }
          setDriverDistance(newDistance);
          setDriverDuration(newDuration);
          driverDurationRef.current = durationValue;
          driverDistanceRef.current = distanceValue;
        } else {
          console.warn("Directions request failed:", status, result);
          setDriverDistance("Unknown");
          setDriverDuration("Unknown");
        }
      });
    }
  }, [
    screen,
    driver?.location,
    pickupCoords,
    airportPickupArea,
    isDriverAtPickupArea,
    showNotification,
    setDriverDistance,
    setDriverDuration,
    setIsDriverAtPickupArea,
  ]);
};