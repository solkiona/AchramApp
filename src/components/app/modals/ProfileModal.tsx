// src/components/app/modals/ProfileModal.tsx
import { X, Phone, Mail, Shield, ChevronRight, Wallet, CreditCard, History, Settings, LogOut } from 'lucide-react';
import Image from 'next/image';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountData: any;
  onLogout: () => void;
  onShowTripHistory?: () => void;
  onShowWallet?: () => void;
  onShowSettings?: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  accountData,
  onLogout,
  onShowTripHistory,
  onShowWallet,
  onShowSettings,
}: ProfileModalProps) {
  if (!isOpen || !accountData) return null;

  const initials = accountData.initials || `${accountData.first_name?.charAt(0) || ''}${accountData.last_name?.charAt(0) || ''}`.toUpperCase();
  const profilePhoto = accountData.profile_photo;
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
            <h2 className="text-xl font-bold">My Profile</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-white/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Profile Info Row - Reduced vertical spacing */}
          <div className="flex items-center gap-4">
            <div className="relative">
              {/* Profile Image/Initials - Slightly smaller */}
              <div className="w-16 h-16 bg-gradient-to-br from-achrams-primary-light to-achrams-secondary-light rounded-xl flex items-center justify-center text-xl font-bold shadow-md ring-2 ring-white/30">
                {profilePhoto ? (
                  <Image
                    src={profilePhoto}
                    alt={`${fullName}'s profile`}
                    width={64} // Reduced size
                    height={64}
                    className="rounded-xl object-cover"
                    unoptimized
                  />
                ) : (
                  <span className="text-achrams-text-light">{initials}</span>
                )}
              </div>
              {/* 2FA Indicator - Smaller and positioned slightly differently */}
              {accountData.is_2fa_enabled && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-sm">
                  <Shield className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              {/* Name - Larger font, truncate if needed */}
              <h3 className="text-lg font-bold mb-1 truncate text-achrams-text-light">{fullName}</h3>
              {/* 2FA Status - More prominent and clear */}
              {accountData.is_2fa_enabled && (
                <div className="inline-flex items-center gap-1 text-xs bg-green-600/20 text-green-200 px-2 py-1 rounded-full">
                  <Shield className="w-3 h-3" />
                  <span>2FA Enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          
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