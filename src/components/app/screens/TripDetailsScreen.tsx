// src/components/app/screens/TripDetailsScreen.tsx
import { useState, useEffect } from 'react';
import { MapPin, Clock, Star, Calendar, ChevronLeft, MessageCircle, Phone } from 'lucide-react';
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface TripDetails {
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
  verification_code: string;
  rating?: {
    score: number;
    comment?: string;
  } | null;
  map_data: {
    pickup_location: {
      geometry: {
        coordinates: [number, number]; // [lng, lat]
      };
      properties: {
        name: string;
        description: string;
      };
    };
    destination_location: {
      geometry: {
        coordinates: [number, number]; // [lng, lat]
      };
      properties: {
        name: string;
        description: string;
      };
    };
  };
  driver?: {
    name: string;
    rating: string; // e.g., "4.9"
    car_type: string;
    car_color: string;
    plate_number: string;
    profile_photo?: string;
    phone: string;
  };
  created_at: string; // ISO date string
  // Add other fields as needed
}

export default function TripDetailsScreen({ tripId, onBack }: { tripId: string; onBack: () => void }) {
  const [tripDetails, setTripDetails] = useState<TripDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTripDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        // NEW: Call the specific trip API using apiClient
        // Example: GET /trips/{tripId}
        const response = await apiClient.get(`/trips/${tripId}`); // Use correct endpoint from Postman doc

        console.log("Trip Details Response:", response); // Debug log
        if (response.status === 200 && response.data && response.data.data) {
          setTripDetails(response.data.data);
        } else {
          setError('Failed to load trip details.');
        }
      } catch (err) {
        console.error("Trip Details Fetch Error:", err);
        let errorMessage = 'An unexpected error occurred.';
        if (err instanceof Error) {
          errorMessage = err.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
        fetchTripDetails();
    }
  }, [tripId]);


  if (loading) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-achrams-text-secondary">Loading trip details...</p>
        </div>
      </div>
    );
  }

  if (error || !tripDetails) {
    return (
      <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center p-6">
        <p className="text-red-500 text-center mb-6">{error || 'Trip details not found.'}</p>
        <button
          onClick={onBack} // Go back on error
          className="bg-achrams-gradient-primary text-achrams-text-light py-3 px-6 rounded-xl font-semibold"
        >
          Back to History
        </button>
      </div>
    );
  }

  // NEW: Extract map coordinates and center
  const pickupCoords = tripDetails.map_data.pickup_location.geometry.coordinates; // [lng, lat]
  const destCoords = tripDetails.map_data.destination_location.geometry.coordinates; // [lng, lat]
  const mapCenter = { lat: pickupCoords[1], lng: pickupCoords[0] }; // { lat: lat, lng: lng }

  // NEW: Load Google Maps API
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script-trip-details',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  });

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col">
      {/* Header */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center">
        <button onClick={onBack} className="mr-4">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Trip Details</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Map Preview (smaller) */}
        <div className="h-48 relative">
          {isLoaded ? (
            <GoogleMap
              mapContainerStyle={{ width: '100%', height: '100%' }}
              center={mapCenter}
              zoom={12}
              options={{
                // Disable default UI for a cleaner look in preview
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
                zoomControl: false,
              }}
            >
              <Marker
                position={{ lat: pickupCoords[1], lng: pickupCoords[0] }}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/green-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
                title={tripDetails.map_data.pickup_location.properties.name}
              />
              <Marker
                position={{ lat: destCoords[1], lng: destCoords[0] }}
                icon={{ url: 'https://maps.google.com/mapfiles/ms/micons/red-dot.png', scaledSize: new window.google.maps.Size(32, 32) }}
                title={tripDetails.map_data.destination_location.properties.name}
              />
            </GoogleMap>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-achrams-bg-secondary">
              <p className="text-achrams-text-secondary">Loading map...</p>
            </div>
          )}
        </div>

        {/* Trip Info */}
        <div className="p-6 space-y-6">
          {/* Date & Status */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-achrams-text-secondary" />
              <span className="text-achrams-text-primary">{new Date(tripDetails.created_at).toLocaleString()}</span>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full ${
              tripDetails.status.value === 'completed' ? 'bg-green-100 text-green-800' :
              tripDetails.status.value === 'cancelled' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {tripDetails.status.label}
            </span>
          </div>

          {/* Fare */}
          <div className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border">
            <div className="flex justify-between items-center">
              <span className="text-achrams-text-secondary">Total Fare</span>
              <span className="text-2xl font-bold text-achrams-text-primary">{tripDetails.amount.formatted}</span>
            </div>
          </div>

          {/* Verification Code */}
          {tripDetails.verification_code && (
            <div className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border">
              <div className="text-xs text-achrams-text-secondary mb-1">Verification Code</div>
              <div className="text-xl font-mono font-bold text-achrams-text-primary">{tripDetails.verification_code}</div>
            </div>
          )}

          {/* Driver Info (if assigned) */}
          {tripDetails.driver && (
            <div className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border">
              <h3 className="font-semibold mb-3 text-achrams-text-primary">Driver Info</h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light text-lg font-bold">
                  {tripDetails.driver.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-achrams-text-primary">{tripDetails.driver.name}</div>
                  <div className="flex items-center gap-1 text-sm text-achrams-text-secondary">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span>{tripDetails.driver.rating}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-sm">
                  <span className="text-achrams-text-secondary">Car: </span>
                  <span className="text-achrams-text-primary">{tripDetails.driver.car_type} • {tripDetails.driver.car_color}</span>
                </div>
                <div className="text-sm">
                  <span className="text-achrams-text-secondary">Plate: </span>
                  <span className="text-achrams-text-primary">{tripDetails.driver.plate_number}</span>
                </div>
              </div>
              <div className="flex gap-3 mt-4">
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-3 bg-achrams-bg-primary border border-achrams-border rounded-xl font-medium text-achrams-text-primary hover:bg-achrams-bg-secondary transition-colors">
                  <Phone className="w-5 h-5" />
                  Call
                </button>
              </div>
            </div>
          )}

          {/* Rating */}
          {tripDetails.rating && (
            <div className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border">
              <h3 className="font-semibold mb-3 text-achrams-text-primary">Your Rating</h3>
              <div className="flex items-center gap-2 mb-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-6 h-6 ${
                      i < tripDetails.rating!.score
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium text-achrams-text-primary">{tripDetails.rating.score}/5</span>
              </div>
              {tripDetails.rating.comment && (
                <p className="text-achrams-text-secondary text-sm italic">"{tripDetails.rating.comment}"</p>
              )}
            </div>
          )}

          {/* Addresses */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-xs text-achrams-text-secondary mb-1">PICKUP</div>
                <div className="font-medium text-achrams-text-primary">{tripDetails.pickup_address}</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-achrams-primary-solid rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <div className="text-xs text-achrams-text-secondary mb-1">DESTINATION</div>
                <div className="font-medium text-achrams-text-primary">{tripDetails.destination_address}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}