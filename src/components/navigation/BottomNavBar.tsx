import React from 'react';
import Link from 'next/link';
import { Home, History, CreditCard, User, Car } from 'lucide-react'; // Added Car for Booking
import { usePathname } from 'next/navigation';

const BottomNavBar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/booking', label: 'Book', icon: Car }, // Using Car for booking
    { href: '/history', label: 'History', icon: History },
    { href: '/wallet', label: 'Wallet', icon: CreditCard },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-achrams-background-primary border-t border-achrams-border p-3 flex justify-around z-10">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg min-w-[60px] ${
              isActive
                ? 'text-achrams-primary-solid'
                : 'text-achrams-text-secondary'
            }`}
            aria-current={isActive ? 'page' : undefined}
          >
            <IconComponent className="w-6 h-6" />
            <span className="text-xs">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default BottomNavBar;