// src/components/app/modals/CancelModal.tsx
import { X, MapPin } from 'lucide-react';
import { useState } from 'react';

const cancelReasons = [
  'Driver is taking too long',
  'Changed my mind',
  'Found another ride',
  'Driver is unprofessional',
  'Other'
];

interface CancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, location?: [number, number], address?: string) => void;
  pickupAddress?: string;
}

export default function CancelModal({
  isOpen,
  onClose,
  onConfirm,
  pickupAddress,
}: CancelModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [otherReason, setOtherReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'Other' ? otherReason : selectedReason;
    if (reason) {
      // In real app, get current coordinates via Geolocation
      onConfirm(reason, undefined, pickupAddress);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50 animate-fadeIn">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">Cancel trip</h3>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <p className="text-gray-600 mb-6">Why do you want to cancel?</p>

        <div className="space-y-3 mb-6">
          {cancelReasons.map((reason, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedReason(reason)}
              className={`w-full text-left px-4 py-4 rounded-xl transition-all ${
                selectedReason === reason
                  ? 'bg-achrams-primary-solid text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {reason}
            </button>
          ))}
        </div>

        {selectedReason === 'Other' && (
          <div className="mb-6">
            <textarea
              placeholder="Please specify..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 rounded-xl outline-none resize-none"
              rows={2}
            />
          </div>
        )}

        {pickupAddress && (
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-xl">
            <MapPin className="w-5 h-5 text-gray-600 flex-shrink-0" />
            <span className="text-sm">{pickupAddress}</span>
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={!selectedReason || (selectedReason === 'Other' && !otherReason.trim())}
          className="w-full bg-red-600 text-white py-4 rounded-xl font-semibold disabled:bg-gray-300"
        >
          Confirm cancellation
        </button>
      </div>
    </div>
  );
}