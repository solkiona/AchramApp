//components/app/screens/DashboardScreen
import { useState } from "react";
import {
  MapPin,
  Clock,
  Wallet,
  User,
  ChevronRight,
  Sun,
  Cloud,
  CloudRain,
  Plane,
  TrendingUp,
  Star,
  Gift,
  Shield,
  HeadphonesIcon,
  CreditCard,
  Bell,
  Heart,
} from "lucide-react";
import BottomNavBar from "../ui/BottomNavBar";
import { Driver } from "@/types/passenger";
import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";
import Image from "next/image";

interface DashboardProps {
  onBookNewTrip: () => void;
  passengerData: { name: string; phone: string; email: string };
  // walletBalance: number;
  activeTrip?: {
    id: string;
    status: string;
    driver?: Driver;
    destination: string;
  } | null;
  onShowProfile: () => void;
  onShowTripHistory: () => void;
  onShowWallet: () => void;
  onShowSettings: () => void;
  onShowActiveTrip: () => void;
  accountData: any;
}
export default function DashboardScreen({
  onBookNewTrip,
  passengerData,
  // walletBallance,
  activeTrip,
  onShowProfile,
  onShowTripHistory,
  onShowSettings,
  onShowActiveTrip,
  accountData,
}: DashboardProps) {
  const [weather] = useState({
    temp: 28,
    condition: "sunny",
    location: "Lagos",
  });

  const walletBalance = 12500;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const firstName =
    accountData?.first_name || accountData?.name?.split(" ")[0] || "Passenger";
  const initials =
    accountData?.initials ||
    `${accountData?.first_name?.charAt(0) || ""}${
      accountData?.last_name?.charAt(0) || ""
    }`.toUpperCase();
  const profilePhoto = accountData?.profile_photo;

  const walletBalanceFromData =
    accountData?.profile?.wallet?.balance?.amount ?? 0;

  const displayWalletBalance = walletBalance ?? walletBalanceFromData; // Prefer the prop if available

  const recentTrip = {
    id: "recent_1",
    pickup: "Murtala Muhammed Airport",
    destination: "Victoria Island, Lagos",
    fare: 4500,
    status: "completed",
    date: "Today, 2:30 PM",
  };

  const WeatherIcon = () => {
    if (weather.condition === "sunny")
      return <Sun className="w-12 h-12 text-amber-500" />;
    if (weather.condition === "cloudy")
      return <Cloud className="w-12 h-12 text-gray-400" />;
    if (weather.condition === "rainy")
      return <CloudRain className="w-12 h-12 text-blue-500" />;
    return <Sun className="w-12 h-12 text-amber-500" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center max-w-md">
      <div className="w-full max-w-md flex flex-col h-screen">
        {/* Premium Header with Brand Gradient */}
        <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-5 shadow-lg">
          <div className="flex items-center justify-between">
            <ACHRAMSHeader title="" />
            <button className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white/30 hover:bg-white/30 transition-all">
              {profilePhoto ? (
                // If using Next.js Image
                <Image
                  src={profilePhoto}
                  alt={`${firstName}'s profile`}
                  fill
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                // Fallback to initials if no photo
                initials
              )}
            </button>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto pb-24 px-6">
          {/* Greeting & Weather Card */}
          <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-6 mt-6 mb-5 shadow-sm border border-emerald-100">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {greeting}, {firstName}!
                </h2>
                <p className="text-gray-600 text-sm">
                  Ready for your next journey?
                </p>
              </div>
              <Plane className="w-6 h-6 text-emerald-600" />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between border border-white shadow-sm">
              <div>
                <div className="text-4xl font-bold text-gray-900 mb-1">
                  {weather.temp}°C
                </div>
                <div className="text-gray-600 capitalize font-medium">
                  {weather.condition}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {weather.location}, Nigeria
                </div>
              </div>
              <div className="ml-4">
                <WeatherIcon />
              </div>
            </div>
          </div>

          {/* Active Trip Card (Conditional) */}
          {/* {activeTrip && (
            <button className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 mb-5 shadow-sm border border-amber-200 transition-all hover:bg-green-50 active:scale-95 cursor-pointer "
            onClick={onShowActiveTrip}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-900">Active Trip</h3>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-semibold">
                  {activeTrip.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {activeTrip.driver?.name?.charAt(0) || "D"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activeTrip.driver?.name || "Driver Assigned"}
                  </p>
                  <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {activeTrip.destination}
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </div>
            </button>
          )} */}

          {activeTrip && (
            // ✅ Added `w-full` to ensure it takes full width of its container (with padding from parent `px-6`)
            // ✅ Removed fixed width/height that might cause stretching if content is less
            <button
              className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 mb-5 shadow-sm border border-amber-200 transition-all hover:bg-green-50 active:scale-95 cursor-pointer"
              onClick={onShowActiveTrip}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold text-gray-900">Active Trip</h3>
                </div>
                <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-semibold">
                  {activeTrip.status}
                </span>
              </div>
              <div className="flex items-center gap-4">
                {/*  Kept fixed size for the avatar circle */}
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
                  {activeTrip.driver?.name?.charAt(0) || "D"}
                </div>
                {/*  Added `min-w-0` and `flex-1` to allow flexible shrinking of the middle content */}
                <div className="flex-1 min-w-0">
                  {/*  Added `truncate` to handle potentially long driver names */}
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {activeTrip.driver?.name || "Driver Assigned"}
                  </p>

                  <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5 min-w-0">
                    <MapPin className="w-3 h-3 flex-shrink-0" />
                    {activeTrip.destination}
                  </p>
                </div>

                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
            </button>
          )}

          {/* Primary CTA Button */}
          <button
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-5 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all mb-6 flex items-center justify-center gap-2"
            onClick={onBookNewTrip}
          >
            <Plane className="w-5 h-5" />
            Book Your Airport Ride
          </button>

          {/* Quick Actions Grid - New Relevant Actions */}
          <div className="grid grid-cols-4 gap-3 mb-6 overflow-auto">
            {[
              { icon: Gift, label: "Rewards", color: "emerald" },
              { icon: Shield, label: "Insurance", color: "teal" },
              { icon: HeadphonesIcon, label: "Support", color: "cyan" },
              { icon: Bell, label: "Alerts", color: "sky" },
            ].map((item, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all active:scale-95"
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-${item.color}-50 flex items-center justify-center`}
                >
                  <item.icon
                    className={`w-5 h-5 text-${item.color}-600`}
                    strokeWidth={2}
                  />
                </div>
                <span className="text-xs text-gray-700 font-medium">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          {/* Recent Trip */}
          <div className="mb-6">
            <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              Recent Trip
            </h3>
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-900 font-medium leading-tight">
                      {recentTrip.pickup}
                    </div>
                  </div>
                  <div className="flex items-start gap-2 pl-6">
                    <div className="text-sm text-gray-600 leading-tight">
                      → {recentTrip.destination}
                    </div>
                  </div>
                </div>
                <div className="text-right ml-3">
                  <div className="text-xl font-bold text-gray-900">
                    ₦{recentTrip.fare.toLocaleString()}
                  </div>
                  <span className="text-xs text-emerald-600 font-semibold capitalize bg-emerald-50 px-2 py-1 rounded-full mt-1 inline-block">
                    {recentTrip.status}
                  </span>
                </div>
              </div>
              <div className="text-xs text-gray-500 flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                <Clock className="w-3 h-3" />
                {recentTrip.date}
              </div>
            </div>
          </div>

          {/* Premium Feature Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-md mb-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold mb-1 text-lg">Flight Delayed?</h4>
                <p className="text-sm text-emerald-100 leading-relaxed">
                  We'll wait for you — no extra charges applied.
                </p>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide mx-auto border border-gray-100 p-2 py-4 shadow-sm rounded-xl items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 ">
            {[
              {
                value: "12",
                label: "Trips",
                icon: TrendingUp,
                color: "emerald",
              },
              { value: "5.0", label: "Rating", icon: Star, color: "amber" },
              {
                value: `₦${displayWalletBalance?.toLocaleString() || "0"}`,
                label: "Balance",
                icon: Wallet,
                color: "teal",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className="min-w-[100px] bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center flex-shrink-0"
              >
                <div className="flex justify-center mb-2">
                  <div
                    className={`w-8 h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}
                  >
                    <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
                  </div>
                </div>
                <div className="text-xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* Powered By Footer - Subtle placement */}
          <div className="text-center py-6 mb-2">
            <p className="text-xs text-gray-400 font-medium">
              Powered by{" "}
              <span className="text-gray-600 font-semibold">
                Excelian Technologies
              </span>
            </p>
          </div>
        </div>

        {/* Bottom Navigation */}
        <BottomNavBar
          onProfileClick={() => {}}
          onHomeClick={() => {}}
          onWalletClick={() => {}}
          onSearchClick={() => {}}
          walletBalance={walletBalance}
        />
      </div>
    </div>
  );
}

// // src/components/app/screens/DashboardScreen.tsx
// 'use client';

// import { useEffect, useState } from 'react';
// import { MapPin, Plus, CreditCard, ShieldAlert, Settings, Bell, Clock, Wallet, User } from 'lucide-react'; // NEW: Add icons
// import BottomNavBar from '../ui/BottomNavBar'; // NEW: Import BottomNavBar
// import { Driver } from '@/types/passenger'; // Assuming this type exists or define it
// import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";

// interface DashboardScreenProps {
//   passengerData: { name: string; phone: string; email: string };
//   walletBalance: number; // NEW: Pass wallet balance from parent
//   activeTrip?: { id: string; status: string; driver?: Driver; destination: string }; // NEW: Pass active trip data if any
//   onShowProfile: () => void;
//   onBookNewTrip: () => void;
//   onShowTripHistory: () => void; // NEW: Handler to trigger trip history view
//   onShowWallet: () => void; // NEW: Handler to trigger wallet view
//   onShowSettings: () => void; // NEW: Handler to trigger settings view
//   onShowActiveTrip: () => void; // NEW: Handler if active trip card is clicked
// }

// export default function DashboardScreen({
//   passengerData,
//   walletBalance, // NEW: Destructure balance
//   activeTrip, // NEW: Destructure active trip data
//   onShowProfile,
//   onBookNewTrip,
//   onShowTripHistory, // NEW: Destructure handler
//   onShowWallet, // NEW: Destructure handler
//   onShowSettings, // NEW: Destructure handler
//   onShowActiveTrip, // NEW: Destructure handler
// }: DashboardScreenProps) {
//   const hour = new Date().getHours();
//   const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
//   const firstName = passengerData.name.split(' ')[0] || 'Passenger';

//   // NEW: State for weather (could be fetched from an API)
//   const [weather, setWeather] = useState({ temp: 28, condition: 'sunny', location: 'Lagos' });

//   // NEW: Example recent trip data (could come from props or fetched)
//   const recentTrip = {
//     id: 'recent_1',
//     pickup: 'Murtala Muhammed Airport',
//     destination: 'VI, Lagos',
//     fare: 4500,
//     status: 'completed',
//     date: 'Today',
//   };

//   return (
//     <div className="h-screen bg-achrams-bg-primary flex flex-col pb-20"> {/* pb-20 to account for fixed BottomNavBar */}
//       {/* Header */}
//       <div className="bg-achrams-primary-solid text-achrams-text-light px-6 py-4 flex items-center justify-between">
//        < ACHRAMSHeader title=" " />
//         <button
//           onClick={onShowProfile}
//           className="w-10 h-10 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
//         >
//           {passengerData.name
//             .split(' ')
//             .map((n) => n[0])
//             .join('')}
//         </button>
//       </div>

//       {/* Scrollable Content Area */}
//       <div className="flex-1 overflow-y-auto px-6 py-8">
//         {/* Weather & Greeting */}
//         <div className="bg-gradient-to-br from-achrams-accent-primary/10 to-achrams-accent-secondary/10 px-6 py-8 rounded-2xl mb-6">
//           <h2 className="text-2xl font-bold mb-1 text-achrams-text-primary">{greeting}, {firstName}!</h2>
//           <p className="text-achrams-text-secondary mb-4">Ready for your next journey?</p>
//           <div className="bg-achrams-bg-secondary rounded-xl p-4 flex items-center justify-between border border-achrams-border">
//             <div>
//               <div className="text-3xl font-bold text-achrams-text-primary">{weather.temp}°C</div>
//               <div className="text-achrams-text-secondary capitalize">{weather.condition}</div>
//               <div className="text-xs text-achrams-text-tertiary">{weather.location}, Nigeria</div>
//             </div>
//             <div className="text-5xl">
//               {weather.condition === 'sunny' && '☀️'}
//               {weather.condition === 'cloudy' && '☁️'}
//               {weather.condition === 'rainy' && '🌧️'}
//             </div>
//           </div>
//         </div>

//         {/* Active Trip Card (if applicable) */}
//         {activeTrip && (
//           <div
//             onClick={onShowActiveTrip} // NEW: Click handler to view active trip
//             className="bg-achrams-bg-secondary rounded-2xl p-5 mb-6 shadow-sm border border-achrams-border cursor-pointer hover:bg-achrams-bg-primary transition-colors"
//           >
//             <div className="flex items-center justify-between mb-3">
//               <h3 className="font-semibold text-achrams-text-primary">Active Trip</h3>
//               <span className="text-xs bg-achrams-warning-light text-achrams-warning-dark px-2 py-1 rounded-full">{activeTrip.status}</span>
//             </div>
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 bg-gradient-to-br from-achrams-primary-solid to-achrams-secondary-solid rounded-full flex items-center justify-center text-achrams-text-light font-bold">
//                 {activeTrip.driver?.name?.charAt(0) || 'D'}
//               </div>
//               <div className="flex-1 min-w-0">
//                 <p className="text-sm font-medium truncate text-achrams-text-primary">{activeTrip.driver?.name || 'Driver Assigned'}</p>
//                 <p className="text-xs text-achrams-text-secondary truncate">To {activeTrip.destination}</p>
//               </div>
//               <button className="text-achrams-primary-solid">
//                 <ChevronRight className="w-5 h-5" />
//               </button>
//             </div>
//           </div>
//         )}

//         {/* Book Button */}
//         <button
//           onClick={onBookNewTrip}
//           className="w-full bg-achrams-gradient-primary text-achrams-text-light py-5 rounded-2xl text-lg font-semibold shadow-md hover:opacity-95 active:scale-[0.98] transition-all mb-6"
//         >
//           Book your airport ride
//         </button>

//         {/* Quick Actions */}
//         <div className="grid grid-cols-4 gap-3 mb-6">
//           <button
//             onClick={onShowTripHistory} // NEW: Click handler
//             className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
//           >
//             <Clock className="w-6 h-6 text-achrams-primary-solid" />
//             <span className="text-xs text-achrams-text-primary">History</span>
//           </button>
//           <button
//             onClick={onShowWallet} // NEW: Click handler
//             className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
//           >
//             <Wallet className="w-6 h-6 text-achrams-primary-solid" />
//             <span className="text-xs text-achrams-text-primary">Wallet</span>
//           </button>
//           <button
//             onClick={onShowSettings} // NEW: Click handler
//             className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
//           >
//             <Settings className="w-6 h-6 text-achrams-primary-solid" />
//             <span className="text-xs text-achrams-text-primary">Settings</span>
//           </button>
//           <button
//             onClick={onShowProfile} // NEW: Could also link to profile
//             className="flex flex-col items-center justify-center gap-2 bg-achrams-bg-secondary rounded-xl p-4 border border-achrams-border hover:bg-achrams-bg-primary transition-colors"
//           >
//             <User className="w-6 h-6 text-achrams-primary-solid" />
//             <span className="text-xs text-achrams-text-primary">Profile</span>
//           </button>
//         </div>

//         {/* Recent Trip */}
//         <div className="mb-6">
//           <h3 className="font-bold text-lg mb-3 text-achrams-text-primary">Recent trip</h3>
//           <div className="bg-achrams-bg-secondary rounded-2xl p-5 shadow-sm border border-achrams-border">
//             <div className="flex items-center justify-between">
//               <div className="flex items-center gap-2">
//                 <MapPin className="w-4 h-4 text-achrams-text-secondary flex-shrink-0" />
//                 <span className="text-sm truncate text-achrams-text-primary">{recentTrip.pickup} → {recentTrip.destination}</span>
//               </div>
//               <span className="text-lg font-bold text-achrams-text-primary">₦{recentTrip.fare.toLocaleString()}</span>
//             </div>
//             <div className="flex justify-between mt-2 text-xs text-achrams-text-tertiary">
//               <span>{recentTrip.date}</span>
//               <span className="capitalize">{recentTrip.status}</span>
//             </div>
//           </div>
//         </div>

//         {/* Promotion Banner */}
//         <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5 shadow-sm mb-6 border border-achrams-border">
//           <div className="flex items-start gap-3">
//             <div className="text-2xl">✈️</div>
//             <div>
//               <h4 className="font-semibold mb-1 text-achrams-text-primary">Flight Delay?</h4>
//               <p className="text-sm text-achrams-text-secondary">We’ll wait for you — no extra charge.</p>
//             </div>
//           </div>
//         </div>

//         {/* Stats */}
//         <div className="grid grid-cols-3 gap-3">
//           <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
//             <div className="text-xl font-bold mb-1 text-achrams-text-primary">1</div>
//             <div className="text-xs text-achrams-text-tertiary">Trips</div>
//           </div>
//           <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
//             <div className="text-xl font-bold mb-1 text-achrams-text-primary">5.0</div>
//             <div className="text-xs text-achrams-text-tertiary">Rating</div>
//           </div>
//           <div className="bg-achrams-bg-secondary rounded-2xl p-4 shadow-sm border border-achrams-border text-center">
//             <div className="text-xl font-bold mb-1 text-achrams-text-primary">₦{walletBalance?.toLocaleString() || '0'}</div> {/* NEW: Display balance */}
//             <div className="text-xs text-achrams-text-tertiary">Wallet</div>
//           </div>
//         </div>
//       </div>

//       {/* NEW: Bottom Navigation Bar */}
//       <BottomNavBar
//         onProfileClick={onShowProfile}
//         walletBalance={walletBalance} // Pass balance to navbar if needed for icon badge
//         onHomeClick={onBookNewTrip} // Example: Home click could book new trip
//         onWalletClick={onShowWallet} // NEW: Link wallet click
//         onSearchClick={onShowTripHistory} // Example: Link search to history
//       />
//     </div>
//   );
// }
