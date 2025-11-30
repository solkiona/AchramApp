// src/components/app/screens/AssigningScreen.tsx
'use client';

import { Loader } from 'lucide-react';

export default function AssigningScreen() {
  return (
    <div className="h-screen bg-achrams-bg-primary flex flex-col items-center justify-center px-6">
      {/* Spinner using ACHRAMS primary color */}
      <div className="w-20 h-20 border-4 border-achrams-primary-solid border-t-transparent rounded-full animate-spin mb-8"></div>
      <h2 className="text-2xl font-bold mb-2 text-achrams-text-primary">Please hold on</h2>
      <p className="text-achrams-text-secondary">Assigning a driver</p>
    </div>
  );
}