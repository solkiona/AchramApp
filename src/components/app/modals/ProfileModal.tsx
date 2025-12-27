// src/components/app/modals/ProfileModal.tsx
import { X, Phone, Mail, Shield, ChevronRight, Wallet, CreditCard, History, Settings, LogOut, User, Camera, Edit3, Save, ArrowLeft, Loader2 , Key, Trash2} from 'lucide-react';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { apiClient } from '@/lib/api'; // Assuming apiClient is available or passed down
import PasswordResetModal from "@/components/app/modals/PasswordResetModal"
import AccountDeletionModal from "@/components/app/modals/AccountDeletionModal"



interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: any; // Consider defining a more specific type for account data
  onLogout: () => void;
  onShowTripHistory?: () => void;
  onShowWallet?: () => void;
  onShowSettings?: () => void;
  // NEW: Prop to update account data after successful API call
  onUpdateAccountData: (updatedData: any) => void;
  // NEW: Prop to show notification
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
  setShowPasswordResetModal: (val: boolean) => void;
  setShowAccountDeletionModal: (val: boolean) => void
}

export default function ProfileModal({
  isOpen,
  onClose,
  accountData,
  onLogout,
  onShowTripHistory,
  onShowWallet,
  onShowSettings,
  onUpdateAccountData, // NEW: Function to update parent state
  showNotification, // NEW: Function to show notifications
  setShowPasswordResetModal,
  setShowAccountDeletionModal,
}: ProfileModalProps) {
  // NEW: State for editing mode and form data
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    first_name: accountData?.first_name || '',
    last_name: accountData?.last_name || '',
    email: accountData?.email || '',
    phone_number: accountData?.phone_number || '',
    profile_photo: accountData?.profile_photo || null,
    // NEW: Include is_2fa_enabled in form state
    is_2fa_enabled: accountData?.is_2fa_enabled || false,
    preferred_language: accountData?.preferred_language?.value || 'en',
  });
  

  const [isSaving, setIsSaving] = useState(false);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(accountData?.profile_photo || null);

  // NEW: Ref for file input
  const fileInputRef = useRef<HTMLInputElement>(null);

  // NEW: Reset form when modal closes or accountData changes while not editing
  useEffect(() => {
    if (!isOpen || !isEditing) {
      setEditForm({
        first_name: accountData?.first_name || '',
        last_name: accountData?.last_name || '',
        email: accountData?.email || '',
        phone_number: accountData?.phone_number || '',
        profile_photo: accountData?.profile_photo || null,
        is_2fa_enabled: accountData?.is_2fa_enabled || false, // Sync with accountData
        preferred_language: accountData?.preferred_language?.value || 'en',
      });
      setProfilePhotoPreview(accountData?.profile_photo || null);
    }
  }, [isOpen, accountData, isEditing]);

  // NEW: Handler for form input changes (including checkbox)
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      // Cast target to HTMLInputElement to access checked property
      const target = e.target as HTMLInputElement;
      setEditForm(prev => ({ ...prev, [name]: target.checked }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  // NEW: Handler for profile photo selection
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Basic validation could be added here (e.g., file type, size)
      setEditForm(prev => ({ ...prev, profile_photo: file })); // Store the File object
      // Create a preview URL for the selected file
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // NEW: Handler for clicking the camera icon to trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // NEW: Handler for saving the profile (PATCH request) - Handles everything
  const handleSaveProfile = async () => {
    if (!accountData) return;

    setIsSaving(true);
    try {
      // Prepare form data for API call
      const formData = new FormData();
      formData.append('first_name', editForm.first_name);
      formData.append('last_name', editForm.last_name);
      formData.append('email', editForm.email);
      formData.append('phone_number', editForm.phone_number);
      // NEW: Append is_2fa_enabled to the form data
      formData.append('is_2fa_enabled', editForm.is_2fa_enabled.toString());
      formData.append('preferred_language', editForm.preferred_language);

      // Append profile photo if it's a File object (newly selected)
      if (editForm.profile_photo instanceof File) {
        formData.append('profile_photo', editForm.profile_photo);
      }

      console.log("Sending profile update request with form data keys:", Array.from(formData.keys()));

      // Use apiClient.patch with form data
      const response = await apiClient.patch('/auth/passenger/me', formData, undefined, true); // isAuthRequest = true

      console.log("Profile update API response:", response);

      if (response.status === "success" && response.data) {
        showNotification("Profile updated successfully!", "success");
        // Update parent state with the new data from the API response
        // This response should contain the updated is_2fa_enabled status and profile photo
        onUpdateAccountData(response.data);
        // Exit edit mode
        setIsEditing(false);
      } else {
        console.error("Profile update failed:", response);
        showNotification(response?.details?.profile_photo?.[0] || response.message || "Failed to update profile.", "error");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showNotification("An error occurred while updating your profile.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // NEW: Handler to cancel editing
  const handleCancelEdit = () => {
    // Reset form to original values
    setEditForm({
      first_name: accountData?.first_name || '',
      last_name: accountData?.last_name || '',
      email: accountData?.email || '',
      phone_number: accountData?.phone_number || '',
      profile_photo: accountData?.profile_photo || null,
      is_2fa_enabled: accountData?.is_2fa_enabled || false,
      preferred_language: accountData?.preferred_language?.value || 'en',
    });
    setProfilePhotoPreview(accountData?.profile_photo || null);
    setIsEditing(false);
  };

  const handleOpenPasswordReset = () => {
    onClose();
    setShowPasswordResetModal(true);
  }

  const handleOpenAccountDeletion = () => {
    onClose();
    setShowAccountDeletionModal(true);
  }

 

  if (!isOpen || !accountData) return null;

  const initials = accountData.initials || `${accountData.first_name?.charAt(0) || ''}${accountData.last_name?.charAt(0) || ''}`.toUpperCase();
  const profilePhoto = profilePhotoPreview; // Use preview if set, else original
  const fullName = `${accountData.first_name || ''} ${accountData.last_name || ''}`.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-md h-[85vh] rounded-t-3xl border-t border-achrams-border shadow-lg overflow-hidden flex flex-col">
        
        {/* Header with Profile - Made more compact */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 pt-6 pb-4 shadow-md">
          {/* Header Row with Title and Close Button */}
          <div className="flex items-center justify-between mb-4">
            {/* NEW: Show Edit/Save/Cancel buttons based on mode */}
            {isEditing ? (
              <button
                onClick={handleCancelEdit}
                className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
                aria-label="Cancel Edit"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            ) : (
              <h2 className="text-xl font-bold">My Profile</h2>
            )}
            <div className="flex items-center gap-2">
              {isEditing && (
                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                  aria-label="Save Profile"
                >
                  <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              )}
              <button
                onClick={onClose}
                className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Profile Info Row - Reduced vertical spacing */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Profile Image/Initials - Slightly smaller */}
              <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-light to-achrams-secondary-light rounded-xl flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/30 relative overflow-hidden">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt={`${fullName}'s profile`}
                    fill // Use fill to cover the container
                    className="rounded-xl object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-achrams-text-light">{initials}</span>
                )}
                {/* NEW: Camera icon overlay for editing */}
                {isEditing && (
                  <button
                    onClick={triggerFileInput}
                    className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity"
                    aria-label="Change profile photo"
                  >
                    <Camera className="w-6 h-6 text-white" />
                  </button>
                )}
              </div>
              {/* NEW: 2FA Indicator - Updated to reflect form state during edit, original state otherwise */}
              {isEditing ? (
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${
                      editForm.is_2fa_enabled ? 'bg-green-500' : 'bg-gray-300' // Green if enabled, gray if disabled in form
                  }`}>
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
              ) : (
                  accountData.is_2fa_enabled && (
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                    <Shield className="w-2.5 h-2.5 text-white" />
                  </div>
                  )
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* NEW: Show input fields in edit mode, otherwise show text */}
              {isEditing ? (
                <>
                  <input
                    type="text"
                    name="first_name"
                    value={editForm.first_name}
                    onChange={handleEditChange}
                    className="text-lg font-bold mb-1 bg-transparent border-b border-white/30 text-achrams-text-light placeholder-white/50 focus:outline-none focus:border-white w-full"
                    placeholder="First Name"
                  />
                  <input
                    type="text"
                    name="last_name"
                    value={editForm.last_name}
                    onChange={handleEditChange}
                    className="text-lg font-bold mb-1 bg-transparent border-b border-white/30 text-achrams-text-light placeholder-white/50 focus:outline-none focus:border-white w-full"
                    placeholder="Last Name"
                  />
                </>
              ) : (
                <>
                  <h3 className="text-lg font-bold mb-1 truncate text-achrams-text-light">{fullName}</h3>
                  {/* 2FA Status - More prominent and clear (outside edit mode) */}
                  {accountData.is_2fa_enabled && (
                    <div className="inline-flex items-center gap-1 text-xs bg-green-600/20 text-green-200 px-2 py-1 rounded-full">
                      <Shield className="w-3 h-3" />
                      <span>2FA Enabled</span>
                    </div>
                  )}
                </>
              )}
            </div>
            {/* NEW: Edit button when not editing */}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Edit Profile"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* NEW: Hidden file input for profile photo */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handlePhotoChange}
          accept="image/*"
          className="hidden"
          aria-hidden="true"
        />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* NEW: Edit Form Section - Only show when editing */}
          {isEditing ? (
            <div className="space-y-4 mb-6">
              {/* Email Field */}
              <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
                <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
                  placeholder="your.email@example.com"
                />
              </div>

              {/* Phone Field */}
              <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
                <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Phone</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={editForm.phone_number}
                  onChange={handleEditChange}
                  className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
                  placeholder="+234 000 000 0000"
                />
              </div>

              {/* Preferred Language Field */}
              <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
                <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Language</label>
                <select
                  name="preferred_language"
                  value={editForm.preferred_language}
                  onChange={handleEditChange}
                  className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
                >
                  <option value="en">English</option>
                  {/* Add other language options as needed */}
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                </select>
              </div>

              {/* NEW: 2FA Toggle Field */}
              <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-xs text-achrams-text-secondary font-medium mb-0.5">Two-Factor Authentication</div>
                    <div className="text-sm font-semibold text-achrams-text-primary">
                      {editForm.is_2fa_enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
                <label className="relative inline-flex h-6 w-11 items-center rounded-full cursor-pointer">
                  <input
                    type="checkbox"
                    name="is_2fa_enabled"
                    checked={editForm.is_2fa_enabled}
                    onChange={handleEditChange}
                    className="sr-only peer"
                  />
                  <span className={`block w-11 h-6 rounded-full transition-colors ${
                    editForm.is_2fa_enabled ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}></span>
                  <span className={`absolute left-1 top-1 bg-white rounded-full w-4 h-4 transition-transform ${
                    editForm.is_2fa_enabled ? 'translate-x-6' : 'translate-x-0'
                  }`}></span>
                </label>
              </div>
            </div>
          ) : (
            // OLD: Contact Information Section - Only show when not editing
            <>
            {/* Contact Information */}
            <div className="mb-6">
              <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Contact Information</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-achrams-border">
                  <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-achrams-text-secondary font-medium mb-0.5">Phone</div>
                    <div className="text-sm font-semibold text-achrams-text-primary truncate">
                      {accountData.phone_number}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-achrams-border">
                  <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs text-achrams-text-secondary font-medium mb-0.5">Email</div>
                    <div className="text-sm font-semibold text-achrams-text-primary truncate">
                      {accountData.email}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* NEW: 2FA Status Card when not editing */}
            <div className="mb-6">
              <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Security</h4>
              <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-achrams-text-primary">Two-Factor Authentication</div>
                    <div className="text-xs text-achrams-text-secondary">
                      {accountData.is_2fa_enabled ? "Enabled" : "Disabled"}
                    </div>
                  </div>
                </div>
                {/* Optionally, show an 'Edit' button here to trigger the 2FA toggle directly, or keep it in edit mode */}
              </div>
            </div>
            </>
          )}

          {/* Wallet Balance */}
          {accountData.profile?.wallet && (
            <div className="mb-6">
              <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Wallet</h4>
              <div 
                className="p-4 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-xl text-white cursor-pointer hover:shadow-lg transition-shadow"
                onClick={onShowWallet}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs text-white/80 mb-1">Available Balance</div>
                    <div className="text-2xl font-bold">
                      {accountData.profile.wallet.balance.formatted || `₦${accountData.profile.wallet.balance.amount?.toLocaleString()}`}
                    </div>
                  </div>
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                    <Wallet className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mb-6">
            <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Quick Actions</h4>
            <div className="space-y-2">
              {onShowTripHistory && (
                <button
                  onClick={() => {
                    onShowTripHistory();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <History className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="font-medium text-achrams-text-primary">Trip History</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
                </button>
              )}

              {onShowWallet && (
                <button
                  onClick={() => {
                    onShowWallet();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                      <Wallet className="w-4 h-4 text-green-600" />
                    </div>
                    <span className="font-medium text-achrams-text-primary">Wallet & Payments</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
                </button>
              )}

              <button
                className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-achrams-text-primary">Payment Methods</span>
                </div>
                <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
              </button>

              {onShowSettings && (
                <button
                  onClick={() => {
                    onShowSettings();
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Settings className="w-4 h-4 text-gray-600" />
                    </div>
                    <span className="font-medium text-achrams-text-primary">Settings & Security</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
                </button>
              )}

               {/* NEW: Password Reset Action */}
              <button
                onClick={handleOpenPasswordReset}
                className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
                    <Key className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="font-medium text-achrams-text-primary">Reset Password</span>
                </div>
                <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
              </button>

              {/* NEW: Account Deletion Action */}
              <button
                onClick={handleOpenAccountDeletion}
                className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-red-50 hover:shadow-sm transition-all text-red-600"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-red-100 rounded-lg flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </div>
                  <span className="font-medium">Delete Account</span>
                </div>
                <ChevronRight className="w-5 h-5 text-red-600" />
              </button>
           

            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-3 text-center text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all mb-4"
          >
            <LogOut className="w-5 h-5" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
      
    </div>
  );
}

// import { X, Phone, Mail, Shield, ChevronRight, Wallet, CreditCard, History, Settings, LogOut, User, Camera, Edit3, Save, ArrowLeft } from 'lucide-react';
// import Image from 'next/image';
// import { useState, useRef, useEffect } from 'react';
// import { apiClient } from '@/lib/api';

// interface ProfileModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   accountData: any; // Consider defining a more specific type for account data
//   onLogout: () => void;
//   onShowTripHistory?: () => void;
//   onShowWallet?: () => void;
//   onShowSettings?: () => void;
//   // NEW: Prop to update account data after successful API call
//   onUpdateAccountData: (updatedData: any) => void;
//   // NEW: Prop to show notification
//   showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
// }

// export default function ProfileModal({
//   isOpen,
//   onClose,
//   accountData,
//   onLogout,
//   onShowTripHistory,
//   onShowWallet,
//   onShowSettings,
//   onUpdateAccountData, // NEW: Function to update parent state
//   showNotification, // NEW: Function to show notifications
// }: ProfileModalProps) {
//   // NEW: State for editing mode and form data
//   const [isEditing, setIsEditing] = useState(false);
//   const [editForm, setEditForm] = useState({
//     first_name: accountData?.first_name || '',
//     last_name: accountData?.last_name || '',
//     email: accountData?.email || '',
//     phone_number: accountData?.phone_number || '',
//     profile_photo: accountData?.profile_photo || null,
//     is_2fa_enabled: accountData?.is_2fa_enabled || false, // Assuming this is handled separately
//     preferred_language: accountData?.preferred_language?.value || 'en',
//   });
//   const [isSaving, setIsSaving] = useState(false);
//   const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(accountData?.profile_photo || null);

//   // NEW: Ref for file input
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   // NEW: Reset form when modal closes or accountData changes while not editing
//   useEffect(() => {
//     if (!isOpen || !isEditing) {
//       setEditForm({
//         first_name: accountData?.first_name || '',
//         last_name: accountData?.last_name || '',
//         email: accountData?.email || '',
//         phone_number: accountData?.phone_number || '',
//         profile_photo: accountData?.profile_photo || null,
//         is_2fa_enabled: accountData?.is_2fa_enabled || false,
//         preferred_language: accountData?.preferred_language?.value || 'en',
//       });
//       setProfilePhotoPreview(accountData?.profile_photo || null);
//     }
//   }, [isOpen, accountData, isEditing]);

//   // NEW: Handler for form input changes
//   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
//     const { name, value } = e.target;
//     setEditForm(prev => ({ ...prev, [name]: value }));
//   };

//   // NEW: Handler for profile photo selection
//   const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     if (e.target.files && e.target.files[0]) {
//       const file = e.target.files[0];
//       // Basic validation could be added here (e.g., file type, size)
//       setEditForm(prev => ({ ...prev, profile_photo: file })); // Store the File object
//       // Create a preview URL for the selected file
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setProfilePhotoPreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   // NEW: Handler for clicking the camera icon to trigger file input
//   const triggerFileInput = () => {
//     fileInputRef.current?.click();
//   };

//   // NEW: Handler for saving the profile
//   const handleSaveProfile = async () => {
//     if (!accountData) return;

//     setIsSaving(true);
//     try {
//       // Prepare form data for API call
//       const formData = new FormData();
//       formData.append('first_name', editForm.first_name);
//       formData.append('last_name', editForm.last_name);
//       formData.append('email', editForm.email);
//       formData.append('phone_number', editForm.phone_number);
//       // formData.append('is_2fa_enabled', editForm.is_2fa_enabled.toString()); // If needed, but likely handled separately
//       formData.append('preferred_language', editForm.preferred_language);

//       // Append profile photo if it's a File object (newly selected)
//       if (editForm.profile_photo instanceof File) {
//         formData.append('profile_photo', editForm.profile_photo);
//       }

//       console.log("Sending profile update request with form data:", Object.fromEntries(formData.entries()));

//       // Use apiClient.patch with form data
//       // Ensure apiClient is configured to handle PATCH requests and form data
//       // The 'true' flag for isAuthRequest should be automatically handled by apiClient if it uses cookies
//       // If not, ensure the token is passed correctly via the cookie mechanism established during login
//       const response = await apiClient.patch('/auth/passenger/me', formData, undefined, true); // isAuthRequest = true

//       console.log("Profile update API response:", response);

//       if (response.status === "success" && response.data) {
//         showNotification("Profile updated successfully!", "success");
//         // Update parent state with the new data from the API response
//         onUpdateAccountData(response.data);
//         // Exit edit mode
//         setIsEditing(false);
//       } else {
//         console.error("Profile update failed:", response);
//         showNotification(response?.details.non_field_errors[0] || response.message || "Failed to update profile.", "error");
        
//       }
//     } catch (error) {
//       console.error("Error updating profile:", error);
//       showNotification("An error occurred while updating your profile.", "error");
//     } finally {
//       setIsSaving(false);
//     }
//   };

//   // NEW: Handler to cancel editing
//   const handleCancelEdit = () => {
//     // Reset form to original values
//     setEditForm({
//       first_name: accountData?.first_name || '',
//       last_name: accountData?.last_name || '',
//       email: accountData?.email || '',
//       phone_number: accountData?.phone_number || '',
//       profile_photo: accountData?.profile_photo || null,
//       is_2fa_enabled: accountData?.is_2fa_enabled || false,
//       preferred_language: accountData?.preferred_language?.value || 'en',
//     });
//     setProfilePhotoPreview(accountData?.profile_photo || null);
//     setIsEditing(false);
//   };

//   if (!isOpen || !accountData) return null;

//   const initials = accountData.initials || `${accountData.first_name?.charAt(0) || ''}${accountData.last_name?.charAt(0) || ''}`.toUpperCase();
//   const profilePhoto = profilePhotoPreview; // Use preview if set, else original
//   const fullName = `${accountData.first_name || ''} ${accountData.last_name || ''}`.trim();

//   return (
//     <div className="fixed inset-0 z-50 flex items-end justify-center">
//       {/* Backdrop */}
//       <div
//         className="absolute inset-0 bg-black/50"
//         onClick={onClose}
//       />
      
//       {/* Modal Content */}
//       <div className="relative bg-white w-full max-w-md h-[85vh] rounded-t-3xl border-t border-achrams-border shadow-lg overflow-hidden flex flex-col">
        
//         {/* Header with Profile - Made more compact */}
//         <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 pt-6 pb-4 shadow-md">
//           {/* Header Row with Title and Close Button */}
//           <div className="flex items-center justify-between mb-4">
//             {/* NEW: Show Edit/Save/Cancel buttons based on mode */}
//             {isEditing ? (
//               <button
//                 onClick={handleCancelEdit}
//                 className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1"
//                 aria-label="Cancel Edit"
//               >
//                 <ArrowLeft className="w-5 h-5" />
//                 <span>Cancel</span>
//               </button>
//             ) : (
//               <h2 className="text-xl font-bold">My Profile</h2>
//             )}
//             <div className="flex items-center gap-2">
//               {isEditing && (
//                 <button
//                   onClick={handleSaveProfile}
//                   disabled={isSaving}
//                   className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
//                   aria-label="Save Profile"
//                 >
//                   <Save className={`w-5 h-5 ${isSaving ? 'animate-spin' : ''}`} />
//                   {isSaving ? 'Saving...' : 'Save'}
//                 </button>
//               )}
//               <button
//                 onClick={onClose}
//                 className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
//                 aria-label="Close"
//               >
//                 <X className="w-6 h-6" />
//               </button>
//             </div>
//           </div>

//           {/* Profile Info Row - Reduced vertical spacing */}
//           <div className="flex items-center gap-4">
//             <div className="relative">
//               {/* Profile Image/Initials - Slightly smaller */}
//               <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-light to-achrams-secondary-light rounded-xl flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/30 relative overflow-hidden">
//                 {profilePhoto ? (
//                   <Image
//                     src={profilePhoto}
//                     alt={`${fullName}'s profile`}
//                     fill // Use fill to cover the container
//                     className="rounded-xl object-cover"
//                     unoptimized
//                   />
//                 ) : (
//                   <span className="text-achrams-text-light">{initials}</span>
//                 )}
//                 {/* NEW: Camera icon overlay for editing */}
//                 {isEditing && (
//                   <button
//                     onClick={triggerFileInput}
//                     className="absolute inset-0 bg-black/30 flex items-center justify-center rounded-xl opacity-0 hover:opacity-100 transition-opacity"
//                     aria-label="Change profile photo"
//                   >
//                     <Camera className="w-6 h-6 text-white" />
//                   </button>
//                 )}
//               </div>
//               {/* 2FA Indicator - Smaller and positioned slightly differently */}
//               {accountData.is_2fa_enabled && (
//                 <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
//                   <Shield className="w-2.5 h-2.5 text-white" />
//                 </div>
//               )}
//             </div>
//             <div className="flex-1 min-w-0">
//               {/* NEW: Show input fields in edit mode, otherwise show text */}
//               {isEditing ? (
//                 <>
//                   <input
//                     type="text"
//                     name="first_name"
//                     value={editForm.first_name}
//                     onChange={handleEditChange}
//                     className="text-lg font-bold mb-1 bg-transparent border-b border-white/30 text-achrams-text-light placeholder-white/50 focus:outline-none focus:border-white w-full"
//                     placeholder="First Name"
//                   />
//                   <input
//                     type="text"
//                     name="last_name"
//                     value={editForm.last_name}
//                     onChange={handleEditChange}
//                     className="text-lg font-bold mb-1 bg-transparent border-b border-white/30 text-achrams-text-light placeholder-white/50 focus:outline-none focus:border-white w-full"
//                     placeholder="Last Name"
//                   />
//                 </>
//               ) : (
//                 <>
//                   <h3 className="text-lg font-bold mb-1 truncate text-achrams-text-light">{fullName}</h3>
//                   {/* 2FA Status - More prominent and clear */}
//                   {accountData.is_2fa_enabled && (
//                     <div className="inline-flex items-center gap-1 text-xs bg-green-600/20 text-green-200 px-2 py-1 rounded-full">
//                       <Shield className="w-3 h-3" />
//                       <span>2FA Enabled</span>
//                     </div>
//                   )}
//                 </>
//               )}
//             </div>
//             {/* NEW: Edit button when not editing */}
//             {!isEditing && (
//               <button
//                 onClick={() => setIsEditing(true)}
//                 className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
//                 aria-label="Edit Profile"
//               >
//                 <Edit3 className="w-5 h-5" />
//               </button>
//             )}
//           </div>
//         </div>

//         {/* NEW: Hidden file input for profile photo */}
//         <input
//           type="file"
//           ref={fileInputRef}
//           onChange={handlePhotoChange}
//           accept="image/*"
//           className="hidden"
//           aria-hidden="true"
//         />

//         {/* Scrollable Content */}
//         <div className="flex-1 overflow-y-auto px-6 py-4">
//           {/* NEW: Edit Form Section - Only show when editing */}
//           {isEditing ? (
//             <div className="space-y-4 mb-6">
//               {/* Email Field */}
//               <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
//                 <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Email</label>
//                 <input
//                   type="email"
//                   name="email"
//                   value={editForm.email}
//                   onChange={handleEditChange}
//                   className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
//                   placeholder="your.email@example.com"
//                 />
//               </div>

//               {/* Phone Field */}
//               <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
//                 <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Phone</label>
//                 <input
//                   type="tel"
//                   name="phone_number"
//                   value={editForm.phone_number}
//                   onChange={handleEditChange}
//                   className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
//                   placeholder="+234 000 000 0000"
//                 />
//               </div>

//               {/* Preferred Language Field */}
//               <div className="p-3 bg-gray-50 rounded-xl border border-achrams-border">
//                 <label className="block text-xs text-achrams-text-secondary font-medium mb-1">Language</label>
//                 <select
//                   name="preferred_language"
//                   value={editForm.preferred_language}
//                   onChange={handleEditChange}
//                   className="w-full bg-transparent text-achrams-text-primary font-semibold focus:outline-none"
//                 >
//                   <option value="en">English</option>
//                   {/* Add other language options as needed */}
//                   <option value="es">Spanish</option>
//                   <option value="fr">French</option>
//                 </select>
//               </div>
//             </div>
//           ) : (
//             // OLD: Contact Information Section - Only show when not editing
//             <>
//             {/* Contact Information */}
//             <div className="mb-6">
//               <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Contact Information</h4>
//               <div className="space-y-2">
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-achrams-border">
//                   <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <Phone className="w-4 h-4 text-blue-600" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-xs text-achrams-text-secondary font-medium mb-0.5">Phone</div>
//                     <div className="text-sm font-semibold text-achrams-text-primary truncate">
//                       {accountData.phone_number}
//                     </div>
//                   </div>
//                 </div>
                
//                 <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-achrams-border">
//                   <div className="w-9 h-9 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
//                     <Mail className="w-4 h-4 text-purple-600" />
//                   </div>
//                   <div className="flex-1 min-w-0">
//                     <div className="text-xs text-achrams-text-secondary font-medium mb-0.5">Email</div>
//                     <div className="text-sm font-semibold text-achrams-text-primary truncate">
//                       {accountData.email}
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             </>
//           )}

//           {/* Wallet Balance */}
//           {accountData.profile?.wallet && (
//             <div className="mb-6">
//               <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Wallet</h4>
//               <div 
//                 className="p-4 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-xl text-white cursor-pointer hover:shadow-lg transition-shadow"
//                 onClick={onShowWallet}
//               >
//                 <div className="flex items-center justify-between">
//                   <div>
//                     <div className="text-xs text-white/80 mb-1">Available Balance</div>
//                     <div className="text-2xl font-bold">
//                       {accountData.profile.wallet.balance.formatted || `₦${accountData.profile.wallet.balance.amount?.toLocaleString()}`}
//                     </div>
//                   </div>
//                   <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
//                     <Wallet className="w-6 h-6" />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* Quick Actions */}
//           <div className="mb-6">
//             <h4 className="font-bold text-achrams-text-primary mb-3 text-sm">Quick Actions</h4>
//             <div className="space-y-2">
//               {onShowTripHistory && (
//                 <button
//                   onClick={() => {
//                     onShowTripHistory();
//                     onClose();
//                   }}
//                   className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center">
//                       <History className="w-4 h-4 text-indigo-600" />
//                     </div>
//                     <span className="font-medium text-achrams-text-primary">Trip History</span>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
//                 </button>
//               )}

//               {onShowWallet && (
//                 <button
//                   onClick={() => {
//                     onShowWallet();
//                     onClose();
//                   }}
//                   className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
//                       <Wallet className="w-4 h-4 text-green-600" />
//                     </div>
//                     <span className="font-medium text-achrams-text-primary">Wallet & Payments</span>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
//                 </button>
//               )}

//               <button
//                 className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
//               >
//                 <div className="flex items-center gap-3">
//                   <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
//                     <CreditCard className="w-4 h-4 text-amber-600" />
//                   </div>
//                   <span className="font-medium text-achrams-text-primary">Payment Methods</span>
//                 </div>
//                 <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
//               </button>

//               {onShowSettings && (
//                 <button
//                   onClick={() => {
//                     onShowSettings();
//                     onClose();
//                   }}
//                   className="w-full flex items-center justify-between p-3 bg-white border border-achrams-border rounded-xl hover:bg-gray-50 hover:shadow-sm transition-all"
//                 >
//                   <div className="flex items-center gap-3">
//                     <div className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center">
//                       <Settings className="w-4 h-4 text-gray-600" />
//                     </div>
//                     <span className="font-medium text-achrams-text-primary">Settings & Security</span>
//                   </div>
//                   <ChevronRight className="w-5 h-5 text-achrams-text-secondary" />
//                 </button>
//               )}
//             </div>
//           </div>

//           {/* Logout Button */}
//           <button
//             onClick={onLogout}
//             className="w-full flex items-center justify-center gap-2 py-3 text-center text-red-600 font-medium bg-red-50 hover:bg-red-100 rounded-xl border border-red-200 transition-all mb-4"
//           >
//             <LogOut className="w-5 h-5" />
//             <span>Log Out</span>
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

