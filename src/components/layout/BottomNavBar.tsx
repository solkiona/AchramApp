// src/components/layout/BottomNavBar.tsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { Home, MapPin, User, WalletCards } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface BottomNavBarProps {
  activeTab: 'home' | 'book' | 'profile' | 'wallet'; // Define active tab prop
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ activeTab }) => {
  const router = useRouter();

  const navItems = [
    { id: 'home', icon: Home, label: 'Home', path: '/' },
    { id: 'book', icon: MapPin, label: 'Book', path: '/booking/details' },
    { id: 'wallet', icon: WalletCards, label: 'Wallet', path: '/wallet' },
    { id: 'profile', icon: User, label: 'Profile', path: '/profile' },
  ];

  return (
    <div className="fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md bg-achrams-background-primary border-t border-achrams-border py-2 px-4 flex justify-around items-center z-20">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => router.push(item.path)}
          className={twMerge(
            'flex flex-col items-center gap-1 p-2 rounded-lg transition-colors w-full',
            activeTab === item.id
              ? 'text-achrams-primary-solid' // Active tab color
              : 'text-achrams-text-secondary hover:text-achrams-text-primary' // Inactive tab color
          )}
          aria-label={item.label}
        >
          <item.icon className="w-6 h-6" />
          <span className="text-xs font-medium">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;