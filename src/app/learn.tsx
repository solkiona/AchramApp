//functions residing in page.tsx

const handleResendOtp = async (data: { name: string; phone: string; email: string; password: string }): Promise<number> => {
    console.log("Resending OTP for email:", data.email);

    try {
      const nameParts = data.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/passenger/onboard/initiate', {
        email: data.email,
        phone_number: data.phone, // Use the phone from the stored signup data
        first_name: firstName,    // Use the parsed name from the stored signup data
        last_name: lastName,
        password: data.password,       // Use the password stored during signup
      });

      console.log("Resend OTP Response:", response);

      if (response.status === "success" && response.data?.countdown) {
        // Return the new countdown received from the API
        console.log("New OTP sent, new countdown:", response.data.countdown);
        return response.data.countdown;
      } else {
        // Handle potential API error responses that still have status 200
        const errorMessage = response.message || 'Failed to resend OTP. Please try again.';
        throw new Error(errorMessage);
      }
    } catch (err: any) {
      console.error("Resend OTP Error:", err);
      let errorMessage = 'An unexpected error occurred while resending OTP.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      // Re-throw the error so the OTPModal can catch it and display it
      throw new Error(errorMessage);
    }
  };





   <OTPModal
              isOpen={showOTP}
              // NEW: Pass the stored countdown value
              initialOtpCountdown={otpCountdown}
              initialSignupData ={{...passengerData, password: signupPasswordForOtp}}
              onComplete={() => {
                setScreen("dashboard");
                setShowOTP(false);
                setSignupPasswordForOtp('')
              }}
              onClose={() => {
                setShowOTP(false)
                setSignupPasswordForOtp('')
              }
  
              }
              onResendOtp={handleResendOtp} // Pass the stored password
          signupData={signupDataForOtp || passengerData} // Pass the stored data, fallback if needed
            />


//OTPModal definition


// src/components/app/modals/OTPModal.tsx
import { useState, useEffect, useRef } from 'react';
import { X, Check, MailCheck, Loader } from 'lucide-react'; // Added MailCheck, Loader icons
import { apiClient } from '@/lib/api'; // Import your apiClient

