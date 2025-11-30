// src/components/ui/OTPInput.tsx
import React, { useState, useRef, useEffect } from 'react';
import { twMerge } from 'tailwind-merge';

interface OTPInputProps {
  length?: number;
  onChange: (otp: string) => void;
  onComplete?: (otp: string) => void;
  autoFocus?: boolean;
  containerClassName?: string;
  inputClassName?: string;
  error?: string; // Add error prop
}

const OTPInput: React.FC<OTPInputProps> = ({
  length = 5,
  onChange,
  onComplete,
  autoFocus = true,
  containerClassName,
  inputClassName,
  error,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (autoFocus && inputRefs.current[0]) {
      inputRefs.current[0]?.focus();
    }
  }, [autoFocus]);

  const handleChange = (index: number, value: string) => {
    if (/^\d*$/.test(value) && value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      onChange(newOtp.join(''));

      // Auto-focus next input
      if (value && index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit if all filled
      const allFilled = newOtp.every(digit => digit !== '');
      if (allFilled && newOtp.join('').length === length) {
        onComplete?.(newOtp.join(''));
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow backspace to clear current and move to previous
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const containerClasses = twMerge(
    'flex gap-3 justify-center bg-achrams-secondary-solid/50 ',
    containerClassName
  );

  const inputClasses = twMerge(
    'w-14 h-14 text-center text-2xl font-bold border-2 border-achrams-border rounded-xl focus:outline-none focus:ring-2 focus:ring-achrams-primary-solid bg-achrams-background-card',
    error ? 'border-red-500 focus:ring-red-500' : 'focus:border-achrams-primary-solid',
    inputClassName
  );

  return (
    <div className={containerClasses}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className={inputClasses}
        />
      ))}
      {error && <p className="mt-2 text-sm text-red-600 w-full text-center">{error}</p>}
    </div>
  );
};

export default OTPInput;