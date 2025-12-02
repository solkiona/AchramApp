// src/components/app/modals/TripRequestStatusModal.tsx
import { X, AlertCircle, CheckCircle, Loader } from 'lucide-react';

interface TripRequestStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'loading' | 'accepted' | 'no-driver' | 'error' | null;
  message?: string | null; // Optional custom message
  onConfirm?: () => void
}

export default function TripRequestStatusModal({
  isOpen,
  onClose,
  status,
  message,
  onConfirm,
}: TripRequestStatusModalProps) {
  if (!isOpen || !status) return null;

  let icon = null;
  let title = '';
  let description = '';
  let buttonText = 'OK';

  switch (status) {
    case 'loading':
      icon = <Loader className="w-8 h-8 animate-spin text-achrams-primary-solid" />;
      title = 'Finding a Driver...';
      description = 'Please wait while we connect you with a driver.';
      buttonText = 'Cancel'; // Or handle cancellation differently if needed
      break;
    case 'accepted':
      icon = <CheckCircle className="w-8 h-8 text-green-500" />;
      title = 'Driver Found!';
      description = message || 'Your ride has been confirmed.';
      buttonText = 'View Details';
      break;
    case 'no-driver':
      icon = <AlertCircle className="w-8 h-8 text-yellow-500" />;
      title = 'No Drivers Available';
      description = message || 'We couldn\'t find a driver at the moment. Please try again later.';
      buttonText = 'Try Again';
      break;
    case 'error':
      icon = <AlertCircle className="w-8 h-8 text-red-500" />;
      title = 'Something Went Wrong';
      description = message || 'An error occurred while processing your request. Please check your connection and try again.';
      buttonText = 'Retry';
      break;
  }

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-100">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">{title}</h3>
          <button
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-6">
          {icon}
          <p className="text-center text-achrams-text-secondary">{description}</p>
        </div>
        <button
          onClick={() => {
            if (status === 'accepted') {
              // The parent (page.tsx) handles the transition after 'accepted' status is set
              onClose(); // Close the modal
            } else if (status === 'no-driver' || status === 'error') {
              // Retry logic or close - in this mock, just 
              if (onConfirm) {onConfirm()} else onClose();
            } else onClose();
          }}
          className={`w-full py-4 rounded-xl font-semibold transition-all ${
            status === 'accepted'
              ? 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
              : 'bg-achrams-secondary-solid text-achrams-text-light hover:bg-achrams-secondary-solid/90'
          }`}
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}