// src/components/app/modals/CancelTripModal.tsx
import { X } from 'lucide-react';

interface CancelTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCancel: (reason: string) => void; // Callback to parent with the selected reason
  isCancelling: boolean; // Flag to show loading state in the modal
}

const REASON_OPTIONS = [
  "Did not find driver",
  "Driver did not show up",
  "Changed my mind",
  "Found another ride",
  "Trip is taking too long",
  "Other"
];

export default function CancelTripModal({
  isOpen,
  onClose,
  onCancel,
  isCancelling,
}: CancelTripModalProps) {
  if (!isOpen) return null;

  const handleSelectReason = (reason: string) => {
    onCancel(reason);
  };

  return (
    <div className="fixed inset-0 bg-achrams-bg-primary z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-achrams-border">
          <h3 className="text-lg font-semibold text-achrams-text-primary">Cancel Trip</h3>
          <button
            onClick={onClose}
            disabled={isCancelling} // Prevent closing while cancelling
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4">
          <p className="text-achrams-text-secondary mb-4">
            Please select a reason for cancelling your trip.
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {REASON_OPTIONS.map((reason) => (
              <button
                key={reason}
                onClick={() => handleSelectReason(reason)}
                disabled={isCancelling}
                className={`w-full text-left px-4 py-3 rounded-lg hover:bg-achrams-bg-secondary transition-colors ${
                  isCancelling
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-achrams-bg-secondary'
                }`}
              >
                {reason}
              </button>
            ))}
          </div>
        </div>
        <div className="p-4 pt-0">
          <button
            onClick={onClose}
            disabled={isCancelling} // Prevent closing while cancelling
            className="w-full py-3 bg-achrams-secondary-solid text-achrams-text-light rounded-lg hover:opacity-95 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Keep Trip
          </button>
        </div>
      </div>
    </div>
  );
}