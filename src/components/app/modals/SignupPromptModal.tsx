
import { X, Loader } from 'lucide-react';
import { useState } from 'react';

import { apiClient } from '@/services/apiClient'; 

interface SignupPromptModalProps {
  isOpen: boolean;
  passengerData: { name: string; email: string; phone: string };
  onClose: () => void;
  
  onRegistrationSuccess: (email: string) => void;
  
  onOpenLoginModal: () => void;
}

export default function SignupPromptModal({
  isOpen,
  passengerData,
  onClose,
  onRegistrationSuccess,
  onOpenLoginModal, 
}: SignupPromptModalProps) {
  if (!isOpen) return null;

  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setError(''); 
    if (!password || !confirmPassword) {
      setError('Please fill in all password fields.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 8) { 
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      
      
      const nameParts = passengerData.name.split(' ');
      const firstName = nameParts[0] || 'Guest';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      const response = await apiClient.post('/auth/passenger/register', {
        email: passengerData.email,
        phone_number: passengerData.phone, 
        first_name: firstName,
        last_name: lastName,
        password: password,
      });

      console.log("Registration Response:", response); 
      
      if (response.status === 201) { 
        
        onRegistrationSuccess(passengerData.email);
      } else {
          setError('Registration failed. Please try again.');
      }
    } catch (err: any) {
        console.error("Registration Error:", err);
        
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

        {/* Display passenger data */}
        <div className="space-y-4 mb-4"> {/* Added mb-4 for spacing before password fields */}
          <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="text-xs text-achrams-text-secondary mb-1">Full name</div>
            <div className="text-achrams-text-primary">{passengerData.name}</div>
          </div>
          <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="text-xs text-achrams-text-secondary mb-1">Email</div>
            <div className="text-achrams-text-primary">{passengerData.email}</div>
          </div>
          <div className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl border border-achrams-border">
            <div className="text-xs text-achrams-text-secondary mb-1">Phone</div>
            <div className="text-achrams-text-primary">{passengerData.phone}</div>
          </div>
        </div>

        {/* NEW: Password Fields */}
        <div className="space-y-4">
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading} 
            className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={loading} 
            className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
          />
        </div>

        {/* NEW: Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}

        <button
          onClick={handleRegister}
          disabled={loading || !password || !confirmPassword} 
          className={`w-full py-4 rounded-xl font-semibold mt-6 transition-all ${
            loading || !password || !confirmPassword
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

        {/* NEW: Sign In Link */}
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