import { PersistedState } from "@/types/app";

export const saveAppState = (state: PersistedState) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem("achrams_app_state", JSON.stringify(state));
      console.log("App state saved to sessionStorage", state);
    } catch (e) {
      console.error("Failed to save app state to sessionStorage", e);
    }
  }
};


export const loadAppState = (): PersistedState | null => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const savedStateStr = sessionStorage.getItem("achrams_app_state");
      if (savedStateStr) {
        const savedState = JSON.parse(savedStateStr) as PersistedState;
        console.log("App state loaded from sessionStorage", savedState);
        return savedState;
      }
    } catch (e) {
      console.error("Failed to load app state from sessionStorage", e);
    }
  }
  return null;
};


// NEW: Helper to save trip data with new fields
export const saveTripData = (tripData: any) => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      sessionStorage.setItem("tripData", JSON.stringify(tripData));
      console.log("Trip data saved to sessionStorage:", tripData);
    } catch (e) {
      console.error("Failed to save trip data to sessionStorage", e);
    }
  }
};

export const loadTripData = (): any | null => {
  if (typeof window !== "undefined" && window.sessionStorage) {
    try {
      const savedTripDataStr = sessionStorage.getItem("tripData");
      if (savedTripDataStr) {
        const savedTripData = JSON.parse(savedTripDataStr);
        console.log("Trip data loaded from sessionStorage", savedTripData);
        return savedTripData;
      }
    } catch (e) {
      console.error("Failed to load trip data from sessionStorage", e);
    }
  }
  return null;
};