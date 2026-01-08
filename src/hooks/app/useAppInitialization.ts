import { useCallback, useEffect, useState, useRef } from "react";
import { apiClient } from "@/lib/api";
import { PersistedState } from "@/types/app";
import { loadAppState, saveAppState } from "@/lib/storage/sessionState";
import { useAuth } from "@/contexts/AuthContext";

type UseAppInitializationProps = {
  hasHydrated: boolean;
  isAuthLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  setScreen: (screen: string) => void;
  setBookAsGuest: (val: boolean) => void;
  setActiveTripId: (id: string | null) => void;
  setDriver: (driver: any) => void;
  setPickup: (pickup: string) => void;
  setDestination: (dest: string) => void;
  setFareEstimate: (val: number | null) => void;
  setPickupCoords: (coords: [number, number] | null) => void;
  setDestinationCoords: (coords: [number, number] | null) => void;
  setRequirements: (req: any) => void;
  setPassengerData: (data: any) => void;
  passengerData: any;
  setGuestId: (id: string | null) => void;
  setVerificationCode: (code: string | null) => void;
  setTripProgress: (progress: number) => void;
  setAirportPickupArea: (area: any) => void;
  startWebSocketConnection: (guestId: string, tripId: string) => void;
  startWebSocketConnectionForAuthUser: (tripId: string) => void;
  stopWebSocketConnection: () => void;
  stopPollingTripStatus: () => void;
  setTripRequestStatus: (status: "loading" | "accepted" | "no-driver" | "error" | null) => void;
  setTripRequestError: (err: string | null) => void;
  preserveBookingContext: () => void;
  setInitComplete: (complete: boolean) => void;
};

