import { useCallback } from "react";
import { apiClient } from "@/lib/api";
import { buildTripData } from "@/lib/booking/buildTripData";
import { formatPhoneNumber } from "@/lib/booking/formatPhone";
import { findNearestAirport, KNOWN_AIRPORTS } from "@/lib/airports";
import posthog from "posthog-js";

type UseBookingProps = {
  tripHistory: any[];
  pickup: string;
  destination: string;
  fareEstimate: number | null;
  pickupCoords: [number, number] | null;
  destinationCoords: [number, number] | null;
  passengerData: any;
  requirements: any;
  bookAsGuest: boolean;
  tripRequestStatus: any;
  isAuthenticated: boolean;
  setTripRequestStatus: (status: "loading" | "accepted" | "no-driver" | "error" | null) => void;
  setTripRequestError: (err: string | null) => void;
  setShowPassengerDetails: (show: boolean) => void;
  clearBookingErrors: () => void;
  handleBookingApiError: (err: any) => void;
  bookingFieldErrors: Record<string, string[]>;
  bookingGeneralError: string | undefined;
  showNotification: (msg: string, type: "info" | "success" | "warning" | "error") => void;
  setVerificationCode: (code: string | null) => void;
  setActiveTripId: (id: string | null) => void;
  setGuestId: (id: string | null) => void;
  setScreen: (screen: string) => void;
  setDriver: (driver: any) => void;
  setAirportPickupArea: (area: any) => void;
  preserveBookingContext: () => void;
  startWebSocketConnection: (guestId: string, tripId: string) => void;
  startWebSocketConnectionForAuthUser: (tripId: string) => void;
  bookTripRetry: boolean;
  setBookTripRetry: (retry: boolean) => void;

};

