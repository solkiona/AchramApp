// src/components/app/modals/TripHistoryModal.tsx
import { useState, useEffect } from "react";
import { Clock, MapPin, Wallet, Star, X, Loader } from "lucide-react";
import { apiClient } from "@/lib/api";
import { Driver } from "@/types/passenger";

interface Trip {
  id: string;
  amount: {
    formatted: string;
    currency: string;
    amount: number;
  };
  status: {
    label: string;
    value: string;
  };
  pickup_address: string;
  destination_address: string;
  verification_code: string;
  rating: { score: number; comment: string } | null;
  map_data?: {
    airport?: any;
    pickup_location?: any;
    destination_location?: any;
  };
  driver?: Driver;
  created_at: string;
}

interface TripHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTrip?: (tripId: string) => void;
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
  const limit = 10;

  const fetchTrips = async (pageNum: number) => {
    if (!isOpen) return;

    setLoading(true);
    setError(null);
    try {
      console.log("Fetching trips from API, page:", pageNum);
      
      // Build query string with pagination params
      const queryParams = `?page=${pageNum}&page_size=${limit}`;
      
      const response = await apiClient.get(
        `/trips${queryParams}`,
        undefined,
        false,
        undefined,
        true
      );
      
      console.log("Trip history API response:", response);

      if (response.count > 0) {
        // ✅ FIX: response.data IS the pagination object, not nested
        const paginationData = response;
        console.log(response.data)
        const newTrips: Trip[] = paginationData.results || [];
        const currentPage = paginationData.current_page;
        const pageCount = paginationData.page_count;
        const pageSize = paginationData.page_size;

        console.log(`Fetched ${newTrips.length} trips for page ${currentPage}/${pageCount}`);

        // Check if there are more pages
        setHasMore(currentPage < pageCount);

        if (pageNum === 1) {
          setTrips(newTrips);
        } else {
          setTrips(prev => [...prev, ...newTrips]);
        }
      } else {
        console.error("API response was not successful:", response);
        setError("Failed to fetch trip history.");
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

  useEffect(() => {
    if (isOpen) {
      fetchTrips(page);
    }
    return () => {
      if (!isOpen) {
        setPage(1);
      }
    };
  }, [isOpen, page]);

  const handleClose = () => {
    setPage(1);
    setTrips([]);
    setHasMore(true);
    onClose();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "Date unknown";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = now.getTime() - date.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (days === 0) {
        return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      } else if (days === 1) {
        return `Yesterday, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
      } else if (days < 7) {
        return `${days} days ago`;
      } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      }
    } catch (e) {
      return "Invalid date";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
      />
      <div className="relative bg-white w-full max-w-md h-[80vh] rounded-t-3xl border-t border-achrams-border shadow-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-achrams-text-light px-6 py-4 flex items-center justify-between shadow-md">
          <h2 className="text-xl font-bold">Trip History</h2>
          <button
            onClick={handleClose}
            className="text-achrams-text-light hover:text-achrams-text-light/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {error ? (
            <div className="text-center py-8">
              <p className="text-achrams-text-secondary mb-4">{error}</p>
              <button
                onClick={() => fetchTrips(page)}
                className="px-6 py-2 bg-achrams-primary-solid text-white rounded-lg font-medium hover:opacity-90"
              >
                Retry
              </button>
            </div>
          ) : loading && trips.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-center">
                <Loader className="w-8 h-8 text-achrams-primary-solid animate-spin mx-auto mb-3" />
                <p className="text-sm text-achrams-text-secondary">Loading your trips...</p>
              </div>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-achrams-text-secondary mx-auto mb-4 opacity-50" />
              <p className="text-achrams-text-secondary text-lg font-medium mb-2">No trips yet</p>
              <p className="text-achrams-text-secondary text-sm">Your trip history will appear here</p>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {trips.map((trip) => (
                  <div
                    key={trip.id}
                    className="bg-white rounded-xl p-4 border border-achrams-border hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Status Badge & Rating */}
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                            trip.status.value === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}>
                            {trip.status.label}
                          </span>
                          {trip.rating !== null && (
                            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded-full">
                              <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
                              <span className="text-xs font-medium text-yellow-700">{trip.rating.score}</span>
                            </div>
                          )}
                        </div>

                        {/* Driver Info */}
                        {trip.driver?.name && (
                          <div className="text-sm font-semibold text-achrams-text-primary mb-2">
                            {trip.driver.name}
                          </div>
                        )}

                        {/* Route */}
                        <div className="space-y-1.5 mb-3">
                          <div className="flex items-start gap-2">
                            <div className="w-2 h-2 rounded-full bg-achrams-primary-solid flex-shrink-0 mt-1.5"></div>
                            <div className="text-sm text-achrams-text-primary truncate flex-1">
                              {trip.pickup_address}
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pl-2">
                            <div className="w-0.5 h-4 bg-achrams-border ml-[3px]"></div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-achrams-text-secondary truncate flex-1">
                              {trip.destination_address}
                            </div>
                          </div>
                        </div>

                        {/* Footer: Date & Fare */}
                        <div className="flex justify-between items-center pt-3 border-t border-achrams-border">
                          <span className="text-xs text-achrams-text-secondary flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(trip.created_at)}
                          </span>
                          <div className="flex items-center gap-1.5 bg-achrams-primary-solid/5 px-3 py-1.5 rounded-lg">
                            <Wallet className="w-4 h-4 text-achrams-primary-solid" />
                            <span className="text-sm font-bold text-achrams-primary-solid">
                              {trip.amount.formatted}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Details Button */}
                      {onSelectTrip && (
                        <button
                          onClick={() => onSelectTrip(trip.id)}
                          className="ml-3 p-2 text-achrams-primary-solid hover:bg-achrams-primary-solid/10 rounded-lg transition-colors"
                          aria-label={`View details for trip ${trip.id}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6"></polyline>
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Loading More Indicator */}
              {loading && trips.length > 0 && (
                <div className="flex justify-center py-4">
                  <Loader className="w-6 h-6 text-achrams-primary-solid animate-spin" />
                </div>
              )}

              {/* End of List */}
              {!loading && !hasMore && trips.length > 0 && (
                <div className="text-center text-achrams-text-secondary py-4 text-sm">
                  That's all your trips!
                </div>
              )}

              {/* Load More Button */}
              {!loading && hasMore && (
                <button
                  onClick={() => setPage(prev => prev + 1)}
                  className="w-full py-3 mt-4 bg-achrams-primary-solid text-white rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all shadow-sm"
                >
                  Load More Trips
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}