export const useAppInitialization = ({
  hasHydrated,
  isAuthLoading,
  isAuthenticated,
  token,
  setScreen,
  setBookAsGuest,
  setActiveTripId,
  setDriver,
  setPickup,
  setDestination,
  setFareEstimate,
  setPickupCoords,
  setDestinationCoords,
  setRequirements,
  setPassengerData,
  passengerData,
  setGuestId,
  setVerificationCode,
  setTripProgress,
  setAirportPickupArea,
  startWebSocketConnection,
  startWebSocketConnectionForAuthUser,
  stopWebSocketConnection,
  stopPollingTripStatus,
  setTripRequestStatus,
  setTripRequestError,
  preserveBookingContext,
  setInitComplete,
}: UseAppInitializationProps) => {
  const initializeAppState = useCallback(async () => {
    if (!hasHydrated || isAuthLoading) {
      console.log(
        "initializeAppState: Waiting for hydration or auth loading to complete."
      );
      return;
    }
    console.log("Initializing app state after hydration and auth check...");
    const savedState = loadAppState();
    const savedTripDataStr = sessionStorage.getItem("tripData");
    let savedTripData = null;
    if (savedTripDataStr) {
      try {
        savedTripData = JSON.parse(savedTripDataStr);
        console.log("Restored tripData from sessionStorage:", savedTripData);
      } catch (e) {
        console.error("Failed to parse tripData from sessionStorage:", e);
        sessionStorage.removeItem("tripData");
      }
    }
    if (savedTripData) {
      setPickup(savedTripData.pickup_address || "");
      setDestination(savedTripData.destination_address || "");
      setFareEstimate(parseFloat(savedTripData.amount?.amount) || null);
      setPickupCoords(savedTripData.pickup_location || null);
      setDestinationCoords(savedTripData.destination_location || null);
      setRequirements({
        luggage: savedTripData.has_extra_luggage || false,
        wheelchair: savedTripData.has_wheel_chair_access || false,
        elderly: savedTripData.has_extra_leg_room || false,
      });
      if (
        savedTripData.guest_name ||
        savedTripData.guest_email ||
        savedTripData.guest_phone
      ) {
        setPassengerData({
          name: savedTripData.guest_name || passengerData.name,
          phone: savedTripData.guest_phone || passengerData.phone,
          email: savedTripData.guest_email || passengerData.email,
        });
      }
    }
    if (savedState) {
      setBookAsGuest(savedState.bookAsGuest || false);
      const isTransitRoute =
        typeof window !== "undefined" &&
        /^\/trips\/transit\/[a-zA-Z0-9_-]+$/.test(window.location.pathname);
      if (isAuthenticated) {
        console.log(
          "User is authenticated, checking for stored active trip ID..."
        );
        if (savedState.bookAsGuest || savedState.activeTripId) {
          console.log(
            "Found stored active trip ID for authenticated user:",
            savedState.activeTripId
          );
          setActiveTripId(savedState.activeTripId);
          setDriver(savedState.driver);
          try {
            let response;
            if (savedState.bookAsGuest) {
              console.log(
                "Initializing as authenticated user who booked as guest. Fetching trip via guest endpoint with guestId:",
                savedState.guestId
              );
              setGuestId(savedState.guestId || null);
              if (!savedState.guestId) {
                throw new Error(
                  "bookAsGuest is true but guestId is missing from saved state."
                );
              }
              response = await apiClient.get(
                `/trips/${savedState.guestId}`,
                undefined,
                true,
                savedState.guestId
              );
            } else {
              setGuestId(null);
              console.log(
                "Initializing as authenticated user who booked normally. Fetching trip via auth endpoint with tripId:",
                savedState.activeTripId
              );
              response = await apiClient.get(
                `/trips/${savedState.activeTripId}`,
                undefined,
                false,
                undefined,
                true
              );
            }
            if (response.status === "success" && response.data) {
              const trip = response.data;
              if (savedState.bookAsGuest) {
                if (!window.location.pathname.startsWith("/trips/transit/")) {
                  window.history.replaceState(
                    null,
                    "",
                    `/trips/transit/${trip?.guest.id}`
                  );
                  console.log(
                    "Updated URL to deep link:",
                    `/trips/transit/${trip?.guest?.id}`
                  );
                }
              }

              console.log("Session guestId:", savedState.guestId);
              console.log("Fetched trip guest.id:", trip.guest?.id);
              console.log("Fetched trip id:", trip.id);


              if (trip?.map_data?.airport?.pickup_area) {
                setAirportPickupArea(trip.map_data.airport.pickup_area);
              }
              setDriver(trip.driver || null);
              setPickup(trip.pickup_address || "");
              setActiveTripId(trip.id);
              setDestination(trip.destination_address || "");
              setFareEstimate(
                trip.amount?.amount ? parseFloat(trip.amount.amount) : null
              );
              setPickupCoords(
                trip.map_data.pickup_location.geometry.coordinates || null
              );
              setDestinationCoords(
                trip.map_data.destination_location.geometry.coordinates || null
              );
              setVerificationCode(trip.verification_code || null);
              setTripProgress(trip.progress || 0);
              if (
                savedState.bookAsGuest &&
                savedState.guestId &&
                (savedState.activeTripId  || trip.id)
              ) {
                console.log(
                  "Resuming WebSocket for authenticated user who booked as guest."
                );

                startWebSocketConnection(
                  savedState.guestId,
                  trip.id
                  // savedState.activeTripI
                  // 
                );
              } else if (savedState.activeTripId) {
                console.log(
                  "Resuming WebSocket for authenticated user who booked normally."
                );
                startWebSocketConnectionForAuthUser(savedState.activeTripId);
              }
              if (["searching"].includes(trip.status.value)) {
                setScreen("assigning");
              } else if (trip.status.value === "accepted") {
                setScreen("driver-assigned");
              } else if (trip.status.value === "driver not found") {
                console.log(
                  "Setting screen to assigning due to driver not found."
                );
                setScreen("assigning");
                stopWebSocketConnection();
                stopPollingTripStatus();
                setTripRequestStatus("no-driver");
                setTripRequestError(`No drivers available for your trip.`);
              } else if (trip.status.value === "active") {
                setScreen("trip-progress");
              } else if (trip.status.value === "completed") {
                setScreen("trip-complete");
              } else if (trip.status.value === "cancelled") {
                console.log(
                  "Stored trip was cancelled, clearing ID and going to dashboard."
                );
                setActiveTripId(null);
                preserveBookingContext();
                if (
                  typeof window !== "undefined" &&
                  window.sessionStorage
                ) {
                  sessionStorage.removeItem("tripData");
                }
                setScreen("dashboard");
              } else {
                console.warn(
                  "Unexpected trip status for user (booked as guest?",
                  !!savedState.bookAsGuest,
                  "):",
                  trip.status
                );
                setScreen("dashboard");
              }
            } else {
              console.error(
                "Error or trip not found when fetching user's trip (booked as guest?",
                !!savedState.bookAsGuest,
                "):",
                response
              );
              setActiveTripId(null);
              sessionStorage.removeItem("tripData");
              setScreen("dashboard");
            }
          } catch (error) {
            console.error(
              "Error fetching user's trip status (booked as guest?",
              !!savedState.bookAsGuest,
              "):",
              error
            );
            setActiveTripId(null);
            sessionStorage.removeItem("tripData");
            setScreen("dashboard");
          }
        } else {
          console.log(
            "No stored active trip ID for authenticated user, going to dashboard..."
          );
          setScreen("dashboard");
        }
      } else {
        console.log(
          "User is not authenticated OR was booking as guest, restoring guest session..."
        );
        console.log("Guest ID from session:", savedState.guestId);
        if (isTransitRoute && savedState.guestId) {
          console.log(
            "Attempting to verify guest trip status for guest ID:",
            savedState.guestId
          );
          setDriver(savedState.driver);

          try {
            const response = await apiClient.get(
              `/trips/${savedState.guestId}`,
              undefined,
              true,
              savedState.guestId
            );
            if (response.status === "success" && response.data) {
              const trip = response.data;
              console.log("Guest trip status fetch was successful: ", trip);
              
              console.log("Session guestId:", savedState.guestId);
              console.log("Fetched trip guest.id:", trip.guest?.id);
              console.log("Fetched trip id:", trip.id);




              if (trip?.map_data?.airport?.pickup_area) {
                setAirportPickupArea(trip.map_data.airport.pickup_area);
              }
              setActiveTripId(trip.id);
              setGuestId(savedState.guestId);
              setDriver(trip.driver || null);
              setPickup(trip.pickup_address || "");
              setDestination(trip.destination_address || "");
              setFareEstimate(
                trip.amount?.amount ? parseFloat(trip.amount.amount) : null
              );
              setPickupCoords(
                trip.map_data.pickup_location.geometry.coordinates || null
              );
              setDestinationCoords(
                trip.map_data.destination_location.geometry.coordinates || null
              );
              setVerificationCode(trip.verification_code || null);
              setTripProgress(trip.progress || 0);
              if (trip.status.value === "searching") {
                setScreen("assigning");
                startWebSocketConnection(savedState.guestId, trip.id);
              } else if (trip.status.value === "driver not found") {
                console.log(
                  "Setting screen to assigning due to driver not found."
                );
                setScreen("assigning");
                stopWebSocketConnection();
                stopPollingTripStatus();
                setTripRequestStatus("no-driver");
                setTripRequestError(`No drivers available for your trip.`);
              } else if (
                ["accepted", "driver_assigned"].includes(trip.status.value)
              ) {
                setScreen("driver-assigned");
                startWebSocketConnection(savedState.guestId, trip.id);
              } else if (trip.status.value === "active") {
                setScreen("trip-progress");
                startWebSocketConnection(savedState.guestId, trip.id);
              } else if (trip.status.value === "completed") {
                setScreen("trip-complete");
              } else if (trip.status.value === "cancelled") {
                preserveBookingContext();
              } else {
                console.log(
                  "Setting screen to dashboard due to unknown trip status."
                );
                setScreen("dashboard");
              }
            } else {
              console.log(
                "Trip not found or error for guest ID, going to booking. Response:",
                response
              );
              setScreen("booking");
              preserveBookingContext();
            }
          } catch (error) {
            console.error("Error verifying guest trip status:", error);
            setScreen("booking");
            preserveBookingContext();
          }
        } else {
          console.log(
            "Not on deep link — clearing guest trip state if present."
          );
          if (savedState.guestId || savedState.activeTripId) {
            saveAppState({
              ...savedState,
              guestId: null,
              activeTripId: null,
              driver: null,
              verificationCode: null,
              tripProgress: 0,
              screen: "booking",
            });
            setGuestId(null);
            setActiveTripId(null);
            setDriver(null);
            setVerificationCode(null);
            setTripProgress(0);
          }
          setScreen("booking");
        }
      }
    } else {
      console.log("No saved state found.");
      if (isAuthenticated) {
        console.log(
          "user is authenticated, so let us take him to dashboard"
        );
        setScreen("dashboard");
      } else {
        console.log(
          "setting screen to booking from initialize app state else condition"
        );
        setScreen("booking");
      }
      setBookAsGuest(false);
    }
    setInitComplete(true);
  }, [
    hasHydrated,
    isAuthLoading,
    isAuthenticated,
    setScreen,
    setBookAsGuest,
    setActiveTripId,
    setDriver,
    setPickup,
    setDestination,
    setFareEstimate,
    setPickupCoords,
    setDestinationCoords,
    setRequirements,
    setPassengerData,
    passengerData,
    setGuestId,
    setVerificationCode,
    setTripProgress,
    setAirportPickupArea,
    startWebSocketConnection,
    startWebSocketConnectionForAuthUser,
    stopWebSocketConnection,
    stopPollingTripStatus,
    setTripRequestStatus,
    setTripRequestError,
    preserveBookingContext,
    setInitComplete,
  ]);

  return { initializeAppState };
};