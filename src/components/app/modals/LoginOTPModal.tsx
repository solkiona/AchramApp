// src/components/app/modals/LoginOTPModal.tsx

import { useState, useEffect, useRef } from 'react';
import { X, Check, ShieldCheck, Loader } from 'lucide-react'; // Use ShieldCheck for 2FA

export default function LoginOTPModal({
  isOpen,
  onClose,
  onSubmit, // Function to call when OTP is submitted
  email, // Email to display in the modal
  showNotification,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (otp: string) => void; // Function to submit the OTP code
  email: string; // Email address for display
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // 6-digit OTP
  const [loading, setLoading] = useState(false); // Loading state for submission
  const [apiError, setApiError] = useState(''); // Error state for API call
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Effect to reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp(['', '', '', '', '', '']);
      setApiError('');
      setLoading(false);
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (loading) return; // Prevent input while loading
    if (!/^\d*$/.test(value) || value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) { // Focus next input
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is completely filled
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      handleSubmitOtp(newOtp.join(''));
    }
  };

  const handleSubmitOtp = async (otpCode: string) => {
    if (loading) return; // Prevent double submission
    setLoading(true);
    setApiError(''); // Clear previous errors
    try {
      // Call the parent function to handle the submission
      await onSubmit(otpCode);
    } catch (err: any) {
      console.error("Login OTP Submission Error:", err);
      let errorMessage = 'An unexpected error occurred.';
      if (err.message) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = () => {
    // 2FA codes are usually not resent easily, often require re-logging in or using backup codes
    // For simplicity in this flow, maybe just inform the user or allow re-login
    showNotification("OTP codes for login are typically not resent. Please try logging in again.", "info");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp border-t border-achrams-border overflow-y-auto">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-achrams-text-primary text-center mx-auto">Verify 2FA</h3>
          <button
            onClick={onClose}
            disabled={loading} // Disable during API call
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-achrams-text-secondary mb-8 mx-auto w-fit">
          Enter the 6-digit code from your authenticator app or sent to <span className="font-medium text-achrams-text-primary">{email}</span>
        </p>

        <div className="flex gap-3 justify-center mb-8">
          {otp.map((_, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={otp[idx]}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              disabled={loading} // Disable during API call
              className={`w-12 h-12 text-center text-2xl font-bold bg-achrams-bg-secondary border-2 rounded-xl outline-none text-achrams-text-primary focus:ring-1 focus:ring-achrams-primary-solid ${
                apiError ? 'border-red-500' : 'border-achrams-border focus:border-achrams-primary-solid'
              }`}
            />
          ))}
        </div>
        {/* Display API error */}
        {apiError && (
          <p className="text-red-500 text-sm mb-2 text-center">{apiError}</p>
        )}
        <button
          onClick={() => handleSubmitOtp(otp.join(''))} // Submit current OTP
          disabled={loading || otp.some(d => d === '')} // Disable if loading or OTP not filled
          className={`w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all ${
            loading || otp.some(d => d === '') ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Verifying...
            </div>
          ) : (
            'Verify'
          )}
        </button>
        <button
          onClick={handleResendOtp}
          className="w-full mt-3 text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors"
        >
          Didn't receive a code?
        </button>
        <button
          onClick={onClose}
          disabled={loading} // Disable during API call
          className="w-full mt-3 text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}