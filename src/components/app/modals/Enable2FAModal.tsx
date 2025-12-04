// src/components/app/modals/Enable2FAModal.tsx
import { X, QrCode, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface Enable2FAModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void; // NEW: Callback after successful enablement
}

export default function Enable2FAModal({
  isOpen,
  onClose,
  onSuccess,
}: Enable2FAModalProps) {
  if (!isOpen) return null;

  // NEW: State for QR code data, OTP input, loading, error
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null); // NEW: Store secret if needed for manual entry
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingSetup, setLoadingSetup] = useState(true); // NEW: Loading for initial setup

  // NEW: Fetch QR code and secret on modal open
  useEffect(() => {
    if (isOpen) {
      const fetchSetupData = async () => {
        setLoadingSetup(true);
        setError('');
        try {
          const response = await apiClient.post('/auth/passenger/2fa/setup'); // Use correct endpoint from Postman
          if (response.status === 200 && response.data && response.data.data) {
            setQrDataUrl(response.data.data.qr_code_url); // Adjust based on actual API response structure
            setSecret(response.data.data.secret); // Adjust based on actual API response structure
          } else {
            setError('Failed to get setup data. Please try again.');
          }
        } catch (err) {
          console.error("2FA Setup Error:", err);
          let errorMessage = 'An unexpected error occurred.';
          if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
        } finally {
          setLoadingSetup(false);
        }
      };

      fetchSetupData();
    } else {
        // NEW: Reset state when modal closes
        setQrDataUrl(null);
        setSecret(null);
        setOtp('');
        setError('');
        setLoading(false);
        setLoadingSetup(false);
    }
  }, [isOpen]);


  const handleEnable = async () => {
    setError(''); // Clear previous errors
    if (!otp) {
      setError('Please enter the OTP from your authenticator app.');
      return;
    }

    setLoading(true);
    try {
      // NEW: Call the enable API using apiClient
      const response = await apiClient.post('/auth/passenger/2fa/enable', { // Use correct endpoint from Postman
        token: otp, // Or 'otp' depending on API expectation
      });

      console.log("2FA Enable Response:", response); // Debug log
      if (response.status === 200) { // Assuming 200 for success
        // NEW: On success, close modal and trigger success handler (e.g., update profile info in parent)
        onClose();
        onSuccess();
      } else {
          setError('Failed to enable 2FA. Please check the code and try again.');
      }
    } catch (err: any) {
        console.error("2FA Enable Error:", err);
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
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp max-h-[90vh] overflow-y-auto border-t border-achrams-border max-w-sm mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Enable Two-Factor Authentication</h3>
          <button
            onClick={onClose}
            disabled={loading} // NEW: Disable close button while loading
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loadingSetup ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader className="w-8 h-8 animate-spin text-achrams-primary-solid mb-4" />
            <p className="text-achrams-text-secondary">Setting up...</p>
          </div>
        ) : (
          <>
            <p className="text-achrams-text-secondary mb-6">
              Scan the QR code below with your authenticator app (like Google Authenticator or Authy) to link your account.
            </p>

            {qrDataUrl ? (
              <div className="flex flex-col items-center mb-6">
                <img src={qrDataUrl} alt="2FA QR Code" className="w-48 h-48 bg-achrams-bg-secondary p-4 rounded-lg border border-achrams-border" />
                {secret && (
                  <p className="text-xs text-achrams-text-tertiary mt-2">
                    Secret: <span className="font-mono">{secret}</span> (For manual entry if QR scan fails)
                  </p>
                )}
              </div>
            ) : (
              <p className="text-red-500 text-sm text-center mb-6">Failed to load QR code.</p>
            )}

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
              onClick={handleEnable}
              disabled={loading || !otp} // NEW: Disable based on loading and OTP field
              className={`w-full py-4 rounded-xl font-semibold mb-3 transition-all ${
                loading || !otp
                  ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
                  : 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
              }`}
            >
              {loading ? ( // NEW: Show spinner while loading
                <div className="flex items-center justify-center">
                  <Loader className="w-5 h-5 animate-spin mr-2" />
                  Enabling...
                </div>
              ) : (
                'Enable 2FA'
              )}
            </button>
          </>
        )}

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