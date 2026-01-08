// src/components/app/modals/ComingSoonModal.tsx
import { X, Phone, Mail, Plane, Utensils, Headphones, Bell, CreditCard, Shield } from 'lucide-react';


interface ComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature: 'hotels' | 'restaurant' | 'support' | 'alerts' | 'wallet' | 'payment' | 'security';
  showNotification?: (message: string, type: "info" | "success" | "warning" | "error") => void; // Optional, for wallet
}

export default function ComingSoonModal({
  isOpen,
  onClose,
  feature,
  showNotification,
}: ComingSoonModalProps) {
  if (!isOpen) return null;

  // Determine title, icon, and description based on the feature
  let title = '';
  let IconComponent: React.FC<{ className?: string }> = () => null; // Placeholder
  let description = '';
  let contactInfo = '';

  console.log(feature);
  switch (feature) {
    
    case 'hotels':
      title = 'Hotels';
      IconComponent = Plane; // Or consider a BedHotel icon if available
      description = 'Book your stay at premium hotels seamlessly through our platform.';
      break;
    case 'restaurant':
      title = 'Restaurant';
      IconComponent = Utensils;
      description = 'Order from top-rated restaurants and get it delivered.';
      break;
    case 'support':
      title = 'Support';
      IconComponent = Headphones;
      description = 'Need assistance? Get in touch with our support team.';
      contactInfo = `Phone: +234 800 ACHRAMS\nEmail: support@achrams.com.ng`;
      break;
    case 'alerts':
      title = 'Alerts';
      IconComponent = Bell;
      description = 'Stay informed with important updates and notifications.';
      break;
    case 'wallet':
      title = 'Wallet';
      IconComponent = CreditCard; // Or Wallet icon
      description = 'Manage your funds and view transaction history.';
      // Optionally, trigger a notification or redirect if showNotification is provided
      if (showNotification) {
        showNotification("Wallet feature coming soon!", "info");
        // Or potentially navigate to a wallet page if it exists but is under construction
        // router.push('/wallet'); // Example if wallet page exists but is under construction
      }
      break;
    case 'payment':
      title = 'Payment Methods';
      IconComponent = CreditCard;
      description = 'Add and manage your preferred payment methods.';
      break;
    case 'security':
      title = 'Security Settings';
      IconComponent = Shield;
      description = 'Manage your account security and privacy settings.';
      break;
    default:
      title = 'Coming Soon';
      IconComponent = Plane; // Default icon
      description = 'This feature is coming soon!';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-white w-full max-w-sm mx-4 rounded-2xl shadow-xl overflow-hidden border border-achrams-border">
        {/* Header */}
        <div className="bg-gradient-to-r from-achrams-primary-solid to-achrams-secondary-solid text-achrams-text-light px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-achrams-text-light" />
            </div>
            <h2 className="text-xl font-bold">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-achrams-text-light hover:text-achrams-text-light/80 p-2 hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-achrams-text-secondary text-center mb-4">
            {description}
          </p>

          {contactInfo && (
            <div className="bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border mb-4">
              <h3 className="font-bold text-achrams-text-primary mb-2 text-center">Contact Support</h3>
              <div className="text-sm text-achrams-text-secondary space-y-1">
                <p className="flex items-center justify-center gap-2">
                  <Phone className="w-4 h-4" /> {/* Assuming Phone icon is imported */}
                  +234 800 ACHRAMS
                </p>
                <p className="flex items-center justify-center gap-2">
                  <Mail className="w-4 h-4" /> {/* Assuming Mail icon is imported */}
                  support@achrams.com.ng
                </p>
              </div>
            </div>
          )}
          {
            (feature === 'hotels' || feature === 'restaurant')
             &&(
                <div className="bg-achrams-primary-solid/10 border border-achrams-primary-solid/20 rounded-xl p-4 text-center">
            <p className="text-achrams-text-secondary text-sm">
              We're working hard to bring this feature to you. Stay tuned!
            </p>
          </div>
            )
          }
        
        </div>

        {/* Footer */}
        <div className="p-4 bg-achrams-bg-secondary border-t border-achrams-border">
          <button
            onClick={onClose}
            className="w-full py-3 bg-achrams-primary-solid text-achrams-text-light rounded-xl font-medium hover:opacity-90 active:scale-[0.98] transition-all"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

// Add imports for Phone and Mail if not already in the file
