export const getScreenFromTripStatus = (
  statusValue: string,
  previousScreen: string | null
): string | null => {
  if (["searching"].includes(statusValue)) {
    return "assigning";
  } else if (statusValue === "driver not found") {
    return "assigning";
  } else if (["accepted", "driver_assigned"].includes(statusValue)) {
    return "driver-assigned";
  } else if (statusValue === "active") {
    return "trip-progress";
  } else if (statusValue === "completed") {
    return "trip-complete";
  } else if (statusValue === "cancelled") {
    return "booking";
  } else {
    return "dashboard";
  }
};