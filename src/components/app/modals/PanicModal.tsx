// src/components/app/modals/PanicModal.tsx
import { AlertCircle, X, Check, Loader } from 'lucide-react';
import { useState } from 'react';
// NEW: Import apiClient
import { apiClient } from '@/lib/api';

const panicOptions = [
  'Driver is behaving suspiciously',
  'Taking wrong route',
  'Uncomfortable with driver behavior',
  'Vehicle condition is unsafe',
  'Other emergency',
];

// NEW: Define the expected props type
interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  // NEW: Prop to receive guestId for the API call
  guestId: string;
  // NEW: Props to receive location data (you'll need to pass these from the parent)
  currentLocationAddress: string; // e.g., pickup address or current geolocation address if available
  currentLocationCoords: [number, number]; // e.g., [lng, lat] from pickupCoords or current geolocation if available
  tripId: string; // NEW: Prop to receive the active trip ID
}

export default function PanicModal({
  isOpen,
  onClose,
  // NEW: Destructure the new props
  guestId,
  currentLocationAddress,
  currentLocationCoords,
  tripId,
}: PanicModalProps) { // NEW: Update the interface
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  // NEW: State for submission status
  const [isSubmitting, setIsSubmitting] = useState(false);
  // NEW: State for error message
  const [submitError, setSubmitError] = useState<string | null>(null);

  // NEW: Function to handle the actual API submission
  const submitAlert = async () => {

    console.log("currentlocationaddress: ", currentLocationAddress, "CurrentLocationCoords: ", currentLocationCoords, "Trip ID: ", tripId)

    if (!selected || !currentLocationCoords || !currentLocationAddress || !tripId) {
      console.error("Cannot submit alert: missing required data.");
      setSubmitError("Missing required information. Cannot send alert.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null); // Clear previous errors

    try {
      // Prepare the request body
      // The Postman example shows 'panic' as the alert_type, which seems fixed for this modal.
      const alertRequestBody = {
        alert_type: "panic", // Fixed for this modal
        address: currentLocationAddress, // Use the address passed in
        location: [currentLocationCoords[0], currentLocationCoords[1]], // [longitude, latitude]
        message: selected, // Use the selected option as the message (or allow custom input later)
        // trip: tripId, // NEW: Include the trip ID if required by the backend (Postman doc shows it as optional, but safer to include if available)
      };

      console.log("Submitting trip alert with payload:", alertRequestBody);

      // NEW: Call the API using apiClient
      // Endpoint: POST /trip-alerts
      // Requires X-Guest-Id header, so pass guestId as the third argument (isGuest=true) and fourth argument (guestId)
      const response = await apiClient.post('/trip-alerts', alertRequestBody, undefined, guestId);

      if (response.status === 'success') {
        console.log("Trip alert submitted successfully:", response);
        setSent(true);
        // NEW: Close the modal after a short delay showing success
        setTimeout(() => {
          setSent(false);
          onClose(); // Close the modal
        }, 2000);
      } else {
        // Handle API error response structure (e.g., status not "success")
        console.error("Trip alert API responded with non-success status:", response);
        let errorMessage = "Failed to send alert. Server responded unexpectedly.";
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
        setSubmitError(errorMessage);
      }
    } catch (err: any) {
      console.error("Error submitting trip alert:", err);
      let errorMessage = "Failed to send alert. Please check your connection and try again.";

      if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        console.error("Unexpected error type caught:", typeof err, err);
        errorMessage = 'An unexpected error occurred.';
      }
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false); // Stop loading state regardless of success/error
    }
  };

  // NEW: Update handleSubmit to call submitAlert
  const handleSubmit = () => {
    if (selected) {
      submitAlert(); // Call the async function
    }
  };

  // NEW: Early return if not open
  if (!isOpen) return null;

  // NEW: Show success screen if sent
  if (sent) {
    return (
      <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50 animate-fadeIn">
        <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Alert Sent</h3>
          <p className="text-gray-600">Your message has been received and someone is looking into it.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-50 flex items-end z-50 animate-fadeIn">
      <div className="bg-white w-full mx-auto max-w-sm rounded-t-3xl p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold">Safety Alert</h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting} // NEW: Disable close button while submitting
            className="disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">Select an issue to quickly send an alert</p>
        <div className="space-y-3">
          {panicOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(option)}
              disabled={isSubmitting} // NEW: Disable options while submitting
              className={`w-full text-left px-4 py-4 rounded-xl transition-all ${
                selected === option
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-gray-50 hover:bg-gray-100'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {option}
            </button>
          ))}
        </div>
        {/* NEW: Show error message if present */}
        {submitError && (
          <div className="mt-4 p-3 bg-red-100 text-red-800 rounded-lg text-sm">
            {submitError}
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!selected || isSubmitting} // NEW: Disable button while submitting or no selection
          className="w-full mt-6 py-4 bg-red-600 text-white rounded-xl font-semibold disabled:bg-gray-300 flex items-center justify-center gap-2"
        >
          {/* NEW: Show loader while submitting */}
          {isSubmitting ? (
            <>
              <Loader className="w-5 h-5 animate-spin" /> Sending...
            </>
          ) : (
            "Send Alert"
          )}
        </button>
      </div>
    </div>
  );
}

// // src/components/app/modals/PanicModal.tsx
// import { AlertCircle, X, Check } from 'lucide-react';
// import { useState } from 'react';

// const panicOptions = [
//   'Driver is behaving suspiciously',
//   'Taking wrong route',
//   'Uncomfortable with driver behavior',
//   'Vehicle condition is unsafe',
//   'Other emergency',
// ];

// export default function PanicModal({
//   isOpen,
//   onClose,
//   onComplete,
// }: {
//   isOpen: boolean;
//   onClose: () => void;
//   onComplete: () => void;
// }) {
//   const [selected, setSelected] = useState<string | null>(null);
//   const [sent, setSent] = useState(false);

//   if (!isOpen) return null;

//   const handleSubmit = () => {
//     if (selected) {
//       setSent(true);
//       setTimeout(() => {
//         setSent(false);
//         onComplete();
//         onClose();
//       }, 2000);
//     }
//   };

//   if (sent) {
//     return (
//       <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50 animate-fadeIn">
//         <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 animate-slideUp text-center">
//           <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
//             <Check className="w-8 h-8 text-green-600" />
//           </div>
//           <h3 className="text-xl font-bold mb-2">Alert Sent</h3>
//           <p className="text-gray-600">Your message has been received and someone is looking into it.</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className=" fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-50 flex items-end z-50 animate-fadeIn">
//       <div className="bg-white w-full mx-auto max-w-md rounded-t-3xl p-6 animate-slideUp">
//         <div className="flex items-center justify-between mb-6">
//           <div className="flex items-center gap-3">
//             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
//               <AlertCircle className="w-6 h-6 text-red-600" />
//             </div>
//             <h3 className="text-xl font-bold">Safety Alert</h3>
//           </div>
//           <button onClick={onClose}>
//             <X className="w-6 h-6" />
//           </button>
//         </div>
//         <p className="text-gray-600 mb-6">Select an issue to quickly send an alert</p>
//         <div className="space-y-3">
//           {panicOptions.map((option, idx) => (
//             <button
//               key={idx}
//               onClick={() => setSelected(option)}
//               className={`w-full text-left px-4 py-4 rounded-xl transition-all ${
//                 selected === option ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
//               }`}
//             >
//               {option}
//             </button>
//           ))}
//         </div>
//         <button
//           onClick={handleSubmit}
//           disabled={!selected}
//           className="w-full mt-6 py-4 bg-red-600 text-white rounded-xl font-semibold disabled:bg-gray-300"
//         >
//           Send Alert
//         </button>
//       </div>
//     </div>
//   );
// }