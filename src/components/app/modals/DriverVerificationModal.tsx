// src/components/app/modals/DriverVerificationModal.tsx
import { Shield, Check } from 'lucide-react';

interface DriverVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  securityCode: string; // Pass the code from parent
}

export default function DriverVerificationModal({
  isOpen,
  onClose,
  securityCode,
}: DriverVerificationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto  shadow-sm">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600">
            <Shield className="w-8 h-8" />
          </div>
        </div>
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Verify Your Driver</h3>
          <p className="text-achrams-text-secondary mt-2">Share this code with your driver to confirm their identity</p>
        </div>
        <div className="bg-achrams-bg-secondary rounded-xl p-4 mb-6 text-center">
          <div className="text-xs text-achrams-text-secondary mb-2">SECURITY CODE</div>
          <div className="text-4xl font-bold text-achrams-text-primary">{securityCode}</div>
        </div>
        <button
          onClick={onClose}
          className="w-full py-4 rounded-xl font-semibold bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98] transition-all"
        >
          OK
        </button>
      </div>
    </div>
  );
}