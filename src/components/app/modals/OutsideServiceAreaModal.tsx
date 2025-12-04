// src/components/app/modals/OutsideServiceAreaModal.tsx
import { X } from 'lucide-react';

interface OutsideServiceAreaModalProps {
  isOpen: boolean;
  onClose: () => void; // Allows closing the modal
}

export default function OutsideServiceAreaModal({
  isOpen,
  onClose,
}: OutsideServiceAreaModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-100">
      <div className="bg-white w-full mx-auto max-w-sm rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Service Area Limitation</h3>
          <button
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col items-center gap-4 mb-6">
          <p className="text-center text-achrams-text-secondary">
            You are currently outside our service area. Booking is not available from this location.
          </p>
        </div>
        <button
          onClick={onClose} // Close the modal when OK is clicked
          className={`w-full py-4 rounded-xl font-semibold transition-all bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]`}
        >
          OK
        </button>
      </div>
    </div>
  );
}