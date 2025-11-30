// src/components/app/modals/OTPModal.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Check, MailCheck } from 'lucide-react'; // Added MailCheck icon

export default function OTPModal({
  isOpen,
  email,
  onComplete,
  onClose,
}: {
  isOpen: boolean;
  email: string;
  onComplete: () => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '']);
  const [verified, setVerified] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setOtp(['', '', '', '', '']);
      setVerified(false); // Reset verified state when opening
    }
  }, [isOpen]);

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value) || value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 4) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 5) {
      setTimeout(() => {
        setVerified(true);
        setTimeout(() => {
          onComplete();
        }, 1000);
      }, 800);
    }
  };

  if (!isOpen) return null;

  if (verified) {
    return (
      // Verified state modal
      <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
        <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp text-center border-t border-achrams-border">
          <div className="w-16 h-16 bg-achrams-bg-secondary rounded-full flex items-center justify-center mx-auto mb-4 border border-achrams-border">
            <Check className="w-8 h-8 text-achrams-primary-solid" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-achrams-text-primary">Email verified!</h3>
          <p className="text-achrams-text-secondary">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    // Input state modal
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
      <div className="bg-white w-full rounded-t-3xl p-6 animate-slideUp border-t border-achrams-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-achrams-text-primary text-center  mx-auto" >Verify your email</h3>
          <button
            onClick={onClose}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-achrams-text-secondary mb-8 mx-auto w-fit">Enter the 5-digit code sent to <span className="font-medium text-achrams-text-primary">{email}</span></p>
        <div className="flex gap-3 justify-center mb-8">
          {otp.map((_, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric" // Better for mobile numeric keyboards
              maxLength={1}
              value={otp[idx]}
              onChange={(e) => handleOtpChange(idx, e.target.value)}
              // Apply ACHRAMS styling to input
              className="w-14 h-14 text-center text-2xl font-bold bg-achrams-bg-secondary border-2 border-achrams-border rounded-xl outline-none text-achrams-text-primary focus:border-achrams-primary-solid focus:ring-1 focus:ring-achrams-primary-solid"
            />
          ))}
        </div>
        <button className="w-full text-center text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors">
          Resend code
        </button>
        <button
          onClick={onClose}
          className="w-full mt-3 text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}