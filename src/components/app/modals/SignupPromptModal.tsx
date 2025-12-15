// components/app/modals/SignupPromptModal.tsx
"use client"

import { X, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api'; // Adjust import path as needed

// Define the type for the full signup data, including password
interface FullSignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

interface SignupPromptModalProps {
  isOpen: boolean;
  passengerData: { name: string; email: string; phone: string }; // Initial data from booking
  onClose: () => void;
  // NEW: Prop now receives full signup data (including password) and countdown
  onVerifyEmail: (data: FullSignupData, countdown: number) => void;
  onOpenLoginModal: () => void;
}

export default function SignupPromptModal({
  isOpen,
  passengerData,
  onClose,
  onVerifyEmail, // Renamed to reflect its new purpose
  onOpenLoginModal,
}: SignupPromptModalProps) {
  if (!isOpen) return null;

  // --- State for user inputs ---
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  
  // --- State for validation errors ---
  const [nameError, setNameError] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [phoneError, setPhoneError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const [error, setError] = useState<string>(''); // General error
  const [loading, setLoading] = useState<boolean>(false);

  // --- Initialize local state from passengerData when modal opens ---
  useEffect(() => {
    if (isOpen) {
      setName(passengerData.name || '');
      setEmail(passengerData.email || '');
      setPhone(passengerData.phone || '');
      // Reset fields and errors when opening
      setPassword('');
      setConfirmPassword('');
      setError('');
      setNameError('');
      setEmailError('');
      setPhoneError('');
      setPasswordError('');
      setConfirmPasswordError('');
    }
  }, [isOpen, passengerData]);

  // --- Validation Functions ---
  const validateName = (input: string): string => {
    if (!input.trim()) {
      return 'Full name is required.';
    }
    if (input.trim().length < 2) {
      return 'Name must be at least 2 characters long.';
    }
    return '';
  };

  const validateEmail = (input: string): string => {
    if (!input) {
      return 'Email is required.';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      return 'Please enter a valid email address.';
    }
    return '';
  };

  const validatePhone = (input: string): string => {
    if (!input) {
      return 'Phone number is required.';
    }
    const digitsOnly = input.replace(/\D/g, '');
    const phoneRegex = /^(\+?234|0)?[789]\d{9}$/;
    if (!phoneRegex.test(digitsOnly)) {
      return 'Please enter a valid Nigerian phone number.';
    }
    return '';
  };

  const validatePassword = (input: string): string => {
    if (!input) {
      return 'Password is required.';
    }
    if (input.length < 8) {
      return 'Password must be at least 8 characters long.';
    }
    return '';
  };

  const validateConfirmPassword = (input: string, passwordInput: string): string => {
    if (!input) {
      return 'Please confirm your password.';
    }
    if (input !== passwordInput) {
      return 'Passwords do not match.';
    }
    return '';
  };

  // --- Handle Blur Events for validation ---
  const handleNameBlur = () => setNameError(validateName(name));
  const handleEmailBlur = () => setEmailError(validateEmail(email));
  const handlePhoneBlur = () => setPhoneError(validatePhone(phone));
  const handlePasswordBlur = () => {
    setPasswordError(validatePassword(password));
    if (confirmPassword) setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));
  };
  const handleConfirmPasswordBlur = () => setConfirmPasswordError(validateConfirmPassword(confirmPassword, password));

  // --- Handle Input Changes ---
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    if (nameError) setNameError('');
  };
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError('');
  };
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value);
    if (phoneError) setPhoneError('');
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError('');
    if (confirmPasswordError) setConfirmPasswordError('');
  };
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (confirmPasswordError) setConfirmPasswordError('');
  };

  const handleRegister = async () => {
    setError('');
    setNameError('');
    setEmailError('');
    setPhoneError('');
    setPasswordError('');
    setConfirmPasswordError('');

    const nameErr = validateName(name);
    const emailErr = validateEmail(email);
    const phoneErr = validatePhone(phone);
    const passwordErr = validatePassword(password);
    const confirmPasswordErr = validateConfirmPassword(confirmPassword, password);

    setNameError(nameErr);
    setEmailError(emailErr);
    setPhoneError(phoneErr);
    setPasswordError(passwordErr);
    setConfirmPasswordError(confirmPasswordErr);

    if (nameErr || emailErr || phoneErr || passwordErr || confirmPasswordErr) {
      return;
    }

    setLoading(true);
    try {
      const nameParts = name.trim().split(/\s+/);
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || '';

      const response = await apiClient.post('/auth/passenger/onboard/initiate', {
        email: email,
        phone_number: phone,
        first_name: firstName,
        last_name: lastName,
        password: password, // Include password in the request
      });

      console.log("Registration Initiate Response:", response);

      if (response.status === "success" && response.data) {
        const countdown = response.data.countdown;
        if (typeof countdown === 'number') {

          console.log('countdown :', response.data.countdown)
          console.log('Passenger Data ', {name, email,phone,password})

          //showNotification(response.message)
            // NEW: Call the prop with the full signup data (including password) and countdown
            onVerifyEmail({ name, email, phone, password }, countdown);
            onClose(); // Close this modal after calling the prop
        } else {
            setError('Invalid countdown received from server.');
        }
      } else {
        setError(response.details?.phone_number?.[0] ||response.details?.email?.[0] || response.message || 'Registration initiation failed. Please try again.');
      }
    } catch (err: any) {
      console.error("Registration Initiate Error:", err);
      let errorMessage = 'An unexpected error occurred.';
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading ||
                          !name || !email || !phone || !password || !confirmPassword ||
                          !!nameError || !!emailError || !!phoneError || !!passwordError || !!confirmPasswordError;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-50">
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-achrams-text-primary">Create your account</h3>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        <p className="text-achrams-text-secondary mb-6">Sign up to save your trips and preferences</p>

        {/* Editable Input Fields with Validation */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              disabled={loading}
              className={`w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border ${
                nameError ? 'border-red-500' : 'border-achrams-border'
              }`}
            />
            {nameError && <p className="text-red-500 text-xs mt-1">{nameError}</p>}
          </div>
          <div className="relative">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={handleEmailChange}
              onBlur={handleEmailBlur}
              disabled={loading}
              className={`w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border ${
                emailError ? 'border-red-500' : 'border-achrams-border'
              }`}
            />
            {emailError && <p className="text-red-500 text-xs mt-1">{emailError}</p>}
          </div>
          <div className="relative">
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={handlePhoneChange}
              onBlur={handlePhoneBlur}
              disabled={loading}
              className={`w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border ${
                phoneError ? 'border-red-500' : 'border-achrams-border'
              }`}
            />
            {phoneError && <p className="text-red-500 text-xs mt-1">{phoneError}</p>}
          </div>
        </div>

        {/* Password Fields with Validation */}
        <div className="space-y-4 mb-4">
          <div className="relative">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={handlePasswordChange}
              onBlur={handlePasswordBlur}
              disabled={loading}
              className={`w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border ${
                passwordError ? 'border-red-500' : 'border-achrams-border'
              }`}
            />
            {passwordError && <p className="text-red-500 text-xs mt-1">{passwordError}</p>}
          </div>
          <div className="relative">
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              onBlur={handleConfirmPasswordBlur}
              disabled={loading}
              className={`w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border ${
                confirmPasswordError ? 'border-red-500' : 'border-achrams-border'
              }`}
            />
            {confirmPasswordError && <p className="text-red-500 text-xs mt-1">{confirmPasswordError}</p>}
          </div>
        </div>

        {/* General Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm mb-2">{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={isSubmitDisabled}
          className={`w-full py-4 rounded-xl font-semibold mt-2 transition-all ${
            isSubmitDisabled
              ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
              : 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Creating...
            </div>
          ) : (
            'Create account'
          )}
        </button>

        {/* Sign In Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onClose();
              onOpenLoginModal();
            }}
            className="text-sm text-achrams-primary-solid hover:underline"
          >
            Already have an account? Sign In
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={loading}
          className="w-full mt-4 text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
        >
          Not now
        </button>
      </div>
    </div>
  );
}

// //components/app/modals/signupPromptModal
// "use client"

// import { X, Loader } from 'lucide-react';
// import { useState } from 'react';

// import { apiClient } from '@/services/apiClient'; 

// interface SignupPromptModalProps {
//   isOpen: boolean;
//   passengerData: { name: string; email: string; phone: string };
//   onClose: () => void;
  
//   onRegistrationSuccess: (email: string) => void;
  
//   onOpenLoginModal: () => void;
// }

// export default function SignupPromptModal({
//   isOpen,
//   passengerData,
//   onClose,
//   onRegistrationSuccess,
//   onOpenLoginModal, 
// }: SignupPromptModalProps) {
//   if (!isOpen) return null;

  
//   const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(false);

//   const handleRegister = async () => {
//     setError(''); 
//     if (!password || !confirmPassword) {
//       setError('Please fill in all password fields.');
//       return;
//     }
//     if (password !== confirmPassword) {
//       setError('Passwords do not match.');
//       return;
//     }
//     if (password.length < 8) { 
//       setError('Password must be at least 8 characters long.');
//       return;
//     }

//     setLoading(true);
//     try {
      
      
//       const nameParts = passengerData.name.split(' ');
//       const firstName = nameParts[0] || 'Guest';
//       const lastName = nameParts.slice(1).join(' ') || 'User';

//       const response = await apiClient.post('/auth/passenger/onboard/initiate', {
//         email: passengerData.email,
//         phone_number: passengerData.phone, 
//         first_name: firstName,
//         last_name: lastName,
//         password: password,
//       });

//       console.log("Registration Response:", response); 
      
//       if (response.status === 201) { 
        
//         onRegistrationSuccess(passengerData.email);
//       } else {
//           setError('Registration failed. Please try again.');
//       }
//     } catch (err: any) {
//         console.error("Registration Error:", err);
        
//         let errorMessage = 'An unexpected error occurred.';
//         if (err.response && err.response.data && err.response.data.message) {
//             errorMessage = err.response.data.message;
//         } else if (err.message) {
//             errorMessage = err.message;
//         }
//         setError(errorMessage);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-50">
//       <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
//         <div className="flex justify-between items-center mb-2">
//           <h3 className="text-xl font-bold text-achrams-text-primary">Create your account</h3>
//           <button
//             onClick={onClose}
//             disabled={loading} 
//             className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
//           >
//             <X className="w-6 h-6" />
//           </button>
//         </div>
//         <p className="text-achrams-text-secondary mb-6">Sign up to save your trips and preferences</p>

//         {/* Display passenger data */}
//         <div className="space-y-4 mb-4"> {/* Added mb-4 for spacing before password fields */}
//           <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
//             <div className="text-xs text-achrams-text-secondary mb-1">Full name</div>
//             <div className="text-achrams-text-primary">{passengerData.name}</div>
//           </div>
//           <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
//             <div className="text-xs text-achrams-text-secondary mb-1">Email</div>
//             <div className="text-achrams-text-primary">{passengerData.email}</div>
//           </div>
//           <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
//             <div className="text-xs text-achrams-text-secondary mb-1">Phone</div>
//             <div className="text-achrams-text-primary">{passengerData.phone}</div>
//           </div>
//         </div>

//         {/* NEW: Password Fields */}
//         <div className="space-y-4">
//           <input
//             type="password"
//             placeholder="Password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={loading} 
//             className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
//           />
//           <input
//             type="password"
//             placeholder="Confirm Password"
//             value={confirmPassword}
//             onChange={(e) => setConfirmPassword(e.target.value)}
//             disabled={loading} 
//             className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
//           />
//         </div>

//         {/* NEW: Error Message Display */}
//         {error && (
//           <p className="text-red-500 text-sm mt-2">{error}</p>
//         )}

//         <button
//           onClick={handleRegister}
//           disabled={loading || !password || !confirmPassword} 
//           className={`w-full py-4 rounded-xl font-semibold mt-6 transition-all ${
//             loading || !password || !confirmPassword
//               ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
//               : 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
//           }`}
//         >
//           {loading ? ( 
//             <div className="flex items-center justify-center">
//               <Loader className="w-5 h-5 animate-spin mr-2" />
//               Creating...
//             </div>
//           ) : (
//             'Create account'
//           )}
//         </button>

//         {/* NEW: Sign In Link */}
//         <div className="mt-4 text-center">
//           <button
//             onClick={() => {
//               onClose(); 
//               onOpenLoginModal(); 
//             }}
//             className="text-sm text-achrams-primary-solid hover:underline"
//           >
//             Already have an account? Sign In
//           </button>
//         </div>

//         <button
//           onClick={onClose}
//           disabled={loading} 
//           className="w-full mt-4 text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
//         >
//           Not now
//         </button>
//       </div>
//     </div>
//   );
// }