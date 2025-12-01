// src/components/app/screens/DashboardScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapPin, Plus, CreditCard, ShieldAlert, Settings, Bell, Clock, Wallet, User } from 'lucide-react'; // NEW: Add icons
import BottomNavBar from '../ui/BottomNavBar'; // NEW: Import BottomNavBar
import { Driver } from '@/types/passenger'; // Assuming this type exists or define it

interface DashboardScreenProps {
  passengerData: { name: string; phone: string; email: string };
  walletBalance: number; // NEW: Pass wallet balance from parent
  activeTrip?: { id: string; status: string; driver?: Driver; destination: string }; // NEW: Pass active trip data if any
  onShowProfile: () => void;
  onBookNewTrip: () => void;
  onShowTripHistory: () => void; // NEW: Handler to trigger trip history view
  onShowWallet: () => void; // NEW: Handler to trigger wallet view
  onShowSettings: () => void; // NEW: Handler to trigger settings view
  onShowActiveTrip: () => void; // NEW: Handler if active trip card is clicked
}

export default function DashboardScreen({
  passengerData,
  walletBalance, // NEW: Destructure balance
  activeTrip, // NEW: Destructure active trip data
  onShowProfile,
  onBookNewTrip,
  onShowTripHistory, // NEW: Destructure handler
  onShowWallet, // NEW: Destructure handler
  onShowSettings, // NEW: Destructure handler
  onShowActiveTrip, // NEW: Destructure handler
}: DashboardScreenProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = passengerData.name.split(' ')[0] || 'Passenger';

  // NEW: State for weather (could be fetched from an API)
  const [weather, setWeather] = useState({ temp: 28, condition: 'sunny', location: 'Lagos' });

  // NEW: Example recent trip data (could come from props or fetched)
  const recentTrip = {
    id: 'recent_1',
    pickup: 'Murtala Muhammed Airport',
    destination: 'VI, Lagos',
    fare: 4500,
    status: 'completed',
    date: 'Today',
  };

  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col pb-20"> {/* pb-20 to account for fixed BottomNavBar */}
      {/* Header */}
      <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ACHRAM</h1>
        <button
          onClick={onShowProfile}
          className="w-10 h-10 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
        >
          {passengerData.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* Weather & Greeting */}
        <div className="bg-gradient-to-br from-achrams-accent-primary/10 to-achrams-accent-secondary/10 px-6 py-8 rounded-2xl mb-6">
          <h2 className="text-2xl font-bold mb-1 text-achrams-text-primary">{greeting}, {firstName}!</h2>
          <p className="text-achrams-text-secondary mb-4">Ready for your next journey?</p>
          <div className="bg-achrams-bg-secondary rounded-xl p-4 flex items-center justify-between border border-achrams-border">
            <div>
              <div className="text-3xl font-bold text-achrams-text-primary">{weather.temp}°C</div>
              <div className="text-achrams-text-secondary capitalize">{weather.condition}</div>
              <div className="text-xs text-achrams-text-tertiary">{weather.location}, Nigeria</div>
            </div>
            <div className="text-5xl">
              {weather.condition === 'sunny' && '☀️'}
              {weather.condition === 'cloudy' && '☁️'}
              {weather.condition === 'rainy' && '🌧️'}
            </div>
          </div>
        </div>

        {/* Active Trip Card (if applicable) */}
        {activeTrip && (
          <div
            onClick={onShowActiveTrip} // NEW: Click handler to view active trip
            className="bg-achrams-bg-secondary rounded-2xl p-5 mb-6 shadow-sm border border-achrams-border cursor-pointer hover:bg-achrams-bg-primary transition-colors"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-achrams-text-primary">Active Trip</h3>
              <span className="text-xs bg-achrams-warning-light text-achrams-warning-dark px-2 py-1 rounded-full">{activeTrip.status}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light font-bold">
                {activeTrip.driver?.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-achrams-text-primary">{activeTrip.driver?.name || 'Driver Assigned'}</p>
                <p className="text-xs text-achrams-text-secondary truncate">To {activeTrip.destination}</p>
              </div>
              <button className="text-achrams-primary-solid">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Book Button */}
        <button
          onClick={onBookNewTrip}
          className="w-full bg-achrams-gradient-primary text-achrams-text-light py-5 rounded-2xl text-lg font-semibold shadow-md hover:opacity-95 active:scale-[0.98] transition-all mb-6"
        >
          Book your airport ride
        </button>

        {/* Quick Actions */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          <button
            onClick={onShowTripHistory} // NEW: Click handler
            className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
          >
            <Clock className="w-6 h-6 text-achrams-primary-solid" />
            <span className="text-xs text-achrams-text-primary">History</span>
          </button>
          <button
            onClick={onShowWallet} // NEW: Click handler
            className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
          >
            <Wallet className="w-6 h-6 text-achrams-primary-solid" />
            <span className="text-xs text-achrams-text-primary">Wallet</span>
          </button>
          <button
            onClick={onShowSettings} // NEW: Click handler
            className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
          >
            <Settings className="w-6 h-6 text-achrams-primary-solid" />
            <span className="text-xs text-achrams-text-primary">Settings</span>
          </button>
          <button
            onClick={onShowProfile} // NEW: Could also link to profile
            className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
          >
            <User className="w-6 h-6 text-achrams-primary-solid" />
            <span className="text-xs text-achrams-text-primary">Profile</span>
          </button>
        </div>

        {/* Recent Trip */}
        <div className="mb-6">
          <h3 className="font-bold text-lg mb-3 text-achrams-text-primary">Recent trip</h3>
          <div className="bg-achrams-bg-secondary rounded-2xl p-5 shadow-sm border border-achrams-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-achrams-text-secondary flex-shrink-0" />
                <span className="text-sm truncate text-achrams-text-primary">{recentTrip.pickup} → {recentTrip.destination}</span>
              </div>
              <span className="text-lg font-bold text-achrams-text-primary">₦{recentTrip.fare.toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-2 text-xs text-achrams-text-tertiary">
              <span>{recentTrip.date}</span>
              <span className="capitalize">{recentTrip.status}</span>
            </div>
          </div>
        </div>

        {/* Promotion Banner */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 shadow-sm mb-6 border border-achrams-border">
          <div className="flex items-start gap-3">
            <div className="text-2xl">✈️</div>
            <div>
              <h4 className="font-semibold mb-1 text-achrams-text-primary">Flight Delay?</h4>
              <p className="text-sm text-achrams-text-secondary">We’ll wait for you — no extra charge.</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
            <div className="text-xl font-bold mb-1 text-achrams-text-primary">1</div>
            <div className="text-xs text-achrams-text-tertiary">Trips</div>
          </div>
          <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
            <div className="text-xl font-bold mb-1 text-achrams-text-primary">5.0</div>
            <div className="text-xs text-achrams-text-tertiary">Rating</div>
          </div>
          <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
            <div className="text-xl font-bold mb-1 text-achrams-text-primary">₦{walletBalance?.toLocaleString() || '0'}</div> {/* NEW: Display balance */}
            <div className="text-xs text-achrams-text-tertiary">Wallet</div>
          </div>
        </div>
      </div>

      {/* NEW: Bottom Navigation Bar */}
      <BottomNavBar
        onProfileClick={onShowProfile}
        walletBalance={walletBalance} // Pass balance to navbar if needed for icon badge
        onHomeClick={onBookNewTrip} // Example: Home click could book new trip
        onWalletClick={onShowWallet} // NEW: Link wallet click
        onSearchClick={onShowTripHistory} // Example: Link search to history
      />
    </div>
  );
}