// Define the type for the full signup data, including password
interface FullSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export default function OTPModal({
  isOpen,
  // NEW: Receive the full signup data from page.tsx
  initialSignupData,
  // NEW: Receive the initial countdown from page.tsx
  initialOtpCountdown,
  // NEW: Receive the function to resend OTP from page.tsx
  onResendOtp,
  onComplete, // This should now trigger the success flow (e.g., setScreen('dashboard'))
  onClose,
}: {
  isOpen: boolean;
  initialSignupData: FullSignupData; // NEW: Initial data for confirmation/resend
  initialOtpCountdown: number; // NEW: Initial countdown value in seconds
  onResendOtp: (data: FullSignupData) => Promise<number>; // NEW: Function to call the initiate endpoint again
  onComplete: () => void;
  onClose: () => void;
}) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']); // Changed to 6 digits
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(false); // Loading state for API call
  const [apiError, setApiError] = useState(''); // Error state for API call
  // NEW: State for countdown
  const [timeLeft, setTimeLeft] = useState(initialOtpCountdown);
  const [isExpired, setIsExpired] = useState(false);
  // NEW: Store the signup data locally within the modal
  const [signupData] = useState(initialSignupData);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null); // Ref to hold the interval ID

  // NEW: Function to format seconds into MM:SS
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // NEW: Effect to handle countdown logic
  useEffect(() => {
    if (isOpen && initialOtpCountdown > 0 && !verified && !isExpired) {
      // Reset timeLeft when modal opens with a new countdown
      setTimeLeft(initialOtpCountdown);
      setIsExpired(false);

      // Clear any existing interval
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }

      // Start the countdown
      countdownIntervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }
            setIsExpired(true); // Set expired state
            setApiError('OTP has expired. Please request a new one.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount, close, or when verified/expired
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [isOpen, initialOtpCountdown, verified, isExpired]); // Depend on these values

  // Effect to reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setOtp(['', '', '', '', '', '']); // Reset to 6 empty strings
      setVerified(false);
      setApiError('');
      setLoading(false);
      // Time state is managed by the main countdown effect
    }
  }, [isOpen]);

  // NEW: Function to submit the OTP
  const submitOtp = async (otpCode: string) => {
    if (isExpired || loading) { // Prevent submission if expired or already loading
        setApiError('OTP has expired or request is pending.');
        return;
    }
    setLoading(true);
    setApiError(''); // Clear previous errors
    try {
      const nameParts = signupData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/passenger/onboard/confirm', {
        email: signupData.email, // Use data from stored signupData
        phone_number: signupData.phone, // Use data from stored signupData
        first_name: firstName, // Use data from stored signupData
        last_name: lastName, // Use data from stored signupData
        password: signupData.password, // Use data from stored signupData
        otp: otpCode, // Add the user-inputted OTP
      });

      console.log("OTP Confirmation Response:", response);

      if (response.status === "success" && response.data?.token) {
        // Store the received token in your auth context or local storage
        if (typeof window !== 'undefined') {
            localStorage.setItem('authToken', response.data.token);
            if(response.data.refresh) {
                localStorage.setItem('refreshToken', response.data.refresh);
            }
        }

        // Clear the countdown interval on success
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        setVerified(true);
        setTimeout(() => {
          onComplete(); // This triggers the flow back in page.tsx
        }, 1000);
      } else {
        setApiError(response.message || 'OTP verification failed. Please try again.');
        setVerified(false);
      }
    } catch (err: any) {
      console.error("OTP Confirmation Error:", err);
      let errorMessage = 'An unexpected error occurred.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setApiError(errorMessage);
      setVerified(false);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (loading || isExpired) return; // Prevent input while loading or expired
    if (!/^\d*$/.test(value) || value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < otp.length - 1) { // Focus next input, handle 6 digits
      inputRefs.current[index + 1]?.focus();
    }

    // Check if OTP is completely filled (6 digits now)
    if (newOtp.every((d) => d !== '') && newOtp.join('').length === 6) {
      submitOtp(newOtp.join(''));
    }
  };

  // NEW: Function to handle OTP resend
  const handleResendOtp = async () => {
    if (loading || !isExpired) { // Only allow resend if expired or maybe always, depending on UX choice
        // If allowing resend anytime, remove the `!isExpired` check or add a cooldown timer
        if (!isExpired) {
            setApiError('A code is still active. Please wait for it to expire or try again later.');
            return;
        }
        // If expired, allow resend
    }
    setLoading(true);
    setApiError(''); // Clear previous errors
    try {
        console.log("Attempting to resend OTP for email:", signupData.email);
        // Call the parent function which handles the API call to initiate, passing the stored signupData
        const newCountdown = await onResendOtp(signupData);

        if (typeof newCountdown === 'number' && newCountdown > 0) {
            // Reset the countdown state with the new value
            setTimeLeft(newCountdown);
            setIsExpired(false);
            setApiError('New OTP sent successfully.'); // Inform user
            setOtp(['', '', '', '', '', '']); // Clear the old OTP inputs

             // Clear any existing interval
            if (countdownIntervalRef.current) {
                clearInterval(countdownIntervalRef.current);
            }

            // Start the countdown again
            countdownIntervalRef.current = setInterval(() => {
                setTimeLeft(prev => {
                if (prev <= 1) {
                    if (countdownIntervalRef.current) {
                    clearInterval(countdownIntervalRef.current);
                    }
                    setIsExpired(true); // Set expired state
                    setApiError('OTP has expired. Please request a new one.');
                    return 0;
                }
                return prev - 1;
                });
            }, 1000);

        } else {
            setApiError('Failed to resend OTP. Please try again.');
        }
    } catch (err: any) {
        console.error("Resend OTP Error:", err);
        let errorMessage = 'An unexpected error occurred while resending OTP.';
        if (err.response?.data?.message) {
            errorMessage = err.response.data.message;
        } else if (err.message) {
            errorMessage = err.message;
        }
        setApiError(errorMessage);
    } finally {
        setLoading(false);
    }
  };

  if (!isOpen) return null;

  if (verified) {
    return (
      <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50">
        <div className="bg-white  w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp text-center border-t border-achrams-border">
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
            disabled={loading || isExpired} // Disable during API call or if expired
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-achrams-text-secondary mb-8 mx-auto w-fit">Enter the 6-digit code sent to <span className="font-medium text-achrams-text-primary">{signupData.email}</span></p>

        {/* NEW: Display countdown timer */}
        <div className="text-center mb-4">
            <p className="text-achrams-text-secondary text-sm">
                Code expires in: <span className={`font-mono ${isExpired ? 'text-red-500' : 'text-achrams-text-primary'}`}>{formatTime(timeLeft)}</span>
            </p>
        </div>

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
              disabled={loading || isExpired} // Disable during API call or if expired
              className={`w-14 h-14 text-center text-2xl font-bold bg-achrams-bg-secondary border-2 rounded-xl outline-none text-achrams-text-primary focus:ring-1 focus:ring-achrams-primary-solid ${
                apiError ? 'border-red-500' : 'border-achrams-border focus:border-achrams-primary-solid'
              }`}
            />
          ))}
        </div>
        {/* Display API error or expiration error */}
        {(apiError || isExpired) && (
          <p className="text-red-500 text-sm mb-2 text-center">{apiError || 'OTP has expired.'}</p>
        )}
        <button
          onClick={handleResendOtp}
          disabled={loading} // Disable resend if loading, maybe also if not expired (depending on UX)
          className={`w-full text-center text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {loading ? ( // Show loading indicator while resending
            <div className="flex items-center justify-center">
              <Loader className="w-4 h-4 animate-spin mr-2" />
              Sending...
            </div>
          ) : (
            'Resend code'
          )}
        </button>
        <button
          onClick={onClose}
          disabled={loading || isExpired} // Disable during API call or if expired
          className="w-full mt-3 text-sm text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}


  