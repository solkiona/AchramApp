import { useCallback, useRef, useEffect} from "react";
import ReconnectingWebSocket from "reconnecting-websocket";
import { apiClient } from "@/lib/api";
import posthog from "posthog-js";

type UseTripWebSocketProps = {
  webSocketConnection: ReconnectingWebSocket | null;
  setWebSocketConnection: (conn: ReconnectingWebSocket | null) => void;
  setWebSocketStatus: (status: "connecting" | "open" | "closed" | "reconnecting") => void;
  activeTripIdRef: React.MutableRefObject<string | null>;
  activeGuestIdRef: React.MutableRefObject<string | null>;
  screenRef: React.MutableRefObject<string | null>;
  pollingIntervalRef: React.MutableRefObject<NodeJS.Timeout | null>;
  stopPollingTripStatus: () => void;
  setTripRequestStatus: (status: "loading" | "accepted" | "no-driver" | "error" | null) => void;
  setTripRequestError: (err: string | null) => void;
  setDriver: (driver: any) => void;
  setScreen: (screen: string) => void;
  setDriverLocation: (loc: [number, number] | null) => void;
  showNotification: (msg: string, type: "info" | "success" | "warning" | "error") => void;
  setAirportPickupArea: (area: any) => void;
  setVerificationCode: (code: string | null) => void;
  setTripProgress: (progress: number) => void;
  setActiveTripId: (id: string | null) => void;
  preserveBookingContext: () => void;
  setPickup:(val: string)=> void;
  setPickupCoords: (val: any) => void;
  setDestinationCoords: (val: any) => void;
  setDestination: (val: string) => void;
  setFareEstimate: (val: number)=> void;
  guestId: string | null;
  activeTripId: string | null;
  bookAsGuest: boolean;
  isAuthenticated: boolean;
};

