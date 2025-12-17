// src/components/app/modals/TripHistoryModal.tsx
import { useState, useEffect } from "react";
import { Clock, MapPin, Wallet, Star, X, Loader } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Driver } from "@/types/passenger"; // Assuming this type exists

// Define the type for a trip based on the API response
interface Trip {
  id: string;
  amount: {
    formatted: string;
    currency: string;
    amount: number;
  };
  status: {
    label: string; // e.g., "Completed", "Cancelled"
    value: string; // e.g., "completed", "cancelled"
  };
  pickup_address: string;
  destination_address: string;
  verification_code: string;
  rating: number | null; // Can be null if not rated
  map_data?: { // Optional, as it might not be in history list
    airport?: any; // Or a more specific type if needed
    pickup_location?: any;
    destination_location?: any;
  };
  driver?: Driver; // Driver details might be included
  created_at?: string; // ISO date string
  // Add other fields if present in API response
}

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip?: (tripId: string) => void; // Optional callback to view details of a specific trip
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export default function TripHistoryModal({
  isOpen,
  onClose,
  onSelectTrip,
  showNotification,
}: TripHistoryModalProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10; // Number of trips per page

  // Fetch trips from the API
  const fetchTrips = async (pageNum: number) => {
    if (!isOpen) return; // Only fetch if modal is open

    setLoading(true);
    setError(null);
    try {
      console.log("Fetching trips from API, page:", pageNum);
      const response = await apiClient.get(
                "/trips",
                undefined,
                false,
                undefined,
                true
              );
      console.log("Trip history API response:", response);

      if (response.status === "success" && response.data) {
        const newTrips: Trip[] = response.data.data || []; // Adjust based on actual API structure
        const total = response.data.total || 0; // Adjust based on actual API structure

        // Assuming API returns paginated data with a total count or a way to know if there are more pages
        // Example: If API returns { data: [...], total: 25, page: 1, limit: 10 }
        // Then 25 total, page 1, limit 10 means 3 pages (10, 10, 5). So if (page * limit) < total, hasMore = true
        // Or if API returns { data: [...], next_page: 2 } then hasMore = !!response.data.next_page
        // For now, assuming a simple structure or that we can infer from length
        // A better API might return { data: [...], has_more: true/false }
        // Let's assume response.data contains the list directly or { data: [...], meta: { total: 25, page: 1, limit: 10 } }
        // Simplified check: if we fetched less than the limit, assume no more
        // Or use total if available
        setHasMore(newTrips.length === limit && (response.data.total === undefined || (pageNum * limit) < response.data.total));

        if (pageNum === 1) {
          setTrips(newTrips); // Replace for first page
        } else {
          setTrips(prev => [...prev, ...newTrips]); // Append for subsequent pages
        }
      } else {
        console.error("API response was not successful:", response);
        setError("Failed to fetch trip history. Server responded with an error.");
        showNotification("Failed to fetch trip history.", "error");
      }
    } catch (err) {
      console.error("Error fetching trip history:", err);
      setError("An error occurred while fetching trip history.");
      showNotification("Failed to fetch trip history. Please check your connection.", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch trips when modal opens or page changes
  useEffect(() => {
    if (isOpen) {
      fetchTrips(page);
    }
    // Reset page when modal closes (optional, for future open)
    return () => {
        if (!isOpen) {
            setPage(1);
        }
    };
  }, [isOpen, page]);

  // Handle closing the modal
  const handleClose = () => {
    setPage(1); // Reset page for next open
    setTrips([]); // Clear trips for next open
    setHasMore(true); // Reset for next open
    onClose();
  };

  // Format date if available
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date unknown";
    const date = new Date(dateString);
    // Example: "Today, 2:30 PM" or "Yesterday, 10:15 AM" or "Nov 10, 2024"
    // Using a simple formatter for now
    return date.toLocaleString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      {/* Modal Content */}
      <div className="relative bg-achrams-bg-primary w-full max-w-md h-[80vh] rounded-t-3xl border-t border-achrams-border shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Trip History</h2>
          <button
            onClick={handleClose}
            className="text-achrams-text-light hover:text-achrams-text-secondary"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-achrams-text-secondary mb-2">{error}</p>
              <button
                onClick={() => fetchTrips(page)} // Retry current page
                className="text-achrams-primary-solid font-medium"
              >
                Retry
              </button>
            </div>
          ) : loading && trips.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <Loader className="w-8 h-8 text-achrams-primary-solid animate-spin" />
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-achrams-text-secondary mx-auto mb-2" />
              <p className="text-achrams-text-secondary">No trip history found.</p>
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Driver Name (if available) or Status */}
                        <div className="flex items-center gap-2 mb-1">
                          {trip.driver?.name ? (
                            <span className="text-sm font-semibold text-achrams-text-primary truncate">
                              {trip.driver.name}
                            </span>
                          ) : (
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              trip.status.value === "completed"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800" // Assuming cancelled or other
                            }`}>
                              {trip.status.label}
                            </span>
                          )}
                          {/* Rating */}
                          {trip.rating !== null && (
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs text-achrams-text-secondary">{trip.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Pickup */}
                        <div className="flex items-start gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-achrams-primary-solid flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-achrams-text-primary truncate">
                            {trip.pickup_address}
                          </div>
                        </div>

                        {/* Destination */}
                        <div className="flex items-start gap-2 pl-6"> {/* Indent destination */}
                          <div className="text-sm text-achrams-text-secondary truncate">
                            → {trip.destination_address}
                          </div>
                        </div>

                        {/* Date and Fare */}
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-achrams-border">
                          <span className="text-xs text-achrams-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(trip.created_at)}
                          </span>
                          <div className="flex items-center gap-1">
                            <Wallet className="w-4 h-4 text-achrams-text-secondary" />
                            <span className="text-sm font-medium text-achrams-text-primary">
                              {trip.amount.formatted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Optional: View Details Button */}
                      {onSelectTrip && (
                        <button
                          onClick={() => onSelectTrip(trip.id)}
                          className="ml-4 p-2 text-achrams-primary-solid hover:text-achrams-primary-light"
                          aria-label={`View details for trip ${trip.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Load More / End of List */}
              {loading && trips.length > 0 && (
                <div className="flex justify-center py-4">
                  <Loader className="w-6 h-6 text-achrams-primary-solid animate-spin" />
                </div>
              )}
              {!loading && !hasMore && (
                <div className="text-center text-achrams-text-secondary py-4 text-sm">
                  You've reached the end of your trip history.
                </div>
              )}
              {!loading && hasMore && (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="w-full py-3 mt-4 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all"
                >
                  Load More
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}


// // src/components/app/screens/TripHistoryScreen.tsx
// import { useState, useEffect } from 'react';
// import { MapPin, Clock, Star, Calendar, ChevronRight } from 'lucide-react';
// import { apiClient } from '@/services/apiClient'; // Assuming you create this service

// interface Trip {
//   id: string;
//   amount: {
//     formatted: string;
//   };
//   status: {
//     label: string;
//     value: string;
//   };
//   pickup_address: string;
//   destination_address: string;
//   created_at: string; // ISO date string
//   rating?: {
//     score: number;
//     comment?: string;
//   } | null;
//   // Add other fields as needed from the API response
// }

// export default function TripHistoryScreen({ onBack, onSelectTrip }: { onBack: () => void; onSelectTrip: (tripId: string) => void }) {
//   const [trips, setTrips] = useState<Trip[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchTrips = async () => {
//       try {
//         setLoading(true);
//         setError(null);
//         // NEW: Call the trips API using apiClient
//         // Example: GET /trips?page=1&limit=20 (pagination might be needed)
//         // Example: GET /trips?status=completed (filtering might be needed)
//         const response = await apiClient.get('/trips'); // Use correct endpoint and params from Postman doc

//         console.log("Trip History Response:", response); // Debug log
//         if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
//           setTrips(response.data.data);
//         } else {
//           setError('Failed to load trip history.');
//         }
//       } catch (err) {
//         console.error("Trip History Fetch Error:", err);
//         let errorMessage = 'An unexpected error occurred.';
//         if (err instanceof Error) {
//           errorMessage = err.message;
//         }
//         setError(errorMessage);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchTrips();
//   }, []); // Fetch on mount


//   if (loading) {
//     return (
//       <div className="h-screen bg-achrams-bg-primary flex items-center justify-center">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
//           <p className="text-achrams-text-secondary">Loading trips...</p>
//         </div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center p-6">
//         <p className="text-red-500 text-center mb-6">{error}</p>
//         <button
//           onClick={() => window.location.reload()} // Simple retry for now
//           className="bg-achrams-gradient-primary text-achrams-text-light py-3 px-6 rounded-xl font-semibold"
//         >
//           Retry
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="h-screen bg-achrams-bg-primary flex flex-col">
//       {/* Header */}
//       <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center">
//         <button onClick={onBack} className="mr-4">
//           <ChevronLeft className="w-6 h-6" />
//         </button>
//         <h1 className="text-xl font-bold">Trip History</h1>
//       </div>

//       {/* Content */}
//       <div className="flex-1 overflow-y-auto p-6">
//         {trips.length === 0 ? (
//           <div className="text-center py-12">
//             <p className="text-achrams-text-secondary">No trips found.</p>
//           </div>
//         ) : (
//           <div className="space-y-4">
//             {trips.map((trip) => (
//               <div
//                 key={trip.id}
//                 onClick={() => onSelectTrip(trip.id)} // NEW: Navigate to TripDetailsScreen
//                 className="bg-achrams-bg-secondary rounded-2xl p-5 shadow-sm border border-achrams-border flex items-center justify-between cursor-pointer hover:bg-achrams-bg-primary transition-colors"
//               >
//                 <div className="flex-1 min-w-0">
//                   <div className="flex items-center gap-2 mb-1">
//                     <Calendar className="w-4 h-4 text-achrams-text-tertiary flex-shrink-0" />
//                     <span className="text-xs text-achrams-text-tertiary">
//                       {new Date(trip.created_at).toLocaleDateString()}
//                     </span>
//                   </div>
//                   <div className="flex items-start gap-2 mb-2">
//                     <MapPin className="w-4 h-4 text-achrams-text-secondary mt-0.5 flex-shrink-0" />
//                     <div className="text-sm text-achrams-text-primary truncate">{trip.pickup_address}</div>
//                   </div>
//                   <div className="flex items-start gap-2 mb-2">
//                     <MapPin className="w-4 h-4 text-achrams-text-secondary mt-0.5 flex-shrink-0" />
//                     <div className="text-sm text-achrams-text-primary truncate">{trip.destination_address}</div>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <div className="flex items-center gap-1">
//                       <span className="text-sm font-medium text-achrams-text-primary">{trip.amount.formatted}</span>
//                       <span className={`text-xs px-2 py-0.5 rounded-full ${
//                         trip.status.value === 'completed' ? 'bg-green-100 text-green-800' :
//                         trip.status.value === 'cancelled' ? 'bg-red-100 text-red-800' :
//                         'bg-yellow-100 text-yellow-800' // For statuses like 'driver not found', 'searching', etc.
//                       }`}>
//                         {trip.status.label}
//                       </span>
//                     </div>
//                     {trip.rating && (
//                       <div className="flex items-center gap-1">
//                         <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
//                         <span className="text-xs text-achrams-text-secondary">{trip.rating.score}</span>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//                 <ChevronRight className="w-5 h-5 text-achrams-text-secondary flex-shrink-0 ml-2" />
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }