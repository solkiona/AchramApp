// src/components/app/modals/PanicModal.tsx
import { AlertCircle, X, Check, Loader, PlusCircle } from 'lucide-react'; // Added PlusCircle icon
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
  // NEW: Add an "Other" option
  { label: "Other", value: "other" },
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
  // NEW: State for the custom reason when "Other" is selected
  const [customReason, setCustomReason] = useState<string>('');
  const [sent, setSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelected(null);
      setCustomReason(''); // NEW: Reset custom reason
      setSent(false);
      setSubmitError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const submitAlert = async () => {
    // NEW: Use custom reason if "other" is selected and custom reason is provided
    const alertTypeToSend = selected === 'other' && customReason.trim() ? "panic" : selected;

    if (!alertTypeToSend || !currentLocationCoords || !currentLocationAddress || !tripId) {
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
          alert_type: alertTypeToSend, // Send the selected type or custom reason
          address: currentLocationAddress,
          location: [currentLocationCoords[0], currentLocationCoords[1]],
          trip: tripId,
          message: customReason.trim()
        });
        response = await apiClient.post(
          "/trip-alerts",
          {
            alert_type: alertTypeToSend, // Send the selected type or custom reason
            address: currentLocationAddress,
            location: [currentLocationCoords[0], currentLocationCoords[1]],
            trip: tripId,
            message: customReason.trim()
          },
          undefined,
          undefined,
          true
        );
      } else {
        console.log('guest Id for alert', guestId);
        response = await apiClient.post('/trip-alerts', {
          alert_type: alertTypeToSend, // Send the selected type or custom reason
          address: currentLocationAddress,
          location: [currentLocationCoords[0], currentLocationCoords[1]],
        }, undefined, guestId);
      }

      console.log("panic modal data", {
        alert_type: alertTypeToSend, // Send the selected type or custom reason
        address: currentLocationAddress,
        location: [currentLocationCoords[0], currentLocationCoords[1]],
      });

      if (response.status === 'success') {
        setSent(true);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        console.log(response);
        setSubmitError(response.details?.non_field_errors?.[0] || response.message || "Failed to send alert. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network error. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    // NEW: Check if "other" is selected but no custom reason is provided
    if (selected === 'other' && !customReason.trim()) {
        setSubmitError("Please specify the reason under 'Other'.");
        return;
    }
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
                    onClick={() => {
                        setSelected(option.value);
                        // NEW: Clear custom reason when selecting a predefined option
                        if (option.value !== 'other') {
                            setCustomReason('');
                        }
                    }}
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

              {/* NEW: Input field for custom reason, shown only when "Other" is selected */}
              {selected === 'other' && (
                <div className="mt-4">
                  <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-1">
                    Please specify:
                  </label>
                  <input
                    type="text"
                    id="customReason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Describe the issue..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm"
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {submitError && (
                <div className="mt-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">
                  {submitError}
                </div>
              )}

              <button
                onClick={handleSubmit}
                disabled={!selected || isSubmitting} // Disable if no option selected
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
// import { AlertCircle, X, Check, Loader } from 'lucide-react';
// import { useState, useEffect } from 'react';
// import { apiClient } from '@/lib/api';

// const panicOptions = [
//   { label: "Panic", value: "panic" },
//   { label: "Assault", value: "assault" },
//   { label: "Dispute", value: "dispute" },
//   { label: "Accident", value: "accident" },
//   { label: "Lost Item", value: "lost_item" },
//   { label: "Harassment", value: "harassment" },
//   { label: "Vehicle Issue", value: "vehicle_issue" },
//   { label: "Medical Emergency", value: "medical_emergency" },
//   { label: "Suspicious Activity", value: "suspicious_activity" },
//   { label: "Unresponsive Driver", value: "unresponsive_driver" },
// ];

// interface PanicModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   guestId: string | null;
//   currentLocationAddress: string;
//   currentLocationCoords: [number, number];
//   tripId: string;
//   isAuthenticated: boolean;
//   bookAsGuest: boolean;
// }

// export default function PanicModal({
//   isOpen,
//   onClose,
//   guestId,
//   currentLocationAddress,
//   currentLocationCoords,
//   tripId,
//   isAuthenticated,
//   bookAsGuest,
// }: PanicModalProps) {
//   const [selected, setSelected] = useState<string | null>(null);
//   const [sent, setSent] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [submitError, setSubmitError] = useState<string | null>(null);

//   // Reset state when modal closes
//   useEffect(() => {
//     if (!isOpen) {
//       setSelected(null);
//       setSent(false);
//       setSubmitError(null);
//       setIsSubmitting(false);
//     }
//   }, [isOpen]);

//   const submitAlert = async () => {
//     if (!selected || !currentLocationCoords || !currentLocationAddress || !tripId) {
//       setSubmitError("Missing required data.");
//       return;
//     }

//     setIsSubmitting(true);
//     setSubmitError(null);

//     try {

//       let response;
//             if (!bookAsGuest && isAuthenticated) {
//               console.log("Raising panic alert as an authenticated user");

//               console.log({
//                   alert_type: selected,
//                   address: currentLocationAddress,
//                   location: [currentLocationCoords[0], currentLocationCoords[1]],
//                   trip: tripId,
//                 },)
//               response = await apiClient.post(
//                 "/trip-alerts",
//                 {
//                   alert_type: selected,
//                   address: currentLocationAddress,
//                   location: [currentLocationCoords[0], currentLocationCoords[1]],
//                   trip: tripId,
//                 },
//                 undefined,
//                 undefined,
//                 true
//               );
//             } else {
//               console.log('guest Id for alert', guestId)
              
//               response = await apiClient.post('/trip-alerts', {
//               alert_type: selected,
//               address: currentLocationAddress,
//               location: [currentLocationCoords[0], currentLocationCoords[1]],
//             }, undefined, guestId);
//             }

//             console.log("panic modal data",  {
//                   alert_type: selected,
//                   address: currentLocationAddress,
//                   location: [currentLocationCoords[0], currentLocationCoords[1]],
//                 })

//       if (response.status === 'success') {
//         setSent(true);
//         setTimeout(() => {
//           onClose();
//         }, 1800);
//       } else {
//         console.log(response)
//         setSubmitError(response.details?.non_field_errors?.[0] || response.message || "Failed to send alert. Please try again.");
//       }
//     } catch (err) {
//       setSubmitError("Network error. Please check your connection.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleSubmit = () => {
//     if (selected) submitAlert();
//   };

//   if (!isOpen) return null;

//   return (
//     <div
//       className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4 sm:p-6 bg-black/40 backdrop-blur-sm animate-fadeIn"
//       onClick={onClose}
//     >
//       {/* Click outside to close */}
//       <div
//         className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden sm:rounded-3xl transform transition-all duration-300"
//         onClick={(e) => e.stopPropagation()} // prevent closing on inner click
//       >
//         {sent ? (
//           // ✅ Success State: Minimal & Reassuring
//           <div className="p-6 text-center">
//             <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
//               <Check className="w-7 h-7 text-emerald-600" />
//             </div>
//             <h3 className="text-lg font-semibold text-gray-900 mb-2">Alert Sent</h3>
//             <p className="text-gray-600 text-sm">
//               Our safety team has been notified and is responding.
//             </p>
//           </div>
//         ) : (
//           // ✅ Main Form: Compact & Focused
//           <>
//             <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
//               <div className="flex items-center gap-3">
//                 <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
//                   <AlertCircle className="w-5 h-5 text-red-600" />
//                 </div>
//                 <h3 className="font-semibold text-gray-900">Report an Issue</h3>
//               </div>
//               <button
//                 onClick={onClose}
//                 disabled={isSubmitting}
//                 className="text-gray-500 hover:text-gray-700 disabled:opacity-40"
//               >
//                 <X className="w-5 h-5" />
//               </button>
//             </div>

//             <div className="p-5">
//               <p className="text-gray-600 text-sm mb-4">
//                 Select the most relevant issue to notify our safety team.
//               </p>

//               <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
//                 {panicOptions.map((option) => (
//                   <button
//                     key={option.value}
//                     onClick={() => setSelected(option.value)}
//                     disabled={isSubmitting}
//                     className={`text-xs px-3 py-2.5 rounded-lg text-gray-700 transition-colors ${
//                       selected === option.value
//                         ? 'bg-red-100 text-red-800 border border-red-200'
//                         : 'bg-gray-100 hover:bg-gray-200'
//                     } disabled:opacity-50 disabled:cursor-not-allowed`}
//                   >
//                     {option.label}
//                   </button>
//                 ))}
//               </div>

//               {submitError && (
//                 <div className="mt-4 p-2.5 bg-red-50 text-red-700 text-xs rounded-lg">
//                   {submitError}
//                 </div>
//               )}

//               <button
//                 onClick={handleSubmit}
//                 disabled={!selected || isSubmitting}
//                 className="w-full mt-5 py-3 bg-red-600 text-white rounded-xl font-medium text-sm disabled:bg-gray-300 disabled:text-gray-500 flex items-center justify-center gap-2"
//               >
//                 {isSubmitting ? (
//                   <>
//                     <Loader className="w-4 h-4 animate-spin" /> Sending...
//                   </>
//                 ) : (
//                   "Send Alert"
//                 )}
//               </button>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// }
