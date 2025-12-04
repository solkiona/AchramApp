// src/components/app/modals/PanicModal.tsx
import { AlertCircle, X, Check } from 'lucide-react';
import { useState } from 'react';

const panicOptions = [
  'Driver is behaving suspiciously',
  'Taking wrong route',
  'Uncomfortable with driver behavior',
  'Vehicle condition is unsafe',
  'Other emergency',
];

export default function PanicModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (selected) {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        onComplete();
        onClose();
      }, 2000);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50 animate-fadeIn">
        <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp text-center">
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
    <div className=" fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-50 flex items-end z-50 animate-fadeIn">
      <div className="bg-white w-full mx-auto max-w-sm rounded-t-3xl p-6 animate-slideUp">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold">Safety Alert</h3>
          </div>
          <button onClick={onClose}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-gray-600 mb-6">Select an issue to quickly send an alert</p>
        <div className="space-y-3">
          {panicOptions.map((option, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(option)}
              className={`w-full text-left px-4 py-4 rounded-xl transition-all ${
                selected === option ? 'bg-red-50 border border-red-200' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full mt-6 py-4 bg-red-600 text-white rounded-xl font-semibold disabled:bg-gray-300"
        >
          Send Alert
        </button>
      </div>
    </div>
  );
}