// src/components/app/modals/Disable2FAModal.tsx
import { X, ShieldAlert, Loader } from 'lucide-react';
import { useState } from 'react';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface Disable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // NEW: Callback after successful disable
}

export default function Disable2FAModal({
  isOpen,
  onClose,
  onSuccess,
}: Disable2FAModalProps) {
  if (!isOpen) return null;

  // NEW: State for OTP input, loading, error
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDisable = async () => {
    setError(''); // Clear previous errors
    if (!otp) {
      setError('Please enter the OTP from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      // NEW: Call the disable API using apiClient
      // The exact endpoint might vary (e.g., POST /auth/passenger/2fa/disable, DELETE /auth/passenger/2fa, or PUT/PATCH with flag)
      // Check passenger postman DOC.txt for the correct endpoint.
      // Example: Assuming POST /auth/passenger/2fa/disable
      const response = await apiClient.post('/auth/passenger/2fa/disable', { // Use correct endpoint from Postman
        token: otp, // Or 'otp' depending on API expectation
      });

      console.log("2FA Disable Response:", response); // Debug log
      if (response.status === 200) { // Assuming 200 for success
        // NEW: On success, close modal and trigger success handler (e.g., update profile info in parent)
        onClose();
        onSuccess();
      } else {
          setError('Failed to disable 2FA. Please check the code and try again.');
      }
    } catch (err: any) {
        console.error("2FA Disable Error:", err);
        let errorMessage = 'An unexpected error occurred.';
        if (err.response && err.response.data && err.response.data.message) {
            errorMessage = err.response.data.message;
        } else if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-achrams-bg-primary bg-opacity-70 flex items-end z-50">
      <div className="bg-achrams-bg-primary w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Disable Two-Factor Authentication</h3>
          <button
            onClick={onClose}
            disabled={loading} // NEW: Disable close button while loading
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex items-center gap-3 p-4 bg-achrams-bg-secondary rounded-xl border border-achrams-border mb-6">
          <ShieldAlert className="w-6 h-6 text-achrams-warning-dark flex-shrink-0" />
          <p className="text-achrams-text-secondary text-sm">
            Disabling 2FA reduces the security of your account. Are you sure you want to proceed?
          </p>
        </div>

        <input
          type="text"
          placeholder="Enter 6-digit code from app"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} // NEW: Allow only digits, max 6
          disabled={loading} // NEW: Disable input while loading
          className="w-full px-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border mb-4"
        />

        {/* NEW: Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleDisable}
          disabled={loading || !otp} // NEW: Disable based on loading and OTP field
          className={`w-full py-4 rounded-xl font-semibold mb-3 transition-all ${
            loading || !otp
              ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
              : 'bg-red-600 text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {loading ? ( // NEW: Show spinner while loading
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Disabling...
            </div>
          ) : (
            'Disable 2FA'
          )}
        </button>

        <button
          onClick={onClose}
          disabled={loading} // NEW: Disable "Cancel" while loading
          className="w-full text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}