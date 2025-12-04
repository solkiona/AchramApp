// src/components/app/modals/LocationPermissionModal.tsx
import { X } from 'lucide-react';

interface LocationPermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGrantAccess: () => void; // Function to trigger browser permission request
}

export default function LocationPermissionModal({
  isOpen,
  onClose,
  onGrantAccess,
}: LocationPermissionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-100">
      <div className="bg-white w-full rounded-t-3xl p-6 max-w-sm mx-auto animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Location Access Required</h3>
          <button
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-6">
          <p className="text-center text-achrams-text-secondary">
            This app requires your location access to work. Please grant access to find nearby pickup locations.
          </p>
        </div>
        <button
          onClick={() => {
            onGrantAccess(); // Trigger the geolocation permission request
            onClose(); // Close the modal after triggering
          }}
          className={`w-full py-4 rounded-xl font-semibold transition-all bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]`}
        >
          Grant Access
        </button>
      </div>
    </div>
  );
}