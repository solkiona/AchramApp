// src/components/app/modals/UpdateProfileModal.tsx
import { X, User, Mail, Phone, Globe, Loader } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiClient } from '@/services/apiClient'; // Assuming you create this service

interface UpdateProfileModalProps {
  isOpen: boolean;
  initialData: { name: string; email: string; phone: string; preferred_language: string }; // NEW: Pass initial data
  onClose: () => void;
  onSuccess: (updatedData: any) => void; // NEW: Callback after successful update
}

export default function UpdateProfileModal({
  isOpen,
  initialData,
  onClose,
  onSuccess,
}: UpdateProfileModalProps) {
  if (!isOpen) return null;

  // NEW: State for form data, loading, error
  const [formData, setFormData] = useState(initialData); // NEW: Initialize with initial data
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // NEW: Reset form when initialData changes (e.g., if modal is reused)
  useEffect(() => {
    if (isOpen) {
        setFormData(initialData);
        setError('');
    }
  }, [initialData, isOpen]);


  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setError(''); // Clear previous errors
    // Basic validation can be added here if needed

    setLoading(true);
    try {
      // NEW: Call the update profile API using apiClient
      // Use PATCH /auth/passenger/me as per Postman doc
      const response = await apiClient.patch('/auth/passenger/me', formData);

      console.log("Profile Update Response:", response); // Debug log
      if (response.status === 200 && response.data && response.data.data) { // Assuming 200 for success
        // NEW: On success, close modal and trigger success handler with updated data
        onClose();
        onSuccess(response.data.data); // Pass the updated user data back
      } else {
          setError('Failed to update profile. Please try again.');
      }
    } catch (err: any) {
        console.error("Profile Update Error:", err);
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
      <div className="bg-achrams-bg-primary w-full max-w-sm mx-auto rounded-t-3xl p-6 animate-slideUp max-h-[85vh] overflow-y-auto border-t border-achrams-border">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-achrams-text-primary">Edit Profile</h3>
          <button
            onClick={onClose}
            disabled={loading} // NEW: Disable close button while loading
            className="text-achrams-text-secondary hover:text-achrams-text-primary transition-colors disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-achrams-text-secondary" />
            <input
              type="text"
              placeholder="Full name"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              disabled={loading} // NEW: Disable input while loading
              className="w-full pl-10 pr-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-achrams-text-secondary" />
            <input
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading} // NEW: Disable input while loading
              className="w-full pl-10 pr-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
            />
          </div>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-achrams-text-secondary" />
            <input
              type="tel"
              placeholder="Phone number"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)} // NEW: Handle phone change
              disabled={loading} // NEW: Disable input while loading
              className="w-full pl-10 pr-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-achrams-text-secondary" />
            <select // NEW: Use select for language
              value={formData.preferred_language}
              onChange={(e) => handleChange('preferred_language', e.target.value)}
              disabled={loading} // NEW: Disable input while loading
              className="w-full pl-10 pr-4 py-4 bg-achrams-bg-secondary rounded-xl outline-none text-achrams-text-primary border border-achrams-border appearance-none"
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              {/* Add more options as needed based on API support */}
            </select>
          </div>
        </div>

        {/* NEW: Error Message Display */}
        {error && (
          <p className="text-red-500 text-sm mb-4">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading} // NEW: Disable based on loading
          className={`w-full py-4 rounded-xl font-semibold mb-3 transition-all ${
            loading
              ? 'bg-achrams-secondary-solid text-achrams-text-light opacity-75 cursor-not-allowed'
              : 'bg-achrams-gradient-primary text-achrams-text-light hover:opacity-90 active:scale-[0.98]'
          }`}
        >
          {loading ? ( // NEW: Show spinner while loading
            <div className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </button>

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