export const useBooking = ({
  tripHistory,
  pickup,
  destination,
  fareEstimate,
  pickupCoords,
  destinationCoords,
  passengerData,
  requirements,
  bookAsGuest,
  isAuthenticated,
  tripRequestStatus,
  setTripRequestStatus,
  setTripRequestError,
  setShowPassengerDetails,
  clearBookingErrors,
  handleBookingApiError,
  bookingFieldErrors,
  bookingGeneralError,
  showNotification,
  setVerificationCode,
  setActiveTripId,
  setGuestId,
  setScreen,
  setDriver,
  setAirportPickupArea,
  preserveBookingContext,
  startWebSocketConnection,
  startWebSocketConnectionForAuthUser,
  bookTripRetry,
  setBookTripRetry,
}: UseBookingProps) => {

  

  const handleRequestRide = useCallback(async () => {
    let tripData: any = null;
    
    if (
      typeof window !== "undefined" &&
      window.sessionStorage &&
      tripRequestStatus === "no-driver"
    ) {
      const savedTripData = sessionStorage.getItem("tripData");
      if (savedTripData) {
        tripData = JSON.parse(savedTripData);
        console.log("Using existing tripData from sessionStorage:", tripData);
      }
    }
    if (!tripData) {
      if (bookAsGuest || !isAuthenticated) {
        if (
          !passengerData.name ||
          !passengerData.phone ||
          !passengerData.email
        ) {
          showNotification("Please fill all passenger details.", "error");
          return;
        }
      }
      if (!pickupCoords || !destinationCoords) {
        showNotification(
          "Pickup and destination locations are required.",
          "error"
        );
        return;
      }
      let airportId: string | null = null;
      
      if (pickup.startsWith("Use my current location")) {
        const nearestAirports = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearestAirports || !nearestAirports.length) {
          setTripRequestStatus("error");
          setTripRequestError(
            "You're outside our service area. Booking not available from this location."
          );
          return;
        }
        const selectedAirport = nearestAirports.find(
          (apt) => apt.name === pickup
        );
        if (!selectedAirport) {
          console.error(
            "Selected pickup name does not match any fetched airport:",
            pickup,
            nearestAirports
          );
          setTripRequestStatus("error");
          setTripRequestError(
            "Could not confirm selected pickup location. Please try again."
          );
          return;
        }
        airportId = selectedAirport.id;
      } else if (pickup in KNOWN_AIRPORTS) {
        airportId = KNOWN_AIRPORTS[pickup];
      } else {
        const nearestAirports = await findNearestAirport(
          pickupCoords[0],
          pickupCoords[1]
        );
        if (!nearestAirports || !nearestAirports.length) {
          setTripRequestStatus("error");
          setTripRequestError(
            "Pickup location is not near a supported airport."
          );
          return;
        }
        const selectedAirport = nearestAirports.find(
          (apt) => apt.name === pickup
        );
        if (selectedAirport) {
          airportId = selectedAirport.id;
        } else {
          console.warn(
            "Typed pickup name did not match any fetched airport name, using first result.",
            pickup,
            nearestAirports
          );
          airportId = nearestAirports[0].id;
        }
      }
      if (!airportId) {
        console.error("Airport ID not available for booking.");
        showNotification(
          "Failed to confirm pickup location. Please try again.",
          "error"
        );
        return;
      }

      tripData = buildTripData(
        fareEstimate,
        pickup,
        destination,
        pickupCoords,
        destinationCoords,
        passengerData,
        requirements,
        airportId,
        bookAsGuest,
        isAuthenticated,
        formatPhoneNumber
      );
      console.log("Request Data:", tripData);
      if (typeof window !== "undefined" && window.sessionStorage) {
        sessionStorage.setItem("tripData", JSON.stringify(tripData));
        console.log("Trip data saved to sessionStorage:", tripData);
      }
    }

    clearBookingErrors();
    setTripRequestStatus("loading");
    setTripRequestError(null);
    try {
      let response;
      const isFirstBooking = tripHistory.length === 0;

      if (!bookAsGuest && isAuthenticated) {
        console.log("Booking as an authenticated user");
        //posthog event capture
        if(isFirstBooking){

          posthog.capture("passenger_first_booking", {
          destination: destination,
          booking_method: "Authenticated User",
          fare_estimate: fareEstimate,
          airport_location: pickup
        });

        } else {

          console.log("Passenger Repeated Booking")
           posthog.capture("passenger_repeated_booking", {
          destination: destination,
          booking_method: "Authenticated User",
          fare_estimate: fareEstimate,
          airport_location: pickup
        });
        }
        
        response = await apiClient.post("/trips", tripData, undefined, undefined, true);
      } else {

        
        //posthog event capture
        posthog.capture("guest_booking_started", {
        destination: destination,
        booking_method: "guest",
        fare_estimate: fareEstimate,
        airport_location: pickup
      });
        response = await apiClient.post("/trips/guest-booking", tripData);
      }
      console.log("Raw API Response:", response);
      if (response.status === "success" && response.data) {
        const trip = response.data;
        setShowPassengerDetails(false);
        const extractedGuestId = trip.guest?.id;
        if (extractedGuestId) {
          setGuestId(extractedGuestId);
        }
        if ((bookAsGuest || !isAuthenticated) && extractedGuestId) {
          if (bookTripRetry || !window.location.pathname.startsWith('/trips/transit/')) {
            window.history.replaceState(null, '', `/trips/transit/${extractedGuestId}`);
            console.log('Updated URL to deep link:', `/trips/transit/${extractedGuestId}`);
          }
          console.log("Trip data received:", trip);
          console.log("Guest ID received:", extractedGuestId);
          if (trip?.map_data?.airport?.pickup_area) {
            setAirportPickupArea(trip.map_data.airport.pickup_area);
          }
          setVerificationCode(trip.verification_code || "");
          setActiveTripId(trip.id);
          setGuestId(extractedGuestId);
          if (trip.status.value === "searching") {
            setTripRequestStatus(null);
            setScreen("assigning");
            startWebSocketConnection(extractedGuestId, trip.id);
          } else if (trip.status.value === "driver_assigned" && trip.driver) {
            setDriver(trip.driver);
            setTripRequestStatus(null);
            setScreen("driver-assigned");
          } else {
            console.warn("Unexpected trip status after booking:", trip.status);
            setTripRequestStatus("error");
            setTripRequestError(`Unexpected booking state: ${trip.status.label}`);
          }
        } else {
          console.log("Trip data received:", trip);
          setVerificationCode(trip.verification_code || "");
          setActiveTripId(trip.id);
          if (trip.status.value === "searching") {
            setTripRequestStatus(null);
            setScreen("assigning");
            startWebSocketConnectionForAuthUser(trip.id);
          } else if (trip.status.value === "driver_assigned" && trip.driver) {
            setDriver(trip.driver);
            setTripRequestStatus(null);
            setScreen("driver-assigned");
          } else {
            console.warn("Unexpected trip status after booking:", trip.status);
            setTripRequestStatus("error");
            setTripRequestError(`Unexpected booking state: ${trip.status.label}`);
          }
        }
      } else {
        console.error(
          "API responded with non-success status or missing data:",
          response
        );
        handleBookingApiError(response);
        if (response?.details?.destination_location) {
          setTripRequestStatus("error");
          setTripRequestError(response?.details?.destination_location?.[0]);
        }
      }
    } catch (err: any) {
      console.error("Booking error:", err);
      handleBookingApiError(err);
      const hasFieldErrors = Object.keys(bookingFieldErrors).length > 0;
      if (bookingGeneralError) {
        console.log("general booking error occured");
        setTripRequestStatus("error");
        setTripRequestError(bookingGeneralError);
        if (!hasFieldErrors) {
          setShowPassengerDetails(false);
        }
      }
    }
  }, [
    tripHistory,
    pickup,
    destination,
    fareEstimate,
    pickupCoords,
    destinationCoords,
    passengerData,
    requirements,
    bookAsGuest,
    isAuthenticated,
    setTripRequestStatus,
    setTripRequestError,
    setShowPassengerDetails,
    clearBookingErrors,
    handleBookingApiError,
    bookingFieldErrors,
    bookingGeneralError,
    showNotification,
    setVerificationCode,
    setActiveTripId,
    setGuestId,
    setScreen,
    setDriver,
    setAirportPickupArea,
    preserveBookingContext,
    startWebSocketConnection,
    startWebSocketConnectionForAuthUser,
    bookTripRetry,
    setBookTripRetry,
    tripRequestStatus,
  ]);

  return { handleRequestRide };
};