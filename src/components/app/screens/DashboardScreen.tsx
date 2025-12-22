// components/app/screens/DashboardScreen.tsx
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
  Utensils,
  Bed, // If available, otherwise use Plane for hotels
  // Add other icons if needed
} from "lucide-react";
import BottomNavBar from "../ui/BottomNavBar";
import { Driver } from "@/types/passenger";
import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";
import Image from "next/image";

// NEW: Import the Coming Soon Modal
import ComingSoonModal from "../modals/ComingSoonModal";

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
  onShowWallet: () => void; // Handler for wallet button
  onShowSettings: () => void;
  onShowActiveTrip: () => void;
  accountData: any;
  onResumeRecentTrip: (tripId: string) => void;
  recentTripData: any;
  // NEW: Add prop for showing notifications (if needed for wallet)
  showNotification: (message: string, type: "info" | "success" | "warning" | "error") => void;
}
export default function DashboardScreen({
  onBookNewTrip,
  passengerData,
  // walletBallance,
  activeTrip,
  onShowProfile,
  onShowTripHistory,
  onShowWallet, // NEW: Handler for wallet button
  onShowSettings,
  onShowActiveTrip,
  accountData,
  onResumeRecentTrip,
  recentTripData,
  // NEW: Prop for notifications
  showNotification,
}: DashboardProps) {
  // NEW: State for the coming soon modal
  const [showComingSoon, setShowComingSoon] = useState<{
    isOpen: boolean;
    feature: 'hotels' | 'restaurant' | 'support' | 'alerts' | 'wallet' | 'payment' | 'security' | null;
  }>({ isOpen: false, feature: null });

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

  const isRecentTripResumable = recentTripData && !['completed', 'cancelled'].includes(recentTripData.status?.value); // Adjust field name


  const displayWalletBalance = walletBalance ?? walletBalanceFromData; // Prefer the prop if available

  // const recentTrip = {
  //   id: "recent_1",
  //   pickup: "Murtala Muhammed Airport",
  //   destination: "Victoria Island, Lagos",
  //   fare: 4500,
  //   status: "completed",
  //   date: "Today, 2:30 PM",
  // };

  const WeatherIcon = () => {
    if (weather.condition === "sunny")
      return <Sun className="w-12 h-12 text-amber-500" />;
    if (weather.condition === "cloudy")
      return <Cloud className="w-12 h-12 text-gray-400" />;
    if (weather.condition === "rainy")
      return <CloudRain className="w-12 h-12 text-blue-500" />;
    return <Sun className="w-12 h-12 text-amber-500" />;
  };

  // NEW: Handler to open the coming soon modal
  const handleComingSoonClick = (feature: 'hotels' | 'restaurant' | 'support' | 'alerts' | 'payment' | 'security') => {
    setShowComingSoon({ isOpen: true, feature });
  };

  // NEW: Handler for wallet click (can also show ComingSoonModal or navigate)
  const handleWalletClick = () => {
    // Option 1: Show Coming Soon Modal
    setShowComingSoon({ isOpen: true, feature: 'wallet' });
    alert('handlewallet clicked')
    // Option 2: Call the existing onShowWallet handler (if it navigates to wallet page)
    // onShowWallet(); // Uncomment if this is the desired behavior
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
              { icon: Bed, label: "Hotels", color: "emerald", feature: 'hotels' as const }, // NEW: Use Bed icon
              { icon: Utensils, label: "Restaurant", color: "teal", feature: 'restaurant' as const }, // NEW: Use Utensils icon
              { icon: HeadphonesIcon, label: "Support", color: "cyan", feature: 'support' as const }, // Support opens modal
              { icon: Bell, label: "Alerts", color: "sky", feature: 'alerts' as const }, // NEW: Alerts opens modal
            ].map((item, idx) => (
              <button
                key={idx}
                className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all active:scale-95"
                onClick={() => handleComingSoonClick(item.feature)} // NEW: Call handler
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
          {recentTripData && ( // Render if recentTripData exists (could be terminal)
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Recent Trip
              </h3>
              {/* NEW: Conditionally make the card clickable based on resumability */}
              {isRecentTripResumable ? (
                // Clickable button for resumable trips
                <button
                  className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-left transition-all hover:bg-gray-50 active:scale-[0.98]"
                  onClick={() => onResumeRecentTrip(recentTripData.id)} // Call the prop function with the trip ID
                >
                  {/* Trip Content */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-900 font-medium leading-tight">
                          {recentTripData.pickup_address || "Pickup Location"} {/* Adjust field name */}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 pl-6">
                        <div className="text-sm text-gray-600 leading-tight">
                          → {recentTripData.destination_address || "Destination"} {/* Adjust field name */}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-xl font-bold text-gray-900">
                        ₦{recentTripData.amount?.amount?.toLocaleString() || "0"} {/* Adjust field name */}
                      </div>
                      {/* Status Badge */}
                      <span className="text-xs font-semibold capitalize bg-amber-50 text-amber-600 px-2 py-1 rounded-full mt-1 inline-block">
                        {recentTripData.status.label || "Status"} {/* Adjust field name */}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                    <Clock className="w-3 h-3" />
                    {new Date(recentTripData.created_at || '').toLocaleString() || "Date Unknown"} {/* Adjust field name */}
                  </div>
                </button>
              ) : (
                // Non-clickable div for non-resumable trips
                <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-left">
                  {/* Trip Content */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="text-sm text-gray-900 font-medium leading-tight">
                          {recentTripData.pickup_address || "Pickup Location"} {/* Adjust field name */}
                        </div>
                      </div>
                      <div className="flex items-start gap-2 pl-6">
                        <div className="text-sm text-gray-600 leading-tight">
                          → {recentTripData.destination_address || "Destination"} {/* Adjust field name */}
                        </div>
                      </div>
                    </div>
                    <div className="text-right ml-3">
                      <div className="text-xl font-bold text-gray-900">
                        ₦{recentTripData.amount?.amount?.toLocaleString() || "0"} {/* Adjust field name */}
                      </div>
                      {/* Status Badge - Highlight terminal status */}
                      <span className="text-xs font-semibold capitalize bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full mt-1 inline-block">
                        {recentTripData.status.label || "Status"} {/* Adjust field name */}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
                    <Clock className="w-3 h-3" />
                    {new Date(recentTripData.created_at || '').toLocaleString() || "Date Unknown"} {/* Adjust field name */}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fallback if no recent trip data at all */}
          {!recentTripData && (
             <div className="mb-6">
              <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-600" />
                Recent Trip
              </h3>
              <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-center">
                  <p className="text-gray-500 text-sm">No recent trips found.</p>
              </div>
             </div>
          )}

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
          {/* <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide mx-auto border border-gray-100 p-2 py-4 shadow-sm rounded-xl items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 ">
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
          </div> */}

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

        {/* NEW: Render the Coming Soon Modal */}
        <ComingSoonModal
          isOpen={showComingSoon.isOpen}
          onClose={() => setShowComingSoon({ isOpen: false, feature: null })}
          feature={showComingSoon.feature!}
          showNotification={showNotification} // Pass the notification function if needed (e.g., for wallet)
        />

        {/* Bottom Navigation */}
        <BottomNavBar
          onProfileClick={() => {}}
          onHomeClick={() => {}}
          onWalletClick={handleWalletClick} // NEW: Use the new handler
          onSearchClick={() => {}}
          walletBalance={walletBalance}
        />
      </div>
    </div>
  );
}

// //components/app/screens/DashboardScreen
// import { useState } from "react";
// import {
//   MapPin,
//   Clock,
//   Wallet,
//   User,
//   ChevronRight,
//   Sun,
//   Cloud,
//   CloudRain,
//   Plane,
//   TrendingUp,
//   Star,
//   Gift,
//   Shield,
//   HeadphonesIcon,
//   CreditCard,
//   Bell,
//   Heart,
// } from "lucide-react";
// import BottomNavBar from "../ui/BottomNavBar";
// import { Driver } from "@/types/passenger";
// import ACHRAMSHeader from "@/components/ui/ACHRAMSHeader";
// import Image from "next/image";

// interface DashboardProps {
//   onBookNewTrip: () => void;
//   passengerData: { name: string; phone: string; email: string };
//   // walletBalance: number;
//   activeTrip?: {
//     id: string;
//     status: string;
//     driver?: Driver;
//     destination: string;
//   } | null;
//   onShowProfile: () => void;
//   onShowTripHistory: () => void;
//   onShowWallet: () => void;
//   onShowSettings: () => void;
//   onShowActiveTrip: () => void;
//   accountData: any;
//   onResumeRecentTrip: (tripId: string) => void;
//   recentTripData: any;
// }
// export default function DashboardScreen({
//   onBookNewTrip,
//   passengerData,
//   // walletBallance,
//   activeTrip,
//   onShowProfile,
//   onShowTripHistory,
//   onShowSettings,
//   onShowActiveTrip,
//   accountData,
//   onResumeRecentTrip,
//   recentTripData,
// }: DashboardProps) {
//   const [weather] = useState({
//     temp: 28,
//     condition: "sunny",
//     location: "Lagos",
//   });

//   const walletBalance = 12500;

//   const hour = new Date().getHours();
//   const greeting =
//     hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
//   const firstName =
//     accountData?.first_name || accountData?.name?.split(" ")[0] || "Passenger";
//   const initials =
//     accountData?.initials ||
//     `${accountData?.first_name?.charAt(0) || ""}${
//       accountData?.last_name?.charAt(0) || ""
//     }`.toUpperCase();
//   const profilePhoto = accountData?.profile_photo;

//   const walletBalanceFromData =
//     accountData?.profile?.wallet?.balance?.amount ?? 0;

//   const isRecentTripResumable = recentTripData && !['completed', 'cancelled'].includes(recentTripData.status?.value); // Adjust field name


//   const displayWalletBalance = walletBalance ?? walletBalanceFromData; // Prefer the prop if available

//   // const recentTrip = {
//   //   id: "recent_1",
//   //   pickup: "Murtala Muhammed Airport",
//   //   destination: "Victoria Island, Lagos",
//   //   fare: 4500,
//   //   status: "completed",
//   //   date: "Today, 2:30 PM",
//   // };

//   const WeatherIcon = () => {
//     if (weather.condition === "sunny")
//       return <Sun className="w-12 h-12 text-amber-500" />;
//     if (weather.condition === "cloudy")
//       return <Cloud className="w-12 h-12 text-gray-400" />;
//     if (weather.condition === "rainy")
//       return <CloudRain className="w-12 h-12 text-blue-500" />;
//     return <Sun className="w-12 h-12 text-amber-500" />;
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex justify-center max-w-md">
//       <div className="w-full max-w-md flex flex-col h-screen">
//         {/* Premium Header with Brand Gradient */}
//         <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white px-6 py-5 shadow-lg">
//           <div className="flex items-center justify-between">
//             <ACHRAMSHeader title="" />
//             <button className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white/30 hover:bg-white/30 transition-all">
//               {profilePhoto ? (
//                 // If using Next.js Image
//                 <Image
//                   src={profilePhoto}
//                   alt={`${firstName}'s profile`}
//                   fill
//                   className="w-full h-full rounded-full object-cover"
//                 />
//               ) : (
//                 // Fallback to initials if no photo
//                 initials
//               )}
//             </button>
//           </div>
//         </div>

//         {/* Scrollable Content Area */}
//         <div className="flex-1 overflow-y-auto pb-24 px-6">
//           {/* Greeting & Weather Card */}
//           <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-6 mt-6 mb-5 shadow-sm border border-emerald-100">
//             <div className="flex items-start justify-between mb-4">
//               <div>
//                 <h2 className="text-2xl font-bold text-gray-900 mb-1">
//                   {greeting}, {firstName}!
//                 </h2>
//                 <p className="text-gray-600 text-sm">
//                   Ready for your next journey?
//                 </p>
//               </div>
//               <Plane className="w-6 h-6 text-emerald-600" />
//             </div>

//             <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-5 flex items-center justify-between border border-white shadow-sm">
//               <div>
//                 <div className="text-4xl font-bold text-gray-900 mb-1">
//                   {weather.temp}°C
//                 </div>
//                 <div className="text-gray-600 capitalize font-medium">
//                   {weather.condition}
//                 </div>
//                 <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
//                   <MapPin className="w-3 h-3" />
//                   {weather.location}, Nigeria
//                 </div>
//               </div>
//               <div className="ml-4">
//                 <WeatherIcon />
//               </div>
//             </div>
//           </div>

          

//           {activeTrip && (
//             // ✅ Added `w-full` to ensure it takes full width of its container (with padding from parent `px-6`)
//             // ✅ Removed fixed width/height that might cause stretching if content is less
//             <button
//               className="w-full bg-gradient-to-r from-amber-50 to-orange-50 rounded-3xl p-5 mb-5 shadow-sm border border-amber-200 transition-all hover:bg-green-50 active:scale-95 cursor-pointer"
//               onClick={onShowActiveTrip}
//             >
//               <div className="flex items-center justify-between mb-4">
//                 <div className="flex items-center gap-2">
//                   <MapPin className="w-5 h-5 text-amber-600" />
//                   <h3 className="font-bold text-gray-900">Active Trip</h3>
//                 </div>
//                 <span className="text-xs bg-amber-100 text-amber-800 px-3 py-1.5 rounded-full font-semibold">
//                   {activeTrip.status}
//                 </span>
//               </div>
//               <div className="flex items-center gap-4">
//                 {/*  Kept fixed size for the avatar circle */}
//                 <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-teal-600 rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-md">
//                   {activeTrip.driver?.name?.charAt(0) || "D"}
//                 </div>
//                 {/*  Added `min-w-0` and `flex-1` to allow flexible shrinking of the middle content */}
//                 <div className="flex-1 min-w-0">
//                   {/*  Added `truncate` to handle potentially long driver names */}
//                   <p className="text-sm font-semibold text-gray-900 truncate">
//                     {activeTrip.driver?.name || "Driver Assigned"}
//                   </p>

//                   <p className="text-xs text-gray-600 truncate flex items-center gap-1 mt-0.5 min-w-0">
//                     <MapPin className="w-3 h-3 flex-shrink-0" />
//                     {activeTrip.destination}
//                   </p>
//                 </div>

//                 <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
//               </div>
//             </button>
//           )}

//           {/* Primary CTA Button */}
//           <button
//             className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-5 rounded-2xl text-lg font-bold shadow-lg hover:shadow-xl active:scale-[0.98] transition-all mb-6 flex items-center justify-center gap-2"
//             onClick={onBookNewTrip}
//           >
//             <Plane className="w-5 h-5" />
//             Book Your Airport Ride
//           </button>

//           {/* Quick Actions Grid - New Relevant Actions */}
//           <div className="grid grid-cols-4 gap-3 mb-6 overflow-auto">
//             {[
//               { icon: Gift, label: "Hotels", color: "emerald" },
//               { icon: Shield, label: "Restaurant", color: "teal" },
//               { icon: HeadphonesIcon, label: "Support", color: "cyan" },
//               { icon: Bell, label: "Alerts", color: "sky" },
//             ].map((item, idx) => (
//               <button
//                 key={idx}
//                 className="flex flex-col items-center justify-center gap-2 bg-white rounded-2xl p-4 border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all active:scale-95"
//               >
//                 <div
//                   className={`w-10 h-10 rounded-xl bg-${item.color}-50 flex items-center justify-center`}
//                 >
//                   <item.icon
//                     className={`w-5 h-5 text-${item.color}-600`}
//                     strokeWidth={2}
//                   />
//                 </div>
//                 <span className="text-xs text-gray-700 font-medium">
//                   {item.label}
//                 </span>
//               </button>
//             ))}
//           </div>

//           {/* Recent Trip */}
//           {recentTripData && ( // Render if recentTripData exists (could be terminal)
//             <div className="mb-6">
//               <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
//                 <Clock className="w-5 h-5 text-gray-600" />
//                 Recent Trip
//               </h3>
//               {/* NEW: Conditionally make the card clickable based on resumability */}
//               {isRecentTripResumable ? (
//                 // Clickable button for resumable trips
//                 <button
//                   className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-left transition-all hover:bg-gray-50 active:scale-[0.98]"
//                   onClick={() => onResumeRecentTrip(recentTripData.id)} // Call the prop function with the trip ID
//                 >
//                   {/* Trip Content */}
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-start gap-2 mb-2">
//                         <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
//                         <div className="text-sm text-gray-900 font-medium leading-tight">
//                           {recentTripData.pickup_address || "Pickup Location"} {/* Adjust field name */}
//                         </div>
//                       </div>
//                       <div className="flex items-start gap-2 pl-6">
//                         <div className="text-sm text-gray-600 leading-tight">
//                           → {recentTripData.destination_address || "Destination"} {/* Adjust field name */}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-right ml-3">
//                       <div className="text-xl font-bold text-gray-900">
//                         ₦{recentTripData.amount?.amount?.toLocaleString() || "0"} {/* Adjust field name */}
//                       </div>
//                       {/* Status Badge */}
//                       <span className="text-xs font-semibold capitalize bg-amber-50 text-amber-600 px-2 py-1 rounded-full mt-1 inline-block">
//                         {recentTripData.status.label || "Status"} {/* Adjust field name */}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
//                     <Clock className="w-3 h-3" />
//                     {new Date(recentTripData.created_at || '').toLocaleString() || "Date Unknown"} {/* Adjust field name */}
//                   </div>
//                 </button>
//               ) : (
//                 // Non-clickable div for non-resumable trips
//                 <div className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-left">
//                   {/* Trip Content */}
//                   <div className="flex items-start justify-between mb-3">
//                     <div className="flex-1 min-w-0">
//                       <div className="flex items-start gap-2 mb-2">
//                         <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
//                         <div className="text-sm text-gray-900 font-medium leading-tight">
//                           {recentTripData.pickup_address || "Pickup Location"} {/* Adjust field name */}
//                         </div>
//                       </div>
//                       <div className="flex items-start gap-2 pl-6">
//                         <div className="text-sm text-gray-600 leading-tight">
//                           → {recentTripData.destination_address || "Destination"} {/* Adjust field name */}
//                         </div>
//                       </div>
//                     </div>
//                     <div className="text-right ml-3">
//                       <div className="text-xl font-bold text-gray-900">
//                         ₦{recentTripData.amount?.amount?.toLocaleString() || "0"} {/* Adjust field name */}
//                       </div>
//                       {/* Status Badge - Highlight terminal status */}
//                       <span className="text-xs font-semibold capitalize bg-emerald-50 text-emerald-600 px-2 py-1 rounded-full mt-1 inline-block">
//                         {recentTripData.status.label || "Status"} {/* Adjust field name */}
//                       </span>
//                     </div>
//                   </div>
//                   <div className="text-xs text-gray-500 flex items-center gap-1 mt-3 pt-3 border-t border-gray-100">
//                     <Clock className="w-3 h-3" />
//                     {new Date(recentTripData.created_at || '').toLocaleString() || "Date Unknown"} {/* Adjust field name */}
//                   </div>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* Fallback if no recent trip data at all */}
//           {!recentTripData && (
//              <div className="mb-6">
//               <h3 className="font-bold text-lg mb-3 text-gray-900 flex items-center gap-2">
//                 <Clock className="w-5 h-5 text-gray-600" />
//                 Recent Trip
//               </h3>
//               <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-200 text-center">
//                   <p className="text-gray-500 text-sm">No recent trips found.</p>
//               </div>
//              </div>
//           )}

//           {/* Premium Feature Banner */}
//           <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-5 shadow-md mb-6 text-white">
//             <div className="flex items-start gap-4">
//               <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
//                 <Plane className="w-6 h-6 text-white" />
//               </div>
//               <div className="flex-1">
//                 <h4 className="font-bold mb-1 text-lg">Flight Delayed?</h4>
//                 <p className="text-sm text-emerald-100 leading-relaxed">
//                   We'll wait for you — no extra charges applied.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Stats Cards */}
//           {/* <div className="flex gap-3 mb-6 overflow-x-auto scrollbar-hide mx-auto border border-gray-100 p-2 py-4 shadow-sm rounded-xl items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 ">
//             {[
//               {
//                 value: "12",
//                 label: "Trips",
//                 icon: TrendingUp,
//                 color: "emerald",
//               },
//               { value: "5.0", label: "Rating", icon: Star, color: "amber" },
//               {
//                 value: `₦${displayWalletBalance?.toLocaleString() || "0"}`,
//                 label: "Balance",
//                 icon: Wallet,
//                 color: "teal",
//               },
//             ].map((stat, idx) => (
//               <div
//                 key={idx}
//                 className="min-w-[100px] bg-white rounded-2xl p-4 shadow-sm border border-gray-200 text-center flex-shrink-0"
//               >
//                 <div className="flex justify-center mb-2">
//                   <div
//                     className={`w-8 h-8 rounded-lg bg-${stat.color}-50 flex items-center justify-center`}
//                   >
//                     <stat.icon className={`w-4 h-4 text-${stat.color}-600`} />
//                   </div>
//                 </div>
//                 <div className="text-xl font-bold text-gray-900 mb-1">
//                   {stat.value}
//                 </div>
//                 <div className="text-xs text-gray-600 font-medium">
//                   {stat.label}
//                 </div>
//               </div>
//             ))}
//           </div> */}

//           {/* Powered By Footer - Subtle placement */}
//           <div className="text-center py-6 mb-2">
//             <p className="text-xs text-gray-400 font-medium">
//               Powered by{" "}
//               <span className="text-gray-600 font-semibold">
//                 Excelian Technologies
//               </span>
//             </p>
//           </div>
//         </div>

//         {/* Bottom Navigation */}
//         <BottomNavBar
//           onProfileClick={() => {}}
//           onHomeClick={() => {}}
//           onWalletClick={() => {}}
//           onSearchClick={() => {}}
//           walletBalance={walletBalance}
//         />
//       </div>
//     </div>
//   );
// }


