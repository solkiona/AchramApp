// // src/components/app/modals/LoginModal.tsx
import { X, Loader, Mail, Chrome, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
// import { apiClient } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import GoogleColor from '@/components/icons/GoogleColor';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (loginResult?: any) => void; 
  onLoginError?: (errorMessage: string) => void; 
  onShowSignupPrompt: () => void;
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  onRequires2FA: (email: string, password: string) => void;
}

export default function LoginModal({
  isOpen,
  onClose,
  onRequires2FA,
  onLoginSuccess,
  onShowSignupPrompt,
  onLoginError,
  showNotification,

}: LoginModalProps) {
  if (!isOpen) return null;

  const { login: updateAuthContext } = useAuth(); // Get the login function from context

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  // const handleLogin = async () => {
  //   setError('');
  //   if (!email || !password) {
  //     setError('Please fill in all fields.');
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // Call the login function from AuthContext, which handles the API call and state updates
  //     const loginSuccessful = await updateAuthContext(email, password);

  //     if (loginSuccessful) {
  //       onClose();
  //       onLoginSuccess(); // Parent (page.tsx) can handle navigation or UI updates
  //     } else {
  //       // The login function in AuthContext should have handled setting an error,
  //       // or we can set a generic one here if needed.
  //       setError('Login failed. Please check your credentials.');
  //     }
  //   } catch (err: any) {
  //       console.error("Login Error caught in LoginModal:", err);
  //       let errorMessage = 'An unexpected error occurred.';
  //       if (err.message) {
  //           errorMessage = err.message;
  //       }
  //       setError(errorMessage);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      // Call the login function from AuthContext, which handles the API call and state updates
      // NEW: Expect the result to be an object { success: boolean, message?: string }
      const loginResult = await updateAuthContext(email, password);
      if (loginResult.success){


        if (loginResult.requires2FA) {
          console.log("LoginModal: 2FA required. calling onRequires2FA handler");
          onRequires2FA(email, password);
          
        }  else {

          onClose();
          onLoginSuccess(); // Parent (page.tsx) can handle navigation or UI updates
          // Optionally, page.tsx can show a success notification here too if needed
        }
        

        
      }
      else {
        // NEW: Handle login failure by getting the specific error message
        const errorMessage = loginResult.message || 'Login failed. Please check your credentials.';
        // Option 1: Set error in the modal's local state (current behavior)
        setError(errorMessage);

        // Option 2: Call a parent handler to show a notification (NEW PREFERRED WAY)
        if (onLoginError) {
            onLoginError(errorMessage); // Pass the specific error message to parent
            showNotification(errorMessage, "error")
        }
      }
    } catch (err: any) {
        console.error("Login Error caught in LoginModal:", err);
        let errorMessage = 'An unexpected error occurred.';
        if (err.message) {
            errorMessage = err.message;
        }
        setError(errorMessage);
        showNotification(errorMessage, 'error')
        if (onLoginError) {
            onLoginError(errorMessage); // Pass the catch error message to parent
        }
    } finally {
      setLoading(false);
    }
  };

  // Placeholder for Google login function
  const handleGoogleLogin = () => {
      setLoadingGoogle(true);
      // Simulate Google login process (replace with actual Google SDK call)
      setTimeout(() => {
          setLoadingGoogle(false);
          alert('Google login functionality would be implemented here using Google SDK.');
      }, 2000);
  };

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 bg-opacity-70 flex items-end z-50">
      <div className="bg-white max-w-sm mx-auto w-full rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-achrams-text-primary">Sign In to your account</h3>
          <button
            onClick={onClose}
            disabled={loading || loadingGoogle}
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Email/Password Login Form */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-achrams-text-secondary" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || loadingGoogle}
              className="w-full pl-10 pr-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
            />
          </div>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading || loadingGoogle}
              className="w-full px-4 py-3 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-achrams-text-secondary hover:text-achrams-text-primary"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleLogin}
          disabled={loading || loadingGoogle || !email || !password}
          className={`w-full py-4 rounded-xl font-semibold mb-4 transition-all ${
            loading || loadingGoogle || !email || !password
              ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
              : 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Signing In...
            </div>
          ) : (
            'Sign In'
          )}
        </button>

        {/* Google Login Button */}

        {false && (

        <button
          onClick={handleGoogleLogin}
          disabled={loading || loadingGoogle}
          className={`w-full py-3 rounded-xl font-medium mb-4 transition-colors flex items-center justify-center gap-2 ${
            loadingGoogle
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
          }`}
        >
          {loadingGoogle ? (
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Signing In...
            </div>
          ) : (
            <>
              <GoogleColor className="w-5 h-5" />
              Sign In with Google
            </>
          )}
        </button>

        )}

        {/* Sign Up Link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              onClose();
              onShowSignupPrompt();
            }}
            className="text-sm text-achrams-primary-solid hover:underline"
          >
            Don't have an account? Sign Up
          </button>
        </div>

        <button
          onClick={onClose}
          disabled={loading || loadingGoogle}
          className="w-full mt-4 text-achrams-text-secondary font-medium hover:text-achrams-text-primary transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
