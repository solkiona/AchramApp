// src/components/app/modals/AirportSelectionModal.tsx
import { X } from 'lucide-react';
import { Airport } from '@/lib/airports'; // Assuming this is your Airport type from src/lib/airports.ts

interface AirportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  airports: Airport[]; // List of airports returned by the API
  onSelect: (airport: Airport) => void; // Callback when an airport is selected
}

export default function AirportSelectionModal({
  isOpen,
  onClose,
  airports,
  onSelect,
}: AirportSelectionModalProps) {
  if (!isOpen || airports.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-100">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto border-t border-achrams-border max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-6 max-w-sm mx-auto">
          <h3 className="text-xl font-bold text-achrams-text-primary">Select Airport</h3>
          <button
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {airports.map((airport) => (
            <button
              key={airport.id}
              onClick={() => {
                onSelect(airport); // Pass the selected airport back to the parent
                onClose(); // Close the modal
              }}
              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-achrams-bg-secondary border border-achrams-border rounded-lg text-left transition-colors"
            >
              <div className="mt-0.5">
                {/* You could add an icon here if needed */}
              </div>
              <div>
                <div className="font-medium text-achrams-text-primary text-sm">{airport.name}</div>
                <div className="text-xs text-achrams-text-secondary">{airport.codename}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}