import { useState, useEffect, useRef } from "react";
import { PersistedState } from "@/types/app";
import { saveAppState, loadAppState } from "@/lib/storage/sessionState";
import router from "next/router";

export const usePersistedAppState = (
  isAuthenticated: boolean,
  isNavigatingToDashboard: boolean,
  previousScreen: string | null,
  screen: string | null,
  hasHydrated: boolean,
  pickup: string,
  destination: string,
  fareEstimate: number | null,
  driver: any | null,
  tripProgress: number,
  pickupCoords: [number, number] | null,
  destinationCoords: [number, number] | null,
  verificationCode: string | null,
  activeTripId: string | null,
  guestId: string | null,
  bookAsGuest: boolean,
  setIsNavigatingToDashboard: (val: boolean) => void
) => {
  useEffect(() => {
    if (hasHydrated && screen !== null) {
      const screenToSave =
        isNavigatingToDashboard && previousScreen ? previousScreen : screen;
      const stateToSave: PersistedState = {
        screen: screenToSave,
        pickup,
        destination,
        fareEstimate,
        driver,
        tripProgress,
        pickupCoords,
        destinationCoords,
        verificationCode,
        activeTripId,
        guestId,
        bookAsGuest,
      };
      console.log("Saving app state with screen:", screenToSave);
      saveAppState(stateToSave);
      if (isNavigatingToDashboard) {
        setIsNavigatingToDashboard(false);
      }
    }
  }, [
    screen,
    pickup,
    destination,
    fareEstimate,
    driver,
    tripProgress,
    pickupCoords,
    destinationCoords,
    verificationCode,
    activeTripId,
    guestId,
    bookAsGuest,
    hasHydrated,
    isNavigatingToDashboard,
    previousScreen,
    setIsNavigatingToDashboard,
  ]);
};