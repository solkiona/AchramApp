// src/components/app/screens/DashboardScreen.tsx
'use client';

import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';

interface DashboardScreenProps {
  passengerData: { name: string; phone: string; email: string };
  onShowProfile: () => void;
  onBookNewTrip: () => void;
}

export default function DashboardScreen({
  passengerData,
  onShowProfile,
  onBookNewTrip,
}: DashboardScreenProps) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = passengerData.name.split(' ')[0] || 'Passenger';

  const [weather] = useState({ temp: 28, condition: 'sunny', location: 'Lagos' });

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">ACHRAM</h1>
        <button
          onClick={onShowProfile}
          className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm font-bold shadow-lg"
        >
          {passengerData.name
            .split(' ')
            .map((n) => n[0])
            .join('')}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 px-6 py-8">
          <h2 className="text-3xl font-bold mb-2">{greeting}, {firstName}!</h2>
          <p className="text-gray-600 mb-6">Ready for your next journey?</p>
          <div className="bg-white rounded-2xl p-5 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-4xl font-bold mb-1">{weather.temp}°C</div>
              <div className="text-gray-600 capitalize">{weather.condition}</div>
              <div className="text-sm text-gray-500">{weather.location}, Nigeria</div>
            </div>
            <div className="text-6xl">
              {weather.condition === 'sunny' && '☀️'}
              {weather.condition === 'cloudy' && '☁️'}
              {weather.condition === 'rainy' && '🌧️'}
            </div>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          <button
            onClick={onBookNewTrip}
            className="w-full bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6 rounded-2xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Book your airport ride
          </button>

          <div>
            <h3 className="font-bold text-lg mb-3">Recent trip</h3>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-600" />
                  <span className="text-sm">Lagos Airport → VI</span>
                </div>
                <span className="text-lg font-bold">₦4,500</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="text-3xl">✈️</div>
              <div>
                <h4 className="font-semibold mb-1">Flight Delay?</h4>
                <p className="text-sm text-gray-700">We’ll wait for you — no extra charge.</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold mb-1">1</div>
              <div className="text-xs text-gray-600">Trips</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold mb-1">5.0</div>
              <div className="text-xs text-gray-600">Rating</div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm text-center">
              <div className="text-2xl font-bold mb-1">₦0</div>
              <div className="text-xs text-gray-600">Saved</div>
            </div>
          </div>
          <div className="h-4"></div>
        </div>
      </div>
    </div>
  );
}