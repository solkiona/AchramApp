// src/components/app/screens/TripHistoryScreen.tsx
import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Calendar, ChevronRight } from 'lucide-react';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface Trip {
  id: string;
  amount: {
    formatted: string;
  };
  status: {
    label: string;
    value: string;
  };
  pickup_address: string;
  destination_address: string;
  created_at: string; // ISO date string
  rating?: {
    score: number;
    comment?: string;
  } | null;
  // Add other fields as needed from the API response
}

export default function TripHistoryScreen({ onBack, onSelectTrip }: { onBack: () => void; onSelectTrip: (tripId: string) => void }) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        setLoading(true);
        setError(null);
        // NEW: Call the trips API using apiClient
        // Example: GET /trips?page=1&limit=20 (pagination might be needed)
        // Example: GET /trips?status=completed (filtering might be needed)
        const response = await apiClient.get('/trips'); // Use correct endpoint and params from Postman doc

        console.log("Trip History Response:", response); // Debug log
        if (response.status === 200 && response.data && Array.isArray(response.data.data)) {
          setTrips(response.data.data);
        } else {
          setError('Failed to load trip history.');
        }
      } catch (err) {
        console.error("Trip History Fetch Error:", err);
        let errorMessage = 'An unexpected error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, []); // Fetch on mount


  if (loading) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-achrams-text-secondary">Loading trips...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-center mb-6">{error}</p>
        <button
          onClick={() => window.location.reload()} // Simple retry for now
          className="bg-achrams-gradient-primary text-achrams-text-light py-3 px-6 rounded-xl font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center">
        <button onClick={onBack} className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Trip History</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {trips.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-achrams-text-secondary">No trips found.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {trips.map((trip) => (
              <div
                key={trip.id}
                onClick={() => onSelectTrip(trip.id)} // NEW: Navigate to TripDetailsScreen
                className="bg-achrams-bg-secondary rounded-2xl p-5 shadow-sm border border-achrams-border flex items-center justify-between cursor-pointer hover:bg-achrams-bg-primary transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4 text-achrams-text-tertiary flex-shrink-0" />
                    <span className="text-xs text-achrams-text-tertiary">
                      {new Date(trip.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-achrams-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-achrams-text-primary truncate">{trip.pickup_address}</div>
                  </div>
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-achrams-text-secondary mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-achrams-text-primary truncate">{trip.destination_address}</div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium text-achrams-text-primary">{trip.amount.formatted}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        trip.status.value === 'completed' ? 'bg-green-100 text-green-800' :
                        trip.status.value === 'cancelled' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800' // For statuses like 'driver not found', 'searching', etc.
                      }`}>
                        {trip.status.label}
                      </span>
                    </div>
                    {trip.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-achrams-text-secondary">{trip.rating.score}</span>
                      </div>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-achrams-text-secondary flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}