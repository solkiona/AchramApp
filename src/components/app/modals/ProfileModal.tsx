// src/components/app/modals/ProfileModal.tsx
import { X, Phone, Mail, Star, Shield, ChevronRight } from 'lucide-react';
import { PassengerAccount } from '@/types/passenger'; // You can define this type

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  passenger: PassengerAccount | null;
  onLogout: () => void;
}

export default function ProfileModal({
  isOpen,
  onClose,
  passenger,
  onLogout,
}: ProfileModalProps) {
  if (!isOpen || !passenger) return null;

  const initials = `${passenger.first_name.charAt(0)}${passenger.last_name.charAt(0)}`.toUpperCase();

  return (
    <div className="fixed inset-0 bg-achrams-secondary-solid/50 flex items-end z-50 animate-fadeIn">
      <div className="bg-white w-full max-w-sm mx-auto rounded-t-3xl animate-slideUp max-h-[90vh] overflow-y-auto">
        <div className="bg-achrams-primary-solid text-white px-6 py-8">
          <button onClick={onClose} className="mb-6">
            <X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-2xl font-bold shadow-lg">
              {initials}
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-1">
                {passenger.first_name} {passenger.last_name}
              </h3>
              {passenger.is_2fa_enabled && (
                <div className="flex items-center gap-1 text-xs text-green-200">
                  <Shield className="w-4 h-4" />
                  <span>2FA enabled</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* Contact Info */}
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Contact information</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Phone className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Phone</div>
                  <div className="font-medium">{passenger.phone_number}</div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <div className="text-xs text-gray-500 mb-1">Email</div>
                  <div className="font-medium">{passenger.email}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Account Stats */}
          {passenger.profile?.wallet && (
            <div>
              <h4 className="font-bold mb-4 text-gray-800">Wallet</h4>
              <div className="p-4 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold">
                  {passenger.profile.wallet.balance.formatted}
                </div>
              </div>
            </div>
          )}

          {/* Settings & Support */}
          <div>
            <h4 className="font-bold mb-4 text-gray-800">Account</h4>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100">
                <span>Security & 2FA</span>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100">
                <span>Payment methods</span>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
              <button className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100">
                <span>Trip history</span>
                <ChevronRight className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>

          <button
            onClick={onLogout}
            className="w-full py-4 text-center text-red-600 font-medium hover:bg-red-50 rounded-xl"
          >
            Log out
          </button>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}