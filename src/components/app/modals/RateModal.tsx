// src/components/app/modals/RateModal.tsx
import { X, Star, Check, Loader } from 'lucide-react';
import { useState } from 'react';
// NEW: Import apiClient
import { apiClient } from '@/lib/api';

interface RateModalProps {
  isOpen: boolean;
  onClose: () => void;
  // NEW: The onRate prop will now be used to potentially trigger a parent state update after API success, but the main logic is here
  onRate: (score: number, comment: string) => void;
  driverName?: string;
  // NEW: Prop to update the parent's notification state
  setNotification: (notification: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null) => void;
  // NEW: Props to receive trip ID and guest ID for the API call
  tripId: string | null;
  guestId: string | null;
}

export default function RateModal({
  isOpen,
  onClose,
  onRate, // This might be called after successful API call if parent needs to do something
  driverName = 'your driver',
  setNotification, // NEW: Destructure the new prop
  // NEW: Destructure the trip and guest ID props
  tripId,
  guestId,
}: RateModalProps) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  // NEW: State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);

  // NEW: Function to handle the actual API submission
  const submitRating = async () => {
    console.log("Rating: ", rating, "Trip ID: ", tripId, 'Guest ID:', guestId)

    if (rating <= 0 || !tripId || !guestId) {
      console.error("Cannot submit rating: missing score, tripId, or guestId.");
      setNotification({
        message: 'Missing required information. Cannot submit rating.',
        type: 'error'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare the request body
      const ratingRequestBody = {
        score: rating,
        comment: comment, // Comment is optional, so it can be an empty string
      };

      console.log("Submitting rating for trip ID:", tripId, "with payload:", ratingRequestBody);

      // NEW: Call the API using apiClient
      // Endpoint: POST /trips/{tripId}/rate
      // Requires X-Guest-Id header, so pass guestId as the fourth argument (isGuest=true is inferred by presence of guestId)
      const response = await apiClient.post(`/trips/${guestId}/rate`, ratingRequestBody, undefined, guestId);

      if (response.status === 'success') {
        console.log("Trip rated successfully:", response);
        // NEW: Close the modal
        onClose();
        // NEW: Set the success notification in the parent component via the prop
        setNotification({
          message: 'Thank you for your feedback!',
          type: 'success'
        });
        // NEW: Optionally call the parent's onRate handler if it needs to do something else (e.g., update local state, trigger other effects)
        onRate(rating, comment);
      } else {
        // Handle API error response structure (e.g., status not "success")
        console.error("Trip rating API responded with non-success status:", response);
        let errorMessage = "Failed to submit rating. Server responded unexpectedly.";
        if (response.message) {
          errorMessage = response.message;
          if (response.details) {
            const fieldErrors = [];
            for (const [field, messages] of Object.entries(response.details)) {
              if (Array.isArray(messages)) {
                fieldErrors.push(`${field}: ${messages.join(", ")}`);
              }
            }
            if (fieldErrors.length > 0) {
              errorMessage += ` Details: ${fieldErrors.join("; ")}`;
            }
          }
        }
        setNotification({
          message: errorMessage,
          type: 'error'
        });
      }
    } catch (err: any) {
      console.error("Error submitting trip rating:", err);
      let errorMessage = "Failed to submit rating. Please check your connection and try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        console.error("Unexpected error type caught:", typeof err, err);
        errorMessage = 'An unexpected error occurred.';
      }
      setNotification({
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setIsSubmitting(false); // Stop loading state regardless of success/error
    }
  };

  const handleSubmit = () => {
    if (rating > 0) {
      // NEW: Call the async submitRating function instead of immediately closing
      submitRating();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bg-achrams-secondary-solid/50 inset-0 bg-opacity-50 flex items-end z-50 animate-fadeIn ">
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Rate {driverName}</h3>
          <button
            onClick={onClose}
            disabled={isSubmitting} // NEW: Disable close button while submitting
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              disabled={isSubmitting} // NEW: Disable stars while submitting
              className={`transform hover:scale-110 transition ${isSubmitting ? 'cursor-not-allowed' : ''}`} // NEW: Add cursor style
            >
              <Star
                className={`w-12 h-12 ${
                  star <= rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder="Share your experience (optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary resize-none mb-6 border border-achrams-border"
          rows={3}
          disabled={isSubmitting} // NEW: Disable textarea while submitting
        />

        <button
          onClick={handleSubmit}
          disabled={rating === 0 || isSubmitting} // NEW: Disable button while submitting or no rating selected
          className="w-full bg-achrams-primary-solid text-achrams-text-light py-4 rounded-xl font-semibold disabled:bg-gray-300 flex items-center justify-center gap-2" // NEW: Add flex classes for loader
        >
          {/* NEW: Show loader while submitting */}
          {isSubmitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Submitting...
            </>
          ) : (
            "Submit"
          )}
        </button>
      </div>
    </div>
  );
}

// // src/components/app/modals/RateModal.tsx
// import { X, Star, Check } from 'lucide-react';
// import { useState } from 'react';

// interface RateModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   onRate: (score: number, comment: string) => void;
//   driverName?: string;
//   // NEW: Prop to update the parent's notification state
//   setNotification: (notification: { message: string; type: 'info' | 'success' | 'warning' | 'error' } | null) => void;
// }

// export default function RateModal({
//   isOpen,
//   onClose,
//   onRate,
//   driverName = 'your driver',
//   setNotification, // NEW: Destructure the new prop
// }: RateModalProps) {
//   const [rating, setRating] = useState(0);
//   const [comment, setComment] = useState('');

//   const handleSubmit = () => {
//     if (rating > 0) {
//       // NEW: Call the API/rate handling function passed from parent (e.g., page.tsx)
//       onRate(rating, comment);

//       // NEW: Close the modal
//       onClose();

//       // NEW: Set the success notification in the parent component via the prop
//       setNotification({
//         message: 'Thank you for your feedback!',
//         type: 'success'
//       });

//       // NEW: Optionally, reset local state after submission
//       // setRating(0); // Resetting rating might be confusing if the API call fails, so leaving it as is for now
//       // setComment('');
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed bg-achrams-secondary-solid/50 inset-0 bg-opacity-50 flex items-end z-50 animate-fadeIn ">
//       <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto">
//         <div className="flex justify-between items-center mb-6">
//           <h3 className="text-2xl font-bold">Rate {driverName}</h3>
//           <button onClick={onClose}>
//             <X className="w-6 h-6" />
//           </button>
//         </div>

//         <div className="flex justify-center gap-2 mb-6">
//           {[1, 2, 3, 4, 5].map((star) => (
//             <button
//               key={star}
//               onClick={() => setRating(star)}
//               className="transform hover:scale-110 transition"
//             >
//               <Star
//                 className={`w-12 h-12 ${
//                   star <= rating
//                     ? 'fill-yellow-400 text-yellow-400'
//                     : 'text-gray-300'
//                 }`}
//               />
//             </button>
//           ))}
//         </div>

//         <textarea
//           placeholder="Share your experience (optional)"
//           value={comment}
//           onChange={(e) => setComment(e.target.value)}
//           className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary resize-none mb-6 border border-achrams-border"
//           rows={3}
//         />

//         <button
//           onClick={handleSubmit}
//           disabled={rating === 0}
//           className="w-full bg-achrams-primary-solid text-achrams-text-light py-4 rounded-xl font-semibold disabled:bg-gray-300"
//         >
//           Submit
//         </button>
//       </div>
//     </div>
//   );
// }