export const useTripWebSocket = ({
  webSocketConnection,
  setWebSocketConnection,
  setWebSocketStatus,
  activeTripIdRef,
  activeGuestIdRef,
  screenRef,
  pollingIntervalRef,
  stopPollingTripStatus,
  setTripRequestStatus,
  setTripRequestError,
  setDriver,
  setScreen,
  setDriverLocation,
  setPickup,
  setPickupCoords,
  setDestinationCoords,
  setDestination,
  setFareEstimate,
  showNotification,
  setAirportPickupArea,
  setVerificationCode,
  setTripProgress,
  setActiveTripId,
  preserveBookingContext,
  guestId,
  activeTripId,
  bookAsGuest,
  isAuthenticated,
}: UseTripWebSocketProps) => {

  const bookAsGuestRef = useRef(bookAsGuest);
  const isAuthenticatedRef = useRef(isAuthenticated);

  useEffect(() => {

    bookAsGuestRef.current = bookAsGuest;
    isAuthenticatedRef.current = isAuthenticated;
  }, [bookAsGuest, isAuthenticated])

  const webSocketConnectionRef = useRef(webSocketConnection);

  useEffect(() => {
    webSocketConnectionRef.current = webSocketConnection;
  }, [webSocketConnection]);



  const stopWebSocketConnection = useCallback(() => {
    if (webSocketConnection) {
      stopPollingTripStatus();
      console.log("Manually stopping WebSocket connection.");
      webSocketConnection.close();
      setWebSocketConnection(null);
      setWebSocketStatus("closed");
    }
  }, [webSocketConnection, setWebSocketConnection, setWebSocketStatus, stopPollingTripStatus]);


  const fetchTripStatus = useCallback(
    async (tripId: string, guestId: string) => {
      if (!tripId) {
        console.warn("fetchTripStatus called without a tripId");
        return;
      }
      try {
        console.log(`Polling trip status for ID: ${tripId}`);
        let response;
        if (!bookAsGuestRef.current && isAuthenticatedRef.current) {
          response = await apiClient.get(
            `/trips/${tripId}`,
            undefined,
            false,
            undefined,
            true
          );
        } else {
          if (!guestId) {
            console.warn(
              "fetchTripStatus called without guestId for guest user"
            );
            stopPollingTripStatus();
            return;
          }
          console.log("Guest Id in polling function", guestId);
          response = await apiClient.get(
            `/trips/${guestId}`,
            undefined,
            true,
            guestId
          );
        }
        if (response.status === "success" && response.data) {
          const trip = response.data;
          console.log(
            `Polled trip status: ${trip.status.value}, has driver: !!${trip.driver}`
          );
          if (trip?.map_data?.airport?.pickup_area) {
            setAirportPickupArea(trip.map_data.airport.pickup_area);
          }
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
          const terminalStates = ["driver not found", "cancelled", "completed"];
          if (terminalStates.includes(trip.status.value)) {
            console.log(
              `🛑 Terminal state reached: ${trip.status.value}. STOPPING POLLING.`
            );
            stopPollingTripStatus();
            stopWebSocketConnection();
            if (trip.status.value === "driver not found") {
              setTripRequestStatus("no-driver");
              setTripRequestError("No drivers available for your trip.");
            } else if (trip.status.value === "completed") {

              showNotification("Trip Completed", "success");
              setScreen("trip-complete");
            } else if (trip.status.value === "cancelled") {
              preserveBookingContext();
              showNotification("Trip was cancelled", "info");
              setScreen("booking");
            }
            return;
          }
          if (
            (trip.status.value === "accepted" ||
              trip.status.value === "driver_assigned") &&
            trip.driver
          ) {
            console.log("✅ Driver assigned via polling. STOPPING POLLING.");
            stopPollingTripStatus();
            setScreen("driver-assigned");
            return;
          }
          if (trip.status.value === "active") {
            console.log("🚗 Trip is active, updating screen");
            setScreen("trip-progress");
          }
          console.log(`⏳ Trip still searching. Continuing to poll.`);
        } else {
          console.error("❌ Polling API error:", response);
        }
      } catch (err) {
        console.error("❌ Error polling trip status:", err);
      }
    },
    [
      setDriver,
      setPickup,
      setDestination,
      setFareEstimate,
      setPickupCoords,
      setDestinationCoords,
      setVerificationCode,
      setTripProgress,
      setAirportPickupArea,
      stopPollingTripStatus,
      stopWebSocketConnection,
      setTripRequestStatus,
      setTripRequestError,
      showNotification,
      setScreen,
      preserveBookingContext,
    ]
  );

  const startPollingTripStatus = useCallback(
    (tripId: string, guestId: string) => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      console.log(
        `Starting polling for trip ${tripId} every 20 seconds (fallback).`
      );
      const interval = setInterval(() => {
        fetchTripStatus(tripId, guestId);
      }, 20000);
      pollingIntervalRef.current = interval;
    },
    [fetchTripStatus, pollingIntervalRef]
  );


  const startWebSocketConnectionForAuthUser = useCallback(

    (tripId: string) => {

      if(!tripId){
        console.warn("Cannot start auth Websocket: missing tripId");
        setScreen("booking");
        return;
      }
      if (webSocketConnectionRef.current && activeTripIdRef.current !== tripId) {
        console.log("Closing existing WebSocket connection.");
        webSocketConnectionRef.current.close();
      }
      const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?trip_id=${tripId}`;
      console.log(
        `Attempting to connect to WebSocket for authenticated user: ${wsUrl}`
      );
      const rws = new ReconnectingWebSocket(wsUrl, [], {
        connectionTimeout: 10000,
        maxRetries: 10,
        maxReconnectionDelay: 10000,
      });
      rws.onopen = () => {
        console.log("WebSocket connection opened for authenticated user.");
        setWebSocketStatus("open");
        stopPollingTripStatus();
      };
      rws.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log("Received WebSocket message in page.tsx:", messageData);
          const { event: eventType, data: tripData, message_id: incomingMessageId } = messageData;
          if (incomingMessageId) {
            const ackMessage = JSON.stringify({
              event: "ack",
              data: { message_id: incomingMessageId },
            });
            console.log("sending ACK for message_id", incomingMessageId);
            rws.send(ackMessage);
          }
          if (tripData?.map_data?.airport?.pickup_area) {
            setAirportPickupArea(tripData.map_data.airport.pickup_area);
          }
          if (
            eventType === "trip:assigned" ||
            eventType === "trip:status:update"
          ) {
            if (tripData.status.value === "driver not found") {
              console.log(
                "Driver not found via WebSocket (page.tsx), updating UI."
              );
              
              setActiveTripId(null);
              setWebSocketConnection(null);
              stopPollingTripStatus();
              setTripRequestStatus("no-driver");
              setTripRequestError(`No drivers available for your trip.`);
              return;
            }
            if (
              (tripData.status.value === "accepted" ||
                tripData.status.value === "driver_assigned") &&
              tripData.driver
            ) {
              console.log(
                `${tripData.status.label} via WebSocket (page.tsx), updating UI with driver.`
              );
              setDriver(tripData.driver);
              console.log("Active Trip Id: ", activeTripId);
              setScreen("driver-assigned");
              stopPollingTripStatus();
              console.log("stopPollingTripStatus was just called");
            } else if (tripData.status.value === "active") {
              console.log(
                `Trip started (status: ${tripData.status.label}) via WebSocket (page.tsx), transitioning to trip-progress.`
              );
              setScreen("trip-progress");
            } else if (
              tripData.status.value === "cancelled" ||
              tripData.status.value === "completed"
            ) {
              console.log(
                `Trip ${tripData.id} is now ${tripData.status.value} via WebSocket (page.tsx).`
              );
              setWebSocketConnection(null);
              stopPollingTripStatus();
              setTripProgress(0);
              setVerificationCode(null);
              if (tripData.status.value === "completed") {
                setScreen("trip-complete");
                showNotification("Trip completed successfully", "info");
              } else if (tripData.status.value === "cancelled") {
                showNotification("Trip was cancelled successfully", "info");
                setScreen("booking");
                setDriver(null);
                preserveBookingContext();
              }
            } else {
              console.log(
                `Received trip status update via WebSocket (page.tsx): ${tripData.status.value}`
              );
            }
          }
          if (eventType === "trip:location:driver") {
            const coords = tripData?.map_data?.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              setDriverLocation(coords);
              setDriver((prevDriver: any) => {
                if (!prevDriver) return null;
                return {
                  ...prevDriver,
                  location: coords,
                };
              });
              console.log("Driver location updated via WebSocket:", coords);
            } else {
              console.warn("Invalid driver location data received:", coords);
            }
            return;
          } else {
            console.log(
              `Received other WebSocket event (page.tsx): ${eventType}`
            );
          }
        } catch (error) {
          console.error(
            "Error parsing WebSocket message in page.tsx:",
            error,
            event.data
          );
        }
      };
      rws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        const currentTripId = activeTripIdRef.current;
        const currentScreen = screenRef.current;
        const currentPollingId = pollingIntervalRef.current;
        setWebSocketStatus("closed");
        if (
          currentTripId &&
          ![
            "driver-assigned",
            "completed",
            "cancelled",
            "driver not found",
          ].includes(currentScreen) &&
          !currentPollingId
        ) {
          console.log(
            `WebSocket closed unexpectedly while screen is '${currentScreen}', starting polling for trip ${currentTripId} as fallback.`
          );
          // Note: guestId must come from closure
          startPollingTripStatus(currentTripId, guestId);
        } else {
          console.log(
            `WebSocket closed, but not starting polling. Trip ID: ${currentTripId}, Screen: ${currentScreen}, Polling Active: ${!!currentPollingId}`
          );
          if (
            [
              "driver-assigned",
              "completed",
              "cancelled",
              "driver not found",
            ].includes(currentScreen)
          ) {
            console.log(
              "Screen indicates final state or driver-assigned (post-cancellation), ensuring polling is stopped."
            );
            stopPollingTripStatus();
          }
        }
      };
      rws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      setWebSocketConnection(rws);
      setWebSocketStatus("connecting");
    },
    [
      // webSocketConnection,
      setWebSocketStatus,
      stopPollingTripStatus,
      setTripRequestStatus,
      setTripRequestError,
      setDriver,
      // setScreen,
      setDriverLocation,
      showNotification,
      setAirportPickupArea,
      setVerificationCode,
      setTripProgress,
      setActiveTripId,
      preserveBookingContext,
      setWebSocketConnection,
      // activeTripId,
      // guestId,
      activeTripIdRef,
      screenRef,
      pollingIntervalRef,
    ]
  );

  const startWebSocketConnection = useCallback(
    (guestId: string, tripId: string) => {
      if(!guestId || !tripId){
        console.warn("Cannot start guest websocket: missing guestId or tripId" , {guestId, tripId})
        setTripRequestStatus('error');
        setTripRequestError("Session Expired. Please start a new booking.");
        setScreen("booking");
        return
      }
      if (webSocketConnectionRef.current && activeTripIdRef.current !== tripId ) {
        console.log("Closing existing WebSocket connection.");
        webSocketConnectionRef.current.close();
      }
      const wsUrl = `wss://api.achrams.com.ng/ws/v1/app?guest_id=${guestId}`;
      console.log(`Attempting to connect to WebSocket for guest: ${wsUrl}`);
      const rws = new ReconnectingWebSocket(wsUrl, [], {
        connectionTimeout: 10000,
        maxRetries: 10,
        maxReconnectionDelay: 10000,
      });
      rws.onopen = () => {
        console.log("WebSocket connection opened for guest.");
        setWebSocketStatus("open");
        stopPollingTripStatus();
      };
      rws.onmessage = (event) => {
        try {
          const messageData = JSON.parse(event.data);
          console.log("Received WebSocket message in page.tsx:", messageData);
          const { event: eventType, data: tripData, message_id: incomingMessageId } = messageData;
          if (incomingMessageId) {
            const ackMessage = JSON.stringify({
              event: "ack",
              data: { message_id: incomingMessageId },
            });
            console.log("sending ACK for message_id", incomingMessageId);
            rws.send(ackMessage);
          }
          if (tripData?.map_data?.airport?.pickup_area) {
            setAirportPickupArea(tripData.map_data.airport.pickup_area);
          }
          if (
            eventType === "trip:assigned" ||
            eventType === "trip:status:update"
          ) {
            if (tripData.status.value === "driver not found") {
              console.log(
                "Driver not found via WebSocket (page.tsx), updating UI."
              );
              setActiveTripId(null); 
              setWebSocketConnection(null);
              stopPollingTripStatus();
              setTripRequestStatus("no-driver");
              setTripRequestError(`No drivers available for your trip.`);
              return;
            }
            if (
              (tripData.status.value === "accepted" ||
                tripData.status.value === "driver_assigned") &&
              tripData.driver
            ) {
              console.log(
                `${tripData.status.label} via WebSocket (page.tsx), updating UI with driver.`
              );
              setDriver(tripData.driver);
              console.log("Active Trip Id: ", activeTripId);
              setScreen("driver-assigned");
              stopPollingTripStatus();
              console.log("stopPollingTripStatus was just called");
            } else if (tripData.status.value === "active") {
              console.log(
                `Trip started (status: ${tripData.status.label}) via WebSocket (page.tsx), transitioning to trip-progress.`
              );
              setScreen("trip-progress");
            } else if (
              tripData.status.value === "cancelled" ||
              tripData.status.value === "completed"
            ) {
              console.log(
                `Trip ${tripData.id} is now ${tripData.status.value} via WebSocket (page.tsx).`
              );
              setWebSocketConnection(null);
              stopPollingTripStatus();
              setTripProgress(0);
              setVerificationCode(null);
              if (tripData.status.value === "completed") {
                setScreen("trip-complete");
                showNotification("Trip completed successfully", "info");
              } else if (tripData.status.value === "cancelled") {
                showNotification("Trip was cancelled successfully", "info");
                setDriver(null);
                setScreen("booking");
                preserveBookingContext();
              }
            } else {
              console.log(
                `Received trip status update via WebSocket (page.tsx): ${tripData.status.value}`
              );
            }
          }
          if (eventType === "trip:location:driver") {
            const coords = tripData?.map_data?.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              setDriverLocation(coords);
              setDriver((prevDriver: any) => {
                if (!prevDriver) return null;
                return {
                  ...prevDriver,
                  location: coords,
                };
              });
              console.log("Driver location updated via WebSocket:", coords);
            } else {
              console.warn("Invalid driver location data received:", coords);
            }
            return;
          } else {
            console.log(
              `Received other WebSocket event (page.tsx): ${eventType}`
            );
          }
        } catch (error) {
          console.error(
            "Error parsing WebSocket message in page.tsx:",
            error,
            event.data
          );
        }
      };
      rws.onclose = (event) => {
        console.log("WebSocket connection closed:", event.code, event.reason);
        const currentTripId = activeTripIdRef.current;
        const currentGuestId = activeGuestIdRef.current;
        const currentScreen = screenRef.current;
        const currentPollingId = pollingIntervalRef.current;
        setWebSocketStatus("closed");
        if (
          currentTripId &&
          ![
            "driver-assigned",
            "completed",
            "cancelled",
            "driver not found",
          ].includes(currentScreen) &&
          !currentPollingId
        ) {
          console.log(
            `WebSocket closed unexpectedly while screen is '${currentScreen}', starting polling for trip ${currentTripId} as fallback.`
          );
          startPollingTripStatus(currentTripId, currentGuestId);
        } else {
          console.log(
            `WebSocket closed, but not starting polling. Trip ID: ${currentTripId}, Screen: ${currentScreen}, Polling Active: ${!!currentPollingId}`
          );
          if (
            [
              "driver-assigned",
              "completed",
              "cancelled",
              "driver not found",
            ].includes(currentScreen)
          ) {
            console.log(
              "Screen indicates final state or driver-assigned (post-cancellation), ensuring polling is stopped."
            );
            stopPollingTripStatus();
          }
        }
      };
      rws.onerror = (error) => {
        console.error("WebSocket error:", error);
      };
      setWebSocketConnection(rws);
      setWebSocketStatus("connecting");
    },
    [
      // webSocketConnection,
      setWebSocketStatus,
      stopPollingTripStatus,
      setTripRequestStatus,
      setTripRequestError,
      setDriver,
      // setScreen,
      setDriverLocation,
      showNotification,
      setAirportPickupArea,
      setVerificationCode,
      setTripProgress,
      setActiveTripId,
      preserveBookingContext,
      setWebSocketConnection,
      // activeTripId,
      // guestId,
      activeTripIdRef,
      activeGuestIdRef,
      screenRef,
      pollingIntervalRef,
    ]
  );

  

  

  
  return {
    startWebSocketConnectionForAuthUser,
    startWebSocketConnection,
    stopWebSocketConnection,
    startPollingTripStatus,
    fetchTripStatus,
  };
};