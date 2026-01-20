// src/components/app/modals/AccountDeletionModal.tsx
import { useState } from 'react';
import { X, AlertCircle, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void; // Callback to handle successful deletion in parent
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}

export default function AccountDeletionModal({
  isOpen,
  onClose,
  onConfirm,
  showNotification,
}: AccountDeletionModalProps) {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDeleteAccount = async () => {
    if (!password) {
      setError("Please enter your password to confirm.");
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Note: The DELETE endpoint typically doesn't require a request body
      // but the API might require authentication via headers/cookies
      const response = await apiClient.delete('/auth/passenger/me', undefined, true); // isAuthRequest=true

      
      if (response.status === "success") {
        console.log("Delete account response:", response);
        showNotification("Account deleted successfully.", "success");
        onConfirm(); // Trigger parent logic (e.g., logout)
      } else {
        setError(response.message || "Failed to delete account.");
        showNotification(response.message || "Failed to delete account.", "error");
      }
    } catch (err: any) {
      console.error("Error deleting account:", err);
      setError(err.response?.data?.message || "An error occurred while deleting your account.");
      showNotification(err.response?.data?.message || "An error occurred while deleting your account.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-sm mx-auto rounded-2xl p-6 border border-achrams-border shadow-lg">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-achrams-text-primary">Delete Account</h3>
            <p className="text-achrams-text-secondary text-sm">
              This action is permanent and cannot be undone. All your data will be lost.
            </p>
          </div>
        </div>

        <div className="p-3 bg-red-50 rounded-xl border border-red-200 mb-4">
          <p className="text-red-700 text-sm">
            To confirm, please enter your password below. This is to ensure you are the account owner.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-achrams-text-secondary font-medium mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 bg-achrams-bg-secondary border border-achrams-border rounded-xl outline-none text-achrams-text-primary focus:ring-1 focus:ring-achrams-primary-solid focus:border-achrams-primary-solid"
            placeholder="Enter your password"
            disabled={loading}
          />
          {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 bg-gray-100 text-achrams-text-primary rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className={`flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Deleting...
              </div>
            ) : (
              'Delete Account'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}