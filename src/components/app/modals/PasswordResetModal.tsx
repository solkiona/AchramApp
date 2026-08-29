// src/components/app/modals/PasswordResetModal.tsx
import { useState, useEffect } from 'react';
import { X, Mail, Loader2, CheckCircle, EyeOff, Eye } from 'lucide-react';
import { apiClient } from '@/lib/api';
import  {useApiErrorHandler} from '@/lib/errors/apiErrorHandler';

interface PasswordResetModalProps {
  isOpen: boolean;
  onClose: () => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  email: string; // Pass the user's email to pre-fill
  keyboardHeight: any;
}

export default function PasswordResetModal({
  isOpen,
  onClose,
  showNotification,
  email,
  keyboardHeight,
}: PasswordResetModalProps) {
  const [step, setStep] = useState<'email' | 'otp' | 'newPassword' | 'success'>('email');
  const [emailInput, setEmailInput] = useState(email ?? ''); // Pre-fill with user's email
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  const { fieldErrors, generalError, handleApiError} = useApiErrorHandler();

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('email');
      setEmailInput(email ?? '');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
      setCountdown(0);
    }
  }, [isOpen, email]);

  // Countdown for resend
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendResetEmail = async () => {
    if (!emailInput || !/^\S+@\S+\.\S+$/.test(emailInput)) {
      showNotification("Please enter a valid email address.", "error");
      return;
    }
    setLoading(true);
    try {
      const response = await apiClient.post('/auth/passenger/reset', { email: emailInput }, undefined, undefined, true); // isAuthRequest=true
      console.log("Reset email response:", response);
      if (response.status === "success") {
        showNotification("Reset email sent successfully!", "success");
        setStep('otp');
        setCountdown(60); // 60 seconds before resend allowed
      } else {
        const message = handleApiError(response);
        showNotification(generalError || response.message || "Failed to send reset email.", "error");
      }
    } catch (err: any) {
      console.error("Error sending reset email:", err);
      handleApiError(err)
      showNotification( generalError || err.response?.data?.message || "An error occurred while sending the reset email.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = () => {
    if (!otp || otp.length !== 6) {
      showNotification("Please enter a valid 6-digit OTP.", "error");
      return;
    }
    setStep('newPassword');
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      showNotification("Password must be at least 8 characters long.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showNotification("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/passenger/confirm-reset', {
        otp,
        password: newPassword,
        email: emailInput,
      }, undefined, undefined, true); // isAuthRequest=true
      console.log("Confirm reset response:", response);
      if (response.status === "success") {
        showNotification("Password reset successfully!", "success");
        setStep('success');
        // Optionally log out user or navigate to login after a delay
        setTimeout(() => {
          setStep('email'); // Reset to initial state
          onClose(); // Close modal after success
        }, 2000);
      } else {
        showNotification(response.message || "Failed to reset password.", "error");
      }
    } catch (err: any) {
      console.error("Error resetting password:", err);
      handleApiError(err);
      showNotification(generalError || err.response?.data?.message || "An error occurred while resetting the password.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) {
      showNotification("Please wait before requesting another OTP.", "info");
      return;
    }
    await handleSendResetEmail();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
      <div className="bg-white w-full max-w-md mx-auto rounded-t-3xl p-6 border-t border-achrams-border"
      
      style={{ transform: `translateY(-${keyboardHeight}px)` }}
      // style={{
      //   maxHeight: keyboardHeight ? `calc(85dvh - ${keyboardHeight}px)` : '85dvh',
      //   paddingBottom: keyboardHeight ? '16px' : undefined
      // }}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-achrams-text-primary">Reset Password</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Step 1: Enter Email */}
        {step === 'email' && (
          <div className="space-y-4">
            <div className="pt-3">
              {/* <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Email</label> */}
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border pr-10"
                placeholder="johndoe@example.com"
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSendResetEmail}
              disabled={loading}
              className={`w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {fieldErrors.email && (
                <p className="text-red-500">
                  {fieldErrors.email[0]}
                </p>
              )}
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </div>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </div>
        )}

        {/* Step 2: Enter OTP */}
        {step === 'otp' && (
          <div className="space-y-4">
            <p className="text-achrams-text-secondary mb-2">
              Enter the 6-digit code sent to <span className="font-medium text-achrams-text-primary">{emailInput}</span>
            </p>
            <div className="flex gap-2 justify-center mb-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <input
                  key={idx}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={otp[idx] || ''}
                  onChange={(e) => {
                    if (/^\d*$/.test(e.target.value) && e.target.value.length <= 1) {
                      const newOtp = otp.split('');
                      newOtp[idx] = e.target.value;
                      setOtp(newOtp.join(''));
                      if (e.target.value && idx < 5) {
                        const next = document.getElementById(`otp-${idx + 1}`);
                        if (next) (next as HTMLInputElement).focus();
                      }
                    }
                  }}
                  id={`otp-${idx}`}
                  disabled={loading}
                  className="w-10 h-10 text-center text-xl font-bold bg-achrams-bg-secondary border-2 rounded-xl outline-none text-achrams-text-primary focus:ring-1 focus:ring-achrams-primary-solid border-achrams-border focus:border-achrams-primary-solid"
                />
              ))}
            </div>
            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.length !== 6}
              className={`w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all ${
                loading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Verify OTP
            </button>
            <button
              onClick={handleResendOtp}
              disabled={loading || countdown > 0}
              className={`w-full text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors ${
                countdown > 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </button>
          </div>
        )}

        {/* Step 3: Enter New Password */}
        {/* step === 'newPassword' */}
        { step === 'newPassword' && (
          <div className="space-y-4">
            <div className="pt-3 relative">
              {/* <label className="block text-xs text-achrams-text-secondary font-small mb-1">New Password</label> */}
              <input
                type={showPassword ?"text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border pr-10"
                placeholder="Enter new password"
                disabled={loading}
              />
              <button
              type="button"
              onClick={() => setShowPassword(prev => !prev)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-achrams-text-secondary hover:text-achrams-text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
            
            </div>
            <div className="pt-3 relative">
              {/* <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Confirm Password</label> */}
              <input
                type={showPassword ?"text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border pr-10"
                placeholder="Confirm new password"
                disabled={loading}
              />

              {fieldErrors.password && (
                <p className="text-red-500">
                  {fieldErrors.password[0]}
                </p>
              )}
              
            </div>
            <button
              onClick={handleResetPassword}
              disabled={loading}
              className={`w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Resetting...
                </div>
              ) : (
                'Reset Password'
              )}
            </button>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 'success' && (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h4 className="text-lg font-bold text-achrams-text-primary mb-2">Password Changed!</h4>
            <p className="text-achrams-text-secondary">Your password has been updated successfully.</p>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full mt-4 text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}