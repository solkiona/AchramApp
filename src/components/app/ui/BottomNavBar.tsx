// src/components/app/ui/BottomNavBar.tsx
import { House, Search, Wallet, User, Clock } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation'; // Or your routing library

interface BottomNavBarProps {
  onProfileClick: () => void; // Handler to open profile modal/settings
  walletBalance?: number; // Optional: Display small badge/indicator on wallet icon
  // NEW: Add handlers for other nav items if needed, e.g., onHomeClick, onSearchClick, onWalletClick
  onHomeClick?: () => void;
  onSearchClick?: () => void;
  onWalletClick?: () => void;
  onShowTripHistory?: () => void;
}

export default function BottomNavBar({
  onProfileClick,
  walletBalance,
  onHomeClick,
  onSearchClick,
  onWalletClick,
  onShowTripHistory,
}: BottomNavBarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Helper to determine if a nav item is active
  const isActive = (path: string) => pathname === path;

  // Handlers for navigation clicks
  const handleHomeClick = () => {
    if (onHomeClick) {
      onHomeClick(); // Allow parent to handle logic (e.g., scroll to top)
    } else {
      // Default behavior: navigate to dashboard if not already there
      if (pathname !== '/dashboard') {
        router.push('/dashboard');
      } else {
        // If already on dashboard, maybe scroll to top
        window.scrollTo(0, 0);
      }
    }
  };

  const handleSearchClick = () => {
      console.log("Trip History button clicked in BottomNavBar. onShowTripHistory prop exists:", !!onShowTripHistory); // Debug log
      if (onShowTripHistory) {
        console.log("Calling onShowTripHistory prop from BottomNavBar.");
        onShowTripHistory(); 
      } else {
        console.warn("onShowTripHistory prop was not provided to BottomNavBar.");
      }
    };

  const handleWalletClick = () => {
    if (onWalletClick) {
      onWalletClick();
    } else {
      // Navigate to wallet screen - placeholder path
      router.push('/wallet'); // Replace with actual wallet screen path
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-achrams-border z-40">
      <div className="flex justify-around items-center py-3 px-2 mx-auto max-w-sm">
        <button
          onClick={handleHomeClick}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
            isActive('/dashboard') ? 'text-achrams-primary-solid' : 'text-achrams-text-secondary'
          } transition-all hover:bg-green-50 active:scale-95 cursor-pointer`}
        >
          <House className={`w-6 h-6 ${isActive('/dashboard') ? 'fill-current' : ''}`} />
          <span className="text-xs">Home</span>
        </button>
        <button
          onClick={handleSearchClick}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
            isActive('/search') ? 'text-achrams-primary-solid' : 'text-achrams-text-secondary'
          }  transition-all hover:bg-green-50 active:scale-95 cursor-pointer`}
        >
          <Clock className={`w-6 h-6 ${isActive('/search') ? 'fill-current' : ''}`} />
          <span className="text-xs">History</span>
        </button>
        <button
          onClick={handleWalletClick}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors relative ${
            isActive('/wallet') ? 'text-achrams-primary-solid' : 'text-achrams-text-secondary'
          }  transition-all hover:bg-green-50 active:scale-95 cursor-pointer`}
        >
          <Wallet className={`w-6 h-6 ${isActive('/wallet') ? 'fill-current' : ''}`} />
          {/* Optional: Wallet balance indicator */}
          {walletBalance != null && walletBalance > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              {walletBalance}
            </span>
          )}
          <span className="text-xs">Wallet</span>
        </button>
        <button
          onClick={onProfileClick}
          className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${
            isActive('/profile') ? 'text-achrams-primary-solid' : 'text-achrams-text-secondary' // Assuming profile page path
          }  transition-all hover:bg-green-50 active:scale-95 cursor-pointer`}
        >
          <User className={`w-6 h-6 ${isActive('/profile') ? 'fill-current' : ''}`} />
          <span className="text-xs">Profile</span>
        </button>
      </div>
    </nav>
  );
  
}