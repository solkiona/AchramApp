// src/components/app/modals/PanicModal.tsx
import { AlertCircle, X, Check, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api';

const panicOptions = [
  { label: "Panic", value: "panic" },
  { label: "Assault", value: "assault" },
  { label: "Dispute", value: "dispute" },
  { label: "Accident", value: "accident" },
  { label: "Lost Item", value: "lost_item" },
  { label: "Harassment", value: "harassment" },
  { label: "Vehicle Issue", value: "vehicle_issue" },
  { label: "Medical Emergency", value: "medical_emergency" },
  { label: "Suspicious Activity", value: "suspicious_activity" },
  { label: "Unresponsive Driver", value: "unresponsive_driver" },
];

interface PanicModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestId: string | null;
  currentLocationAddress: string;
  currentLocationCoords: [number, number];
  tripId: string;
  isAuthenticated: boolean;
  bookAsGuest: boolean;
}

export default function PanicModal({
  isOpen,
  onClose,
  guestId,
  currentLocationAddress,
  currentLocationCoords,
  tripId,
  isAuthenticated,
  bookAsGuest,
}: PanicModalProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setSent(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const submitAlert = async () => {
    if (!selected || !currentLocationCoords || !currentLocationAddress || !tripId) {
      setSubmitError("Missing required data.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {

      let response;
            if (!bookAsGuest && isAuthenticated) {
              console.log("Raising panic alert as an authenticated user");

              console.log({
                  alert_type: selected,
                  address: currentLocationAddress,
                  location: [currentLocationCoords[0], currentLocationCoords[1]],
                  trip: tripId,
                },)
              response = await apiClient.post(
                "/trip-alerts",
                {
                  alert_type: selected,
                  address: currentLocationAddress,
                  location: [currentLocationCoords[0], currentLocationCoords[1]],
                  trip: tripId,
                },
                undefined,
                undefined,
                true
              );
            } else {
              console.log('guest Id for alert', guestId)
              
              response = await apiClient.post('/trip-alerts', {
              alert_type: selected,
              address: currentLocationAddress,
              location: [currentLocationCoords[0], currentLocationCoords[1]],
            }, undefined, guestId);
            }

            console.log("panic modal data",  {
                  alert_type: selected,
                  address: currentLocationAddress,
                  location: [currentLocationCoords[0], currentLocationCoords[1]],
                })

      if (response.status === 'success') {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        console.log(response)
        setSubmitError(response.details?.non_field_errors?.[0] || response.message || "Failed to send alert. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (selected) submitAlert();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      {/* Click outside to close */}
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden sm:rounded-3xl transform transition-all duration-300"
        onClick={(e) => e.stopPropagation()} // prevent closing on inner click
      >
        {sent ? (
          // ✅ Success State: Minimal & Reassuring
          <div className="p-6 text-center">
            <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Sent</h3>
            <p className="text-gray-600 text-sm">
              Our safety team has been notified and is responding.
            </p>
          </div>
        ) : (
          // ✅ Main Form: Compact & Focused
          <>
            <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="font-semibold text-gray-900">Report an Issue</h3>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5">
              <p className="text-gray-600 text-sm mb-4">
                Select the most relevant issue to notify our safety team.
              </p>

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {panicOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelected(option.value)}
                    disabled={isSubmitting}
                    className={`text-xs px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
                      selected === option.value
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-gray-100 hover:bg-gray-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              {submitError && (
                <div className="mt-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selected || isSubmitting}
                className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-medium text-sm disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" /> Sending...
                  </>
                ) : (
                  "Send Alert"
                )}
              </button>
            </div>
          </>
        )}
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